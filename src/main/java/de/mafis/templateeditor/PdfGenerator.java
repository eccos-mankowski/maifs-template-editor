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
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * A utility class for generating PDFs from JSON data.
 */
public class PdfGenerator {

    private static final float MM_TO_POINTS = 2.83465f;

    /**
     * Generates a PDF from a JSON string.
     *
     * @param json     the JSON string representing the PDF content.
     * @param ticketId the ID of the ticket to be embedded in the QR code.
     */
    public static void generatePdfFromJson(String json, String ticketId) {
        try (PDDocument document = new PDDocument()) {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            PDFont myFont;
            try (InputStream fontStream = PdfGenerator.class.getResourceAsStream("/OpenSans-Regular.ttf")) {
                if (fontStream == null) {
                    throw new IOException("Font 'OpenSans-Regular.ttf' not found in classpath.");
                }
                myFont = PDType0Font.load(document, fontStream);
            }

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            float pageHeight = PDRectangle.A4.getHeight();
            
            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
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
            }

            String outputPath = "generated_ticket.pdf";
            document.save(outputPath);
            System.out.println("PDF generated to: " + outputPath);

        } catch (Exception e) {
            System.err.println("Error generating PDF: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void renderTextBox(PDPageContentStream cs, JsonNode node, float x, float y, float w, float h, PDFont font) throws Exception {
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
        String id = node.path("id").asText("");

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

    private static void renderQrCode(PDDocument doc, PDPageContentStream cs, String data, float x, float y, float w, float h) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.MARGIN, 0);

        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, 200, 200, hints);
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        PDImageXObject qrImage = LosslessFactory.createFromImage(doc, bufferedImage);

        float size = Math.min(w, h);
        float drawX = x + (w - size) / 2;
        float manualYOffset = -4f * MM_TO_POINTS;
        float drawY = y + (h - size) / 2 + manualYOffset;

        cs.drawImage(qrImage, drawX, drawY, size, size);
    }

    private static void renderImage(PDDocument doc, PDPageContentStream cs, JsonNode node, float x, float y, float w, float h) {
        if (!node.has("imageData") || node.get("imageData").isNull()) return;

        String base64 = node.get("imageData").asText();
        if (base64 == null || base64.trim().isEmpty()) return;
        if (base64.contains(",")) base64 = base64.split(",")[1];

        try {
            byte[] imageBytes = Base64.getDecoder().decode(base64);
            if (imageBytes.length == 0) return;
            
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, imageBytes, "img");

            if (node.path("scaleToFit").asBoolean(true)) {
                cs.saveGraphicsState();
                cs.addRect(x, y, w, h);
                cs.clip();
                
                float imgRatio = (float) pdImage.getWidth() / pdImage.getHeight();
                float boxRatio = w / h;
                float drawW, drawH, drawX, drawY;

                if (imgRatio > boxRatio) {
                    drawH = h;
                    drawW = h * imgRatio;
                    drawX = x - (drawW - w) / 2f;
                    drawY = y;
                } else {
                    drawW = w;
                    drawH = w / imgRatio;
                    drawX = x;
                    drawY = y - (drawH - h) / 2f;
                }
                cs.drawImage(pdImage, drawX, drawY, drawW, drawH);
                cs.restoreGraphicsState();
            } else {
                float imgRatio = (float) pdImage.getWidth() / pdImage.getHeight();
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
