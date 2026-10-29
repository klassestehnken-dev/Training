import { useEffect, useState } from "react";

/* ---------- Strichfigur mit Gelenken ---------- */

const LEN = { torso: 50, sh: 4, head: 12, ua: 26, fa: 24, th: 37, sn: 36, ft: 11 };
const COL = {
  body: "#3A4350",
  far: "#B4BBC4",
  hi: "#2541D8",
  hiFar: "#9DAAF0",
  eq: "#8A939E",
  eqDark: "#2B3138",
  pad: "#A9B2BC",
  floor: "#CDD3DA",
};
const rad = (d) => (d * Math.PI) / 180;
const dir = (d) => [Math.cos(rad(d)), Math.sin(rad(d))];
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const lerp = (a, b, t) => a + (b - a) * t;

// Zwei-Glieder-Kinematik: Gelenk (Ellenbogen/Knie) so legen, dass das Ende den Zielpunkt erreicht
function ik(P, T, a, b, s) {
  const dx = T[0] - P[0];
  const dy = T[1] - P[1];
  let d = Math.hypot(dx, dy);
  d = Math.max(Math.abs(a - b) + 0.5, Math.min(a + b - 0.3, d));
  const base = Math.atan2(dy, dx);
  const A = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const j = [P[0] + a * Math.cos(base + s * A), P[1] + a * Math.sin(base + s * A)];
  const v = [T[0] - j[0], T[1] - j[1]];
  const vl = Math.hypot(v[0], v[1]) || 1;
  return [j, [j[0] + (v[0] / vl) * b, j[1] + (v[1] / vl) * b]];
}

function solveSide(p) {
  const hip = [p.hx, p.hy];
  const neck = add(hip, dir(p.t), LEN.torso);
  const sho = add(hip, dir(p.t), LEN.torso - LEN.sh);
  const head = add(neck, dir(p.t + (p.ht || 0)), LEN.head);
  let el, ha;
  const UA = LEN.ua * (p.uaS ?? 1);
  if (p.hrx != null) [el, ha] = ik(sho, [sho[0] + p.hrx, sho[1] + p.hry], UA, LEN.fa, p.hs);
  else if (p.hax != null) [el, ha] = ik(sho, [p.hax, p.hay], UA, LEN.fa, p.hs);
  else {
    el = add(sho, dir(p.ua), UA);
    ha = add(el, dir(p.fa), LEN.fa);
  }
  let kn, an;
  if (p.ax != null) [kn, an] = ik(hip, [p.ax, p.ay], LEN.th, LEN.sn, p.ks);
  else {
    kn = add(hip, dir(p.th), LEN.th);
    an = add(kn, dir(p.sn), LEN.sn);
  }
  const toe = add(an, dir(p.ft ?? 0), LEN.ft);
  return { hip, neck, sho, head, el, ha, kn, an, toe };
}

function solveFront(p) {
  const cx = p.cx;
  const sy = p.sy;
  const shL = [cx - 15, sy];
  const shR = [cx + 15, sy];
  const elL = add(shL, dir(90 + p.al), LEN.ua);
  const elR = add(shR, dir(90 - p.al), LEN.ua);
  const haL = add(elL, dir(90 + p.al - p.eb), LEN.fa);
  const haR = add(elR, dir(90 - p.al + p.eb), LEN.fa);
  const hipL = [cx - 9, sy + 44];
  const hipR = [cx + 9, sy + 44];
  const seat = p.seat;
  const anL = seat ? [cx - 24, sy + 100] : [cx - 11, sy + 116];
  const anR = seat ? [cx + 24, sy + 100] : [cx + 11, sy + 116];
  const knL = seat ? [cx - 22, sy + 58] : [cx - 10, sy + 80];
  const knR = seat ? [cx + 22, sy + 58] : [cx + 10, sy + 80];
  return { cx, sy, shL, shR, elL, elR, haL, haR, hipL, hipR, knL, knR, anL, anR, head: [cx, sy - 20], neck: [cx, sy - 6] };
}

function interp(A, B, k) {
  const o = {};
  Object.keys(A).forEach((key) => {
    const a = A[key];
    const b = B[key] ?? a;
    o[key] = typeof a === "number" && typeof b === "number" ? lerp(a, b, k) : a;
  });
  return o;
}

const Ln = ({ a, b, w, c }) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />;

function SideBody({ J, hi }) {
  const has = (k) => hi.includes(k);
  const c = (k) => (has(k) ? COL.hi : COL.body);
  const cf = (k) => (has(k) ? COL.hiFar : COL.far);
  const o = (p) => [p[0] - 3, p[1] - 2.5];
  const along = (from, to, f) => [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f];
  return (
    <g>
      <Ln a={o(J.hip)} b={o(J.kn)} w={10} c={cf("th")} />
      <Ln a={o(J.kn)} b={o(J.an)} w={8} c={cf("sn")} />
      <Ln a={o(J.an)} b={o(J.toe)} w={5} c={COL.far} />
      <Ln a={o(J.sho)} b={o(J.el)} w={8} c={cf("ua")} />
      <Ln a={o(J.el)} b={o(J.ha)} w={6.5} c={cf("fa")} />
      <Ln a={J.hip} b={J.neck} w={17} c={c("torso")} />
      {(has("chest") || has("back")) && <Ln a={J.neck} b={along(J.neck, J.hip, 0.42)} w={17} c={COL.hi} />}
      {has("abs") && <Ln a={along(J.neck, J.hip, 0.45)} b={along(J.neck, J.hip, 0.9)} w={17} c={COL.hi} />}
      {has("glute") && <circle cx={J.hip[0]} cy={J.hip[1]} r={9} fill={COL.hi} />}
      <Ln a={J.hip} b={J.kn} w={11.5} c={c("th")} />
      <Ln a={J.kn} b={J.an} w={9.5} c={c("sn")} />
      <Ln a={J.an} b={J.toe} w={6} c={COL.body} />
      <Ln a={J.sho} b={J.el} w={9.5} c={c("ua")} />
      <Ln a={J.el} b={J.ha} w={7.5} c={c("fa")} />
      {has("delt") && <circle cx={J.sho[0]} cy={J.sho[1]} r={6.5} fill={COL.hi} />}
      <circle cx={J.head[0]} cy={J.head[1]} r={9.5} fill={COL.body} />
    </g>
  );
}

function FrontBody({ J, hi }) {
  const has = (k) => hi.includes(k);
  const c = (k) => (has(k) ? COL.hi : COL.body);
  return (
    <g>
      <Ln a={J.hipL} b={J.knL} w={11} c={COL.body} />
      <Ln a={J.knL} b={J.anL} w={9} c={COL.body} />
      <Ln a={J.hipR} b={J.knR} w={11} c={COL.body} />
      <Ln a={J.knR} b={J.anR} w={9} c={COL.body} />
      <polygon points={`${J.shL[0]},${J.shL[1]} ${J.shR[0]},${J.shR[1]} ${J.hipR[0] + 3},${J.hipR[1]} ${J.hipL[0] - 3},${J.hipL[1]}`} fill={COL.body} stroke={COL.body} strokeWidth={8} strokeLinejoin="round" />
      <Ln a={J.shL} b={J.elL} w={9} c={c("ua")} />
      <Ln a={J.elL} b={J.haL} w={7.5} c={c("fa")} />
      <Ln a={J.shR} b={J.elR} w={9} c={c("ua")} />
      <Ln a={J.elR} b={J.haR} w={7.5} c={c("fa")} />
      {has("delt") && (
        <>
          <circle cx={J.shL[0]} cy={J.shL[1]} r={7} fill={COL.hi} />
          <circle cx={J.shR[0]} cy={J.shR[1]} r={7} fill={COL.hi} />
        </>
      )}
      <Ln a={J.neck} b={[J.cx, J.sy]} w={7} c={COL.body} />
      <circle cx={J.head[0]} cy={J.head[1]} r={10} fill={COL.body} />
    </g>
  );
}

/* ---------- Geräte ---------- */

const plate = (p, r = 12) => (
  <g>
    <circle cx={p[0]} cy={p[1]} r={r} fill={COL.eqDark} />
    <circle cx={p[0]} cy={p[1]} r={2.5} fill={COL.eq} />
  </g>
);
const dumbbell = (p) => (
  <g>
    <circle cx={p[0]} cy={p[1]} r={6.5} fill={COL.eqDark} />
    <circle cx={p[0]} cy={p[1]} r={1.8} fill={COL.eq} />
  </g>
);
const bench = (x1, x2, y, legs = true) => (
  <g>
    {legs && (
      <>
        <line x1={x1 + 10} y1={y} x2={x1 + 10} y2={156} stroke={COL.eq} strokeWidth={4} />
        <line x1={x2 - 10} y1={y} x2={x2 - 10} y2={156} stroke={COL.eq} strokeWidth={4} />
      </>
    )}
    <rect x={x1} y={y - 4} width={x2 - x1} height={8} rx={4} fill={COL.pad} />
  </g>
);
const cable = (from, to) => (
  <g>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={COL.eq} strokeWidth={1.6} />
    <circle cx={from[0]} cy={from[1]} r={4.5} fill="none" stroke={COL.eq} strokeWidth={2} />
    <circle cx={to[0]} cy={to[1]} r={3} fill={COL.eqDark} />
  </g>
);
const floor = (y = 156, x1 = 10, x2 = 210) => <line x1={x1} y1={y} x2={x2} y2={y} stroke={COL.floor} strokeWidth={2} />;

/* ---------- Übungen ---------- */

const GUIDES = [
  {
    keys: ["bankdrücken"],
    muscles: "Brust, Trizeps, vordere Schulter",
    cues: ["Schulterblätter zusammen und nach unten ziehen", "Stange kontrolliert zur unteren Brust senken", "Füße fest am Boden, Po bleibt auf der Bank"],
    hi: ["chest", "ua", "fa"],
    A: { hx: 128, hy: 98, t: 180, hax: 84, hay: 46, hs: 1, uaS: 1, ax: 162, ay: 148, ks: -1, ft: 0, ht: 0 },
    B: { hax: 86, hay: 84, uaS: 0.55 },
    eq: (J) => ({ back: <>{floor()}{bench(44, 150, 107)}</>, front: plate(J.ha, 12) }),
  },
  {
    keys: ["schrägbankdrückenmitkurzhanteln", "schrägbankdrücken", "schrägbankdrückenkh"],
    muscles: "Obere Brust, vordere Schulter, Trizeps",
    cues: ["Bank auf 30–45° einstellen", "Hanteln seitlich an der Brust absenken", "Oben nicht zusammenschlagen, Spannung halten"],
    hi: ["chest", "ua", "fa"],
    A: { hx: 120, hy: 112, t: -145, hax: 86, hay: 38, hs: 1, uaS: 1, ax: 156, ay: 148, ks: -1, ft: 0 },
    B: { hax: 93, hay: 76, uaS: 0.55 },
    eq: () => ({
      back: (
        <>
          {floor()}
          <line x1={118} y1={120} x2={118} y2={156} stroke={COL.eq} strokeWidth={4} />
          <rect x={104} y={116} width={34} height={8} rx={4} fill={COL.pad} />
          <line x1={126} y1={124} x2={64} y2={81} stroke={COL.pad} strokeWidth={9} strokeLinecap="round" />
        </>
      ),
      front: null,
    }),
    eqFront: (J) => dumbbell(J.ha),
  },
  {
    keys: ["schulterdrücken"],
    muscles: "Schultern, Trizeps",
    cues: ["Rücken an die Lehne, Bauch fest", "Hanteln auf Kinnhöhe starten", "Nach oben drücken, ohne ins Hohlkreuz zu gehen"],
    view: "front",
    hi: ["delt", "ua", "fa"],
    A: { cx: 110, sy: 58, al: 95, eb: -85, seat: 1 },
    B: { al: 162, eb: -4 },
    eq: (J) => ({
      back: (
        <>
          {floor()}
          <rect x={92} y={44} width={36} height={60} rx={6} fill={COL.pad} />
          <rect x={78} y={100} width={64} height={9} rx={4} fill={COL.pad} />
          <line x1={110} y1={109} x2={110} y2={156} stroke={COL.eq} strokeWidth={4} />
        </>
      ),
      front: <>{dumbbell(J.haL)}{dumbbell(J.haR)}</>,
    }),
  },
  {
    keys: ["seitheben"],
    view: "front",
    muscles: "Seitliche Schulter",
    cues: ["Arme leicht gebeugt, der Ellenbogen führt", "Nur bis Schulterhöhe heben", "Langsam absenken, nicht schwingen"],
    hi: ["delt", "ua"],
    A: { cx: 110, sy: 42, al: 8, eb: 4 },
    B: { al: 84, eb: 12 },
    eq: (J) => ({ back: floor(), front: <>{dumbbell(J.haL)}{dumbbell(J.haR)}</> }),
  },
  {
    keys: ["dips"],
    muscles: "Brust, Trizeps",
    cues: ["Schultern weg von den Ohren", "Absenken, bis die Oberarme etwa waagerecht sind", "Leicht nach vorn lehnen für mehr Brust"],
    hi: ["chest", "ua", "fa"],
    A: { hx: 103, hy: 92, t: -84, hax: 110, hay: 96, hs: 1, ax: 86, ay: 150, ks: -1, ft: 30 },
    B: { hx: 92, hy: 124, t: -74, ax: 76, ay: 172 },
    vb: "0 0 220 190",
    eq: () => ({
      back: (
        <>
          <line x1={110} y1={100} x2={110} y2={186} stroke={COL.eq} strokeWidth={4} />
          <rect x={92} y={93} width={44} height={6} rx={3} fill={COL.eqDark} />
        </>
      ),
      front: null,
    }),
  },
  {
    keys: ["trizepsdrückenamkabel", "trizepsdrücken"],
    muscles: "Trizeps",
    cues: ["Ellenbogen bleiben eng am Körper", "Nur die Unterarme bewegen", "Unten kurz durchdrücken, langsam zurück"],
    hi: ["ua", "fa"],
    A: { hx: 99, hy: 78, t: -84, ua: 92, fa: -38, ax: 102, ay: 150, ks: -1, ft: 0 },
    B: { fa: 88 },
    eq: (J) => ({ back: <>{floor()}<line x1={150} y1={4} x2={150} y2={156} stroke={COL.floor} strokeWidth={6} /></>, front: cable([146, 10], J.ha) }),
  },
  {
    keys: ["kniebeuge", "kniebeugen"],
    muscles: "Oberschenkel, Po",
    cues: ["Füße schulterbreit, Zehen leicht nach außen", "Hüfte nach hinten unten, Knie folgen den Zehen", "Rücken gerade, Fersen bleiben am Boden"],
    hi: ["th", "sn", "glute"],
    A: { hx: 108, hy: 76.5, t: -89, hrx: -5, hry: -3, hs: -1, ax: 110, ay: 149, ks: -1, ft: 0 },
    B: { hx: 82, hy: 114, t: -56 },
    eq: (J) => ({ back: floor(), front: plate([J.sho[0] - 4, J.sho[1] - 4], 12) }),
  },
  {
    keys: ["rumänischeskreuzheben", "rdl"],
    muscles: "Beinbeuger, Po, unterer Rücken",
    cues: ["Knie leicht gebeugt und fest", "Hüfte weit nach hinten schieben, Rücken bleibt gerade", "Stange eng an den Beinen entlangführen"],
    hi: ["th", "glute", "back"],
    A: { hx: 110, hy: 76.5, t: -89, hax: 114, hay: 79, hs: -1, ax: 112, ay: 149, ks: -1, ft: 0 },
    B: { hx: 84, hy: 85, t: -24, hax: 121, hay: 118 },
    eq: (J) => ({ back: floor(), front: plate(J.ha, 12) }),
  },
  {
    keys: ["kreuzheben"],
    muscles: "Po, Beinbeuger, Rücken, Oberschenkel",
    cues: ["Stange über der Fußmitte, nah am Schienbein", "Rücken gerade, Brust raus, Arme lang", "Aus den Beinen hochdrücken, oben Hüfte strecken"],
    hi: ["th", "glute", "back"],
    A: { hx: 82, hy: 106, t: -36, hax: 120, hay: 143, hs: -1, ax: 112, ay: 149, ks: -1, ft: 0 },
    B: { hx: 110, hy: 76.5, t: -89, hax: 114, hay: 79 },
    eq: (J) => ({ back: floor(), front: plate(J.ha, 12) }),
  },
  {
    keys: ["beinpresse"],
    muscles: "Oberschenkel, Po",
    cues: ["Füße schulterbreit mittig auf der Platte", "Knie nicht ganz durchdrücken", "Unterer Rücken bleibt an der Lehne"],
    hi: ["th", "sn", "glute"],
    A: { hx: 74, hy: 122, t: -150, hax: 92, hay: 132, hs: -1, ax: 114, ay: 89, ks: 1, ft: -130 },
    B: { ax: 128, ay: 77 },
    eq: (J) => {
      const d = dir(-40);
      const n = dir(50);
      const c = add(J.an, d, 5);
      return {
        back: (
          <>
            {floor()}
            <line x1={104} y1={124} x2={184} y2={56} stroke={COL.floor} strokeWidth={5} strokeLinecap="round" />
            <line x1={84} y1={134} x2={30} y2={103} stroke={COL.pad} strokeWidth={9} strokeLinecap="round" />
            <line x1={70} y1={132} x2={98} y2={136} stroke={COL.pad} strokeWidth={9} strokeLinecap="round" />
            <line x1={84} y1={140} x2={84} y2={156} stroke={COL.eq} strokeWidth={4} />
          </>
        ),
        front: <line x1={c[0] + n[0] * 16} y1={c[1] + n[1] * 16} x2={c[0] - n[0] * 16} y2={c[1] - n[1] * 16} stroke={COL.eqDark} strokeWidth={6} strokeLinecap="round" />,
      };
    },
  },
  {
    keys: ["plank", "plank(sekunden)", "unterarmstütz"],
    muscles: "Bauch, Rumpf",
    cues: ["Ellenbogen genau unter den Schultern", "Körper bildet eine Linie, Po nicht hochstrecken", "Bauch und Po fest, ruhig weiteratmen"],
    hi: ["torso", "abs"],
    still: true,
    A: { hx: 100, hy: 135, t: 190.5, hax: 30, hay: 151, hs: -1, ax: 170, ay: 147, ks: 1, ft: 100 },
    B: {},
    eq: () => ({ back: floor(157), front: null }),
  },
  {
    keys: ["crunches", "crunch"],
    muscles: "Gerader Bauchmuskel",
    cues: ["Unterer Rücken bleibt am Boden", "Schultern einrollen, nicht am Kopf ziehen", "Oben kurz halten, langsam ablegen"],
    hi: ["abs", "torso"],
    A: { hx: 112, hy: 147, t: 180, hax: 114, hay: 144, hs: 1, ax: 152, ay: 149, ks: -1, ft: 0 },
    B: { t: 210, hax: 120, hay: 116 },
    eq: () => ({ back: floor(157), front: null }),
  },
  {
    keys: ["klimmzüge", "klimmzug"],
    muscles: "Breiter Rücken, Bizeps",
    cues: ["Erst die Schultern nach unten ziehen", "Brust zur Stange, Kinn über die Stange", "Kontrolliert ablassen, ohne Schwung"],
    hi: ["back", "ua", "fa"],
    A: { hx: 106, hy: 124, t: -93, hax: 110, hay: 22, hs: 1, ax: 96, ay: 188, ks: -1, ft: 60 },
    B: { hx: 107, hy: 88, ax: 96, ay: 152 },
    vb: "0 0 220 200",
    eq: () => ({
      back: (
        <>
          <line x1={40} y1={22} x2={180} y2={22} stroke={COL.eq} strokeWidth={3} />
          <circle cx={110} cy={22} r={4.5} fill={COL.eqDark} />
        </>
      ),
      front: null,
    }),
  },
  {
    keys: ["latzug"],
    muscles: "Breiter Rücken, Bizeps",
    cues: ["Stange zur oberen Brust ziehen", "Oberkörper leicht zurücklehnen", "Ellenbogen nach unten und hinten führen"],
    hi: ["back", "ua", "fa"],
    A: { hx: 98, hy: 122, t: -100, hax: 99, hay: 28, hs: 1, ax: 136, ay: 158, ks: -1, ft: 0 },
    B: { hax: 104, hay: 92 },
    vb: "0 0 220 175",
    eq: (J) => ({
      back: (
        <>
          {floor(166)}
          <rect x={80} y={126} width={36} height={8} rx={4} fill={COL.pad} />
          <line x1={98} y1={134} x2={98} y2={166} stroke={COL.eq} strokeWidth={4} />
          <circle cx={134} cy={114} r={6} fill={COL.pad} />
        </>
      ),
      front: cable([101, 5], J.ha),
    }),
  },
  {
    keys: ["rudernamkabel", "kabelrudern", "rudern"],
    muscles: "Mittlerer Rücken, Bizeps",
    cues: ["Rücken gerade, Brust raus", "Griff zum Bauchnabel ziehen", "Schulterblätter am Ende zusammendrücken"],
    hi: ["back", "ua", "fa"],
    A: { hx: 78, hy: 136, t: -76, hax: 136, hay: 116, hs: -1, ax: 150, ay: 132, ks: -1, ft: -80 },
    B: { t: -95, hax: 104, hay: 120 },
    eq: (J) => ({
      back: (
        <>
          {floor()}
          <rect x={56} y={140} width={56} height={8} rx={4} fill={COL.pad} />
          <line x1={161} y1={120} x2={161} y2={146} stroke={COL.eqDark} strokeWidth={5} strokeLinecap="round" />
          <line x1={196} y1={60} x2={196} y2={156} stroke={COL.floor} strokeWidth={6} />
        </>
      ),
      front: cable([192, 122], J.ha),
    }),
  },
  {
    keys: ["liegestütze", "liegestütz", "pushups"],
    muscles: "Brust, Trizeps, Rumpf",
    cues: ["Hände etwas breiter als schulterbreit", "Körper bleibt eine gerade Linie", "Brust bis knapp über den Boden, zu schwer? Hände auf eine Bank"],
    hi: ["chest", "ua", "fa"],
    A: { hx: 103, hy: 118, t: 200, hax: 60, hay: 151, hs: -1, ax: 171, ay: 142, ks: 1, ft: 110 },
    B: { hx: 99, hy: 135, t: 186, ft: 96 },
    eq: () => ({ back: floor(157), front: null }),
  },
  {
    keys: ["facepulls", "facepull"],
    muscles: "Hintere Schulter, oberer Rücken",
    cues: ["Seilzug auf Gesichtshöhe einstellen", "Zum Gesicht ziehen, Ellenbogen hoch und außen", "Hände enden neben den Ohren"],
    hi: ["delt", "back", "ua"],
    A: { hx: 94, hy: 77.5, t: -90, hax: 138, hay: 40, hs: -1, ax: 96, ay: 150, ks: -1, ft: 0 },
    B: { t: -94, hax: 106, hay: 22 },
    eq: (J) => ({ back: <>{floor()}<line x1={202} y1={4} x2={202} y2={156} stroke={COL.floor} strokeWidth={6} /></>, front: cable([198, 40], J.ha) }),
  },
  {
    keys: ["bizepscurls", "bizepscurl", "curls"],
    muscles: "Bizeps",
    cues: ["Ellenbogen bleiben fest am Körper", "Ohne Schwung nach oben", "Langsam ablassen"],
    hi: ["ua", "fa"],
    A: { hx: 101, hy: 76.5, t: -90, ua: 92, fa: 86, ax: 102, ay: 149, ks: -1, ft: 0 },
    B: { fa: -64 },
    eq: (J) => ({ back: floor(), front: dumbbell(J.ha) }),
  },
];

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-zäöüß()]/g, "");
export function findGuide(name) {
  const n = norm(name);
  return GUIDES.find((g) => g.keys.some((k) => norm(k) === n)) || GUIDES.find((g) => g.keys.some((k) => n.startsWith(norm(k)))) || null;
}
export const GUIDE_LIST = GUIDES;

const ease = (x) => 0.5 - Math.cos(Math.PI * x) / 2;

export function Figure({ g, k }) {
  const A = g.A;
  const B = { ...A, ...g.B };
  const p = interp(A, B, k);
  const J = g.view === "front" ? solveFront(p) : solveSide(p);
  const eq = g.eq(J);
  return (
    <svg viewBox={g.vb || "0 0 220 170"} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Bewegungsablauf">
      {eq.back}
      {g.view === "front" ? <FrontBody J={J} hi={g.hi} /> : <SideBody J={J} hi={g.hi} />}
      {eq.front}
      {g.eqFront && g.eqFront(J)}
    </svg>
  );
}

export function ExerciseGuide({ name, accent = COL.hi, mute = "#6B7480" }) {
  const g = findGuide(name);
  const [k, setK] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!g || g.still || paused) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setK(1);
      return;
    }
    let raf;
    const st = performance.now() - k * 0;
    const loop = (now) => {
      const c = ((now - st) / 3200) % 1;
      let v;
      if (c < 0.12) v = 0;
      else if (c < 0.47) v = ease((c - 0.12) / 0.35);
      else if (c < 0.6) v = 1;
      else v = 1 - ease((c - 0.6) / 0.4);
      setK(v);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [g, paused]);
  if (!g) return null;
  return (
    <div>
      <button
        onClick={() => setPaused((x) => !x)}
        aria-label={paused ? "Animation fortsetzen" : "Animation anhalten"}
        style={{ width: "100%", maxWidth: 340, margin: "0 auto", display: "block", background: "#F4F6F9", borderRadius: 12, padding: 6 }}
      >
        <Figure g={g} k={k} />
      </button>
      <p style={{ fontSize: 13, color: mute, textAlign: "center", marginTop: 4 }}>
        {g.still ? "Position halten" : paused ? "Angehalten, tippen zum Fortsetzen" : "Tippen zum Anhalten"}
      </p>
      <p style={{ marginTop: 10 }}>
        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: accent, marginRight: 6 }} />
        <span style={{ fontWeight: 600 }}>Zielmuskeln:</span> {g.muscles}
      </p>
      <ul style={{ marginTop: 6, paddingLeft: 0, listStyle: "none" }}>
        {g.cues.map((c) => (
          <li key={c} style={{ display: "flex", gap: 8, padding: "3px 0" }}>
            <span style={{ color: accent, fontWeight: 700 }}>✓</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
