package de.mafis.templateeditor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * A utility class for generating PDFs from JSON data.
 * This class provides methods to generate a PDF from a JSON string
 * and to render various elements such as text boxes, images, and QR codes.
 */
public class PdfGenerator {

    private static final float MM_TO_POINTS = 2.83465f;

    /**
     * Generates a PDF from a JSON string.
     * @param json the JSON string representing the PDF content.
     * @param ticketId the ID of the ticket to be embedded in the QR code.
     */
    public static void generatePdfFromJson(String json, String ticketId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            PDDocument document = new PDDocument();
            
            PDFont myFont = PDType0Font.load(document, new File("OpenSans-Regular.ttf"));

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            float pageHeight = PDRectangle.A4.getHeight();
            PDPageContentStream cs = new PDPageContentStream(document, page);

            for (JsonNode element : root.get("elements")) {
                String type = element.get("elementType").asText();
                float x = (float) element.get("x").asDouble() * MM_TO_POINTS;
                float yJson = (float) element.get("y").asDouble() * MM_TO_POINTS;
                float w = (float) element.get("width").asDouble() * MM_TO_POINTS;
                float h = (float) element.get("height").asDouble() * MM_TO_POINTS;
                float yPdf = pageHeight - yJson - h;

                if ("text_box".equals(type)) {
                    renderTextBox(cs, element, x, yPdf, w, h, myFont);
                } else if ("image".equals(type)) {
                    renderImage(document, cs, element, x, yPdf, w, h);
                } else if ("qr_code".equals(type)) {
                    renderQrCode(document, cs, ticketId, x, yPdf, w, h);
                }
            }

            cs.close();
            document.save("ticket.pdf");
            document.close();
            System.out.println("PDF generated!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * The main method for testing the PDF generation.
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        try {
            String json = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("ticket.json")));
            generatePdfFromJson(json, "TICKET-12345");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Renders a text box on the PDF.
     * @param cs the content stream to draw on.
     * @param node the JSON node representing the text box.
     * @param x the x coordinate of the text box.
     * @param y the y coordinate of the text box.
     * @param w the width of the text box.
     * @param h the height of the text box.
     * @param font the font to use for the text.
     * @throws Exception if an error occurs while rendering the text box.
     */
    private static void renderTextBox(PDPageContentStream cs, JsonNode node, float x, float y, float w, float h, PDFont font) throws Exception {
        String id = node.path("id").asText("");

        if (id.equals("title") || id.equals("subtitle")) {
            y -= MM_TO_POINTS;
        }

        if (node.has("backgroundColor") && !node.get("backgroundColor").isNull() && !node.get("backgroundColor").asText().isEmpty()) {
            cs.setNonStrokingColor(Color.decode(node.get("backgroundColor").asText()));
            cs.addRect(x, y, w, h);
            cs.fill();
        }

        String rawText = node.path("text").asText("");
        if (rawText.trim().isEmpty()) return;

        int fontSize = node.path("fontSize").asInt(11);
        cs.setNonStrokingColor(Color.decode(node.path("color").asText("#000000")));
        cs.setFont(font, fontSize);

        float capHeight = font.getFontDescriptor().getCapHeight() / 1000f * fontSize;
        float leading = fontSize * 1.2f;
        String[] lines = rawText.split("\n");

        float currentY;
        if (id.equals("title") || id.equals("subtitle")) {
            currentY = y + (h / 2f) - (capHeight / 2f);
        } else {
            float topPadding = 2.0f * MM_TO_POINTS;
            currentY = (y + h) - capHeight - topPadding;
        }

        for (String line : lines) {
            float textWidth = font.getStringWidth(line) / 1000 * fontSize;
            float textX = x;

            if ("C".equals(node.path("textAlign").asText())) {
                textX = x + (w - textWidth) / 2;
            }

            cs.beginText();
            cs.newLineAtOffset(textX, currentY);
            cs.showText(line);
            cs.endText();
            currentY -= leading;
        }
    }

    /**
     * Renders a QR code on the PDF.
     * @param doc the document to add the QR code to.
     * @param cs the content stream to draw on.
     * @param data the data to encode in the QR code.
     * @param x the x coordinate of the QR code.
     * @param y the y coordinate of the QR code.
     * @param w the width of the QR code.
     * @param h the height of the QR code.
     * @throws Exception if an error occurs while rendering the QR code.
     */
    private static void renderQrCode(PDDocument doc, PDPageContentStream cs, String data, float x, float y, float w, float h) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.MARGIN, 0); // Prevents unnecessary white border from the generator

        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, 200, 200, hints);
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        PDImageXObject qrImage = LosslessFactory.createFromImage(doc, bufferedImage);

        // We use 100% of the box size to have full control
        float size = Math.min(w, h);

        // Centering in the box
        float drawX = x + (w - size) / 2;

        // OFFSET LOGIC:
        float manualYOffset = -4f * MM_TO_POINTS; // Shifts it 4mm further down

        float drawY = y + (h - size) / 2 + manualYOffset;

        cs.drawImage(qrImage, drawX, drawY, size, size);
    }

    /**
     * Renders an image on the PDF.
     * @param doc the document to add the image to.
     * @param cs the content stream to draw on.
     * @param node the JSON node representing the image.
     * @param x the x coordinate of the image.
     * @param y the y coordinate of the image.
     * @param w the width of the image.
     * @param h the height of the image.
     */
    private static void renderImage(PDDocument doc, PDPageContentStream cs, JsonNode node, float x, float y, float w, float h) {
        if (!node.has("imageData") || node.get("imageData").isNull()) return;

        String base64 = node.get("imageData").asText();
        if (base64 == null || base64.trim().isEmpty()) return;
        if (base64.contains(",")) base64 = base64.split(",")[1];

        try {
            byte[] imageBytes = Base64.getDecoder().decode(base64);
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, imageBytes, "img");

            float imgWidth = (float) pdImage.getWidth();
            float imgHeight = (float) pdImage.getHeight();
            float imgRatio = imgWidth / imgHeight;
            float boxRatio = w / h;

            if (node.path("scaleToFit").asBoolean(false) || w > 400) {
                // --- CSS "OBJECT-FIT: COVER" (CENTERED) ---
                cs.saveGraphicsState();
                // Set a clipping path to the box
                cs.addRect(x, y, w, h);
                cs.clip();

                float drawW, drawH, drawX, drawY;

                if (imgRatio > boxRatio) {
                    // Image is wider than the box in proportion
                    drawH = h;
                    drawW = h * imgRatio;
                    drawX = x - (drawW - w) / 2f; // Center horizontally (cut off left/right)
                    drawY = y;
                } else {
                    // Image is narrower/taller than the box in proportion
                    drawW = w;
                    drawH = w / imgRatio;
                    drawX = x;
                    // Center vertically (cut off top/bottom evenly)
                    // We move the image down by half of the "excess height"
                    drawY = y - (drawH - h) / 2f;
                }

                cs.drawImage(pdImage, drawX, drawY, drawW, drawH);
                cs.restoreGraphicsState();
            } else {
                // Logo logic (keep proportions within the box - "contain")
                float drawW = w, drawH = w / imgRatio;
                if (drawH > h) {
                    drawH = h;
                    drawW = h * imgRatio;
                }
                cs.drawImage(pdImage, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
            }
        } catch (Exception e) {
            System.err.println("Could not render image: " + e.getMessage());
        }
    }

}