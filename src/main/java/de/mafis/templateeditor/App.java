package de.mafis.templateeditor;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * The main entry point for the JavaFX application.
 * This class is responsible for initializing the JavaFX application, loading the primary view,
 * and setting up the main stage.
 */
public class App extends Application {

    private double xOffset = 0;
    private double yOffset = 0;

    /**
     * The main entry point for all JavaFX applications.
     * The start method is called after the init method has returned,
     * and after the system is ready for the application to begin running.
     *
     * @param stage the primary stage for this application, onto which
     * the application scene can be set.
     * @throws IOException if the fxml file cannot be loaded.
     */
    @Override
    public void start(Stage stage) throws IOException {
        System.out.println("[DEBUG_LOG] Starting App...");
        Scene scene = new Scene(loadFXML("primary"), 1280, 720); // Larger default size for editor

        scene.setOnMousePressed(event -> {
            xOffset = event.getSceneX();
            yOffset = event.getSceneY();
        });

        scene.setOnMouseDragged(event -> {
            stage.setX(event.getScreenX() - xOffset);
            stage.setY(event.getScreenY() - yOffset);
        });
        
        stage.setScene(scene);
        //stage.initStyle(StageStyle.TRANSPARENT);
        stage.show();
        System.out.println("[DEBUG_LOG] App started successfully.");
    }

    /**
     * Loads an FXML file and returns the root parent.
     * @param fxml the name of the fxml file to load.
     * @return the root parent of the loaded fxml file.
     * @throws IOException if the fxml file cannot be loaded.
     */
    private static Parent loadFXML(String fxml) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(App.class.getResource("/ticket-editor/" + fxml + ".fxml"));
        return fxmlLoader.load();
    }

    /**
     * The main method is ignored in correctly deployed JavaFX application.
     * main() serves only as fallback in case the application can not be
     * launched through deployment artifacts, e.g., in IDEs with limited FX
     * support.
     *
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        launch();
    }

}