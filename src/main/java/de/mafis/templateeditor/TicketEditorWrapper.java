package de.mafis.templateeditor;

import de.mafis.templateeditor.core.BaseFXWebViewWrapper;
import javafx.stage.Stage;

import java.util.function.Consumer;

/**
 * Implementation of BaseFXWebViewWrapper for the Ticket Editor.
 */
public class TicketEditorWrapper extends BaseFXWebViewWrapper {

    private Consumer<String> onSaveCallback;

    public void setOnSaveCallback(Consumer<String> onSaveCallback) {
        this.onSaveCallback = onSaveCallback;
    }

    @Override
    protected String getResourcePath() {
        return "/ticket-editor/index.html";
    }

    @Override
    protected void configureCallbacks(DynamicJavaConnector connector) {
        connector.registerCallback("save", data -> {
            if (onSaveCallback != null) {
                onSaveCallback.accept(data);
            }
        });
        // You can register more callbacks here as needed
    }

    /**
     * Specialized openStage for TicketEditor with predefined title and size.
     */
    public void openEditor(Stage ownerStage, Consumer<String> onSaveCallback) {
        this.onSaveCallback = onSaveCallback;
        openStage(ownerStage, "Ticket Template Editor", 1280, 720);
    }
}
