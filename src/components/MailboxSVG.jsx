// ─── Utilitaires couleur ─────────────────────────────────────────────────────

function parseRGB(hex) {
  if (!hex || hex.length < 7) return [128, 128, 128];
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function shade(hex, amt) {
  const [r, g, b] = parseRGB(hex);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

const dk  = (h) => shade(h, -28);   // plus sombre
const dk2 = (h) => shade(h, -55);   // beaucoup plus sombre
const lt  = (h) => shade(h, +38);   // plus clair

// ─── Constantes de layout (unités = mm réels) ────────────────────────────────

const VW    = 424;   // largeur totale
const VH_A1 = 359;   // hauteur A1
const VH_A2 = 638;   // hauteur A2

// Borders du coffre
const C_RX  = 22;   // rayon des coins
const C_L   = 40;   // largeur bordure gauche
const C_R   = 30;   // largeur bordure droite
const C_TOP = 26;   // hauteur capot supérieur
const C_BOT = 21;   // hauteur solin inférieur

// Rails du cadre
const F_T = 14;     // rail haut
const F_L = 18;     // rail gauche
const F_R = 12;     // rail droit
const F_B = 16;     // rail bas

// Zone intérieure (entre bordures coffre)
const INN_X = C_L;               // 40
const INN_W = VW - C_L - C_R;   // 354

// Zone portillon (intérieur cadre)
const P_X = INN_X + F_L;              // 58
const P_W = INN_W - F_L - F_R;       // 324

// A1
const INN_Y1  = C_TOP;
const INN_H1  = VH_A1 - C_TOP - C_BOT;   // 312
const P_Y1    = INN_Y1 + F_T;            // 40
const P_H1    = INN_H1 - F_T - F_B;     // 282

// A2
const INN_H2  = VH_A2 - C_TOP - C_BOT;   // 591
const P_Y2    = C_TOP + F_T;             // 40
const P_H2TOT = INN_H2 - F_T - F_B;     // 561
const SEP_H   = 12;                      // séparateur entre portillons A2
const P_EACH  = Math.floor((P_H2TOT - SEP_H) / 2); // 274

// ─── Coffre ──────────────────────────────────────────────────────────────────

function Coffre({ color, height }) {
  const botY = height - C_BOT;

  return (
    <g>
      {/* Corps principal */}
      <rect x={0} y={0} width={VW} height={height} rx={C_RX} fill={color} />

      {/* Capot supérieur (plus sombre) */}
      <rect x={0} y={0} width={VW} height={C_TOP}     rx={C_RX} fill={dk(color)} />
      <rect x={0} y={C_TOP - 5} width={VW} height={5} fill={dk(color)} />

      {/* Solin inférieur */}
      <rect x={0} y={botY} width={VW} height={C_BOT} fill={dk(color)} rx={5} />
      <rect x={0} y={botY} width={VW} height={5}     fill={dk(color)} />

      {/* Reflet léger bord gauche du capot */}
      <rect x={C_RX} y={1} width={VW - 2 * C_RX} height={2}
        fill={lt(color)} opacity={0.35} />

      {/* Ligne de jonction capot / corps */}
      <line x1={INN_X} y1={C_TOP} x2={VW - C_R} y2={C_TOP}
        stroke={dk2(color)} strokeWidth={1.5} />

      {/* Ligne de jonction corps / solin */}
      <line x1={INN_X} y1={botY} x2={VW - C_R} y2={botY}
        stroke={dk2(color)} strokeWidth={1} opacity={0.7} />

      {/* Arête intérieure gauche */}
      <line x1={INN_X} y1={C_TOP} x2={INN_X} y2={botY}
        stroke={dk2(color)} strokeWidth={2} />

      {/* Arête intérieure droite (reflet) */}
      <line x1={VW - C_R} y1={C_TOP} x2={VW - C_R} y2={botY}
        stroke={lt(color)} strokeWidth={1.5} opacity={0.4} />

      {/* Serrure bâtiment (bord gauche) */}
      <circle cx={C_L / 2} cy={height * 0.61} r={10} fill={dk(color)} />
      <circle cx={C_L / 2} cy={height * 0.61} r={6}  fill={dk2(color)} />
      <circle cx={C_L / 2} cy={height * 0.61} r={2.5} fill="#2a2a2a" />
    </g>
  );
}

// ─── Cadre (tube acier mécano-soudé) ─────────────────────────────────────────

function Cadre({ color, innY, innH, isA2 }) {
  const x  = INN_X;
  const w  = INN_W;
  const midY = innY + F_T + P_EACH; // séparateur A2

  return (
    <g fill={color}>
      {/* Rail haut */}
      <rect x={x} y={innY}            width={w}  height={F_T} />
      <rect x={x} y={innY}            width={w}  height={2}   fill={lt(color)} opacity={0.65} />
      <rect x={x} y={innY + F_T - 2}  width={w}  height={2}   fill={dk(color)} opacity={0.5} />

      {/* Rail gauche */}
      <rect x={x}          y={innY} width={F_L} height={innH} />
      <rect x={x}          y={innY} width={2}   height={innH} fill={lt(color)} opacity={0.65} />
      <rect x={x + F_L - 2} y={innY} width={2}   height={innH} fill={dk(color)} opacity={0.5} />

      {/* Rail droit */}
      <rect x={x + w - F_R} y={innY} width={F_R} height={innH} />
      <rect x={x + w - 2}   y={innY} width={2}   height={innH} fill={dk(color)} opacity={0.6} />

      {/* Rail bas */}
      <rect x={x} y={innY + innH - F_B} width={w} height={F_B} />
      <rect x={x} y={innY + innH - 2}   width={w} height={2}   fill={dk(color)} opacity={0.5} />

      {/* Séparateur A2 (rail horizontal médian) */}
      {isA2 && (
        <g>
          <rect x={P_X} y={midY}          width={P_W} height={SEP_H} />
          <rect x={P_X} y={midY}          width={P_W} height={2}
            fill={lt(color)} opacity={0.5} />
          <rect x={P_X} y={midY + SEP_H - 2} width={P_W} height={2}
            fill={dk(color)} opacity={0.5} />
        </g>
      )}
    </g>
  );
}

// ─── Portillon ELITE (galbé, avec ailette) ───────────────────────────────────

function ElitePortillon({ x, y, w, h, color }) {
  // Fente courrier
  const sX = x + w * 0.09;
  const sW = w * 0.82;
  const sY = y + h * 0.215;
  const sH = h * 0.105;

  // Serrure
  const lcx = x + w * 0.205;
  const lcy = y + h * 0.515;
  const lr  = h * 0.056;

  // Plaque nom
  const npX = x + w * 0.155;
  const npY = y + h * 0.705;
  const npW = w * 0.430;
  const npH = h * 0.078;

  return (
    <g>
      {/* Corps portillon */}
      <rect x={x} y={y} width={w} height={h} fill={color} rx={4} />

      {/* Lignes de galbe pressées (effet embossage Elite) */}
      <path
        d={`M ${x + w*0.44},${y} Q ${x + w*0.73},${y + h*0.27} ${x + w},${y + h*0.42}`}
        fill="none" stroke={dk(color)} strokeWidth={2.8} opacity={0.33} strokeLinecap="round"
      />
      <path
        d={`M ${x + w*0.70},${y} Q ${x + w*0.88},${y + h*0.33} ${x + w},${y + h*0.69}`}
        fill="none" stroke={dk(color)} strokeWidth={2.8} opacity={0.33} strokeLinecap="round"
      />
      <path
        d={`M ${x + w*0.25},${y} Q ${x + w*0.47},${y + h*0.38} ${x + w*0.53},${y + h}`}
        fill="none" stroke={dk(color)} strokeWidth={2.2} opacity={0.25} strokeLinecap="round"
      />
      <path
        d={`M ${x},${y + h*0.28} Q ${x + w*0.22},${y + h*0.50} ${x + w*0.40},${y + h}`}
        fill="none" stroke={dk(color)} strokeWidth={2.2} opacity={0.22} strokeLinecap="round"
      />

      {/* Reflet haut */}
      <rect x={x} y={y} width={w} height={2} fill={lt(color)} opacity={0.38} rx={4} />

      {/* Fente courrier — bord extérieur sombre */}
      <rect x={sX} y={sY} width={sW} height={sH} fill={dk2(color)} rx={4} />
      {/* Ouverture noire */}
      <rect x={sX+3} y={sY+3} width={sW-6} height={sH-8} fill="#0d0d0d" rx={2} />
      {/* Ailette anti-retour (gris-bleu fixe, légèrement bombée) */}
      <rect x={sX+5} y={sY+4} width={sW-10} height={sH-11} fill="#8fa0bc" rx={3} />
      {/* Reflet ailette */}
      <rect x={sX+5} y={sY+4} width={sW-10} height={4}
        fill="#b2c2d8" opacity={0.9} rx={2} />

      {/* Serrure */}
      <circle cx={lcx} cy={lcy} r={lr}         fill={dk(color)} />
      <circle cx={lcx} cy={lcy} r={lr * 0.64}  fill={dk2(color)} />
      <circle cx={lcx} cy={lcy} r={lr * 0.27}  fill="#1e1e1e" />
      <rect x={lcx - lr*0.11} y={lcy} width={lr*0.22} height={lr*0.52} fill="#1e1e1e" />

      {/* Plaque nom */}
      <rect x={npX} y={npY} width={npW} height={npH}
        fill={dk(color)} stroke={dk2(color)} strokeWidth={1} rx={2} />
    </g>
  );
}

// ─── Portillon DISCRETION (plat, sans ailette) ───────────────────────────────

function DiscretionPortillon({ x, y, w, h, color }) {
  // Fente courrier (large, haut du portillon)
  const sX = x + w * 0.04;
  const sW = w * 0.92;
  const sY = y + h * 0.105;
  const sH = h * 0.096;

  // Serrure (gauche)
  const lcx = x + w * 0.215;
  const lcy = y + h * 0.475;
  const lr  = h * 0.046;

  // Plaque nom (droite, même niveau que serrure)
  const npX = x + w * 0.385;
  const npY = y + h * 0.435;
  const npW = w * 0.480;
  const npH = h * 0.082;

  return (
    <g>
      {/* Corps portillon — plat */}
      <rect x={x} y={y} width={w} height={h} fill={color} rx={2} />

      {/* Reflet haut */}
      <rect x={x} y={y} width={w} height={1.5} fill={lt(color)} opacity={0.38} rx={2} />

      {/* Fente courrier — bande sombre pleine largeur */}
      <rect x={sX} y={sY} width={sW} height={sH} fill={dk2(color)} rx={2} />
      {/* Ouverture noire */}
      <rect x={sX+2} y={sY+2} width={sW-4} height={sH-5} fill="#0d0d0d" rx={1} />
      {/* Pas d'ailette sur DISCRETION */}

      {/* Serrure */}
      <circle cx={lcx} cy={lcy} r={lr}         fill={dk(color)} />
      <circle cx={lcx} cy={lcy} r={lr * 0.60}  fill={dk2(color)} />
      <circle cx={lcx} cy={lcy} r={lr * 0.26}  fill="#1e1e1e" />
      <rect x={lcx - lr*0.10} y={lcy} width={lr*0.20} height={lr*0.46} fill="#1e1e1e" />

      {/* Plaque nom (contour uniquement) */}
      <rect x={npX} y={npY} width={npW} height={npH}
        fill="none" stroke={dk(color)} strokeWidth={1.5} rx={2} />
    </g>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function MailboxSVG({ gamme, modele, couleurCoffre, couleurCadre, couleurPortillon }) {
  const isA2    = modele === 'A2';
  const isElite = gamme === 'ELITE';

  const vH   = isA2 ? VH_A2 : VH_A1;
  const innY = C_TOP;
  const innH = vH - C_TOP - C_BOT;

  const Port = isElite ? ElitePortillon : DiscretionPortillon;

  return (
    <svg
      viewBox={`0 0 ${VW} ${vH}`}
      width="100%"
      height="100%"
      style={{ display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="mb-shadow" x="-8%" y="-6%" width="116%" height="116%">
          <feDropShadow dx={0} dy={5} stdDeviation={7}
            floodColor="#000000" floodOpacity={0.22} />
        </filter>
      </defs>

      {/* 1 — Coffre (structure extérieure) */}
      <g filter="url(#mb-shadow)">
        <Coffre color={couleurCoffre} height={vH} />
      </g>

      {/* 2 — Cadre (tube acier, contour intérieur) */}
      <Cadre
        color={couleurCadre}
        innY={innY}
        innH={innH}
        isA2={isA2}
      />

      {/* 3 — Portillon(s) */}
      {isA2 ? (
        <>
          <Port x={P_X} y={P_Y2}                w={P_W} h={P_EACH} color={couleurPortillon} />
          <Port x={P_X} y={P_Y2 + P_EACH + SEP_H} w={P_W} h={P_EACH} color={couleurPortillon} />
        </>
      ) : (
        <Port x={P_X} y={P_Y1} w={P_W} h={P_H1} color={couleurPortillon} />
      )}
    </svg>
  );
}
