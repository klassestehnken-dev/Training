# Trainings-App – Kontext für Claude Code

Persönliche Fitness-App von Joshua (Lehrer, Köln; nutzt sie auf dem iPhone im Studio).
Bitte auf **Deutsch** antworten und ihn **duzen**. Erklärungen kurz und praktisch halten.
Er arbeitet nicht täglich mit Git: Schritte zum Veröffentlichen immer konkret benennen.

## Was die App ist

- Eine einzige Web-App (React), gebaut zu **einer** `index.html` (CSS + JS eingebettet).
- Läuft auf **GitHub Pages** aus diesem Repo (Branch `main`, Ordner `/`), auf dem iPhone als Symbol auf dem Home-Bildschirm (PWA, `manifest.webmanifest`, `sw.js` für Offline).
- Daten liegen lokal im Browser (`localStorage`) **und** werden mit einem **Google Sheet** abgeglichen (Google Apps Script als Web-App, siehe `apps-script/Code.gs`). Kein eigener Server, kein Netlify.

## Ordner

```
src/App.jsx               gesamte App (eine große Datei, ca. 2.900 Zeilen)
src/main.jsx              Einstieg, registriert sw.js
src/in.css                Tailwind-Basis
src/index.template.html   HTML-Vorlage mit Platzhaltern /*__CSS__*/ und /*__JS__*/
build.mjs                 baut index.html + erneuert die Cache-Version in sw.js
index.html, sw.js         gebaute, ausgelieferte Dateien (werden committet!)
manifest.webmanifest, icon-*.png, apple-touch-icon.png
apps-script/Code.gs       Google-Apps-Script fürs Sheet (liest den Code aus der Skripteigenschaft CODE)
apps-script/appsscript.json  Manifest des Apps-Script-Projekts (für clasp)
extras/uebungs-figuren.jsx  animierte Übungs-Strichfiguren (bewusst NICHT in der App, nur für Vorschaubilder)
tests/gas-mock.cjs         Nachbau von Apps Script/Sheet für lokale Tests
```

## Bauen und veröffentlichen

```
npm install
npm run build     # erzeugt index.html, setzt neue CACHE-Version in sw.js
npm run serve     # lokal testen auf http://localhost:8787
```

Danach `index.html` und `sw.js` committen und pushen → GitHub Pages ist nach 1–2 Minuten aktuell.
Auf dem iPhone die App einmal ganz schließen und neu öffnen.

**Immer nach Änderungen an src/ bauen und die gebauten Dateien mitcommitten**, sonst ändert sich online nichts.

Änderungen an `apps-script/Code.gs` gehen per **clasp** direkt ins Google-Projekt:
`npm run gas:deploy` lädt `apps-script/` hoch und erneuert die bestehende Web-App-Bereitstellung (URL bleibt gleich).
`.clasp.json` (scriptId, rootDir, deploymentId) ist absichtlich nicht im Repo. Der geheime Code steht als
**Skripteigenschaft `CODE`** im Apps-Script-Projekt, nie im Quelltext (Repo ist öffentlich). Fehlt sie, antwortet das
Skript „Im Skript fehlt die Skripteigenschaft CODE.“. Live-Bereitstellungen startet Joshua selbst bzw. bestätigt sie.
Ohne clasp: Code im Apps-Script-Editor ersetzen, dann *Bereitstellen → Bereitstellungen verwalten → Stift → Version: Neue Version*.

## Datenmodell (localStorage `trn-data`)

```js
{
  exercises: [{ id, name, type: "kraft" | "eigen" | "cardio" }],   // Standardübungen haben IDs d0…d15
  entries: [{ id, ts, date: "YYYY-MM-DD", exId,
              sets: [{ reps, kg|null }]            // kraft/eigen
              | minutes, km }],                     // cardio
  meta: {
    plans:    [{ id, name, exIds: [] }],
    notes:    { [exId]: "Text" },
    products: [{ id, code?, name, brand?, kcal100?, prot100?, serving?, pKcal?, pProt? }],
                // kcal100/prot100 = Werte pro 100 g; pKcal/pProt = Werte pro Portion
    goal:     { kcal, protein|null },
  },
  food: [{ id, ts, date, pid, name, g|null, kcal, prot|null }],
}
```

Weitere Schlüssel: `trn-queue` (noch nicht gesendete Änderungen), `trn-settings` ({url, code} des Sheets),
`trn-rest` (Pausentimer), `trn-active-plan` ({date, id}), `trn-theme` (Theme-ID); `sessionStorage.trn-tab`.

## Abgleich mit dem Google Sheet

- Jede Änderung wird per `diffOps(alt, neu)` in Operationen übersetzt und in `trn-queue` gesammelt, dann per
  `POST` (Content-Type `text/plain`, Body `{ code, ops }`) geschickt. Antwort = kompletter Stand; `GET ?code=…` liefert ihn auch.
- Operationen: `addExercise`, `deleteExercise`, `addEntry` (mit `exName`, `exType`), `deleteEntry`, `setMeta` (ganzes meta),
  `addFood`, `deleteFood`. **Bearbeiten = löschen + neu anlegen mit gleicher ID.**
- Blätter im Sheet: `Einträge` (eine Zeile pro Satz), `Übungen`, `Pläne & Notizen` (Zeile `meta` mit JSON), `Essen`.
- Skript meldet `version: 3`. Fehlen `meta`/`food` in der Antwort (altes Skript), behält die App ihre lokalen Daten und zeigt einen Hinweis.
- Datumswerte aus dem Sheet kommen je nach Einstellung als Text („Sun Oct 11 2026 …“) → werden in `normDate()` normalisiert. Nicht entfernen.
- Offline: Änderungen bleiben in der Warteschlange und werden bei Netz (online-Event, Sichtbarkeit, alle 30 s) gesendet.

## Funktionen (Stand Ende Oktober 2026)

- **Training:** Tagesdatum, Plan-Karte mit „Letztes Training: … / Heute dran: …“ (Erkennung über `planForDay`, bester Übungs-Überlapp),
  Übungsauswahl nach Art (Gewichte/Eigengewicht/Cardio), Sätze mit Vorlagen 3×10/4×8/5×5, „Letztes Mal“-Box mit **Steigerungs-Vorschlag**
  (`suggestNext`: alle Sätze geschafft → +2,5 kg bzw. +1 kg unter 20 kg; Eigengewicht +1 Wdh.), Notiz pro Übung, schon heute eingetragene
  Übung wird beim erneuten Antippen weiterbearbeitet, **Pausentimer** (Leiste unten, Ton), **Rekord-Meldung**.
- **Essen:** Kalorien-Ring + Eiweiß, Tagesziel, Strichcode-Scanner (ZXing, Kamera; Nummer auch eintippbar), Nährwerte von
  **Open Food Facts** (`world.openfoodfacts.org/api/v2/product/{code}.json`), lokal bekannte Produkte zuerst, Eintrag von Hand
  (pro 100 g oder ganze Portion), „Schnell hinzufügen“ mit Bearbeiten-Modus (✕ + Rückgängig), letzte 7 Tage.
- **Verlauf:** Tage mit Plan-Schild, bearbeiten/löschen.
- **Entwicklung:** Trainingswochen (Mo–So, 8 KW), pro Übung Gewicht je Satz / Höchstgewicht / Volumen, Gesamtvolumen.
- **Übungen & Daten:** Aussehen (Themes), Trainingspläne (Reihenfolge per Pfeilen), Pausentimer-Einstellungen, Übungen anlegen/löschen,
  Google-Sheet-Verbindung, Sicherung (JSON herunterladen/kopieren/einspielen, CSV für Excel).

## Design

- Alle Farben, Schriften, Rundungen sind Tokens im Objekt `C` am Anfang von `App.jsx`. Keine festen Farbwerte neu einbauen, sondern Tokens nutzen
  (`C.field` für Eingabe-/Chip-Flächen, `C.solid`/`C.onSolid` für aktive dunkle Flächen, `C.blue` = Akzentfarbe des Themes).
- Themes in `THEMES` (studio, nacht, ruhig, signal); Wahl in `localStorage.trn-theme`, Anwendung beim Start, Wechsel lädt die Seite neu.
  Das Skript `<script id="pre">` in der Vorlage setzt Statusleiste/Hintergrund vor dem Rendern – bei neuen Themes dort ergänzen.
- Schriften: Barlow / Barlow Condensed (Standard), Rubik („Hell & ruhig“), Oswald („Signal“) über Google Fonts.

## Joshuas Daten und Gewohnheiten

- Ziel: abnehmen, definierte Muskeln, Fokus Oberkörper. Aktuell zwei Ganzkörperpläne **„Ganzkörper A“** und **„Ganzkörper B“** im Wechsel, 3×/Woche.
- Eigene Übungsnamen in der App (so verwenden!): **„Ruderzug“** (= Rudern am Kabel), **„Kurzhantel Drücken“** (= Schrägbankdrücken mit Kurzhanteln),
  „Bizeps curls“, „Trizeptsdrücken“ (Schreibweise so in seinen Daten), „Ausfallschritte“, „Butterfly“.
- Pläne/Übungen ergänzt man am einfachsten über einen Sicherungstext (JSON mit `exercises`, `entries: []`, `meta.plans`, `meta.notes`),
  den er unter „Sicherung einspielen“ einfügt. Einspielen ergänzt nur, überschreibt nichts (bestehende Notizen gewinnen).

## Testen

- Bisher mit Playwright (Chromium, Handygröße 390×844) getestet. Google-Aufrufe per `page.route("https://script.google.com/**")` auf `tests/gas-mock.cjs` umleiten:
  `node tests/gas-mock.cjs apps-script/Code.gs` (Port 8788, Code im Mock: `geheim42`, änderbar mit `GAS_CODE=…`, Sheet-Inhalt unter `/__sheets`).
- Open Food Facts im Test per `page.route` mit Beispiel-JSON beantworten.
- Scanner testen: Chromium mit `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=<strichcode>.y4m`
  (Strichcode-PNG mit ffmpeg zu y4m umwandeln). Funktioniert zuverlässig.
- Nach Änderungen kurz alle Tabs durchklicken und auf `pageerror` achten.

## Grenzen / bekannte Punkte

- iPhone-Web-Apps haben keinen Zugriff auf Apple Health und kein Bluetooth. Vibration gibt es in Safari nicht, der Pausen-Ton nur bei nicht stummgeschaltetem Handy.
- Bundle ca. 1,1 MB (Scanner-Bibliothek). Ggf. später dynamisch nachladen.
- `App.jsx` ist groß; Aufteilen in Module wäre eine sinnvolle Aufräumarbeit.

## Ideen, die besprochen wurden

- **Fitnessuhr:** über die iPhone-App *Kurzbefehle* täglich Schritte/Aktivkalorien/Trainings aus Apple Health lesen und per POST an das
  Apps Script schicken (neue Op + Blatt). Aktivkalorien evtl. nur zur Hälfte aufs Kalorienziel anrechnen (einstellbar). Noch nicht gebaut.
- **Essen per Foto erkennen** (Bild-KI über Apps Script mit API-Schlüssel): bewusst zurückgestellt.
- Übungs-Animationen: Joshua möchte sie **nicht** in der App.
