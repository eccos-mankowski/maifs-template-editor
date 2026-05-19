package de.mafis.templateeditor;

import javafx.stage.Stage;

import javax.swing.*;
import java.util.function.Consumer;

/**
 * Public API for the Ticket Template Library.
 * Provides methods to open the editor in a new JavaFX Stage or embed it into a Swing JPanel.
 */
public class TicketTemplateLibrary {

    private static final TicketEditorWrapper editorWrapper = new TicketEditorWrapper();

    /**
     * Embeds the React-based ticket template editor into a Swing JPanel.
     *
     * @param container      The JPanel that will host the editor.
     * @param onSaveCallback A Consumer that receives the template JSON when the user saves.
     */
    public static void embedEditor(JPanel container, Consumer<String> onSaveCallback) {
        editorWrapper.setOnSaveCallback(onSaveCallback);
        editorWrapper.embed(container);
    }

    /**
     * Clears the cached WebView to free up resources.
     * Call this when the editor is no longer needed (e.g., application shutdown or closing the main window).
     */
    public static void clearCache() {
        editorWrapper.clearCache();
    }

    /**
     * Opens the editor in a new, modal JavaFX Stage.
     *
     * @param ownerStage     The parent stage for the modal window.
     * @param onSaveCallback A Consumer that receives the template JSON.
     */
    public static void openEditor(Stage ownerStage, Consumer<String> onSaveCallback) {
        editorWrapper.openEditor(ownerStage, onSaveCallback);
    }

    /**
     * Generates a PDF document from the provided template JSON string.
     *
     * @param templateJson The JSON string representing the ticket template.
     * @param ticketId     The unique ID for the ticket, used for QR code generation.
     * @param outputPath   The file path where the generated PDF should be saved.
     */
    public static void generatePdf(String templateJson, String ticketId, String outputPath) {
        PdfGenerator.generatePdfFromJson(templateJson, ticketId, outputPath);
    }
}
