import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Trash2, Dumbbell, History, TrendingUp, ListChecks, Check, X, Pencil, Timer, Lightbulb, Trophy, StickyNote, ChevronUp, ChevronDown, ScanLine, ChevronLeft, ChevronRight, Search, UtensilsCrossed } from "lucide-react";

const KEY = "trainingslog-v1";
// Farben angelehnt an Hantelscheiben: blau, grün, gelb, rot – jede Farbe hat eine Bedeutung
const C = {
  bg: "#EEF0F3",
  card: "#FFFFFF",
  ink: "#16181C",
  floor: "#1B1E23",
  mute: "#68707B",
  line: "#DCE0E6",
  blue: "#2148D6",
  blueSoft: "#E5EAFC",
  teal: "#16925A",
  yellow: "#EDB200",
  red: "#D6322E",
  // Design-Einstellungen (zentral, damit sich das Aussehen leicht ändern lässt)
  field: "#FFFFFF",
  cardBorder: "#E4E7EC",
  solid: "#16181C",
  onSolid: "#FFFFFF",
  headText: "#FFFFFF",
  headMute: "#AEB5BF",
  navBg: "#1B1E23",
  navBorder: "transparent",
  navText: "#8D95A0",
  navOn: "#FFFFFF",
  navPill: "#2148D6",
  navPillText: "#FFFFFF",
  radius: 20,
  overlap: 26,
  barSoft: "#A9B6F2",
  scheme: "light",
  titleSize: 23,
  h1: 46,
  font: "'Barlow', system-ui, sans-serif",
  cond: "'Barlow Condensed', 'Barlow', system-ui, sans-serif",
};

// Themes: werden pro Gerät gespeichert und beim Start angewendet
const THEMES = {
  studio: {
    name: "Studio",
    desc: "Dunkler Kopf, Hantelscheiben-Farben",
    preview: { head: "#1B1E23", bg: "#EEF0F3", card: "#FFFFFF", accent: "#2148D6", text: "#16181C" },
    tokens: {},
  },
  nacht: {
    name: "Nachtmodus",
    desc: "Komplett dunkel, Orange",
    preview: { head: "#0E1012", bg: "#0E1012", card: "#181B1F", accent: "#FF6A2B", text: "#EEF0F2" },
    tokens: {
      bg: "#0E1012", card: "#181B1F", cardBorder: "#24282E", ink: "#EEF0F2", mute: "#8F98A3", line: "#2E333A", field: "#20242A",
      solid: "#EEF0F2", onSolid: "#0E1012", blue: "#FF6A2B", blueSoft: "#3A2216", teal: "#2FBF71", yellow: "#F5C542", red: "#FF4D4D",
      floor: "#0E1012", headText: "#EEF0F2", headMute: "#8F98A3", navBg: "#121417", navBorder: "#22262B", navText: "#7D8590",
      navOn: "#EEF0F2", navPill: "#FF6A2B", navPillText: "#FFFFFF", radius: 18, overlap: 0, barSoft: "#5A3524", scheme: "dark",
    },
  },
  ruhig: {
    name: "Hell & ruhig",
    desc: "Viel Weiß, runde Schrift, Grün",
    preview: { head: "#F3F5F7", bg: "#F3F5F7", card: "#FFFFFF", accent: "#0E7A5F", text: "#1D2430" },
    tokens: {
      bg: "#F3F5F7", card: "#FFFFFF", cardBorder: "#E7EAEE", ink: "#1D2430", mute: "#6E7785", line: "#DDE2E8", field: "#F7F8FA",
      solid: "#1D2430", onSolid: "#FFFFFF", blue: "#0E7A5F", blueSoft: "#E1F1EB", teal: "#2E9B6E", yellow: "#E3A21A", red: "#D64545",
      floor: "#F3F5F7", headText: "#1D2430", headMute: "#6E7785", navBg: "#FFFFFF", navBorder: "#E7EAEE", navText: "#8A929E",
      navOn: "#0E7A5F", navPill: "#E1F1EB", navPillText: "#0E7A5F", radius: 26, overlap: 0, barSoft: "#B7DCCD",
      font: "'Rubik', system-ui, sans-serif", cond: "'Rubik', system-ui, sans-serif", titleSize: 20, h1: 38,
    },
  },
  signal: {
    name: "Signal",
    desc: "Signalorange, schwarze Knöpfe",
    preview: { head: "#FF4F1A", bg: "#EDEDED", card: "#FFFFFF", accent: "#111111", text: "#111111" },
    tokens: {
      bg: "#EDEDED", card: "#FFFFFF", cardBorder: "#DADADA", ink: "#111111", mute: "#5F6368", line: "#D4D4D4", field: "#FFFFFF",
      solid: "#111111", onSolid: "#FFFFFF", blue: "#111111", blueSoft: "#FFE3D6", teal: "#15925A", yellow: "#FFB800", red: "#C81E1E",
      floor: "#FF4F1A", headText: "#111111", headMute: "rgba(17,17,17,.72)", navBg: "#111111", navBorder: "#111111", navText: "#9A9A9A",
      navOn: "#FFFFFF", navPill: "#FF4F1A", navPillText: "#111111", radius: 10, overlap: 22, barSoft: "#C9C9C9",
      font: "'Barlow', system-ui, sans-serif", cond: "'Oswald', 'Barlow Condensed', sans-serif", h1: 44,
    },
  },
};
let THEME_ID = "studio";
try {
  THEME_ID = localStorage.getItem("trn-theme") || "studio";
} catch (e) {
  /* Speicher gesperrt */
}
if (!THEMES[THEME_ID]) THEME_ID = "studio";
Object.assign(C, THEMES[THEME_ID].tokens);
if (typeof window !== "undefined" && window.__THEME) Object.assign(C, window.__THEME);
const TYPE_COL = { kraft: C.blue, eigen: C.teal, cardio: C.yellow };
const FONT = C.font;
const COND = C.cond;

const TYPES = [
  { id: "kraft", label: "Gewichte" },
  { id: "eigen", label: "Eigengewicht" },
  { id: "cardio", label: "Cardio" },
];
const PRESETS = [[3, 10], [4, 8], [5, 5]];
const EMPTY_META = { plans: [], notes: {} };
const REST_CHOICES = [60, 90, 120, 180];
const mmss = (sec) => `${Math.floor(sec / 60)}:${pad(sec % 60)}`;

/* ---------- Ton für den Pausentimer ---------- */
let audioCtx = null;
function unlockAudio() {
  try {
    if (!audioCtx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (A) audioCtx = new A();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {
    /* kein Ton möglich */
  }
}
function beep() {
  try {
    if (!audioCtx) return;
    [0, 0.28, 0.56].forEach((t, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = i === 2 ? 1320 : 880;
      o.connect(g);
      g.connect(audioCtx.destination);
      const st = audioCtx.currentTime + t;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.5, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.22);
      o.start(st);
      o.stop(st + 0.25);
    });
  } catch (e) {
    /* kein Ton möglich */
  }
}
const DEFAULT_EX = [
  ["Bankdrücken", "kraft"], ["Kniebeuge", "kraft"], ["Kreuzheben", "kraft"], ["Schulterdrücken", "kraft"],
  ["Rudern am Kabel", "kraft"], ["Latzug", "kraft"], ["Beinpresse", "kraft"], ["Bizepscurls", "kraft"],
  ["Klimmzüge", "eigen"], ["Liegestütze", "eigen"], ["Dips", "eigen"], ["Crunches", "eigen"],
  ["Laufband", "cardio"], ["Fahrradergometer", "cardio"], ["Rudergerät", "cardio"], ["Crosstrainer", "cardio"],
].map(([name, type], i) => ({ id: "d" + i, name, type }));

const METRICS = {
  kraft: [["perSet", "Gewicht je Satz", "kg"], ["maxKg", "Höchstes Gewicht", "kg"], ["volume", "Volumen (kg × Wdh.)", "kg"]],
  eigen: [["reps", "Wiederholungen gesamt", "Wdh."]],
  cardio: [["minutes", "Dauer", "min"], ["km", "Strecke", "km"]],
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const shortDate = (s) => {
  const [, m, d] = s.split("-");
  return `${d}.${m}.`;
};
const longDate = (s) =>
  new Date(s + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const num = (v) => {
  if (v === "" || v == null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
};
const fmt = (n) => (n == null ? "" : String(Math.round(n * 100) / 100).replace(".", ","));
const byNewest = (a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0);

function summary(e, ex) {
  const cardio = ex ? ex.type === "cardio" : !e.sets;
  if (cardio) {
    const p = [];
    if (e.minutes != null) p.push(`${fmt(e.minutes)} min`);
    if (e.km != null) p.push(`${fmt(e.km)} km`);
    return p.join(", ") || "–";
  }
  const s = e.sets || [];
  if (!s.length) return "–";
  const same = s.every((x) => x.reps === s[0].reps && x.kg === s[0].kg);
  if (same) return `${s.length} × ${s[0].reps}` + (s[0].kg ? ` mit ${fmt(s[0].kg)} kg` : "");
  return s.map((x) => (x.kg ? `${x.reps}×${fmt(x.kg)}` : `${x.reps}`)).join("  /  ") + (s.some((x) => x.kg) ? " kg" : "");
}

function seriesFor(entries, exId) {
  const by = {};
  entries
    .filter((e) => e.exId === exId)
    .forEach((e) => {
      const d = by[e.date] || (by[e.date] = { date: e.date, maxKg: 0, volume: 0, reps: 0, minutes: 0, km: 0, sets: [] });
      (e.sets || []).forEach((s) => {
        d.maxKg = Math.max(d.maxKg, s.kg || 0);
        d.volume += (s.kg || 0) * s.reps;
        d.reps += s.reps;
        d.sets.push(s);
      });
      d.minutes += e.minutes || 0;
      d.km += e.km || 0;
    });
  return Object.values(by)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const o = { ...d, label: shortDate(d.date) };
      d.sets.forEach((s, i) => (o["s" + (i + 1)] = s.kg || 0));
      return o;
    });
}

/* ---------- kleine Bausteine ---------- */

function Card({ children, title, right }) {
  return (
    <section className="p-4 mb-3" style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.cardBorder}` }}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: COND, fontWeight: 700, fontSize: C.titleSize, letterSpacing: 0.2 }}>{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm"
      style={{
        borderRadius: 999,
        background: active ? C.solid : C.field,
        color: active ? C.onSolid : C.ink,
        border: `1.5px solid ${active ? C.solid : C.line}`,
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

function Field({ value, onChange, placeholder, big, width }) {
  return (
    <input
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="text-center"
      style={{
        width: width || 64,
        padding: big ? "6px 8px" : "8px 6px",
        border: `1.5px solid ${C.line}`,
        borderRadius: big ? 14 : 10,
        fontFamily: big ? COND : FONT,
        fontWeight: big ? 700 : 500,
        fontSize: big ? 38 : 17,
        background: C.field,
        color: C.ink,
      }}
    />
  );
}

function DeleteButton({ onConfirm }) {
  const [ask, setAsk] = useState(false);
  if (ask)
    return (
      <span className="flex items-center gap-1">
        <button onClick={onConfirm} aria-label="Löschen bestätigen" className="p-2" style={{ color: "#C2261D" }}>
          <Check size={18} />
        </button>
        <button onClick={() => setAsk(false)} aria-label="Abbrechen" className="p-2" style={{ color: C.mute }}>
          <X size={18} />
        </button>
      </span>
    );
  return (
    <button onClick={() => setAsk(true)} aria-label="Löschen" className="p-2" style={{ color: C.mute }}>
      <Trash2 size={17} />
    </button>
  );
}

/* ---------- Sätze anzeigen ---------- */

function SetChips({ sets }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sets.map((s, i) => (
        <span key={i} className="px-2 py-1" style={{ background: C.field, border: `1.5px solid ${C.line}`, borderRadius: 8 }}>
          <span className="text-xs" style={{ color: C.mute }}>{i + 1}. </span>
          <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 18 }}>
            {s.reps}
            {s.kg ? ` × ${fmt(s.kg)} kg` : " Wdh."}
          </span>
        </span>
      ))}
    </div>
  );
}

// Erkennt anhand der gemachten Übungen, welcher Plan an einem Tag trainiert wurde
function planForDay(dayEntries, plans) {
  const done = new Set(dayEntries.map((e) => e.exId));
  let best = null;
  plans.forEach((p) => {
    const hit = p.exIds.filter((id) => done.has(id)).length;
    if (!hit) return;
    const ratio = hit / p.exIds.length;
    if (hit < 2 && ratio < 0.5) return;
    if (!best || hit > best.hit || (hit === best.hit && ratio > best.ratio)) best = { plan: p, hit, ratio };
  });
  return best ? best.plan : null;
}
const weekdayShort = (s) => new Date(s + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");

function suggestNext(last, ex) {
  if (!last || !last.sets || !last.sets.length || ex.type === "cardio") return null;
  const s = last.sets;
  const allReps = s.every((x) => x.reps >= s[0].reps);
  if (ex.type === "kraft") {
    const top = Math.max(...s.map((x) => x.kg || 0));
    if (!top) return null;
    const allTop = s.every((x) => (x.kg || 0) === top);
    if (allReps && allTop) {
      const step = top < 20 ? 1 : 2.5;
      return { up: true, kg: top + step, text: `Letztes Mal alle Sätze mit ${fmt(top)} kg geschafft. Heute ${fmt(top + step)} kg probieren.`, label: `Mit ${fmt(top + step)} kg übernehmen` };
    }
    return { up: false, text: `Noch nicht alle Sätze voll geschafft. Bleib bei ${fmt(top)} kg.` };
  }
  if (allReps) return { up: true, plusReps: 1, text: "Letztes Mal alle Sätze geschafft. Heute je 1 Wiederholung mehr probieren.", label: "Mit +1 Wdh. übernehmen" };
  return { up: false, text: "Noch nicht alle Sätze voll geschafft. Bleib bei den Wiederholungen." };
}

function LastBox({ history, ex, onApply }) {
  if (!history.length)
    return (
      <p className="text-sm mb-3" style={{ color: C.mute }}>
        Erstes Mal bei dieser Übung. Viel Erfolg!
      </p>
    );
  const [last, ...older] = history;
  const sug = suggestNext(last, ex);
  return (
    <div className="mb-4 p-3" style={{ background: C.blueSoft, borderRadius: 12 }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontWeight: 600, color: C.blue }}>Letztes Mal am {shortDate(last.date)}</span>
        <button onClick={() => onApply(last)} className="px-3 py-1 text-sm" style={{ background: C.blue, color: "#fff", borderRadius: 8, fontWeight: 600 }}>
          Übernehmen
        </button>
      </div>
      {ex.type === "cardio" ? (
        <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 22 }}>{summary(last, ex)}</div>
      ) : (
        <SetChips sets={last.sets || []} />
      )}
      {sug && (
        <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: "1px solid #C9D2F7" }}>
          <div className="flex gap-2 text-sm" style={{ color: C.ink }}>
            <Lightbulb size={17} style={{ color: sug.up ? "#C2731A" : C.mute, flexShrink: 0, marginTop: 1 }} />
            <span>{sug.text}</span>
          </div>
          {sug.up && (
            <button
              onClick={() => onApply(last, sug)}
              className="py-2 text-sm"
              style={{ background: C.field, color: C.blue, border: `1.5px solid ${C.blue}`, borderRadius: 8, fontWeight: 600 }}
            >
              {sug.label}
            </button>
          )}
        </div>
      )}
      {older.length > 0 && (
        <div className="mt-2 text-sm" style={{ color: C.mute }}>
          {older.map((o) => (
            <div key={o.id}>
              Am {shortDate(o.date)}: {summary(o, ex)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteBox({ note, onSave }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note);
  if (editing)
    return (
      <div className="mb-4">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="z. B. Sitzhöhe 4, Griff eng, Schulter zwickt"
          className="w-full p-2"
          style={{ border: `1.5px solid ${C.line}`, borderRadius: 10, fontSize: 16, minHeight: 70 }}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              onSave(text);
              setEditing(false);
            }}
            className="flex-1 py-2"
            style={{ background: C.solid, color: C.onSolid, borderRadius: 10, fontWeight: 600 }}
          >
            Notiz speichern
          </button>
          <button
            onClick={() => {
              setText(note);
              setEditing(false);
            }}
            className="px-4 py-2"
            style={{ color: C.mute, border: `1.5px solid ${C.line}`, borderRadius: 10 }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  if (!note)
    return (
      <button onClick={() => setEditing(true)} className="mb-3 text-sm flex items-center gap-1" style={{ color: C.mute }}>
        <StickyNote size={15} /> Notiz hinzufügen
      </button>
    );
  return (
    <button
      onClick={() => setEditing(true)}
      className="mb-4 w-full text-left p-3 flex gap-2"
      style={{ background: "#FFF8E1", border: "1.5px solid #F2DFA7", borderRadius: 12 }}
    >
      <StickyNote size={17} style={{ color: "#A36A00", flexShrink: 0, marginTop: 2 }} />
      <span className="flex-1" style={{ whiteSpace: "pre-wrap" }}>{note}</span>
      <Pencil size={15} style={{ color: C.mute, flexShrink: 0, marginTop: 3 }} />
    </button>
  );
}

/* ---------- Training eintragen ---------- */

function LogView({ data, save, exById, openReq, clearOpenReq, startRest }) {
  const meta = data.meta || EMPTY_META;
  const plans = meta.plans || [];
  const [activePlan, setActivePlanState] = useState(() => {
    const a = lsGet("trn-active-plan", null);
    return a && a.date === todayStr() ? a.id : null;
  });
  const setActivePlan = (id) => {
    setActivePlanState(id);
    lsSet("trn-active-plan", { date: todayStr(), id });
  };
  const plan = plans.find((p) => p.id === activePlan);
  const [date, setDate] = useState(todayStr());
  const lastTraining = useMemo(() => {
    const dates = [...new Set(data.entries.map((e) => e.date))].filter((d) => d < date).sort().reverse();
    for (const d of dates) {
      const p = planForDay(data.entries.filter((e) => e.date === d), plans);
      if (p) return { date: d, plan: p };
    }
    return dates.length ? { date: dates[0], plan: null } : null;
  }, [data.entries, plans, date]);
  const nextPlan = useMemo(() => {
    if (!plans.length) return null;
    if (!lastTraining?.plan) return null;
    const i = plans.findIndex((p) => p.id === lastTraining.plan.id);
    return plans[(i + 1) % plans.length];
  }, [plans, lastTraining]);
  const [editId, setEditId] = useState(null);
  const formRef = useRef(null);
  const [type, setType] = useState("kraft");
  const [exId, setExId] = useState(null);
  const [sets, setSets] = useState([]);
  const [allKg, setAllKg] = useState("");
  const [minutes, setMinutes] = useState("");
  const [km, setKm] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [flash, setFlash] = useState(null);

  const ex = exById[exId];
  const lastOf = (id) => data.entries.filter((e) => e.exId === id).sort(byNewest)[0];
  const last = exId ? lastOf(exId) : null;

  // Eintrag laden: gibt es an diesem Tag schon einen, wird er weiterbearbeitet
  const loadEntry = (e) => {
    setEditId(e.id);
    setMinutes(e.minutes != null ? fmt(e.minutes) : "");
    setKm(e.km != null ? fmt(e.km) : "");
    const s = (e.sets || []).map((x) => ({ reps: String(x.reps), kg: x.kg != null ? fmt(x.kg) : "" }));
    setSets(s);
    const mx = Math.max(0, ...(e.sets || []).map((x) => x.kg || 0));
    setAllKg(mx ? fmt(mx) : "");
  };

  const pick = (id, d = date, entryId = null) => {
    setExId(id);
    const existing = entryId
      ? data.entries.find((e) => e.id === entryId)
      : data.entries.filter((e) => e.exId === id && e.date === d).sort(byNewest)[0];
    if (existing) {
      loadEntry(existing);
    } else {
      setEditId(null);
      setSets([]);
      setMinutes("");
      setKm("");
      const l = lastOf(id);
      const maxKg = l?.sets?.length ? Math.max(...l.sets.map((s) => s.kg || 0)) : 0;
      setAllKg(maxKg ? fmt(maxKg) : "");
    }
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const openEntry = (e) => {
    const x = exById[e.exId];
    if (!x) return;
    setType(x.type);
    setAdding(false);
    pick(x.id, e.date, e.id);
  };

  useEffect(() => {
    if (!openReq) return;
    const e = data.entries.find((x) => x.id === openReq);
    if (e) {
      setDate(e.date);
      openEntry(e);
    }
    clearOpenReq();
  }, [openReq]);

  const closeForm = () => {
    setExId(null);
    setEditId(null);
    setSets([]);
    setMinutes("");
    setKm("");
  };

  const historyOf = (id) => data.entries.filter((e) => e.exId === id && e.date !== date).sort(byNewest).slice(0, 3);
  const applyLast = (l, sug) => {
    if (ex?.type === "cardio") {
      setMinutes(l.minutes != null ? fmt(l.minutes) : "");
      setKm(l.km != null ? fmt(l.km) : "");
      return;
    }
    const plus = sug?.plusReps || 0;
    const kgNew = sug?.kg != null ? fmt(sug.kg) : null;
    const s = (l.sets || []).map((x) => ({ reps: String(x.reps + plus), kg: kgNew ?? (x.kg != null ? fmt(x.kg) : "") }));
    setSets(s);
    const mx = Math.max(0, ...(l.sets || []).map((x) => x.kg || 0));
    if (kgNew) setAllKg(kgNew);
    else if (mx) setAllKg(fmt(mx));
  };
  const saveNote = (t) => {
    const notes = { ...(meta.notes || {}) };
    if (t.trim()) notes[exId] = t.trim();
    else delete notes[exId];
    save({ ...data, meta: { ...meta, notes } });
  };
  const applyPreset = (n, r) =>
    setSets(Array.from({ length: n }, () => ({ reps: String(r), kg: ex?.type === "kraft" ? allKg : "" })));
  const changeAllKg = (v) => {
    setAllKg(v);
    setSets((s) => s.map((x) => ({ ...x, kg: v })));
  };
  const addSet = () => {
    if (sets.length) startRest(true);
    setSets((s) => [
      ...s,
      { reps: s.length ? s[s.length - 1].reps : "10", kg: s.length ? s[s.length - 1].kg : ex?.type === "kraft" ? allKg : "" },
    ]);
  };
  const updSet = (i, k, v) => setSets((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const delSet = (i) => setSets((s) => s.filter((_, j) => j !== i));

  const canSave =
    ex && (ex.type === "cardio" ? num(minutes) || num(km) : sets.some((s) => num(s.reps) > 0));

  const saveEntry = () => {
    if (!canSave) return;
    const old = editId ? data.entries.find((x) => x.id === editId) : null;
    const e = old ? { id: old.id, ts: old.ts, date: old.date, exId } : { id: uid(), ts: Date.now(), date, exId };
    if (ex.type === "cardio") {
      e.minutes = num(minutes);
      e.km = num(km);
    } else {
      e.sets = sets
        .filter((s) => num(s.reps) > 0)
        .map((s) => ({ reps: Math.round(num(s.reps)), kg: ex.type === "kraft" ? num(s.kg) : null }));
    }
    // Neuer Rekord?
    const prev = data.entries.filter((x) => x.exId === exId && x.id !== e.id);
    let rec = null;
    if (prev.length) {
      if (ex.type === "kraft") {
        const nm = Math.max(0, ...e.sets.map((x) => x.kg || 0));
        const pm = Math.max(0, ...prev.flatMap((x) => (x.sets || []).map((y) => y.kg || 0)));
        if (nm > pm && nm > 0) rec = `Neuer Rekord: ${fmt(nm)} kg bei ${ex.name}!`;
      } else if (ex.type === "eigen") {
        const nm = Math.max(0, ...e.sets.map((x) => x.reps || 0));
        const pm = Math.max(0, ...prev.flatMap((x) => (x.sets || []).map((y) => y.reps || 0)));
        if (nm > pm && nm > 0) rec = `Neuer Rekord: ${nm} Wiederholungen am Stück bei ${ex.name}!`;
      } else {
        const pk = Math.max(0, ...prev.map((x) => x.km || 0));
        const pmin = Math.max(0, ...prev.map((x) => x.minutes || 0));
        if ((e.km || 0) > pk && pk > 0) rec = `Neue Bestleistung: ${fmt(e.km)} km bei ${ex.name}!`;
        else if ((e.minutes || 0) > pmin && pmin > 0) rec = `Neue Bestleistung: ${fmt(e.minutes)} Minuten bei ${ex.name}!`;
      }
    }
    save({ ...data, entries: old ? data.entries.map((x) => (x.id === old.id ? e : x)) : [...data.entries, e] });
    setFlash(rec ? { text: rec, rec: true } : { text: old ? `${ex.name} aktualisiert` : `${ex.name} gespeichert` });
    setTimeout(() => setFlash(null), rec ? 4500 : 2200);
    if (ex.type !== "cardio") startRest(true);
    closeForm();
  };

  const addExercise = () => {
    const name = newName.trim();
    if (!name) return;
    const found = data.exercises.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setType(found.type);
      pick(found.id);
    } else {
      const nx = { id: uid(), name, type };
      save({ ...data, exercises: [...data.exercises, nx] });
      setExId(nx.id);
      setEditId(null);
      setSets([]);
      setAllKg("");
    }
    setNewName("");
    setAdding(false);
  };

  const dayEntries = data.entries.filter((e) => e.date === date).sort((a, b) => (a.ts || 0) - (b.ts || 0));

  return (
    <>
      <Card>
        <label className="flex items-center justify-between gap-3">
          <span style={{ color: C.mute }}>Datum</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              if (!e.target.value) return;
              setDate(e.target.value);
              closeForm();
            }}
            style={{ border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "6px 10px", fontSize: 16 }}
          />
        </label>
      </Card>

      {plans.length > 0 && (
        <Card title="Trainingsplan">
          {lastTraining && (
            <div className="mb-3 px-3 py-2 text-sm" style={{ background: C.bg, borderRadius: 10 }}>
              <div>
                <span style={{ color: C.mute }}>Letztes Training ({weekdayShort(lastTraining.date)}, {shortDate(lastTraining.date)}):</span>{" "}
                <span style={{ fontWeight: 600 }}>{lastTraining.plan ? lastTraining.plan.name : "ohne Plan"}</span>
              </div>
              {nextPlan && (
                <div className="mt-1">
                  <span style={{ color: C.mute }}>Heute dran:</span>{" "}
                  <span style={{ fontWeight: 600, color: C.blue }}>{nextPlan.name}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {plans.map((p) => {
              const isNext = nextPlan && p.id === nextPlan.id && p.id !== activePlan;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlan(p.id === activePlan ? null : p.id)}
                  className="px-3 py-2 text-sm"
                  style={{
                    borderRadius: 999,
                    background: p.id === activePlan ? C.solid : isNext ? C.blueSoft : C.bg,
                    color: p.id === activePlan ? C.onSolid : isNext ? C.blue : C.ink,
                    border: isNext ? `1.5px solid ${C.blue}` : "1.5px solid transparent",
                    fontWeight: isNext || p.id === activePlan ? 600 : 500,
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
          {plan &&
            (() => {
              const items = plan.exIds.map((id) => exById[id]).filter(Boolean);
              const doneE = (id) => data.entries.filter((e) => e.exId === id && e.date === date).sort(byNewest)[0];
              const nextId = items.find((x) => !doneE(x.id))?.id;
              const n = items.filter((x) => doneE(x.id)).length;
              return (
                <div className="mt-3">
                  <p className="text-sm mb-1" style={{ color: n === items.length && n ? C.teal : C.mute, fontWeight: n === items.length && n ? 600 : 400 }}>
                    {n === items.length && n ? "Plan komplett erledigt. Stark!" : `${n} von ${items.length} erledigt`}
                  </p>
                  {items.map((x, i) => {
                    const d = doneE(x.id);
                    const isNext = x.id === nextId;
                    return (
                      <button
                        key={x.id}
                        onClick={() => {
                          setType(x.type);
                          setAdding(false);
                          pick(x.id);
                        }}
                        className="w-full flex items-center gap-3 py-2 px-2 text-left"
                        style={{ borderTop: `1px solid ${C.bg}`, background: x.id === exId ? C.blueSoft : "transparent", borderRadius: 8 }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: d ? C.teal : isNext ? C.blue : C.field,
                            color: d || isNext ? "#fff" : C.mute,
                            border: d || isNext ? "none" : `1.5px solid ${C.line}`,
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {d ? <Check size={16} /> : i + 1}
                        </span>
                        <span className="flex-1">
                          <span className="block" style={{ fontWeight: 600 }}>{x.name}</span>
                          <span className="block text-sm" style={{ color: isNext ? C.blue : C.mute }}>
                            {d ? summary(d, x) : isNext ? "Als Nächstes" : "Offen"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
        </Card>
      )}

      <Card title={plan ? "Weitere Übung" : "Übung wählen"}>
        <div className="flex gap-1 mb-3 p-1" style={{ background: C.bg, borderRadius: 12 }}>
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setType(t.id);
                closeForm();
                setAdding(false);
              }}
              className="flex-1 py-2 text-sm flex items-center justify-center gap-1"
              style={{
                borderRadius: 9,
                background: type === t.id ? C.field : "transparent",
                fontWeight: type === t.id ? 600 : 500,
                color: type === t.id ? C.ink : C.mute,
                boxShadow: type === t.id ? "0 1px 2px rgba(22,24,28,.12)" : "none",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 4, background: TYPE_COL[t.id], flexShrink: 0 }} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.exercises
            .filter((x) => x.type === type)
            .map((x) => {
              const done = data.entries.some((e) => e.exId === x.id && e.date === date);
              return (
                <Chip key={x.id} active={x.id === exId} onClick={() => pick(x.id)}>
                  <span className="flex items-center gap-1">
                    {done && <Check size={14} />}
                    {x.name}
                  </span>
                </Chip>
              );
            })}
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="px-3 py-2 text-sm flex items-center gap-1"
              style={{ borderRadius: 999, border: `1.5px dashed ${C.mute}`, color: C.ink }}
            >
              <Plus size={15} /> Neue Übung
            </button>
          )}
        </div>
        {adding && (
          <div className="flex gap-2 mt-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExercise()}
              placeholder={`Name (${TYPES.find((t) => t.id === type).label})`}
              className="flex-1 px-3 py-2"
              style={{ border: `1.5px solid ${C.line}`, borderRadius: 10, fontSize: 16 }}
            />
            <button onClick={addExercise} className="px-4" style={{ background: C.blue, color: "#fff", borderRadius: 10, fontWeight: 600 }}>
              Anlegen
            </button>
            <button onClick={() => setAdding(false)} aria-label="Abbrechen" className="px-2" style={{ color: C.mute }}>
              <X size={20} />
            </button>
          </div>
        )}
      </Card>

      {ex && (
        <div ref={formRef} style={{ scrollMarginTop: 12 }}>
        <Card
          title={ex.name}
          right={
            <button onClick={closeForm} aria-label="Schließen" className="p-1" style={{ color: C.mute }}>
              <X size={20} />
            </button>
          }
        >
          {editId && (
            <div className="mb-3 px-3 py-2 text-sm flex items-center gap-2" style={{ background: "#FFF4DD", color: "#7A4B00", borderRadius: 10 }}>
              <Pencil size={15} />
              {date === todayStr() ? "Heute schon eingetragen" : `Eingetragen am ${shortDate(date)}`}. Ändere Sätze oder füge neue hinzu.
            </div>
          )}
          <NoteBox key={exId} note={meta.notes?.[exId] || ""} onSave={saveNote} />
          <LastBox history={historyOf(exId)} ex={ex} onApply={applyLast} />

          {ex.type === "cardio" ? (
            <div className="flex gap-4">
              <label className="flex flex-col items-center gap-1">
                <Field value={minutes} onChange={setMinutes} placeholder="0" big width={110} />
                <span style={{ color: C.mute }}>Minuten</span>
              </label>
              <label className="flex flex-col items-center gap-1">
                <Field value={km} onChange={setKm} placeholder="0" big width={110} />
                <span style={{ color: C.mute }}>Kilometer</span>
              </label>
            </div>
          ) : (
            <>
              {ex.type === "kraft" && (
                <label className="flex items-end gap-2 mb-4">
                  <Field value={allKg} onChange={changeAllKg} placeholder="0" big width={120} />
                  <span style={{ fontFamily: COND, fontSize: 24, fontWeight: 600, paddingBottom: 6 }}>kg</span>
                  <span className="text-sm ml-2" style={{ color: C.mute, paddingBottom: 10 }}>für alle Sätze</span>
                </label>
              )}

              <div className="flex gap-2 mb-3">
                {PRESETS.map(([n, r]) => (
                  <button
                    key={n + "x" + r}
                    onClick={() => applyPreset(n, r)}
                    className="flex-1 py-2"
                    style={{ background: C.blueSoft, color: C.blue, borderRadius: 10, fontFamily: COND, fontWeight: 700, fontSize: 20 }}
                  >
                    {n} × {r}
                  </button>
                ))}
              </div>

              {sets.map((s, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <span className="w-14 text-sm" style={{ color: C.mute }}>
                    Satz {i + 1}
                  </span>
                  <Field value={s.reps} onChange={(v) => updSet(i, "reps", v)} placeholder="Wdh." />
                  <span className="text-sm" style={{ color: C.mute }}>Wdh.</span>
                  {ex.type === "kraft" && (
                    <>
                      <Field value={s.kg} onChange={(v) => updSet(i, "kg", v)} placeholder="kg" />
                      <span className="text-sm" style={{ color: C.mute }}>kg</span>
                    </>
                  )}
                  <button onClick={() => delSet(i)} aria-label={`Satz ${i + 1} entfernen`} className="ml-auto p-2" style={{ color: C.mute }}>
                    <X size={18} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between mt-2">
                <button onClick={addSet} className="flex items-center gap-1 text-sm py-2" style={{ color: C.blue, fontWeight: 600 }}>
                  <Plus size={16} /> Satz hinzufügen
                </button>
                <button onClick={() => startRest(false)} className="flex items-center gap-1 text-sm py-2 px-3" style={{ color: C.ink, background: C.bg, borderRadius: 999 }}>
                  <Timer size={15} /> Pause starten
                </button>
              </div>
            </>
          )}

          <button
            onClick={saveEntry}
            disabled={!canSave}
            className="w-full mt-4 py-3"
            style={{
              background: canSave ? C.blue : C.line,
              color: canSave ? "#fff" : C.mute,
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 17,
            }}
          >
            {editId ? "Änderungen speichern" : "Übung speichern"}
          </button>
        </Card>
        </div>
      )}

      {flash && (
        <div
          className="mb-3 px-4 py-3 flex items-center gap-2"
          style={{ background: flash.rec ? "#F5B82E" : C.teal, color: flash.rec ? C.ink : "#fff", borderRadius: 12, fontWeight: flash.rec ? 600 : 400 }}
        >
          {flash.rec ? <Trophy size={20} /> : <Check size={18} />} {flash.text}
        </div>
      )}

      <Card title={date === todayStr() ? "Heute erledigt" : `Am ${shortDate(date)} erledigt`}>
        {dayEntries.length > 0 && (
          <p className="text-sm mb-1" style={{ color: C.mute }}>Tippe eine Übung an, um sie zu bearbeiten oder weitere Sätze hinzuzufügen.</p>
        )}
        {dayEntries.length === 0 ? (
          <p style={{ color: C.mute }}>Noch nichts eingetragen. Wähle oben eine Übung.</p>
        ) : (
          dayEntries.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between py-2"
              style={{ borderTop: `1px solid ${C.bg}`, background: e.id === editId ? "#FFF4DD" : "transparent", borderRadius: 8 }}
            >
              <button onClick={() => openEntry(e)} className="flex-1 text-left flex items-center gap-3 py-1" aria-label={`${exById[e.exId]?.name || "Übung"} bearbeiten`}>
                <span>
                  <span className="block" style={{ fontWeight: 600 }}>{exById[e.exId]?.name || "Gelöschte Übung"}</span>
                  <span className="block text-sm" style={{ color: C.mute }}>{summary(e, exById[e.exId])}</span>
                </span>
              </button>
              <button onClick={() => openEntry(e)} aria-label="Bearbeiten" className="p-2" style={{ color: C.blue }}>
                <Pencil size={17} />
              </button>
              <DeleteButton
                onConfirm={() => {
                  if (e.id === editId) closeForm();
                  save({ ...data, entries: data.entries.filter((x) => x.id !== e.id) });
                }}
              />
            </div>
          ))
        )}
      </Card>
    </>
  );
}

/* ---------- Verlauf ---------- */

function HistoryView({ data, save, exById, onEdit }) {
  const days = useMemo(() => {
    const g = {};
    [...data.entries].sort(byNewest).forEach((e) => (g[e.date] = g[e.date] || []).push(e));
    return Object.entries(g);
  }, [data.entries]);

  if (!days.length)
    return (
      <Card>
        <p style={{ color: C.mute }}>Hier erscheinen deine Trainingstage, sobald du die erste Übung gespeichert hast.</p>
      </Card>
    );

  const plans = data.meta?.plans || [];
  return days.map(([date, list]) => {
    const p = planForDay(list, plans);
    return (
    <Card key={date} title={longDate(date)}>
      {p && (
        <span className="inline-block mb-2 px-2 py-1 text-xs" style={{ background: C.blueSoft, color: C.blue, borderRadius: 6, fontWeight: 600 }}>
          {p.name}
        </span>
      )}
      {list.map((e) => (
        <div key={e.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.bg}` }}>
          <button onClick={() => exById[e.exId] && onEdit(e.id)} className="flex-1 text-left">
            <span className="block" style={{ fontWeight: 600 }}>{exById[e.exId]?.name || "Gelöschte Übung"}</span>
            <span className="block text-sm" style={{ color: C.mute }}>{summary(e, exById[e.exId])}</span>
          </button>
          {exById[e.exId] && (
            <button onClick={() => onEdit(e.id)} aria-label="Bearbeiten" className="p-2" style={{ color: C.blue }}>
              <Pencil size={17} />
            </button>
          )}
          <DeleteButton onConfirm={() => save({ ...data, entries: data.entries.filter((x) => x.id !== e.id) })} />
        </div>
      ))}
    </Card>
    );
  });
}

/* ---------- Entwicklung ---------- */

function Stat({ label, value }) {
  return (
    <div className="flex-1 p-3" style={{ background: C.bg, borderRadius: 12 }}>
      <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 26, lineHeight: 1.1 }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: C.mute }}>{label}</div>
    </div>
  );
}

const dStr = (x) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dn = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dn);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y) / 86400000 + 1) / 7);
}

function WeekCard({ entries }) {
  const days = new Set(entries.map((e) => e.date));
  const today = todayStr();
  const mon = mondayOf(new Date());
  const week = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return dStr(x);
  });
  const weeks = Array.from({ length: 8 }, (_, k) => {
    const st = new Date(mon);
    st.setDate(mon.getDate() - 7 * (7 - k));
    let c = 0;
    for (let i = 0; i < 7; i++) {
      const x = new Date(st);
      x.setDate(st.getDate() + i);
      if (days.has(dStr(x))) c++;
    }
    return { kw: isoWeek(st), count: c, current: k === 7 };
  });
  const first = [...days].sort()[0];
  const weeksSince = first ? Math.min(8, Math.max(1, Math.floor((mon - mondayOf(new Date(first + "T12:00:00"))) / (7 * 86400000)) + 1)) : 1;
  const avg = weeks.slice(8 - weeksSince).reduce((s, w) => s + w.count, 0) / weeksSince;
  const thisWeek = weeks[7].count;
  const LBL = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <Card title="Trainingswochen">
      <div className="flex justify-between mb-4">
        {week.map((d, i) => {
          const on = days.has(d);
          const isToday = d === today;
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <span className="text-xs" style={{ color: isToday ? C.ink : C.mute, fontWeight: isToday ? 600 : 400 }}>{LBL[i]}</span>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: on ? C.blue : C.bg,
                  color: "#fff",
                  boxShadow: isToday ? `0 0 0 2px #fff, 0 0 0 4px ${C.ink}` : "none",
                }}
              >
                {on && <Check size={17} />}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mb-4">
        <Stat label="Diese Woche" value={`${thisWeek} ${thisWeek === 1 ? "Tag" : "Tage"}`} />
        <Stat label={weeksSince < 8 ? `Schnitt (${weeksSince} ${weeksSince === 1 ? "Woche" : "Wochen"})` : "Schnitt (8 Wochen)"} value={`${fmt(Math.round(avg * 10) / 10)} ${Math.round(avg * 10) / 10 === 1 ? "Tag" : "Tage"}`} />
      </div>
      <div className="flex items-end gap-2" style={{ height: 96 }}>
        {weeks.map((w) => (
          <div key={w.kw} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: "100%" }}>
            <span className="text-xs" style={{ color: C.ink, fontWeight: 600 }}>{w.count || ""}</span>
            <div style={{ width: "100%", maxWidth: 30, height: Math.max(3, (w.count / 7) * 58), background: w.current ? C.blue : C.barSoft, borderRadius: "5px 5px 2px 2px" }} />
            <span className="text-xs" style={{ color: w.current ? C.ink : C.mute, fontWeight: w.current ? 600 : 400, whiteSpace: "nowrap" }}>{w.kw}</span>
          </div>
        ))}
      </div>
      <p className="text-xs mt-2 text-center" style={{ color: C.mute }}>Trainingstage pro Kalenderwoche</p>
    </Card>
  );
}

function ProgressView({ data, exById }) {
  const used = data.exercises.filter((x) => data.entries.some((e) => e.exId === x.id));
  const [exId, setExId] = useState(used[0]?.id || "");
  const [metricIdx, setMetricIdx] = useState(0);
  const ex = exById[exId];
  const metrics = ex ? METRICS[ex.type] : [];
  const metric = metrics[metricIdx] || metrics[0];
  const series = useMemo(() => (ex ? seriesFor(data.entries, ex.id) : []), [data.entries, ex]);

  const volumeByDay = useMemo(() => {
    const g = {};
    data.entries.forEach((e) => {
      if (exById[e.exId]?.type !== "kraft") return;
      g[e.date] = (g[e.date] || 0) + (e.sets || []).reduce((s, x) => s + (x.kg || 0) * x.reps, 0);
    });
    return Object.entries(g)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-20)
      .map(([date, volume]) => ({ label: shortDate(date), volume }));
  }, [data.entries, exById]);

  const recent = [...data.entries].sort(byNewest).slice(0, 8);

  if (!used.length)
    return (
      <Card>
        <p style={{ color: C.mute }}>Sobald du ein paar Übungen eingetragen hast, siehst du hier deine Entwicklung.</p>
      </Card>
    );

  const vKey = metric?.[0] === "perSet" ? "maxKg" : metric?.[0];
  const vals = series.map((d) => d[vKey] || 0);
  const maxSets = Math.min(6, Math.max(0, ...series.map((d) => d.sets.length)));
  const SET_COLORS = [C.blue, C.teal, "#C2731A", "#8B3FC7", "#C2261D", "#5A6472"];
  const best = vals.length ? Math.max(...vals) : 0;
  const lastV = vals[vals.length - 1] || 0;
  const diff = vals.length > 1 ? lastV - vals[0] : null;
  const unit = metric?.[2] || "";

  return (
    <>
      <WeekCard entries={data.entries} />
      <Card title="Pro Übung">
        <select
          value={exId}
          onChange={(e) => {
            setExId(e.target.value);
            setMetricIdx(0);
          }}
          className="w-full px-3 py-2 mb-3"
          style={{ border: `1.5px solid ${C.line}`, borderRadius: 10, fontSize: 16, background: C.field }}
        >
          {used.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>

        {metrics.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {metrics.map((m, i) => (
              <Chip key={m[0]} active={i === metricIdx} onClick={() => setMetricIdx(i)}>
                {m[1]}
              </Chip>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <Stat label="Bestwert" value={`${fmt(best)} ${unit}`} />
          <Stat label="Zuletzt" value={`${fmt(lastV)} ${unit}`} />
          <Stat label="Seit Beginn" value={diff == null ? "–" : `${diff >= 0 ? "+" : ""}${fmt(diff)}`} />
        </div>

        {series.length < 2 ? (
          <p className="text-sm" style={{ color: C.mute }}>
            Ab zwei Trainingstagen mit dieser Übung erscheint hier eine Kurve.
          </p>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={C.bg} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.mute }} tickLine={false} axisLine={false} />
                <YAxis domain={["perSet", "maxKg"].includes(metric[0]) ? [(m) => Math.max(0, Math.floor((m - 5) / 5) * 5), (m) => Math.ceil((m + 5) / 5) * 5] : [0, "auto"]} tick={{ fontSize: 12, fill: C.mute }} tickLine={false} axisLine={false} />
                {metric[0] === "perSet" ? (
                  <>
                    <Tooltip formatter={(v, n) => [`${fmt(v)} kg`, `Satz ${String(n).slice(1)}`]} />
                    {Array.from({ length: maxSets }, (_, i) => (
                      <Line key={i} type="monotone" dataKey={"s" + (i + 1)} stroke={SET_COLORS[i]} strokeWidth={2.5} dot={{ r: 3, fill: SET_COLORS[i] }} connectNulls isAnimationActive={false} />
                    ))}
                  </>
                ) : (
                  <>
                    <Tooltip formatter={(v) => [`${fmt(v)} ${unit}`, metric[1]]} />
                    <Line type="monotone" dataKey={metric[0]} stroke={C.blue} strokeWidth={3} dot={{ r: 4, fill: C.blue }} isAnimationActive={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {metric[0] === "perSet" && series.length >= 2 && maxSets > 1 && (
          <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: C.mute }}>
            {Array.from({ length: maxSets }, (_, i) => (
              <span key={i} className="flex items-center gap-1">
                <span style={{ width: 10, height: 10, borderRadius: 3, background: SET_COLORS[i], display: "inline-block" }} /> Satz {i + 1}
              </span>
            ))}
          </div>
        )}
      </Card>

      {ex.type !== "cardio" && (
        <Card title={`Alle Sätze: ${ex.name}`}>
          {[...series].reverse().map((d) => (
            <div key={d.date} className="py-2" style={{ borderTop: `1px solid ${C.bg}` }}>
              <div className="text-sm mb-1" style={{ color: C.mute }}>{longDate(d.date)}</div>
              <SetChips sets={d.sets} />
            </div>
          ))}
        </Card>
      )}

      <Card title="Gesamtvolumen pro Trainingstag">
        {volumeByDay.length === 0 ? (
          <p className="text-sm" style={{ color: C.mute }}>Zählt alle Übungen mit Gewichten: Gewicht mal Wiederholungen.</p>
        ) : (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeByDay} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={C.bg} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: C.mute }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: C.mute }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [`${fmt(v)} kg`, "Volumen"]} />
                <Bar dataKey="volume" fill={C.teal} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Letzte Einträge">
        {recent.map((e) => (
          <div key={e.id} className="flex justify-between gap-3 py-2" style={{ borderTop: `1px solid ${C.bg}` }}>
            <span>
              <span style={{ fontWeight: 600 }}>{exById[e.exId]?.name || "Gelöschte Übung"}</span>
              <span className="text-sm block" style={{ color: C.mute }}>{summary(e, exById[e.exId])}</span>
            </span>
            <span className="text-sm" style={{ color: C.mute }}>{shortDate(e.date)}</span>
          </div>
        ))}
      </Card>
    </>
  );
}

/* ---------- Sichern & Wiederherstellen ---------- */

function downloadFile(content, name, mime) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (e) {
    return false;
  }
}

function toCsv(data, exById) {
  const typeLabel = Object.fromEntries(TYPES.map((t) => [t.id, t.label]));
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [["Datum", "Übung", "Art", "Satz", "Wiederholungen", "Gewicht (kg)", "Minuten", "Kilometer"]];
  [...data.entries]
    .sort((a, b) => a.date.localeCompare(b.date) || (a.ts || 0) - (b.ts || 0))
    .forEach((e) => {
      const ex = exById[e.exId];
      const d = e.date.split("-").reverse().join(".");
      const name = ex?.name || "Gelöschte Übung";
      const art = ex ? typeLabel[ex.type] : "";
      if (e.sets && e.sets.length) {
        e.sets.forEach((s, i) => rows.push([d, name, art, i + 1, s.reps, fmt(s.kg), "", ""]));
      } else {
        rows.push([d, name, art, "", "", "", fmt(e.minutes), fmt(e.km)]);
      }
    });
  return "\uFEFF" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
}

function BackupCard({ data, save, exById }) {
  const [msg, setMsg] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [importText, setImportText] = useState("");
  const json = JSON.stringify({ app: "trainingslog", version: 1, exportedAt: new Date().toISOString(), ...data }, null, 1);
  const stamp = todayStr();

  const note = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 3500);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      note("Sicherung in die Zwischenablage kopiert.");
    } catch (e) {
      setShowJson(true);
      note("Kopieren ist hier gesperrt. Markiere den Text im Feld und kopiere ihn von Hand.");
    }
  };

  const doImport = () => {
    let parsed;
    try {
      parsed = JSON.parse(importText);
    } catch (e) {
      note("Das ist keine gültige Sicherung. Füge den kompletten Text der Sicherung ein.");
      return;
    }
    if (!parsed || !Array.isArray(parsed.exercises) || !Array.isArray(parsed.entries)) {
      note("In dem Text fehlen Übungen oder Einträge. Prüfe, ob du die ganze Sicherung eingefügt hast.");
      return;
    }
    const exIds = new Set(data.exercises.map((x) => x.id));
    const enIds = new Set(data.entries.map((x) => x.id));
    const newEx = parsed.exercises.filter((x) => x && x.id && x.name && !exIds.has(x.id));
    const newEn = parsed.entries.filter((x) => x && x.id && x.date && x.exId && !enIds.has(x.id));
    const m = data.meta || EMPTY_META;
    const pm = parsed.meta || EMPTY_META;
    const meta = {
      ...m,
      plans: [...(m.plans || []), ...(pm.plans || []).filter((p) => !(m.plans || []).some((q) => q.id === p.id))],
      notes: { ...(pm.notes || {}), ...(m.notes || {}) },
      products: [...(m.products || []), ...(pm.products || []).filter((p) => !(m.products || []).some((q) => q.id === p.id))],
      goal: m.goal || pm.goal || null,
    };
    const curFood = data.food || [];
    const newFood = (Array.isArray(parsed.food) ? parsed.food : []).filter((f) => f && f.id && f.date && !curFood.some((x) => x.id === f.id));
    save({ ...data, exercises: [...data.exercises, ...newEx], entries: [...data.entries, ...newEn], meta, food: [...curFood, ...newFood] });
    setImportText("");
    note(`Eingespielt: ${newEn.length} Trainings-Einträge, ${newEx.length} Übungen und ${newFood.length} Essens-Einträge neu hinzugefügt.`);
  };

  const btn = { background: C.blueSoft, color: C.blue, borderRadius: 10, fontWeight: 600 };

  return (
    <Card title="Daten sichern">
      <p className="text-sm mb-3" style={{ color: C.mute }}>
        {data.entries.length} Einträge und {data.exercises.length} Übungen gespeichert.
      </p>
      <div className="flex flex-col gap-2">
        <button
          className="py-3"
          style={btn}
          onClick={() =>
            downloadFile(json, `training-sicherung-${stamp}.json`, "application/json")
              ? note("Sicherung wird heruntergeladen.")
              : (setShowJson(true), note("Download ist hier gesperrt. Kopiere die Sicherung aus dem Feld."))
          }
        >
          Sicherung herunterladen (JSON)
        </button>
        <button
          className="py-3"
          style={btn}
          onClick={() =>
            downloadFile(toCsv(data, exById), `training-${stamp}.csv`, "text/csv;charset=utf-8")
              ? note("Tabelle wird heruntergeladen.")
              : note("Download ist hier gesperrt. Nutze stattdessen „Sicherung kopieren“.")
          }
        >
          Als Tabelle für Excel (CSV)
        </button>
        <button className="py-3" style={btn} onClick={copy}>
          Sicherung kopieren
        </button>
        <button className="py-2 text-sm" style={{ color: C.mute }} onClick={() => setShowJson((v) => !v)}>
          {showJson ? "Sicherungstext ausblenden" : "Sicherungstext anzeigen"}
        </button>
      </div>

      {showJson && (
        <textarea
          readOnly
          value={json}
          onFocus={(e) => e.target.select()}
          className="w-full mt-2 p-2 text-xs"
          style={{ height: 140, border: `1.5px solid ${C.line}`, borderRadius: 10 }}
        />
      )}

      <h3 className="mt-5 mb-2" style={{ fontFamily: COND, fontWeight: 600, fontSize: 19 }}>
        Sicherung einspielen
      </h3>
      <p className="text-sm mb-2" style={{ color: C.mute }}>
        Füge den Text einer Sicherung ein. Vorhandene Einträge bleiben erhalten, nur fehlende werden ergänzt.
      </p>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="Sicherungstext hier einfügen"
        className="w-full p-2 text-sm"
        style={{ height: 90, border: `1.5px solid ${C.line}`, borderRadius: 10 }}
      />
      <button
        onClick={doImport}
        disabled={!importText.trim()}
        className="w-full mt-2 py-3"
        style={{
          background: importText.trim() ? C.blue : C.line,
          color: importText.trim() ? "#fff" : C.mute,
          borderRadius: 12,
          fontWeight: 600,
        }}
      >
        Sicherung einspielen
      </button>

      {msg && (
        <div className="mt-3 px-3 py-2 text-sm" style={{ background: C.bg, borderRadius: 10 }}>
          {msg}
        </div>
      )}
    </Card>
  );
}

/* ---------- Trainingspläne ---------- */

function PlansCard({ data, save, exById }) {
  const meta = data.meta || EMPTY_META;
  const plans = meta.plans || [];
  const [edit, setEdit] = useState(null);
  const savePlans = (p) => save({ ...data, meta: { ...meta, plans: p } });
  const valid = edit && edit.name.trim() && edit.exIds.length;
  const commitEdit = () => {
    if (!valid) return;
    const p = { ...edit, name: edit.name.trim() };
    savePlans(plans.some((x) => x.id === p.id) ? plans.map((x) => (x.id === p.id ? p : x)) : [...plans, p]);
    setEdit(null);
  };
  const toggle = (id) => setEdit((e) => ({ ...e, exIds: e.exIds.includes(id) ? e.exIds.filter((x) => x !== id) : [...e.exIds, id] }));
  const move = (i, d) =>
    setEdit((e) => {
      const a = [...e.exIds];
      const j = i + d;
      if (j < 0 || j >= a.length) return e;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...e, exIds: a };
    });

  if (edit)
    return (
      <Card title={plans.some((x) => x.id === edit.id) ? "Plan bearbeiten" : "Neuer Plan"}>
        <input
          autoFocus
          value={edit.name}
          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
          placeholder="z. B. Tag A – Oberkörper"
          className="w-full px-3 py-2 mb-3"
          style={{ border: `1.5px solid ${C.line}`, borderRadius: 10, fontSize: 16 }}
        />
        {edit.exIds.length > 0 && (
          <div className="mb-3">
            <p className="text-sm mb-1" style={{ color: C.mute }}>Reihenfolge im Studio</p>
            {edit.exIds.map((id, i) => (
              <div key={id} className="flex items-center gap-2 py-1" style={{ borderTop: `1px solid ${C.bg}` }}>
                <span className="w-6 text-sm" style={{ color: C.mute }}>{i + 1}.</span>
                <span className="flex-1">{exById[id]?.name || "Gelöschte Übung"}</span>
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Nach oben" className="p-1" style={{ color: i === 0 ? C.line : C.ink }}>
                  <ChevronUp size={20} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === edit.exIds.length - 1} aria-label="Nach unten" className="p-1" style={{ color: i === edit.exIds.length - 1 ? C.line : C.ink }}>
                  <ChevronDown size={20} />
                </button>
                <button onClick={() => toggle(id)} aria-label="Entfernen" className="p-1" style={{ color: C.mute }}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm mb-2" style={{ color: C.mute }}>Übungen antippen, um sie hinzuzufügen</p>
        {TYPES.map((t) => (
          <div key={t.id} className="mb-2">
            <div className="text-xs mb-1" style={{ color: C.mute }}>{t.label}</div>
            <div className="flex flex-wrap gap-2">
              {data.exercises
                .filter((x) => x.type === t.id)
                .map((x) => (
                  <Chip key={x.id} active={edit.exIds.includes(x.id)} onClick={() => toggle(x.id)}>
                    {x.name}
                  </Chip>
                ))}
            </div>
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <button
            onClick={commitEdit}
            disabled={!valid}
            className="flex-1 py-3"
            style={{ background: valid ? C.blue : C.line, color: valid ? "#fff" : C.mute, borderRadius: 12, fontWeight: 600 }}
          >
            Plan speichern
          </button>
          <button onClick={() => setEdit(null)} className="px-4 py-3" style={{ color: C.mute, border: `1.5px solid ${C.line}`, borderRadius: 12 }}>
            Abbrechen
          </button>
        </div>
      </Card>
    );

  return (
    <Card title="Trainingspläne">
      {plans.length === 0 && (
        <p className="text-sm mb-3" style={{ color: C.mute }}>
          Lege feste Abläufe an, z. B. „Tag A“ und „Tag B“. Im Training tippst du dann nur noch den Plan an und arbeitest ihn ab.
        </p>
      )}
      {plans.map((p) => (
        <div key={p.id} className="flex items-center gap-2 py-2" style={{ borderTop: `1px solid ${C.bg}` }}>
          <button onClick={() => setEdit({ ...p })} className="flex-1 text-left">
            <span className="block" style={{ fontWeight: 600 }}>{p.name}</span>
            <span className="block text-sm" style={{ color: C.mute }}>
              {p.exIds.map((id) => exById[id]?.name).filter(Boolean).join(", ")}
            </span>
          </button>
          <button onClick={() => setEdit({ ...p })} aria-label="Plan bearbeiten" className="p-2" style={{ color: C.blue }}>
            <Pencil size={17} />
          </button>
          <DeleteButton onConfirm={() => savePlans(plans.filter((x) => x.id !== p.id))} />
        </div>
      ))}
      <button
        onClick={() => setEdit({ id: uid(), name: "", exIds: [] })}
        className="w-full mt-2 py-3 flex items-center justify-center gap-1"
        style={{ background: C.blueSoft, color: C.blue, borderRadius: 12, fontWeight: 600 }}
      >
        <Plus size={17} /> Neuen Plan anlegen
      </button>
    </Card>
  );
}

function RestSettingsCard({ cfg, setCfg }) {
  return (
    <Card title="Pausentimer">
      <p className="text-sm mb-2" style={{ color: C.mute }}>Pausenlänge zwischen den Sätzen</p>
      <div className="flex gap-2 mb-4">
        {REST_CHOICES.map((sec) => (
          <button
            key={sec}
            onClick={() => setCfg({ ...cfg, sec })}
            className="flex-1 py-2"
            style={{
              borderRadius: 10,
              background: cfg.sec === sec ? C.solid : C.bg,
              color: cfg.sec === sec ? C.onSolid : C.ink,
              fontFamily: COND,
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {mmss(sec)}
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="block">Automatisch starten</span>
          <span className="block text-sm" style={{ color: C.mute }}>bei „Satz hinzufügen“ und nach dem Speichern</span>
        </span>
        <button
          role="switch"
          aria-checked={cfg.auto}
          onClick={() => setCfg({ ...cfg, auto: !cfg.auto })}
          style={{ width: 52, height: 30, borderRadius: 15, background: cfg.auto ? C.teal : C.line, position: "relative", flexShrink: 0 }}
        >
          <span style={{ position: "absolute", top: 3, left: cfg.auto ? 25 : 3, width: 24, height: 24, borderRadius: 12, background: "#FFFFFF", transition: "left .15s" }} />
        </button>
      </label>
    </Card>
  );
}

/* ---------- Aussehen ---------- */

function ThemeCard() {
  const choose = (id) => {
    if (id === THEME_ID) return;
    try {
      localStorage.setItem("trn-theme", id);
      sessionStorage.setItem("trn-tab", "exercises");
    } catch (e) {
      /* Speicher gesperrt */
    }
    window.scrollTo(0, 0);
    location.reload();
  };
  return (
    <Card title="Aussehen">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(THEMES).map(([id, t]) => {
          const on = id === THEME_ID;
          const pv = t.preview;
          return (
            <button
              key={id}
              onClick={() => choose(id)}
              className="text-left p-2"
              aria-pressed={on}
              style={{ borderRadius: 14, border: `2px solid ${on ? C.blue : C.line}`, background: C.field }}
            >
              <div style={{ borderRadius: 9, overflow: "hidden", background: pv.bg, border: "1px solid rgba(0,0,0,.08)" }} aria-hidden="true">
                <div style={{ background: pv.head, height: 22, padding: "5px 7px" }}>
                  <div style={{ width: 34, height: 8, borderRadius: 3, background: pv.head === pv.bg ? pv.text : pv.head === "#FF4F1A" ? "#111" : "#fff", opacity: 0.85 }} />
                </div>
                <div style={{ padding: 6 }}>
                  <div style={{ background: pv.card, borderRadius: 6, padding: 6 }}>
                    <div style={{ width: "70%", height: 6, borderRadius: 3, background: pv.text, opacity: 0.8, marginBottom: 5 }} />
                    <div style={{ width: "45%", height: 12, borderRadius: 6, background: pv.accent }} />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1" style={{ fontWeight: 600 }}>
                {on && <Check size={15} style={{ color: C.blue }} />}
                {t.name}
              </div>
              <div className="text-xs" style={{ color: C.mute }}>{t.desc}</div>
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: C.mute }}>Wird auf diesem Handy gespeichert. Die App lädt beim Wechsel kurz neu.</p>
    </Card>
  );
}

/* ---------- Übungen verwalten ---------- */

function ExercisesView({ data, save, exById, sync, rest }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("kraft");
  const add = () => {
    const n = name.trim();
    if (!n || data.exercises.some((x) => x.name.toLowerCase() === n.toLowerCase())) return;
    save({ ...data, exercises: [...data.exercises, { id: uid(), name: n, type }] });
    setName("");
  };
  return (
    <>
      <ThemeCard />
      <PlansCard data={data} save={save} exById={exById} />
      <RestSettingsCard cfg={rest.cfg} setCfg={rest.setCfg} />
      <Card title="Neue Übung anlegen">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="z. B. Ausfallschritte"
          className="w-full px-3 py-2 mb-3"
          style={{ border: `1.5px solid ${C.line}`, borderRadius: 10, fontSize: 16 }}
        />
        <div className="flex gap-2 mb-3 flex-wrap">
          {TYPES.map((t) => (
            <Chip key={t.id} active={type === t.id} onClick={() => setType(t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
        <button onClick={add} className="w-full py-3" style={{ background: C.blue, color: "#fff", borderRadius: 12, fontWeight: 600 }}>
          Übung anlegen
        </button>
      </Card>

      {TYPES.map((t) => (
        <Card key={t.id} title={t.label}>
          {data.exercises
            .filter((x) => x.type === t.id)
            .map((x) => {
              const count = data.entries.filter((e) => e.exId === x.id).length;
              return (
                <div key={x.id} className="flex items-center justify-between py-1" style={{ borderTop: `1px solid ${C.bg}` }}>
                  <span>{x.name}</span>
                  {count ? (
                    <span className="text-sm py-2" style={{ color: C.mute }}>
                      {count} {count === 1 ? "Eintrag" : "Einträge"}
                    </span>
                  ) : (
                    <DeleteButton onConfirm={() => save({ ...data, exercises: data.exercises.filter((y) => y.id !== x.id) })} />
                  )}
                </div>
              );
            })}
        </Card>
      ))}

      <SyncCard {...sync} />
      <BackupCard data={data} save={save} exById={exById} />
    </>
  );
}

/* ---------- Essen ---------- */

const ORANGE = C.red;
const fmt0 = (n) => (n == null ? "" : Math.round(n).toLocaleString("de-DE"));
const fmt1 = (n) => (n == null ? "" : (Math.round(n * 10) / 10).toLocaleString("de-DE"));

function dayLabel(d) {
  const t = todayStr();
  if (d === t) return "Heute";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d === dStr(y)) return "Gestern";
  return new Date(d + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
}
const shiftDay = (d, n) => {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() + n);
  return dStr(x);
};

async function lookupBarcode(code) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_de,brands,nutriments,serving_quantity`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Server antwortet nicht");
  const j = await res.json();
  if (!j || j.status !== 1 || !j.product) return null;
  const p = j.product;
  const n = p.nutriments || {};
  const toNum = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));
  let kcal = toNum(n["energy-kcal_100g"]);
  if (kcal == null && toNum(n["energy_100g"]) != null) kcal = Math.round(toNum(n["energy_100g"]) / 4.184);
  return {
    code,
    name: (p.product_name_de || p.product_name || "").trim(),
    brand: String(p.brands || "").split(",")[0].trim(),
    kcal100: kcal,
    prot100: toNum(n["proteins_100g"]),
    serving: toNum(p.serving_quantity),
  };
}

function Scanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");
  useEffect(() => {
    let controls = null;
    let done = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        controls = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          videoRef.current,
          (res, _e, ctl) => {
            if (res && !done) {
              done = true;
              ctl.stop();
              try {
                navigator.vibrate && navigator.vibrate(80);
              } catch (e) {
                /* keine Vibration */
              }
              onResult(res.getText());
            }
          }
        );
        if (done) controls.stop();
      } catch (e) {
        const name = e && e.name;
        if (name === "NotAllowedError") setErr("Die Kamera ist nicht erlaubt. Erlaube sie in den iPhone-Einstellungen unter Safari → Kamera und versuch es noch einmal.");
        else if (name === "NotFoundError" || name === "OverconstrainedError") setErr("Keine Kamera gefunden.");
        else setErr("Die Kamera konnte nicht gestartet werden. Gib die Nummer unter dem Strichcode einfach unten ein.");
      }
    })();
    return () => {
      done = true;
      if (controls) controls.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#000", zIndex: 60 }}>
      <div className="flex items-center justify-between px-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)", color: "#fff" }}>
        <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 26 }}>Strichcode scannen</span>
        <button onClick={onClose} aria-label="Scanner schließen" className="p-2">
          <X size={26} />
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
        {!err && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div style={{ width: "78%", maxWidth: 340, height: 150, border: "3px solid #fff", borderRadius: 16, boxShadow: "0 0 0 2000px rgba(0,0,0,.45)" }} />
          </div>
        )}
        {err && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p className="text-center" style={{ color: "#fff", fontSize: 17 }}>{err}</p>
          </div>
        )}
      </div>
      <div className="p-4" style={{ background: "#111", paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
        {!err && <p className="text-center text-sm mb-3" style={{ color: "#bbb" }}>Halte den Strichcode in den Rahmen.</p>}
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={manual}
            onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
            placeholder="Oder Nummer eintippen"
            className="flex-1 px-3 py-3"
            style={{ borderRadius: 10, fontSize: 16, background: C.field }}
          />
          <button
            onClick={() => manual.length >= 8 && onResult(manual)}
            disabled={manual.length < 8}
            className="px-4"
            style={{ background: manual.length >= 8 ? C.blue : "#444", color: "#fff", borderRadius: 10, fontWeight: 600 }}
          >
            Suchen
          </button>
        </div>
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ background: "rgba(20,24,30,.45)", zIndex: 50 }} onClick={onClose}>
      <div
        className="w-full max-w-xl p-4"
        style={{ background: C.card, borderRadius: "20px 20px 0 0", maxHeight: "92vh", overflowY: "auto", paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: COND, fontWeight: 700, fontSize: 26, lineHeight: 1.1 }}>{title}</h2>
          <button onClick={onClose} aria-label="Schließen" className="p-1" style={{ color: C.mute }}>
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inpStyle = { border: `1.5px solid ${C.line}`, borderRadius: 10, fontSize: 16, background: C.field };

// Menge zu einem bekannten Produkt eingeben (Werte pro 100 g oder pro Portion)
function AmountSheet({ product, entry, lastGrams, onSave, onEdit, onClose }) {
  const per100 = product.kcal100 != null;
  const [grams, setGrams] = useState(() => {
    if (entry && entry.g != null) return fmt(entry.g);
    return String(lastGrams || product.serving || 100);
  });
  const [factor, setFactor] = useState(() => (entry && product.pKcal ? fmt(Math.round((entry.kcal / product.pKcal) * 100) / 100) : "1"));
  const g = num(grams) || 0;
  const f = num(factor) || 0;
  const kcal = per100 ? (product.kcal100 * g) / 100 : (product.pKcal || 0) * f;
  const prot = per100 ? (product.prot100 != null ? (product.prot100 * g) / 100 : null) : product.pProt != null ? product.pProt * f : null;
  const ok = per100 ? g > 0 : f > 0;
  const chips = per100 ? [50, 100, 150, 200, 250] : [0.5, 1, 1.5, 2];
  return (
    <Sheet title={product.name} onClose={onClose}>
      <p className="text-sm mb-3" style={{ color: C.mute }}>
        {product.brand ? `${product.brand} · ` : ""}
        {per100
          ? `${fmt0(product.kcal100)} kcal${product.prot100 != null ? `, ${fmt1(product.prot100)} g Eiweiß` : ""} pro 100 g`
          : `${fmt0(product.pKcal)} kcal${product.pProt != null ? `, ${fmt1(product.pProt)} g Eiweiß` : ""} pro Portion`}
      </p>
      <label className="flex items-end gap-2 mb-3">
        {per100 ? (
          <>
            <Field value={grams} onChange={setGrams} placeholder="0" big width={130} />
            <span style={{ fontFamily: COND, fontSize: 24, fontWeight: 600, paddingBottom: 6 }}>g</span>
          </>
        ) : (
          <>
            <Field value={factor} onChange={setFactor} placeholder="1" big width={110} />
            <span style={{ fontFamily: COND, fontSize: 24, fontWeight: 600, paddingBottom: 6 }}>Portion</span>
          </>
        )}
      </label>
      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((c) => (
          <Chip key={c} active={per100 ? g === c : f === c} onClick={() => (per100 ? setGrams(String(c)) : setFactor(fmt(c)))}>
            {per100 ? `${c} g` : `${fmt(c)} ×`}
          </Chip>
        ))}
        {per100 && product.serving && !chips.includes(product.serving) && (
          <Chip active={g === product.serving} onClick={() => setGrams(fmt(product.serving))}>
            1 Portion ({fmt(product.serving)} g)
          </Chip>
        )}
      </div>
      <div className="p-3 mb-4 flex gap-2" style={{ background: C.bg, borderRadius: 12 }}>
        <div className="flex-1">
          <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 30, lineHeight: 1 }}>{fmt0(kcal)}</div>
          <div className="text-xs" style={{ color: C.mute }}>kcal</div>
        </div>
        <div className="flex-1">
          <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 30, lineHeight: 1 }}>{prot == null ? "–" : fmt1(prot)}</div>
          <div className="text-xs" style={{ color: C.mute }}>g Eiweiß</div>
        </div>
      </div>
      <button
        disabled={!ok}
        onClick={() => onSave({ g: per100 ? g : null, kcal: Math.round(kcal), prot: prot == null ? null : Math.round(prot * 10) / 10 })}
        className="w-full py-3"
        style={{ background: ok ? C.blue : C.line, color: ok ? "#fff" : C.mute, borderRadius: 12, fontWeight: 600, fontSize: 17 }}
      >
        {entry ? "Änderung speichern" : "Hinzufügen"}
      </button>
      <button onClick={onEdit} className="w-full mt-2 py-2 text-sm" style={{ color: C.mute }}>
        Nährwerte korrigieren
      </button>
    </Sheet>
  );
}

// Neues Lebensmittel von Hand anlegen oder Nährwerte korrigieren
function ManualSheet({ initial, notFound, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [mode, setMode] = useState(initial && initial.pKcal != null && initial.kcal100 == null ? "portion" : "per100");
  const [kcal, setKcal] = useState(initial ? fmt(initial.kcal100 ?? initial.pKcal) : "");
  const [prot, setProt] = useState(initial ? fmt(initial.prot100 ?? initial.pProt) : "");
  const [grams, setGrams] = useState(initial?.serving ? fmt(initial.serving) : "100");
  const [remember, setRemember] = useState(true);
  const k = num(kcal);
  const ok = name.trim() && k != null && k >= 0 && (mode === "portion" || (num(grams) || 0) > 0);
  const save = () => {
    if (!ok) return;
    const p = num(prot);
    const product =
      mode === "per100"
        ? { name: name.trim(), kcal100: k, prot100: p, serving: initial?.serving ?? null, pKcal: null, pProt: null }
        : { name: name.trim(), kcal100: null, prot100: null, serving: null, pKcal: k, pProt: p };
    onSave(product, mode === "per100" ? num(grams) : null, remember);
  };
  return (
    <Sheet title={initial?.id ? "Nährwerte korrigieren" : "Lebensmittel eintragen"} onClose={onClose}>
      {notFound && (
        <p className="text-sm mb-3 px-3 py-2" style={{ background: "#FFF4DD", color: "#7A4B00", borderRadius: 10 }}>
          {notFound}
        </p>
      )}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, z. B. Döner oder Apfel" className="w-full px-3 py-3 mb-3" style={inpStyle} />
      <div className="flex gap-1 mb-3 p-1" style={{ background: C.bg, borderRadius: 12 }}>
        {[
          ["per100", "Werte pro 100 g"],
          ["portion", "Ganze Portion"],
        ].map(([m, l]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 text-sm"
            style={{ borderRadius: 9, background: mode === m ? C.field : "transparent", fontWeight: mode === m ? 600 : 500, color: mode === m ? C.ink : C.mute }}
          >
            {l}
          </button>
        ))}
      </div>
      <p className="text-sm mb-2" style={{ color: C.mute }}>
        {mode === "per100" ? "Steht auf der Packung unter „pro 100 g“." : "Für Essen ohne Packung: Schätze die ganze Portion."}
      </p>
      <div className="flex gap-3 mb-3">
        <label className="flex-1">
          <span className="block text-sm mb-1">kcal</span>
          <input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="0" className="w-full px-3 py-2" style={inpStyle} />
        </label>
        <label className="flex-1">
          <span className="block text-sm mb-1">Eiweiß (g)</span>
          <input inputMode="decimal" value={prot} onChange={(e) => setProt(e.target.value)} placeholder="optional" className="w-full px-3 py-2" style={inpStyle} />
        </label>
      </div>
      {mode === "per100" && (
        <label className="block mb-3">
          <span className="block text-sm mb-1">Gegessene Menge (g)</span>
          <input inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} className="w-full px-3 py-2" style={inpStyle} />
        </label>
      )}
      {!initial?.id && (
        <label className="flex items-center gap-2 mb-4 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 20, height: 20 }} />
          In „Meine Lebensmittel“ merken
        </label>
      )}
      <button
        disabled={!ok}
        onClick={save}
        className="w-full py-3"
        style={{ background: ok ? C.blue : C.line, color: ok ? "#fff" : C.mute, borderRadius: 12, fontWeight: 600, fontSize: 17 }}
      >
        {initial?.id ? "Speichern" : "Hinzufügen"}
      </button>
    </Sheet>
  );
}

function GoalForm({ goal, onSave, onCancel }) {
  const [k, setK] = useState(goal?.kcal ? String(goal.kcal) : "");
  const [p, setP] = useState(goal?.protein ? String(goal.protein) : "");
  const ok = (num(k) || 0) > 0;
  return (
    <div>
      <div className="flex gap-3 mb-3">
        <label className="flex-1">
          <span className="block text-sm mb-1">Kalorien pro Tag</span>
          <input inputMode="numeric" value={k} onChange={(e) => setK(e.target.value)} placeholder="z. B. 2200" className="w-full px-3 py-2" style={inpStyle} />
        </label>
        <label className="flex-1">
          <span className="block text-sm mb-1">Eiweiß pro Tag (g)</span>
          <input inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} placeholder="optional" className="w-full px-3 py-2" style={inpStyle} />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          disabled={!ok}
          onClick={() => onSave({ kcal: Math.round(num(k)), protein: num(p) ? Math.round(num(p)) : null })}
          className="flex-1 py-3"
          style={{ background: ok ? C.blue : C.line, color: ok ? "#fff" : C.mute, borderRadius: 12, fontWeight: 600 }}
        >
          Ziel speichern
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-3" style={{ color: C.mute, border: `1.5px solid ${C.line}`, borderRadius: 12 }}>
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
}

function Ring({ value, max, color, size = 156, stroke = 15, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.min(1, value / max) : 0;
  return (
    <div className="relative" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.bg} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function Meter({ value, max, over, label, unit }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span>
          <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 30 }}>{fmt0(value)}</span>
          <span style={{ color: C.mute }}> {max ? `von ${fmt0(max)} ${unit}` : unit}</span>
        </span>
        <span className="text-sm" style={{ color: C.mute }}>{label}</span>
      </div>
      {max ? (
        <div style={{ height: 12, background: C.bg, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: over, borderRadius: 6, transition: "width .3s" }} />
        </div>
      ) : null}
    </div>
  );
}

function FoodView({ data, save }) {
  const meta = data.meta || EMPTY_META;
  const products = meta.products || [];
  const goal = meta.goal || null;
  const food = data.food || [];
  const [date, setDate] = useState(todayStr());
  const [scan, setScan] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState("");
  const [manage, setManage] = useState(false);
  const [undo, setUndo] = useState(null);

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const day = food.filter((f) => f.date === date).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const sumK = day.reduce((s, f) => s + (f.kcal || 0), 0);
  const sumP = day.reduce((s, f) => s + (f.prot || 0), 0);
  const lastGramsOf = (pid) => [...food].filter((f) => f.pid === pid && f.g != null).sort((a, b) => (b.ts || 0) - (a.ts || 0))[0]?.g;

  const recent = useMemo(() => {
    const seen = {};
    [...food].sort((a, b) => (b.ts || 0) - (a.ts || 0)).forEach((f) => {
      if (f.pid && byId[f.pid] && !seen[f.pid]) seen[f.pid] = true;
    });
    return Object.keys(seen).slice(0, 10).map((id) => byId[id]);
  }, [food, products]);
  const hits = q.trim() ? products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12) : [];

  const note = (t) => {
    setFlash(t);
    setTimeout(() => setFlash(""), 2200);
  };

  const upsertProduct = (list, p) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]);

  const addFood = (product, vals, entry, newProducts = products) => {
    const f = entry
      ? { ...entry, ...vals, name: product.name }
      : { id: uid(), ts: Date.now(), date, pid: product.id, name: product.name, ...vals };
    save({
      ...data,
      meta: { ...meta, products: newProducts },
      food: entry ? food.map((x) => (x.id === entry.id ? f : x)) : [...food, f],
    });
    setSheet(null);
    note(entry ? `${product.name} geändert` : `${product.name} hinzugefügt`);
  };

  const onScanned = async (code) => {
    setScan(false);
    const local = products.find((p) => p.code === code);
    if (local) {
      setSheet({ kind: "amount", product: local });
      return;
    }
    setBusy("Suche Produkt …");
    try {
      const r = await lookupBarcode(code);
      setBusy("");
      if (r && r.kcal100 != null) {
        setSheet({ kind: "amount", product: { id: code, ...r, name: r.name || "Unbekanntes Produkt" }, fresh: true });
      } else {
        setSheet({
          kind: "manual",
          initial: { code, name: r?.name || "", serving: r?.serving ?? null },
          notFound: r ? "Für dieses Produkt fehlen die Kalorien in der Datenbank. Trag die Werte von der Packung ein, dann kennt die App es beim nächsten Mal." : "Dieses Produkt ist nicht in der Datenbank. Trag die Werte von der Packung ein, dann kennt die App es beim nächsten Mal.",
        });
      }
    } catch (e) {
      setBusy("");
      setSheet({
        kind: "manual",
        initial: { code, name: "" },
        notFound: "Keine Verbindung zur Lebensmittel-Datenbank. Trag die Werte von der Packung ein.",
      });
    }
  };

  const totals7 = Array.from({ length: 7 }, (_, i) => {
    const d = shiftDay(date, i - 6);
    return { d, k: food.filter((f) => f.date === d).reduce((s, f) => s + (f.kcal || 0), 0) };
  });
  const max7 = Math.max(goal?.kcal || 0, ...totals7.map((t) => t.k), 1);

  const over = goal && sumK > goal.kcal;
  const left = goal ? goal.kcal - sumK : null;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setDate(shiftDay(date, -1))} aria-label="Vorheriger Tag" className="p-2" style={{ color: C.ink }}>
            <ChevronLeft size={22} />
          </button>
          <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 22 }}>{dayLabel(date)}</span>
          <button
            onClick={() => date < todayStr() && setDate(shiftDay(date, 1))}
            aria-label="Nächster Tag"
            className="p-2"
            style={{ color: date < todayStr() ? C.ink : C.line }}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {!goal || editGoal ? (
          <>
            <p className="mb-3">{goal ? "Tagesziel ändern" : "Lege dein Tagesziel fest. Dann siehst du immer, wie viel du noch essen kannst."}</p>
            <GoalForm
              goal={goal}
              onCancel={goal ? () => setEditGoal(false) : null}
              onSave={(g) => {
                save({ ...data, meta: { ...meta, goal: g } });
                setEditGoal(false);
              }}
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Ring value={sumK} max={goal.kcal} color={over ? ORANGE : C.blue}>
                <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 36, lineHeight: 1, color: over ? ORANGE : C.ink }}>{fmt0(Math.abs(left))}</span>
                <span className="text-xs mt-1" style={{ color: C.mute }}>{over ? "kcal zu viel" : "kcal übrig"}</span>
              </Ring>
              <div className="flex-1 min-w-0">
                <div className="mb-3">
                  <div className="text-xs" style={{ color: C.mute }}>Gegessen</div>
                  <div>
                    <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 26 }}>{fmt0(sumK)}</span>
                    <span className="text-sm" style={{ color: C.mute }}> / {fmt0(goal.kcal)} kcal</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: C.mute }}>Eiweiß</div>
                  <div className="mb-1">
                    <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 26 }}>{fmt0(sumP)}</span>
                    <span className="text-sm" style={{ color: C.mute }}>{goal.protein ? ` / ${fmt0(goal.protein)} g` : " g"}</span>
                  </div>
                  {goal.protein ? (
                    <div style={{ height: 8, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (sumP / goal.protein) * 100)}%`, height: "100%", background: C.teal, borderRadius: 4, transition: "width .3s" }} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <button onClick={() => setEditGoal(true)} className="mt-3 text-sm" style={{ color: C.mute }}>
              Ziel ändern
            </button>
          </>
        )}
      </Card>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setScan(true)}
          className="flex-1 py-4 flex items-center justify-center gap-2"
          style={{ background: C.blue, color: "#fff", borderRadius: 14, fontWeight: 600, fontSize: 17 }}
        >
          <ScanLine size={22} /> Scannen
        </button>
        <button
          onClick={() => setSheet({ kind: "manual", initial: null })}
          className="flex-1 py-4 flex items-center justify-center gap-2"
          style={{ background: C.card, color: C.ink, borderRadius: 14, fontWeight: 600, fontSize: 17, border: `1px solid ${C.cardBorder}` }}
        >
          <Pencil size={19} /> Von Hand
        </button>
      </div>

      {busy && <p className="mb-3 text-sm" style={{ color: C.mute }}>{busy}</p>}
      {flash && (
        <div className="mb-3 px-4 py-3 flex items-center gap-2" style={{ background: C.teal, color: "#fff", borderRadius: 12 }}>
          <Check size={18} /> {flash}
        </div>
      )}

      {products.length > 0 && (
        <Card
          title="Schnell hinzufügen"
          right={
            <button
              onClick={() => {
                setManage((m) => !m);
                setQ("");
              }}
              className="text-sm px-3 py-1"
              style={{ color: manage ? "#fff" : C.blue, background: manage ? C.blue : "transparent", borderRadius: 999, fontWeight: 600 }}
            >
              {manage ? "Fertig" : "Bearbeiten"}
            </button>
          }
        >
          {manage ? (
            <>
              <p className="text-sm mb-3" style={{ color: C.mute }}>Tippe auf ✕, um ein Lebensmittel aus der Liste zu entfernen. Deine Einträge bleiben erhalten.</p>
              <div className="flex flex-wrap gap-2">
                {[...products]
                  .sort((a, b) => a.name.localeCompare(b.name, "de"))
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        const before = products;
                        save({ ...data, meta: { ...meta, products: products.filter((x) => x.id !== p.id) } });
                        setUndo({ name: p.name, list: before });
                        setTimeout(() => setUndo((u) => (u && u.name === p.name ? null : u)), 5000);
                      }}
                      className="pl-3 pr-2 py-2 text-sm flex items-center gap-1"
                      style={{ borderRadius: 999, background: "#FDECEC", color: "#8A1C14", border: "1.5px solid #F4C2C0" }}
                      aria-label={`${p.name} entfernen`}
                    >
                      {p.name} <X size={15} />
                    </button>
                  ))}
              </div>
            </>
          ) : (
          <>
          {products.length > 6 && (
            <div className="flex items-center gap-2 px-3 mb-3" style={{ ...inpStyle }}>
              <Search size={17} style={{ color: C.mute }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Meine Lebensmittel durchsuchen" className="flex-1 py-2" style={{ fontSize: 16, outline: "none" }} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(q.trim() ? hits : recent.length ? recent : products.slice(-10)).map((p) => (
              <Chip key={p.id} onClick={() => setSheet({ kind: "amount", product: p })}>
                {p.name}
              </Chip>
            ))}
            {q.trim() && hits.length === 0 && <span className="text-sm" style={{ color: C.mute }}>Nichts gefunden.</span>}
          </div>
          </>
          )}
          {undo && (
            <div className="mt-3 px-3 py-2 flex items-center justify-between text-sm" style={{ background: C.solid, color: C.onSolid, borderRadius: 10 }}>
              <span>{undo.name} entfernt</span>
              <button
                onClick={() => {
                  save({ ...data, meta: { ...meta, products: undo.list } });
                  setUndo(null);
                }}
                style={{ fontWeight: 700, color: "#9DB4FF" }}
              >
                Rückgängig
              </button>
            </div>
          )}
        </Card>
      )}

      <Card title={date === todayStr() ? "Heute gegessen" : `Gegessen ${dayLabel(date).toLowerCase() === "gestern" ? "gestern" : `am ${shortDate(date)}`}`}>
        {day.length === 0 ? (
          <p style={{ color: C.mute }}>Noch nichts eingetragen. Scanne eine Packung oder trag etwas von Hand ein.</p>
        ) : (
          day.map((f) => (
            <div key={f.id} className="flex items-center gap-2 py-2" style={{ borderTop: `1px solid ${C.bg}` }}>
              <button
                className="flex-1 text-left"
                onClick={() => {
                  const p = byId[f.pid];
                  if (p) setSheet({ kind: "amount", product: p, entry: f });
                }}
              >
                <span className="block" style={{ fontWeight: 600 }}>{f.name}</span>
                <span className="block text-sm" style={{ color: C.mute }}>
                  {f.g != null ? `${fmt(f.g)} g · ` : ""}
                  {f.prot != null ? `${fmt1(f.prot)} g Eiweiß` : "Eiweiß unbekannt"}
                </span>
              </button>
              <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 20 }}>{fmt0(f.kcal)}</span>
              <span className="text-xs" style={{ color: C.mute, marginRight: 2 }}>kcal</span>
              <DeleteButton onConfirm={() => save({ ...data, food: food.filter((x) => x.id !== f.id) })} />
            </div>
          ))
        )}
      </Card>

      {goal && (
        <Card title="Letzte 7 Tage">
          <div className="relative flex items-end gap-2" style={{ height: 110 }}>
            <div
              className="absolute left-0 right-0"
              style={{ bottom: 20 + (goal.kcal / max7) * 70, borderTop: `2px dashed ${C.mute}`, opacity: 0.5 }}
              aria-hidden="true"
            />
            {totals7.map((t) => (
              <button key={t.d} onClick={() => setDate(t.d)} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: "100%" }}>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 30,
                    height: Math.max(3, (t.k / max7) * 70),
                    background: t.k > goal.kcal ? ORANGE : t.d === date ? C.blue : C.barSoft,
                    borderRadius: "5px 5px 2px 2px",
                  }}
                />
                <span className="text-xs" style={{ color: t.d === date ? C.ink : C.mute, fontWeight: t.d === date ? 600 : 400, height: 16 }}>
                  {new Date(t.d + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "")}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: C.mute }}>Gestrichelte Linie = dein Tagesziel, rot = darüber</p>
        </Card>
      )}

      {scan && <Scanner onResult={onScanned} onClose={() => setScan(false)} />}

      {sheet?.kind === "amount" && (
        <AmountSheet
          key={(sheet.entry?.id || "") + sheet.product.id}
          product={sheet.product}
          entry={sheet.entry}
          lastGrams={lastGramsOf(sheet.product.id)}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet({ kind: "manual", initial: sheet.product, entry: sheet.entry })}
          onSave={(vals) => addFood(sheet.product, vals, sheet.entry, upsertProduct(products, sheet.product))}
        />
      )}
      {sheet?.kind === "manual" && (
        <ManualSheet
          initial={sheet.initial}
          notFound={sheet.notFound}
          onClose={() => setSheet(null)}
          onSave={(vals, grams, remember) => {
            const base = sheet.initial || {};
            const product = { ...base, ...vals, id: base.id || base.code || uid() };
            if (base.id) {
              // Nährwerte eines gespeicherten Produkts korrigiert
              const plist = upsertProduct(products, product);
              if (sheet.entry) {
                const g = sheet.entry.g;
                const k = product.kcal100 != null ? (product.kcal100 * (g || 0)) / 100 : product.pKcal;
                const p = product.kcal100 != null ? (product.prot100 != null ? (product.prot100 * (g || 0)) / 100 : null) : product.pProt;
                addFood(product, { g: product.kcal100 != null ? g : null, kcal: Math.round(k || 0), prot: p == null ? null : Math.round(p * 10) / 10 }, sheet.entry, plist);
              } else {
                save({ ...data, meta: { ...meta, products: plist } });
                setSheet({ kind: "amount", product });
              }
              return;
            }
            const g = grams || 0;
            const k = product.kcal100 != null ? (product.kcal100 * g) / 100 : product.pKcal;
            const p = product.kcal100 != null ? (product.prot100 != null ? (product.prot100 * g) / 100 : null) : product.pProt;
            addFood(
              product,
              { g: product.kcal100 != null ? g : null, kcal: Math.round(k || 0), prot: p == null ? null : Math.round(p * 10) / 10 },
              null,
              remember ? upsertProduct(products, product) : products
            );
          }}
        />
      )}
    </>
  );
}

/* ---------- Google-Sheet-Sync ---------- */

// Datum aus dem Sheet in JJJJ-MM-TT umwandeln, egal in welchem Format es ankommt
function normDate(v) {
  const s = String(v == null ? "" : v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  const d = new Date(s);
  if (!isNaN(d)) return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return todayStr();
}
const normMeta = (m) =>
  m && typeof m === "object"
    ? {
        ...m,
        plans: Array.isArray(m.plans) ? m.plans : [],
        notes: m.notes && typeof m.notes === "object" ? m.notes : {},
        products: Array.isArray(m.products) ? m.products : [],
        goal: m.goal && typeof m.goal === "object" ? m.goal : null,
      }
    : null;
const normData = (d) => ({
  exercises: d.exercises || [],
  entries: (d.entries || []).map((e) => ({ ...e, date: normDate(e.date) })),
  meta: normMeta(d.meta),
  food: Array.isArray(d.food) ? d.food.map((f) => ({ ...f, date: normDate(f.date) })) : null,
});


const LS = { data: "trn-data", queue: "trn-queue", settings: "trn-settings" };
const lsGet = (k, f) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : f;
  } catch (e) {
    return f;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    /* Speicher voll oder gesperrt */
  }
};

function diffOps(prev, next) {
  const ops = [];
  const pEx = new Set(prev.exercises.map((x) => x.id));
  const nEx = new Set(next.exercises.map((x) => x.id));
  const pEn = new Set(prev.entries.map((x) => x.id));
  const nEn = new Set(next.entries.map((x) => x.id));
  const exMap = Object.fromEntries(next.exercises.map((x) => [x.id, x]));
  next.exercises.forEach((x) => !pEx.has(x.id) && ops.push({ op: "addExercise", exercise: x }));
  next.entries.forEach((e) => {
    if (pEn.has(e.id)) return;
    const x = exMap[e.exId];
    ops.push({ op: "addEntry", entry: e, exName: x?.name || "", exType: x?.type || "" });
  });
  prev.entries.forEach((e) => !nEn.has(e.id) && ops.push({ op: "deleteEntry", id: e.id }));
  const pMap = Object.fromEntries(prev.entries.map((e) => [e.id, e]));
  next.entries.forEach((e) => {
    const o = pMap[e.id];
    if (!o || JSON.stringify(o) === JSON.stringify(e)) return;
    const x = exMap[e.exId];
    ops.push({ op: "deleteEntry", id: e.id });
    ops.push({ op: "addEntry", entry: e, exName: x?.name || "", exType: x?.type || "" });
  });
  prev.exercises.forEach((x) => !nEx.has(x.id) && ops.push({ op: "deleteExercise", id: x.id }));
  if (next.meta && JSON.stringify(prev.meta || null) !== JSON.stringify(next.meta)) ops.push({ op: "setMeta", meta: next.meta });
  const pf = prev.food || [];
  const nf = next.food || [];
  const pfMap = Object.fromEntries(pf.map((f) => [f.id, f]));
  const nfIds = new Set(nf.map((f) => f.id));
  pf.forEach((f) => !nfIds.has(f.id) && ops.push({ op: "deleteFood", id: f.id }));
  nf.forEach((f) => {
    const o = pfMap[f.id];
    if (!o) ops.push({ op: "addFood", food: f });
    else if (JSON.stringify(o) !== JSON.stringify(f)) {
      ops.push({ op: "deleteFood", id: f.id });
      ops.push({ op: "addFood", food: f });
    }
  });
  return ops;
}

function applyOps(state, ops) {
  let ex = [...state.exercises];
  let en = [...state.entries];
  let meta = state.meta;
  let food = state.food ? [...state.food] : null;
  ops.forEach((o) => {
    if (o.op === "setMeta") meta = o.meta;
    if (food && o.op === "addFood" && !food.some((x) => x.id === o.food.id)) food.push(o.food);
    if (food && o.op === "deleteFood") food = food.filter((x) => x.id !== o.id);
    if (o.op === "addExercise" && !ex.some((x) => x.id === o.exercise.id)) ex.push(o.exercise);
    if (o.op === "deleteExercise") ex = ex.filter((x) => x.id !== o.id);
    if (o.op === "addEntry" && !en.some((x) => x.id === o.entry.id)) en.push(o.entry);
    if (o.op === "deleteEntry") en = en.filter((x) => x.id !== o.id);
  });
  return { exercises: ex, entries: en, meta, food };
}

function mergeAdd(a, b) {
  const exIds = new Set(a.exercises.map((x) => x.id));
  const enIds = new Set(a.entries.map((x) => x.id));
  const am = a.meta;
  const bm = b.meta || EMPTY_META;
  const bp = bm.products || [];
  const meta = am
    ? {
        ...bm,
        ...am,
        plans: [...am.plans, ...bm.plans.filter((p) => !am.plans.some((q) => q.id === p.id))],
        notes: { ...bm.notes, ...am.notes },
        products: [...(am.products || []), ...bp.filter((p) => !(am.products || []).some((q) => q.id === p.id))],
        goal: am.goal || bm.goal || null,
      }
    : bm;
  const af = a.food || [];
  const bf = b.food || [];
  const food = a.food ? [...af, ...bf.filter((f) => !af.some((x) => x.id === f.id))] : null;
  return {
    exercises: [...a.exercises, ...b.exercises.filter((x) => !exIds.has(x.id))],
    entries: [...a.entries, ...b.entries.filter((x) => !enIds.has(x.id))],
    meta,
    food,
  };
}

function SyncCard({ settings, connect, disconnect, status, queueLen, syncNow, metaSupported }) {
  const [url, setUrl] = useState(settings.url || "");
  const [code, setCode] = useState(settings.code || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const connected = settings.url && settings.code;

  const doConnect = async () => {
    setBusy(true);
    setMsg("");
    const r = await connect(url.trim(), code.trim());
    setMsg(r);
    setBusy(false);
  };
  const inp = { border: `1.5px solid ${C.line}`, borderRadius: 10, fontSize: 16 };

  return (
    <Card title="Google Sheet">
      {connected ? (
        <>
          <p className="mb-3" style={{ color: C.ink }}>
            Verbunden. Jede Änderung landet automatisch in deinem Sheet.
            {queueLen > 0 && <span style={{ color: C.mute }}> {queueLen} Änderungen warten noch auf Netz.</span>}
          </p>
          <div className="flex gap-2">
            <button onClick={syncNow} className="flex-1 py-3" style={{ background: C.blueSoft, color: C.blue, borderRadius: 10, fontWeight: 600 }}>
              Jetzt abgleichen
            </button>
            <button onClick={disconnect} className="px-4 py-3" style={{ color: C.mute, borderRadius: 10, border: `1.5px solid ${C.line}` }}>
              Trennen
            </button>
          </div>
          {status.state === "error" && (
            <p className="text-sm mt-3" style={{ color: "#8A1C14" }}>Letzter Abgleich fehlgeschlagen: {status.msg}</p>
          )}
          {metaSupported === false && (
            <p className="text-sm mt-3 px-3 py-2" style={{ background: "#FFF4DD", color: "#7A4B00", borderRadius: 10 }}>
              Ein Teil deiner Daten (Pläne, Notizen oder Essen) bleibt vorerst nur auf diesem Handy. Damit alles im Sheet landet, stelle das neue Skript (Code.gs) als neue Version bereit.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm mb-3" style={{ color: C.mute }}>
            Füge die Web-App-URL aus Apps Script und deinen Code ein. Danach speichert die App alles zusätzlich in deinem Sheet.
          </p>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" className="w-full px-3 py-2 mb-2" style={inp} />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Dein Code" className="w-full px-3 py-2 mb-3" style={inp} />
          <button
            onClick={doConnect}
            disabled={busy || !url.trim() || !code.trim()}
            className="w-full py-3"
            style={{ background: url.trim() && code.trim() ? C.blue : C.line, color: url.trim() && code.trim() ? "#fff" : C.mute, borderRadius: 12, fontWeight: 600 }}
          >
            {busy ? "Verbinde …" : "Verbinden"}
          </button>
        </>
      )}
      {msg && <p className="text-sm mt-3 px-3 py-2" style={{ background: C.bg, borderRadius: 10 }}>{msg}</p>}
    </Card>
  );
}

function SyncStatus({ status, queueLen, connected, onRetry, onSetup }) {
  if (!connected)
    return (
      <button onClick={onSetup} className="mt-3 text-sm text-left flex items-center gap-2" style={{ color: C.headMute }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: C.headMute }} />
        Nur auf diesem Handy. <span style={{ color: C.headText, fontWeight: 600, textDecoration: "underline" }}>Sheet verbinden</span>
      </button>
    );
  if (status.state === "error")
    return (
      <div className="mt-3 px-4 py-3 text-sm" style={{ background: "#FCE4E2", color: "#8A1C14", borderRadius: 12 }}>
        Abgleich fehlgeschlagen: {status.msg} Deine Einträge sind auf dem Handy sicher.
        <button onClick={onRetry} className="block mt-2 px-3 py-2" style={{ background: "#8A1C14", color: "#fff", borderRadius: 8, fontWeight: 600 }}>
          Erneut versuchen
        </button>
      </div>
    );
  const text =
    status.state === "syncing"
      ? "Gleicht ab …"
      : queueLen > 0
      ? `Offline: ${queueLen} ${queueLen === 1 ? "Änderung wird" : "Änderungen werden"} später gesendet`
      : "Mit Google Sheet abgeglichen";
  const ok = status.state !== "syncing" && queueLen === 0;
  return (
    <p className="mt-3 text-sm flex items-center gap-2" style={{ color: C.headMute }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: ok ? "#3CC27F" : C.yellow }} />
      {text}
    </p>
  );
}

/* ---------- App ---------- */

const TABS = [
  { id: "log", label: "Training", icon: Dumbbell },
  { id: "food", label: "Essen", icon: UtensilsCrossed },
  { id: "history", label: "Verlauf", icon: History },
  { id: "progress", label: "Entwicklung", icon: TrendingUp },
  { id: "exercises", label: "Übungen & Daten", short: "Übungen", icon: ListChecks },
];

export default function App() {
  useEffect(() => {
    document.body.style.background = C.bg;
  }, []);
  const [data, setData] = useState(() => {
    const d = lsGet(LS.data, null);
    if (d && Array.isArray(d.entries) && Array.isArray(d.exercises)) {
      const n = normData(d);
      return { ...n, meta: n.meta || EMPTY_META, food: n.food || [] };
    }
    return { exercises: DEFAULT_EX, entries: [], meta: EMPTY_META, food: [] };
  });
  const [metaSupported, setMetaSupported] = useState(null);
  const [restCfg, setRestCfgState] = useState(() => ({ sec: 90, auto: true, ...lsGet("trn-rest", {}) }));
  const setRestCfg = (c) => {
    setRestCfgState(c);
    lsSet("trn-rest", c);
  };
  const [restEnd, setRestEnd] = useState(null);
  const [restDone, setRestDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const startRest = (auto = false) => {
    if (auto && !restCfg.auto) return;
    unlockAudio();
    setRestDone(false);
    setNow(Date.now());
    setRestEnd(Date.now() + restCfg.sec * 1000);
  };
  useEffect(() => {
    if (!restEnd) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= restEnd) {
        setRestEnd(null);
        setRestDone(true);
        beep();
        try {
          navigator.vibrate && navigator.vibrate([300, 150, 300]);
        } catch (e) {
          /* keine Vibration */
        }
        setTimeout(() => setRestDone(false), 6000);
      }
    };
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [restEnd]);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0;
  const timerVisible = !!restEnd || restDone;
  const [settings, setSettings] = useState(() => lsGet(LS.settings, { url: "", code: "" }));
  const [queueLen, setQueueLen] = useState(() => lsGet(LS.queue, []).length);
  const [status, setStatus] = useState({ state: "idle", msg: "" });
  const [tab, setTab] = useState(() => {
    try {
      const t = sessionStorage.getItem("trn-tab");
      sessionStorage.removeItem("trn-tab");
      if (t && TABS.some((x) => x.id === t)) return t;
    } catch (e) {
      /* Speicher gesperrt */
    }
    return "log";
  });
  const [openReq, setOpenReq] = useState(null);

  const dataRef = useRef(data);
  const queueRef = useRef(lsGet(LS.queue, []));
  const settingsRef = useRef(settings);
  const busy = useRef(false);
  const again = useRef(false);
  const syncRef = useRef(null);

  const configured = () => !!(settingsRef.current.url && settingsRef.current.code);
  const commit = (next) => {
    dataRef.current = next;
    setData(next);
    lsSet(LS.data, next);
  };
  const setQueue = (q) => {
    queueRef.current = q;
    lsSet(LS.queue, q);
    setQueueLen(q.length);
  };

  const call = async (body, s = settingsRef.current) => {
    const res = body
      ? await fetch(s.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ code: s.code, ...body }) })
      : await fetch(`${s.url}${s.url.includes("?") ? "&" : "?"}code=${encodeURIComponent(s.code)}&t=${Date.now()}`);
    const txt = await res.text();
    let j;
    try {
      j = JSON.parse(txt);
    } catch (e) {
      throw new Error("Keine gültige Antwort. Stimmt die URL und ist die Web-App für „Jeder“ freigegeben?");
    }
    if (!j.ok) throw new Error(j.error || "Unbekannter Fehler.");
    return normData(j);
  };

  syncRef.current = async () => {
    if (!configured()) return;
    if (busy.current) {
      again.current = true;
      return;
    }
    if (navigator.onLine === false) {
      setStatus({ state: "idle", msg: "" });
      return;
    }
    busy.current = true;
    setStatus({ state: "syncing", msg: "" });
    try {
      const sent = queueRef.current;
      const server = await call(sent.length ? { ops: sent } : null);
      setQueue(queueRef.current.slice(sent.length));
      setMetaSupported(!!server.meta && !!server.food);
      const merged = applyOps(server, queueRef.current);
      if (!merged.meta) merged.meta = dataRef.current.meta || EMPTY_META;
      if (!merged.food) merged.food = dataRef.current.food || [];
      commit(merged);
      setStatus({ state: "ok", msg: "" });
    } catch (e) {
      const offline = navigator.onLine === false || e instanceof TypeError;
      setStatus(offline ? { state: "idle", msg: "" } : { state: "error", msg: e.message || String(e) });
    } finally {
      busy.current = false;
      if (again.current) {
        again.current = false;
        setTimeout(() => syncRef.current(), 300);
      }
    }
  };

  useEffect(() => {
    const run = () => syncRef.current();
    run();
    const onVis = () => document.visibilityState === "visible" && run();
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVis);
    const iv = setInterval(() => queueRef.current.length && run(), 30000);
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(iv);
    };
  }, []);

  const save = (next) => {
    const ops = diffOps(dataRef.current, next);
    commit(next);
    if (configured() && ops.length) {
      setQueue([...queueRef.current, ...ops]);
      syncRef.current();
    }
  };

  const connect = async (url, code) => {
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) return "Die URL muss mit https://script.google.com/ beginnen.";
    const s = { url, code };
    try {
      const server = await call(null, s);
      const merged = mergeAdd(server, dataRef.current);
      if (!merged.food) merged.food = dataRef.current.food || [];
      setMetaSupported(!!server.meta && !!server.food);
      settingsRef.current = s;
      setSettings(s);
      lsSet(LS.settings, s);
      setQueue(diffOps(server, merged));
      commit(merged);
      syncRef.current();
      const n = merged.entries.length - server.entries.length;
      return n > 0 ? `Verbunden. ${n} Einträge von diesem Handy werden ins Sheet übertragen.` : "Verbunden. Deine Daten sind auf dem neuesten Stand.";
    } catch (e) {
      return navigator.onLine === false || e instanceof TypeError
        ? "Keine Verbindung. Prüfe das Netz und die URL."
        : e.message;
    }
  };

  const disconnect = () => {
    const s = { url: "", code: "" };
    settingsRef.current = s;
    setSettings(s);
    lsSet(LS.settings, s);
    setQueue([]);
    setStatus({ state: "idle", msg: "" });
  };

  const exById = useMemo(() => Object.fromEntries(data.exercises.map((e) => [e.id, e])), [data]);
  const current = TABS.find((t) => t.id === tab);
  const connected = !!(settings.url && settings.code);

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: FONT, minHeight: "100vh", colorScheme: C.scheme }}>
      <header style={{ background: C.floor, color: C.headText, paddingTop: "calc(env(safe-area-inset-top) + 18px)" }}>
        <div className="max-w-xl mx-auto px-4" style={{ paddingBottom: C.overlap + 14 }}>
          <p style={{ color: C.headMute, fontSize: 15 }}>{longDate(todayStr())}</p>
          <h1 style={{ fontFamily: COND, fontWeight: 700, fontSize: C.h1, lineHeight: 1.05, letterSpacing: 0.3 }}>{current.label}</h1>
          <SyncStatus
            status={status}
            queueLen={queueLen}
            connected={connected}
            onRetry={() => syncRef.current()}
            onSetup={() => setTab("exercises")}
          />
        </div>
      </header>
      <div className="max-w-xl mx-auto px-4" style={{ marginTop: -C.overlap, position: "relative", paddingBottom: timerVisible ? 178 : 116 }}>

        {tab === "log" ? (
          <LogView data={data} save={save} exById={exById} openReq={openReq} clearOpenReq={() => setOpenReq(null)} startRest={startRest} />
        ) : tab === "food" ? (
          <FoodView data={data} save={save} />
        ) : tab === "history" ? (
          <HistoryView
            data={data}
            save={save}
            exById={exById}
            onEdit={(id) => {
              setOpenReq(id);
              setTab("log");
            }}
          />
        ) : tab === "progress" ? (
          <ProgressView data={data} exById={exById} />
        ) : (
          <ExercisesView
            data={data}
            save={save}
            exById={exById}
            sync={{ settings, connect, disconnect, status, queueLen, syncNow: () => syncRef.current(), metaSupported }}
            rest={{ cfg: restCfg, setCfg: setRestCfg }}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0" style={{ background: C.navBg, borderTop: `1px solid ${C.navBorder}`, paddingBottom: "env(safe-area-inset-bottom)", zIndex: 40 }}>
        {timerVisible && (
          <div style={{ background: restDone ? C.teal : C.blue, color: "#fff" }} role="timer" aria-live="polite">
            <div className="max-w-xl mx-auto px-4 py-2 flex items-center gap-2">
              {restDone ? (
                <>
                  <Check size={20} />
                  <span className="flex-1" style={{ fontWeight: 600, fontSize: 17 }}>Pause vorbei. Weiter geht's!</span>
                  <button onClick={() => setRestDone(false)} aria-label="Schließen" className="p-2">
                    <X size={20} />
                  </button>
                </>
              ) : (
                <>
                  <Timer size={20} style={{ opacity: 0.7 }} />
                  <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 32, lineHeight: 1, minWidth: 72 }}>{mmss(restLeft)}</span>
                  <span className="flex-1 text-sm" style={{ opacity: 0.7 }}>Pause</span>
                  <button onClick={() => setRestEnd((e) => Math.max(Date.now() + 1000, e - 15000))} className="px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,.14)", borderRadius: 8, fontWeight: 600 }}>
                    −15 s
                  </button>
                  <button onClick={() => setRestEnd((e) => e + 15000)} className="px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,.14)", borderRadius: 8, fontWeight: 600 }}>
                    +15 s
                  </button>
                  <button onClick={() => setRestEnd(null)} aria-label="Pause beenden" className="p-2">
                    <X size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        <div className="max-w-xl mx-auto flex px-1 pt-2 pb-2">
          {TABS.map(({ id, label, short, icon: Icon }) => {
            const on = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-1 flex flex-col items-center gap-1 py-1 text-xs"
                style={{ color: on ? C.navOn : C.navText, fontWeight: on ? 600 : 500 }}
                aria-current={on ? "page" : undefined}
              >
                <span
                  className="flex items-center justify-center"
                  style={{ width: 52, height: 30, borderRadius: 15, background: on ? C.navPill : "transparent", color: on ? C.navPillText : "inherit", transition: "background .15s" }}
                >
                  <Icon size={21} />
                </span>
                {short || label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
