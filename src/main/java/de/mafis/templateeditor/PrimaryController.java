package de.mafis.templateeditor;

import java.net.URL;
import java.util.ResourceBundle;
import java.util.UUID;

import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;

/**
 * The controller for the primary view of the application.
 * This controller is responsible for initializing the WebView, loading the React application,
 * and handling communication between the JavaFX application and the React application.
 */
public class PrimaryController implements Initializable {

    @FXML
    private WebView webView;

    private WebEngine engine;

    /**
     * Called to initialize a controller after its root element has been completely processed.
     *
     * @param arg0 The location used to resolve relative paths for the root object, or
     * {@code null} if the location is not known.
     * @param arg1 The resources used to localize the root object, or {@code null} if
     * the root object was not localized.
     */
    @Override
    public void initialize(URL arg0, ResourceBundle arg1) {
        engine = webView.getEngine();
        
        // Handle JS Alerts (used for logging and data transfer)
        engine.setOnAlert(event -> {
            String message = event.getData();
            if (message.startsWith("PDF_JSON:")) {
                String json = message.substring("PDF_JSON:".length());
                String ticketId = "TICKET-" + UUID.randomUUID().toString();
                PdfGenerator.generatePdfFromJson(json, ticketId);
            } else {
                System.out.println("[DEBUG_LOG] JS Alert: " + message);
            }
        });

        loadPage();
    }

    /**
     * Loads the React application into the WebView.
     */
    private void loadPage() {
        URL resource = getClass().getResource("/ticket-editor/index.html");
        if (resource == null) {
            System.err.println("[DEBUG_LOG] Could not find /ticket-editor/index.html");
            return;
        }
        System.out.println("[DEBUG_LOG] Loading page: " + resource.toExternalForm());
        engine.load(resource.toExternalForm());
    }
}
