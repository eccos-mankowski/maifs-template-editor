# PoC: JavaFX WebView mit React Ticket-Editor

Dieses Projekt ist ein Proof of Concept (PoC), der demonstriert, wie eine moderne Web-Anwendung (React) in eine bestehende Java 8-Anwendung integriert werden kann, um eine flexible und zukunftsfähige Lösung für die Erstellung von Gutscheinvorlagen zu schaffen.

## 1. Kernkonzept & Zielsetzung

Ziel dieses PoC ist es, die technische Machbarkeit der Einbettung des bereits existierenden, im **mafis-digital.de Webshop** produktiv eingesetzten **React-basierten Ticket-Editors** in eine **JavaFX 8 WebView** zu validieren.

Durch die Wiederverwendung des bestehenden Editors entfällt die Neuentwicklung einer eigenen Editor-Komponente. Dieser hybride Ansatz ermöglicht:
- **Moderne User Experience:** Nutzung einer bewährten, modernen und intuitiven Benutzeroberfläche.
- **Strikte Entkopplung:** Saubere Trennung von UI (React) und Backend-Logik (Java).
- **Bessere Wartbarkeit:** Unabhängige Entwicklung und Wartung von Frontend und Backend.
- **Zukunftsfähigkeit:** Das Frontend kann mit modernen Web-Technologien weiterentwickelt werden, ohne die Java-Basis zu verändern.

---

## 2. Technische Umsetzung

Der PoC besteht aus drei Hauptkomponenten:

### a) Frontend: React-basierter Vorlageneditor
- **Technologie:** Eine in **TypeScript** geschriebene React-Anwendung, die sich im Verzeichnis `/src/main/resources/ticket-editor` befindet.
- **Funktionalität:**
    - **Dynamische Formulare** (`react-hook-form`) zur Bearbeitung von Vorlagen-Eigenschaften (Farben, Texte, Bilder).
    - **Live-Vorschau** auf einer HTML-Canvas (`react-konva`) zur Visualisierung der Änderungen in Echtzeit.
    - **Moderne UI-Komponenten** (`@blueprintjs/core`) für eine ansprechende Bedienung.

### b) Backend: JavaFX Host-Anwendung
- **Technologie:** Eine minimale **JavaFX 8**-Anwendung, die eine `WebView`-Komponente bereitstellt.
- **Funktionalität:**
    - Die `WebView` lädt die kompilierte React-Anwendung als lokale Ressource (`index.html`).
    - Sie agiert als Container und stellt die Brücke zur Java-Welt her.

### c) Kommunikationsbrücke & PDF-Generierung
- **Datenfluss (Frontend → Backend):**
    1.  **Serialisierung:** Beim Speichern wird der Zustand der Vorlage in ein **JSON-Dokument** serialisiert.
    2.  **Datenübertragung (PoC-Ansatz):** Das JSON wird über einen `alert()`-Aufruf mit einem speziellen Präfix (`PDF_JSON:`) an die `WebView` gesendet.
    3.  **Verarbeitung:** Ein `OnAlert`-Handler in der `WebEngine` fängt diese Nachricht ab, extrahiert das JSON und übergibt es an den `PdfGenerator`.
- **PDF-Generierung:**
    - Die Java-Klasse `PdfGenerator` (basierend auf **Apache PDFBox**) parst das JSON und rendert die Elemente (Texte, Bilder, QR-Code) in eine PDF-Datei (`ticket_final.pdf`).

---

## 3. Projekt starten

### Voraussetzungen
- Java 8 JDK
- Apache Maven
- Node.js und npm

### Schritte
1.  **Frontend-Abhängigkeiten installieren:**
    ```bash
    cd src/main/resources/ticket-editor
    npm install
    ```

2.  **Projekt kompilieren und Frontend bauen:**
    Kehren Sie ins Hauptverzeichnis zurück und führen Sie den Maven-Build aus. Dieser kompiliert die Java-Klassen und löst automatisch den Build-Prozess der React-Anwendung aus (via `frontend-maven-plugin`).
    ```bash
    mvn clean install
    ```

3.  **Anwendung starten:**
    ```bash
    mvn javafx:run
    ```

Die Anwendung sollte nun starten und den Ticket-Editor anzeigen. Nach dem Speichern wird im Hauptverzeichnis des Projekts eine `ticket_final.pdf` generiert.

---

## 4. Nächste Schritte zur Produktivsetzung

Dieser PoC dient als Grundlage für eine produktive Gutschein-Bibliothek für die **mafis Kasse**. Folgende Schritte sind für die Weiterentwicklung geplant:

#### 1. Robuste Kommunikation implementieren
- Ersetzen der `alert()`-Brücke durch das **`JSObject`-API** von JavaFX, um eine saubere, bidirektionale Kommunikation zu ermöglichen.

#### 2. Template-Speicherung & -Verwaltung
- Implementierung einer Logik zum **Speichern und Laden** von Vorlagen (z.B. als JSON-Dateien oder in einer lokalen SQLite-Datenbank).

#### 3. Als Bibliothek für mafis paketieren
- Kapselung des gesamten PoC (Editor-Einbettung, PDF-Generierung, Template-Verwaltung) in eine eigenständige **Java-Bibliothek (JAR)**.
- Definition klarer Schnittstellen, damit die Bibliothek als Abhängigkeit in die mafis Kasse integriert werden kann.

#### 4. Bereitstellung von Kernfunktionen für die Kasse
- **PDF-Generierungsfunktion:** Eine Methode bereitstellen, die ohne UI-Interaktion aufgerufen werden kann, um aus einer Template-ID und dynamischen Ticket-Daten (Preis, Datum, QR-Code-Inhalt) eine fertige PDF zu erzeugen.
- **Editor-Startfunktion:** Einen Hook oder eine Methode definieren, die es der mafis Kasse ermöglicht, den Editor bei Bedarf in einem neuen Fenster zu öffnen.

#### 5. Kompatibilitäts- und Performance-Tests
- Sicherstellen, dass die Bibliothek in der realen Kassen-Umgebung (spezifische JRE, Hardware, Betriebssystem) performant und stabil läuft.
- Analyse von Speicher- und CPU-Verbrauch.
