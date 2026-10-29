/**
 * Trainings-App: Speicher im Google Sheet
 * 1. Projekteinstellungen > Skripteigenschaften: Eigenschaft CODE mit eigenem Code anlegen
 *    (den gibst du auch in der App ein). Der Code steht so nie im Quelltext.
 * 2. „Bereitstellen“ > „Neue Bereitstellung“ > Typ „Web-App“
 *    Ausführen als: Ich   |   Zugriff: Jeder
 * Hochladen und Bereitstellung erneuern geht von der App-Seite aus mit: npm run gas:deploy
 */
const CODE = PropertiesService.getScriptProperties().getProperty('CODE') || '';

function checkCode_(c) {
  if (!CODE) return 'Im Skript fehlt die Skripteigenschaft CODE.';
  if (String(c || '') !== CODE) return 'Falscher Code.';
  return '';
}

const SHEET_ENTRIES = 'Einträge';
const SHEET_EX = 'Übungen';
const H_ENTRIES = ['Datum', 'Übung', 'Art', 'Satz', 'Wiederholungen', 'Gewicht (kg)', 'Minuten', 'Kilometer', 'Eintrag-ID', 'Übungs-ID', 'Zeitstempel'];
const H_EX = ['Übungs-ID', 'Name', 'Art'];
const SHEET_META = 'Pläne & Notizen';
const H_META = ['Schlüssel', 'Wert (bitte nicht ändern)'];
const SHEET_FOOD = 'Essen';
const H_FOOD = ['Datum', 'Lebensmittel', 'Menge (g)', 'kcal', 'Eiweiß (g)', 'Eintrag-ID', 'Produkt-ID', 'Zeitstempel'];
const TYPE_LABEL = { kraft: 'Gewichte', eigen: 'Eigengewicht', cardio: 'Cardio' };
const TYPE_ID = { Gewichte: 'kraft', Eigengewicht: 'eigen', Cardio: 'cardio' };

function doGet(e) {
  const err = checkCode_(e.parameter.code);
  if (err) return json_({ ok: false, error: err });
  return json_(Object.assign({ ok: true }, load_()));
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Ungültige Anfrage.' });
  }
  const bad = checkCode_(body.code);
  if (bad) return json_({ ok: false, error: bad });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    (body.ops || []).forEach(apply_);
    SpreadsheetApp.flush();
    return json_(Object.assign({ ok: true }, load_()));
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Änderungen anwenden ---------- */

function apply_(o) {
  if (!o || !o.op) return;
  if (o.op === 'addExercise') addExercise_(o.exercise);
  if (o.op === 'deleteExercise') deleteRows_(sheet_(SHEET_EX, H_EX), 1, o.id);
  if (o.op === 'addEntry') addEntry_(o.entry, o.exName, o.exType);
  if (o.op === 'deleteEntry') deleteRows_(sheet_(SHEET_ENTRIES, H_ENTRIES), 9, o.id);
  if (o.op === 'setMeta') setMeta_(o.meta);
  if (o.op === 'addFood') addFood_(o.food);
  if (o.op === 'deleteFood') deleteRows_(sheet_(SHEET_FOOD, H_FOOD), 6, o.id);
}

function addExercise_(x) {
  if (!x || !x.id) return;
  const sh = sheet_(SHEET_EX, H_EX);
  if (ids_(sh, 1).has(String(x.id))) return;
  sh.appendRow([String(x.id), x.name, TYPE_LABEL[x.type] || x.type]);
}

function addEntry_(en, exName, exType) {
  if (!en || !en.id) return;
  const sh = sheet_(SHEET_ENTRIES, H_ENTRIES);
  if (ids_(sh, 9).has(String(en.id))) return;
  const p = String(en.date).split('-').map(Number);
  const date = new Date(p[0], p[1] - 1, p[2], 12);
  const art = TYPE_LABEL[exType] || exType || '';
  const base = (satz, reps, kg, min, km) => [date, exName, art, satz, reps, kg, min, km, String(en.id), String(en.exId), en.ts || ''];
  const rows = en.sets && en.sets.length
    ? en.sets.map((s, i) => base(i + 1, s.reps, s.kg == null ? '' : s.kg, '', ''))
    : [base('', '', '', en.minutes == null ? '' : en.minutes, en.km == null ? '' : en.km)];
  const start = sh.getLastRow() + 1;
  sh.getRange(start, 1, rows.length, H_ENTRIES.length).setValues(rows);
  sh.getRange(start, 1, rows.length, 1).setNumberFormat('dd.MM.yyyy');
}

function deleteRows_(sh, col, id) {
  const last = sh.getLastRow();
  if (last < 2) return;
  const vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]) === String(id)) sh.deleteRow(i + 2);
  }
}

/* ---------- Daten laden ---------- */

function load_() {
  const exRows = values_(sheet_(SHEET_EX, H_EX));
  const exercises = exRows
    .filter((r) => r[0] !== '')
    .map((r) => ({ id: String(r[0]), name: String(r[1]), type: TYPE_ID[r[2]] || String(r[2]) }));

  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const map = {};
  const order = [];
  values_(sheet_(SHEET_ENTRIES, H_ENTRIES)).forEach((r) => {
    const id = String(r[8]);
    if (!id) return;
    let e = map[id];
    if (!e) {
      const d = isDate_(r[0]) ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]);
      e = map[id] = { id: id, date: d, exId: String(r[9]), ts: Number(r[10]) || 0 };
      order.push(id);
    }
    if (r[3] !== '') {
      (e.sets = e.sets || []).push({ reps: Number(r[4]) || 0, kg: r[5] === '' ? null : Number(r[5]) });
    } else {
      e.minutes = r[6] === '' ? null : Number(r[6]);
      e.km = r[7] === '' ? null : Number(r[7]);
    }
  });
  return { exercises: exercises, entries: order.map((id) => map[id]), meta: loadMeta_(), food: loadFood_(tz), version: 3 };
}

/* ---------- Essen ---------- */

function addFood_(f) {
  if (!f || !f.id) return;
  const sh = sheet_(SHEET_FOOD, H_FOOD);
  if (ids_(sh, 6).has(String(f.id))) return;
  const p = String(f.date).split('-').map(Number);
  const date = new Date(p[0], p[1] - 1, p[2], 12);
  const row = sh.getLastRow() + 1;
  sh.getRange(row, 1, 1, H_FOOD.length).setValues([[date, f.name || '', f.g == null ? '' : f.g, f.kcal || 0, f.prot == null ? '' : f.prot, String(f.id), String(f.pid || ''), f.ts || '']]);
  sh.getRange(row, 1).setNumberFormat('dd.MM.yyyy');
}

function loadFood_(tz) {
  return values_(sheet_(SHEET_FOOD, H_FOOD))
    .filter((r) => r[5] !== '')
    .map((r) => ({
      id: String(r[5]),
      date: isDate_(r[0]) ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]),
      name: String(r[1]),
      g: r[2] === '' ? null : Number(r[2]),
      kcal: Number(r[3]) || 0,
      prot: r[4] === '' ? null : Number(r[4]),
      pid: String(r[6] || ''),
      ts: Number(r[7]) || 0,
    }));
}

/* ---------- Trainingspläne & Notizen ---------- */

function setMeta_(m) {
  const sh = sheet_(SHEET_META, H_META);
  const json = JSON.stringify(m || {});
  const vals = values_(sh);
  for (let i = 0; i < vals.length; i++) {
    if (vals[i][0] === 'meta') {
      sh.getRange(i + 2, 2).setValue(json);
      return;
    }
  }
  sh.appendRow(['meta', json]);
}

function loadMeta_() {
  const sh = sheet_(SHEET_META, H_META);
  const row = values_(sh).find((r) => r[0] === 'meta');
  if (!row) return { plans: [], notes: {} };
  try {
    return JSON.parse(row[1]);
  } catch (e) {
    return { plans: [], notes: {} };
  }
}

/* ---------- Hilfsfunktionen ---------- */

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

function values_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
}

function ids_(sh, col) {
  const last = sh.getLastRow();
  if (last < 2) return new Set();
  return new Set(sh.getRange(2, col, last - 1, 1).getValues().map((r) => String(r[0])));
}

function isDate_(v) {
  return Object.prototype.toString.call(v) === '[object Date]' || (v && typeof v.getFullYear === 'function');
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
