package de.mafis.templateeditor;

import javafx.application.Application;
import javafx.stage.Stage;

import java.util.UUID;

/**
 * Example JavaFX App demonstrating how to use the TicketTemplateLibrary.
 * This app provides buttons to open the editor and generate a test PDF.
 */
public class App extends Application {

    @Override
    public void start(Stage stage) {
        TicketTemplateLibrary.openEditor(stage, json -> {
            System.out.println("[APP] Template saved via editor callback.");
        });
    }

    private void generateTestPdf() {
        // Example of generating PDF directly without opening editor UI
        String sampleJson = "{\"width\":210,\"height\":297,\"elements\":[{\"elementType\":\"text_box\",\"x\":10,\"y\":10,\"width\":190,\"height\":30,\"text\":\"Hello Library PDF!\",\"fontSize\":24,\"textAlign\":\"C\"}]}";
        TicketTemplateLibrary.generatePdf(sampleJson, "DIRECT-PDF-123", "direct_library_pdf.pdf");
        System.out.println("[APP] Direct test PDF generated.");
    }

    public static void main(String[] args) {
        launch(args);
    }
}
