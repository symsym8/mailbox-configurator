import { useState, useEffect, useMemo } from "react";

// ─── Couleurs marqueurs AutoCAD dans les SVG ─────────────────────────────────
//   #ff2a1b  → rouge  → COFFRE      (colorisable)
//   #0089b6  → bleu   → CADRE       (colorisable)
//   #00b51a  → vert   → PORTILLON   (colorisable)
//   #f1dd38  → jaune  → AILETTE + SERRURES → fixe inox
const MARKERS = {
  coffre: "#ff2a1b",
  cadre: "#0089b6",
  portillon: "#00b51a",
  inox: "#f1dd38",
};

const INOX = "#C0C0C0";

// Remplace fill:COLOR et stroke:COLOR dans les styles inline du SVG
function colorize(svgText, coffre, cadre, portillon) {
  if (!svgText) return "";

  const replacements = [
    [MARKERS.coffre, coffre],
    [MARKERS.cadre, cadre],
    [MARKERS.portillon, portillon],
    [MARKERS.inox, INOX],
  ];

  let s = svgText;
  for (const [from, to] of replacements) {
    // fill:COLOR  (dans style="...")
    s = s.replace(new RegExp(`fill:${from}`, "gi"), `fill:${to}`);
    // stroke:COLOR (dans style="...")
    s = s.replace(new RegExp(`stroke:${from}`, "gi"), `stroke:${to}`);
    // fill="COLOR" (attribut direct, au cas où)
    s = s.replace(new RegExp(`fill="${from}"`, "gi"), `fill="${to}"`);
    // stroke="COLOR"
    s = s.replace(new RegExp(`stroke="${from}"`, "gi"), `stroke="${to}"`);
  }
  return s;
}

// Rend le SVG responsive : remplace width/height fixes par 100%
function makeResponsive(svgText) {
  return svgText
    .replace(/(<svg[^>]*)\s+width="[^"]*"/, '$1 width="100%"')
    .replace(/(<svg[^>]*)\s+height="[^"]*"/, '$1 height="100%"');
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function MailboxSVGViewer({
  gamme,
  modele,
  couleurCoffre,
  couleurCadre,
  couleurPortillon,
}) {
  const [rawSvg, setRawSvg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Nom du fichier SVG : elite_A1.svg / elite_A2.svg / discretion_A1.svg / ...
  const svgUrl = `/image/${gamme.toLowerCase()}_${modele}.svg`;

  // Charge le SVG brut quand la gamme ou le modèle change
  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(svgUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        setRawSvg(makeResponsive(text));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [svgUrl]);

  // Applique les couleurs RAL en temps réel (recalculé à chaque changement de couleur)
  const colorizedSvg = useMemo(
    () => colorize(rawSvg, couleurCoffre, couleurCadre, couleurPortillon),
    [rawSvg, couleurCoffre, couleurCadre, couleurPortillon],
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: 12,
          color: "#3E3E56",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid #E2E2EC",
            borderTopColor: "#C9A84C",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ fontSize: 13 }}>Chargement…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          color: "#3E3E56",
          fontSize: 13,
        }}
      >
        Impossible de charger le SVG ({svgUrl})
      </div>
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: colorizedSvg }}
      style={{ width: "100%", height: "100%", lineHeight: 0 }}
    />
  );
}
