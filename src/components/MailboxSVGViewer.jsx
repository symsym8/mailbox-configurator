import { useState, useEffect, useRef } from "react";

// Couleurs marqueurs AutoCAD dans les SVG
const MARKERS = {
  coffre: "#ff2a1b",
  cadre: "#0089b6",
  portillon: "#00b51a",
  inox: "#f1dd38",
};
const INOX_COLOR = "#C0C0C0";

// Cache mémoire des SVG déjà téléchargés — la 2e visite d'un modèle est instantanée
const svgCache = new Map();

function makeResponsive(svgText) {
  return svgText
    .replace(/(<svg[^>]*)\s+width="[^"]*"/, '$1 width="100%"')
    .replace(/(<svg[^>]*)\s+height="[^"]*"/, '$1 height="100%"');
}

// Parcourt les éléments du SVG et leur ajoute data-zone + sauvegarde les valeurs d'origine
function tagZones(container) {
  for (const el of container.querySelectorAll("*")) {
    const style = el.getAttribute("style") || "";
    const fill = el.getAttribute("fill") || "";
    const stroke = el.getAttribute("stroke") || "";
    const combined = (style + fill + stroke).toLowerCase();

    for (const [zone, hex] of Object.entries(MARKERS)) {
      if (combined.includes(hex.toLowerCase())) {
        el.setAttribute("data-zone", zone);
        el.setAttribute("data-orig-style", style);
        el.setAttribute("data-orig-fill", fill);
        el.setAttribute("data-orig-stroke", stroke);
        break;
      }
    }
  }
}

// Met à jour uniquement les éléments taggés — pas de re-injection innerHTML
function applyColors(container, coffre, cadre, portillon) {
  const zoneColor = { coffre, cadre, portillon, inox: INOX_COLOR };

  for (const el of container.querySelectorAll("[data-zone]")) {
    const zone = el.getAttribute("data-zone");
    const newColor = zoneColor[zone];
    if (!newColor) continue;

    const origMarker = MARKERS[zone];
    const re = new RegExp(origMarker, "gi");
    const origStyle = el.getAttribute("data-orig-style") || "";
    const origFill = el.getAttribute("data-orig-fill") || "";
    const origStroke = el.getAttribute("data-orig-stroke") || "";

    if (origStyle) el.setAttribute("style", origStyle.replace(re, newColor));
    if (origFill && origFill.toLowerCase() === origMarker.toLowerCase())
      el.setAttribute("fill", newColor);
    if (origStroke && origStroke.toLowerCase() === origMarker.toLowerCase())
      el.setAttribute("stroke", newColor);
  }
}

export default function MailboxSVGViewer({
  gamme,
  modele,
  couleurCoffre,
  couleurCadre,
  couleurPortillon,
}) {
  const containerRef = useRef(null);
  // Ref pour les couleurs courantes : évite les stale closures dans le callback fetch
  const colorsRef = useRef({ couleurCoffre, couleurCadre, couleurPortillon });
  const [status, setStatus] = useState("loading");

  const svgUrl = `/image/${gamme.toLowerCase()}_${modele}.svg`;

  // Toujours à jour avant tout callback asynchrone
  colorsRef.current = { couleurCoffre, couleurCadre, couleurPortillon };

  // Charge le SVG, injecte une seule fois, tague les zones et applique les couleurs initiales
  useEffect(() => {
    setStatus("loading");
    let cancelled = false;

    const source = svgCache.has(svgUrl)
      ? Promise.resolve(svgCache.get(svgUrl))
      : fetch(svgUrl)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
          })
          .then((text) => {
            svgCache.set(svgUrl, text);
            return text;
          });

    source
      .then((text) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = makeResponsive(text);
        tagZones(containerRef.current);
        const { couleurCoffre, couleurCadre, couleurPortillon } =
          colorsRef.current;
        applyColors(
          containerRef.current,
          couleurCoffre,
          couleurCadre,
          couleurPortillon,
        );
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [svgUrl]);

  // Met à jour uniquement les couleurs — manipulation DOM directe, sans re-injection SVG
  useEffect(() => {
    if (status !== "ready" || !containerRef.current) return;
    applyColors(
      containerRef.current,
      couleurCoffre,
      couleurCadre,
      couleurPortillon,
    );
  }, [status, couleurCoffre, couleurCadre, couleurPortillon]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        lineHeight: 0,
      }}
    >
      {/* Toujours rendu pour que containerRef soit disponible dès le premier fetch */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
      )}

      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3E3E56",
            fontSize: 13,
          }}
        >
          Impossible de charger le SVG ({svgUrl})
        </div>
      )}
    </div>
  );
}
