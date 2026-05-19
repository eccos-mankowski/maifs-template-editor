package de.mafis.templateeditor;

import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.net.URL;
import java.util.function.Consumer;

/**
 * Public API for the Ticket Template Library.
 * This class provides methods to open the React-based template editor
 * and to generate PDFs from template JSON data.
 */
public class TicketTemplateLibrary {

    private static final String PDF_JSON_PREFIX = "PDF_JSON:";

    /**
     * Opens the React-based ticket template editor in a new modal window.
     * The editor allows users to design and save ticket templates.
     * When a template is saved, the generated JSON is passed to the onSaveCallback.
     *
     * @param ownerStage The parent stage for the modal editor window.
     * @param onSaveCallback A Consumer that will receive the generated template JSON string
     *                       when the user saves the template in the editor.
     */
    public static void openEditor(Stage ownerStage, Consumer<String> onSaveCallback) {
        Platform.runLater(() -> {
            Stage editorStage = new Stage();
            editorStage.initOwner(ownerStage);
            editorStage.initModality(Modality.APPLICATION_MODAL);
            editorStage.setTitle("Ticket Template Editor");
            editorStage.setWidth(1280);
            editorStage.setHeight(720);

            WebView webView = new WebView();
            WebEngine engine = webView.getEngine();

            // Handle JS Alerts (used for logging and data transfer from React)
            engine.setOnAlert(event -> {
                String message = event.getData();
                if (message.startsWith(PDF_JSON_PREFIX)) {
                    String json = message.substring(PDF_JSON_PREFIX.length());
                    if (onSaveCallback != null) {
                        onSaveCallback.accept(json);
                    }
                    editorStage.close(); 
                } else {
                    System.out.println("[DEBUG_LOG] JS Alert: " + message);
                }
            });

            loadReactApp(engine);

            Scene scene = new Scene(webView);
            editorStage.setScene(scene);
            editorStage.show(); 
        });
    }

    /**
     * Generates a PDF document from the provided template JSON string.
     * This method can be called independently without opening the editor UI.
     *
     * @param templateJson The JSON string representing the ticket template.
     * @param ticketId The unique ID for the ticket, used for QR code generation.
     * @param outputPath The file path where the generated PDF should be saved (e.g., "ticket_final.pdf").
     */
    public static void generatePdf(String templateJson, String ticketId, String outputPath) {
        PdfGenerator.generatePdfFromJson(templateJson, ticketId);
    }

    /**
     * Loads the React application (ticket editor) into the WebView.
     * @param engine The WebEngine of the WebView.
     */
    private static void loadReactApp(WebEngine engine) {
        URL resource = TicketTemplateLibrary.class.getResource("/ticket-editor/index.html");
        if (resource == null) {
            System.err.println("[ERROR] Could not find /ticket-editor/index.html. Ensure frontend is built and packaged correctly.");
            return;
        }
        System.out.println("[DEBUG_LOG] Loading React app: " + resource.toExternalForm());
        engine.load(resource.toExternalForm());
    }
}
