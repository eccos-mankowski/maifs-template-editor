package de.mafis.templateeditor.core;

import javafx.application.Platform;
import javafx.embed.swing.JFXPanel;
import javafx.scene.Scene;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Modality;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

import javax.swing.*;
import java.awt.*;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

/**
 * A reusable wrapper for embedding a web-based UI inside Swing or JavaFX.
 */
@SuppressWarnings("BooleanMethodIsAlwaysInverted")
public abstract class BaseFXWebViewWrapper {

    private static boolean fxChecked = false;
    private static boolean fxAvailable = false;
    private static boolean platformInitialized = false;

    private WebView cachedWebView;
    private DynamicJavaConnector currentConnector;

    /**
     * Checks if JavaFX is available for use.
     */
    public static boolean isFxAvailable() {
        if (!fxChecked) {
            try {
                Class.forName("javafx.embed.swing.JFXPanel");
                fxAvailable = true;
            } catch (ClassNotFoundException e) {
                fxAvailable = false;
            }
            fxChecked = true;
        }
        return fxAvailable;
    }

    protected static synchronized void initializePlatform() {
        if (!isFxAvailable() || platformInitialized) return;
        try {
            Platform.setImplicitExit(false);
            platformInitialized = true;
        } catch (Throwable t) {
            // Fallback for cases where a Platform class might not be fully initialized or accessible
            try {
                Class<?> platformClass = Class.forName("javafx.application.Platform");
                java.lang.reflect.Method setImplicitExit = platformClass.getMethod("setImplicitExit", boolean.class);
                setImplicitExit.invoke(null, false);
                platformInitialized = true;
            } catch (Throwable t2) {
                System.err.println("Could not set Platform.setImplicitExit(false)");
                platformInitialized = true;
            }
        }
    }

    protected abstract String getResourcePath();
    
    /**
     * Subclasses can register their callbacks here.
     */
    protected abstract void configureCallbacks(DynamicJavaConnector connector);

    /**
     * Embeds the web component into a Swing JPanel.
     */
    public void embed(JPanel container) {
        initializePlatform();
        if (!isFxAvailable()) {
            showErrorLabel(container, "<html><center><font color='red'><b>JavaFX missing!</b><br>Required runtime components are unavailable.</font></center></html>");
            return;
        }

        SwingUtilities.invokeLater(() -> {
            final JFXPanel fxPanel = new JFXPanel();
            container.removeAll();
            container.setLayout(new BorderLayout());
            container.add(fxPanel, BorderLayout.CENTER);
            container.revalidate();
            container.repaint();

            Platform.runLater(() -> {
                ensureWebViewInitialized();
                fxPanel.setScene(new Scene(cachedWebView));
                cachedWebView.requestLayout();
            });
        });
    }

    /**
     * Opens the web component in a standalone window.
     */
    public void openStage(Stage ownerStage, String title, int width, int height) {
        initializePlatform();
        if (!isFxAvailable()) return;

        Platform.runLater(() -> {
            Stage stage = new Stage();
            if (ownerStage != null) {
                stage.initOwner(ownerStage);
            }
            stage.initModality(Modality.APPLICATION_MODAL);
            stage.setTitle(title);
            stage.setWidth(width);
            stage.setHeight(height);

            ensureWebViewInitialized();

            stage.setScene(new Scene(cachedWebView));
            cachedWebView.requestLayout();
            stage.show();
        });
    }

    private void ensureWebViewInitialized() {
        if (cachedWebView == null) {
            cachedWebView = createWebView();
        } else {
            configureCallbacks(currentConnector);
            if (cachedWebView.getScene() != null) {
                cachedWebView.getScene().setRoot(new javafx.scene.layout.Pane());
            }
        }
    }

    private WebView createWebView() {
        WebView webView = new WebView();
        WebEngine engine = webView.getEngine();
        currentConnector = new DynamicJavaConnector();
        configureCallbacks(currentConnector);

        engine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
            if (newState == javafx.concurrent.Worker.State.SUCCEEDED) {
                JSObject window = (JSObject) engine.executeScript("window");
                // Expose the connector object to JS as window.javaConnector
                window.setMember("javaConnector", currentConnector);
            }
        });

        URL resource = getClass().getResource(getResourcePath());
        if (resource == null) {
            engine.loadContent("<html><body><h1>Error</h1><p>Resource not found: " + getResourcePath() + "</p></body></html>");
        } else {
            engine.load(resource.toExternalForm());
        }
        return webView;
    }

    public void clearCache() {
        Platform.runLater(() -> {
            if (cachedWebView != null) {
                if (cachedWebView.getScene() != null) {
                    cachedWebView.getScene().setRoot(new javafx.scene.layout.Pane());
                }
                cachedWebView.getEngine().load("about:blank");
                cachedWebView = null;
            }
            currentConnector = null;
        });
    }

    private void showErrorLabel(JPanel container, String message) {
        SwingUtilities.invokeLater(() -> {
            container.removeAll();
            container.setLayout(new BorderLayout());
            container.add(new JLabel(message, SwingConstants.CENTER), BorderLayout.CENTER);
            container.revalidate();
            container.repaint();
        });
    }

    /**
     * A dynamic connector that allows registering multiple callbacks by name.
     */
    public static class DynamicJavaConnector {
        private final Map<String, Consumer<String>> callbacks = new HashMap<>();

        public void registerCallback(String name, Consumer<String> callback) {
            callbacks.put(name, callback);
        }

        /**
         * Generic call method from JavaScript.
         * Usage in JS: window.javaConnector.call("onSave", jsonString);
         */
        public void call(String name, String data) {
            Consumer<String> callback = callbacks.get(name);
            if (callback != null) {
                SwingUtilities.invokeLater(() -> callback.accept(data));
            } else {
                System.err.println("No callback registered for name: " + name);
            }
        }
    }
}
