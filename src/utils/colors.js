// ─────────────────────────────────────────
//  Nuancier RAL disponible
// ─────────────────────────────────────────
export const RAL_COLORS = [
  { code: 'RAL 1018', name: 'Jaune zinc',         hex: '#F3A505' },
  { code: 'RAL 3022', name: 'Rouge saumon',        hex: '#D56D56' },
  { code: 'RAL 3003', name: 'Rouge rubis',         hex: '#8E1728' },
  { code: 'RAL 8012', name: 'Brun rouge',          hex: '#6C3B2A' },
  { code: 'RAL 8017', name: 'Brun chocolat',       hex: '#442F29' },
  { code: 'RAL 9011', name: 'Noir graphite',       hex: '#1F1F1F' },
  { code: 'RAL 7024', name: 'Gris graphite',       hex: '#474A50' },
  { code: 'RAL 7037', name: 'Gris poussière',      hex: '#7D7F7D' },
  { code: 'RAL 9006', name: 'Aluminium blanc',     hex: '#A5A5A5' },
  { code: 'RAL 7016', name: 'Gris anthracite',     hex: '#383E42' },
  { code: 'RAL 1013', name: 'Blanc perle',         hex: '#E9E0D1' },
  { code: 'RAL 7032', name: 'Gris silex',          hex: '#B5B0A1' },
  { code: 'RAL 1015', name: 'Ivoire clair',        hex: '#E6D2B5' },
  { code: 'RAL 9003', name: 'Blanc de sécurité',   hex: '#F4F4F4' },
  { code: 'RAL 6019', name: 'Vert blanc',          hex: '#CFE5CE' },
  { code: 'RAL 6032', name: 'Vert de sécurité',    hex: '#237F52' },
  { code: 'RAL 6005', name: 'Vert mousse',         hex: '#1F3A2D' },
  { code: 'RAL 6027', name: 'Vert clair',          hex: '#7DC4BC' },
  { code: 'RAL 5021', name: "Bleu d'eau",          hex: '#1B8A91' },
  { code: 'RAL 5015', name: 'Bleu ciel',           hex: '#1F6EA2' },
  { code: 'RAL 5002', name: 'Bleu outremer',       hex: '#1A2B6D' },
];

// ─────────────────────────────────────────
//  Conversion hex → HSL
// ─────────────────────────────────────────
function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6;               break;
      case b: h = ((r - g) / d + 4) / 6;               break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// ─────────────────────────────────────────
//  Calcul du filtre CSS pour une couleur RAL
//
//  Principe :
//  1. sepia(100%) donne à l'image une base colorée (≈ hue 35°, sat 44%)
//  2. hue-rotate() décale la teinte vers la cible
//  3. saturate() ajuste la saturation
//  4. brightness() ajuste la luminosité
//
//  Pour les couleurs neutres (gris/noir/blanc), on utilise
//  grayscale + brightness uniquement.
// ─────────────────────────────────────────
export function getColorFilter(hex) {
  const [h, s, l] = hexToHSL(hex);

  // Couleur achromatique (gris / noir / blanc)
  if (s < 8) {
    const bri = Math.round((l / 50) * 100);
    return `grayscale(100%) brightness(${bri}%)`;
  }

  // Couleur chromée — sepia donne la base hue ≈ 35°
  const hueRotate = h - 35;
  const saturate  = Math.round((s / 44) * 115); // léger boost pour compenser
  const brightness = Math.round((l / 48) * 95);

  return `sepia(100%) hue-rotate(${hueRotate}deg) saturate(${saturate}%) brightness(${brightness}%)`;
}

// ─────────────────────────────────────────
//  Trouve la couleur RAL par son code hex
// ─────────────────────────────────────────
export function findRALByHex(hex) {
  return RAL_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
}
