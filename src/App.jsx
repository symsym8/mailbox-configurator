import { useState, useRef, useCallback } from "react";
import MailboxSVGViewer from "./components/MailboxSVGViewer";
import { RAL_COLORS } from "./utils/colors";
import { generatePDF } from "./utils/pdfGenerator";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#F5F5F7",
  surface: "#FFFFFF",
  s2: "#F0F0F5",
  s3: "#E8E8EE",
  border: "#E2E2EC",
  gold: "#C9A84C",
  goldL: "#E2C47A",
  goldD: "#9A7E38",
  goldF: "rgba(201,168,76,0.10)",
  goldG: "rgba(201,168,76,0.28)",
  text: "#1E1E2E",
  muted: "#5A5A78",
  dim: "#9898B0",
};

// ─── CSS responsive ───────────────────────────────────────────────────────────
// Stratégie mobile : display:contents sur le wrapper supprime le bloc,
// rendant chaque aside-section enfant direct de app-main → order CSS fonctionne.
const RESPONSIVE_CSS = `
  /* ── DESKTOP (défaut) ──────────────────────────────────── */
  .app-root { height:100vh; overflow:hidden; display:flex; flex-direction:column; }
  .app-main { flex:1; display:flex; overflow:hidden; }

  .aside-wrapper {
    width:390px; flex-shrink:0;
    display:flex; flex-direction:column;
    overflow-y:auto; scrollbar-width:thin;
    border-right:1px solid #E2E2EC;
    box-shadow:2px 0 8px rgba(0,0,0,0.04);
  }
  .aside-section { border-bottom:1px solid #E2E2EC; flex-shrink:0; }
  .aside-section:last-child { border-bottom:none; }

  .app-preview { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .app-svg-zone {
    flex:1; display:flex; align-items:center; justify-content:center;
    padding:32px 40px; position:relative; overflow:hidden;
  }
  .app-bottom-bar   { display:flex; }
  .app-export-fixed { display:none; }
  .recap-mobile     { display:none; }

  .ral-grid   { display:grid; grid-template-columns:repeat(7,1fr); gap:7px; }
  .field-inp  { font-size:11.5px; padding:8px 11px; }
  .field-area { font-size:11.5px; padding:8px 11px; }
  .zone-tab   { padding:7px 0; font-size:10.5px; }

  /* ── MOBILE (≤768px) ────────────────────────────────────── */
  @media (max-width:768px) {
    .app-root { height:auto; min-height:100vh; overflow:visible; padding-bottom:72px; }
    .app-main { flex-direction:column; overflow:visible; }

    /* Le wrapper devient transparent : enfants remontent dans app-main */
    .aside-wrapper { display:contents; }

    /* Fond blanc + séparateur pour chaque section sur mobile */
    .aside-section { background:#FFFFFF; border-bottom:1px solid #E2E2EC; }

    /* ── Ordre mobile souhaité ──────────────────────────────
       1 GAMME  2 MODÈLE  3 SVG  4 COULEURS  5 DESCRIPTIF  6 CLIENT */
    .aside-gamme    { order:1; }
    .aside-modele   { order:2; }
    .app-preview    { order:3; flex:none; overflow:visible; }
    .aside-couleurs { order:4; }
    .aside-desc     { order:5; }
    .aside-client   { order:6; }

    .app-svg-zone {
      flex:none; min-height:270px; height:45vw; max-height:380px;
      padding:20px 16px;
    }
    .app-bottom-bar   { display:none; }
    .app-export-fixed { display:block; }
    .recap-mobile     { display:block; }

    .ral-grid   { grid-template-columns:repeat(6,1fr); gap:9px; }
    .field-inp  { font-size:14px; padding:11px 14px; }
    .field-area { font-size:14px; padding:11px 14px; }
    .zone-tab   { padding:9px 0; font-size:11px; }
  }
`;

// ─── Données ──────────────────────────────────────────────────────────────────
const DIMS = {
  A1: { h: 359, l: 424, p: 365 },
  A2: { h: 638, l: 424, p: 365 },
  A3: { h: 918, l: 424, p: 365 },
  B2: { h: 359, l: 732, p: 365 },
  B4: { h: 638, l: 732, p: 365 },
  B6: { h: 918, l: 732, p: 365 },
};

const GAMMES = {
  ELITE: {
    badge: "PREMIUM",
    desc: "Anti-effraction Grade 5 · NF D 27404",
    models: ["A1", "A2", "A3", "B2", "B4", "B6"],
  },
  DISCRETION: {
    badge: "CLASSIQUE",
    desc: "Design épuré · Portillon plat",
    models: ["A1", "A2", "A3"],
  },
};

const DESCRIPTIFS = {
  ELITE: [
    "Coffre acier 10/10 galvanisé, assemblé monobloc avec chants droits",
    "Finition peinture époxy-polyester cuite au four",
    "Portillon galbé embouti en tôle d'acier galvanisé 15/10 avec fenêtre d'introduction du courrier, chicane antivol, condamnation par dispositif renforcé",
    "Cadre ouvrant tube acier mécanosoudé avec verrouillage multipoints",
    "Tablettes et séparations intérieures en tôle d'acier galvanisé",
    "Anti-effraction grade 5 — NF D 27404",
  ],
  DISCRETION: [
    "Coffre acier 10/10 galvanisé, assemblé monobloc avec chants droits",
    "Finition peinture époxy-polyester cuite au four",
    "Portillon plat 12/10 avec fenêtre d'introduction du courrier, chicane antivol, condamnation par came",
    "Cadre ouvrant tube acier mécanosoudé avec verrouillage multipoints",
    "Tablettes et séparations intérieures en tôle d'acier galvanisé",
    "NF D 27404",
  ],
};

const DEFAULTS = {
  gamme: "ELITE",
  modele: "A1",
  couleurCoffre: "#383E42",
  couleurCadre: "#383E42",
  couleurPortillon: "#A5A5A5",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const findRAL = (hex) =>
  RAL_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
const ralLabel = (hex) => {
  const r = findRAL(hex);
  return r ? `${r.code} · ${r.name}` : hex;
};
const ralCode = (hex) => {
  const r = findRAL(hex);
  return r ? r.code : hex;
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig] = useState(DEFAULTS);
  const [client, setClient] = useState({
    prenom: "",
    nom: "",
    email: "",
    societe: "",
    adresseLivraison: "",
  });
  const [activeZone, setActiveZone] = useState("coffre");
  const [svgKey, setSvgKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [svgVisible, setSvgVisible] = useState(true);
  const [descOpen, setDescOpen] = useState(false);
  const previewRef = useRef(null);

  const setC = useCallback((k, v) => setConfig((p) => ({ ...p, [k]: v })), []);

  const handleGamme = (gamme) => {
    const models = GAMMES[gamme].models;
    const modele = models.includes(config.modele) ? config.modele : models[0];
    setSvgVisible(false);
    setTimeout(() => {
      setConfig((p) => ({ ...p, gamme, modele }));
      setSvgKey((k) => k + 1);
      setSvgVisible(true);
    }, 180);
  };

  const handleModele = (modele) => {
    setSvgVisible(false);
    setTimeout(() => {
      setC("modele", modele);
      setSvgKey((k) => k + 1);
      setSvgVisible(true);
    }, 180);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await generatePDF(previewRef.current, config, client);
    } finally {
      setExporting(false);
    }
  };

  const dim = DIMS[config.modele];
  const gamme = GAMMES[config.gamme];

  const zones = [
    {
      id: "coffre",
      label: "Coffre",
      color: config.couleurCoffre,
      set: (v) => setC("couleurCoffre", v),
    },
    {
      id: "cadre",
      label: "Cadre",
      color: config.couleurCadre,
      set: (v) => setC("couleurCadre", v),
    },
    {
      id: "portillon",
      label: "Portillon",
      color: config.couleurPortillon,
      set: (v) => setC("couleurPortillon", v),
    },
  ];
  const az = zones.find((z) => z.id === activeZone);

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>

      <div
        className="app-root"
        style={{
          background: T.bg,
          color: T.text,
          fontFamily: "'Inter', system-ui, sans-serif",
          userSelect: "none",
        }}
      >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header
          style={{
            height: 52,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            zIndex: 20,
            position: "sticky",
            top: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/logo.png"
              alt="CTS"
              style={{ height: 26, width: "auto", objectFit: "contain" }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div style={{ width: 1, height: 22, background: T.border }} />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.07em",
                  color: T.gold,
                  lineHeight: 1,
                }}
              >
                CTS
              </div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.11em",
                  color: T.dim,
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                Configurateur BAL
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.dim, letterSpacing: "0.04em" }}>
            {new Date().toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        </header>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <div className="app-main">
          {/* ── ASIDE WRAPPER ─────────────────────────────────────────────
              Desktop : div scrollable 390px, enfants empilés
              Mobile  : display:contents → enfants remontent dans app-main
                        et sont réordonnés via CSS order                   */}
          <div
            className="aside-wrapper"
            style={{
              background: T.surface,
              scrollbarColor: `${T.border} transparent`,
            }}
          >
            {/* 01 — GAMME ─────────────────────────────────────────────── */}
            <div className="aside-section aside-gamme">
              <SectionLabel number="01" label="Gamme" />
              <div
                style={{
                  padding: "0 20px 18px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {Object.entries(GAMMES).map(([key, g]) => (
                  <GammeCard
                    key={key}
                    gKey={key}
                    g={g}
                    active={config.gamme === key}
                    onClick={() => handleGamme(key)}
                  />
                ))}
              </div>
            </div>

            {/* 02 — DESCRIPTIF TECHNIQUE (accordéon) ─────────────────── */}
            <div className="aside-section aside-desc">
              <Accordion
                number="02"
                label="Descriptif technique"
                badge={config.gamme}
                open={descOpen}
                onToggle={() => setDescOpen((o) => !o)}
              >
                <ul
                  style={{ margin: 0, padding: "0 0 0 4px", listStyle: "none" }}
                >
                  {DESCRIPTIFS[config.gamme].map((item, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 11.5,
                        color: T.muted,
                        lineHeight: 1.65,
                        paddingBottom:
                          i < DESCRIPTIFS[config.gamme].length - 1 ? 8 : 0,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: T.gold,
                          fontWeight: 700,
                          fontSize: 10,
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      >
                        ▸
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div
                  style={{
                    marginTop: 14,
                    padding: "7px 12px",
                    borderRadius: 8,
                    background: config.gamme === "ELITE" ? T.goldF : T.s2,
                    border: `1px solid ${config.gamme === "ELITE" ? T.gold : T.border}`,
                    fontSize: 11,
                    color: config.gamme === "ELITE" ? T.goldD : T.muted,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  {config.gamme === "ELITE"
                    ? "✓ Certifié Anti-effraction Grade 5 — NF D 27404"
                    : "✓ Conforme NF D 27404"}
                </div>
              </Accordion>
            </div>

            {/* 03 — MODÈLE ────────────────────────────────────────────── */}
            <div className="aside-section aside-modele">
              <SectionLabel number="03" label="Modèle" />
              <div
                style={{
                  padding: "0 20px 18px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {gamme.models.map((m) => (
                  <ModelCard
                    key={m}
                    model={m}
                    dim={DIMS[m]}
                    active={config.modele === m}
                    onClick={() => handleModele(m)}
                  />
                ))}
              </div>
            </div>

            {/* 04 — COULEURS ──────────────────────────────────────────── */}
            <div className="aside-section aside-couleurs">
              <SectionLabel number="04" label="Couleurs" />
              <div style={{ padding: "0 20px 18px" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {zones.map((z) => (
                    <ZoneTab
                      key={z.id}
                      zone={z}
                      active={activeZone === z.id}
                      onClick={() => setActiveZone(z.id)}
                    />
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      background: az.color,
                      border: "1.5px solid rgba(0,0,0,0.12)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: T.muted }}>
                    {ralLabel(az.color)}
                  </span>
                </div>
                <div className="ral-grid">
                  {RAL_COLORS.map((ral) => (
                    <ColorSwatch
                      key={ral.code}
                      ral={ral}
                      selected={
                        az.color.toLowerCase() === ral.hex.toLowerCase()
                      }
                      onClick={() => az.set(ral.hex)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 05 — CLIENT ────────────────────────────────────────────── */}
            <div className="aside-section aside-client">
              <SectionLabel number="05" label="Client" />
              <div
                style={{
                  padding: "0 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <Field
                    label="Prénom"
                    value={client.prenom}
                    onChange={(v) => setClient((p) => ({ ...p, prenom: v }))}
                  />
                  <Field
                    label="Nom"
                    value={client.nom}
                    onChange={(v) => setClient((p) => ({ ...p, nom: v }))}
                  />
                </div>
                <Field
                  label="Email"
                  type="email"
                  value={client.email}
                  onChange={(v) => setClient((p) => ({ ...p, email: v }))}
                />
                <Field
                  label="Société"
                  value={client.societe}
                  onChange={(v) => setClient((p) => ({ ...p, societe: v }))}
                />
                <Field
                  label="Adresse de livraison"
                  value={client.adresseLivraison}
                  onChange={(v) =>
                    setClient((p) => ({ ...p, adresseLivraison: v }))
                  }
                  multiline
                />
              </div>
            </div>
          </div>
          {/* fin aside-wrapper */}

          {/* ── PANNEAU DROIT (SVG) ───────────────────────────────────── */}
          <main className="app-preview">
            {/* Zone SVG */}
            <div
              className="app-svg-zone"
              ref={previewRef}
              style={{ background: T.bg }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  backgroundImage: `radial-gradient(${T.border} 1px, transparent 1px)`,
                  backgroundSize: "28px 28px",
                  opacity: 0.8,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: "50%",
                  height: "50%",
                  borderRadius: "50%",
                  pointerEvents: "none",
                  background:
                    "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 16,
                  padding: "5px 13px",
                  borderRadius: 20,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  zIndex: 2,
                }}
              >
                <span style={{ color: T.gold, fontWeight: 700 }}>
                  {config.gamme}
                </span>
                <span style={{ color: T.dim }}>·</span>
                <span style={{ color: T.muted }}>Modèle {config.modele}</span>
              </div>
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: svgVisible ? 1 : 0,
                  transition: "opacity 0.2s ease",
                }}
              >
                <MailboxSVGViewer
                  key={svgKey}
                  gamme={config.gamme}
                  modele={config.modele}
                  couleurCoffre={config.couleurCoffre}
                  couleurCadre={config.couleurCadre}
                  couleurPortillon={config.couleurPortillon}
                />
              </div>
            </div>

            {/* Récap couleurs + dimensions — mobile uniquement */}
            <div
              className="recap-mobile"
              style={{
                background: T.surface,
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <div style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  {zones.map((z) => (
                    <div
                      key={z.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          background: z.color,
                          flexShrink: 0,
                          border: "1px solid rgba(0,0,0,0.12)",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: 8.5,
                            letterSpacing: "0.09em",
                            color: T.dim,
                            textTransform: "uppercase",
                            marginBottom: 1,
                          }}
                        >
                          {z.label}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: T.muted,
                            fontWeight: 500,
                          }}
                        >
                          {ralCode(z.color)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    background: T.s2,
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  {[
                    ["Hauteur", dim.h],
                    ["Largeur", dim.l],
                    ["Profondeur", dim.p],
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 8.5,
                          letterSpacing: "0.1em",
                          color: T.dim,
                          textTransform: "uppercase",
                          marginBottom: 3,
                        }}
                      >
                        {lbl}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          color: T.text,
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        {val}
                        <span
                          style={{ fontSize: 9, color: T.dim, marginLeft: 2 }}
                        >
                          mm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Barre du bas — PC uniquement */}
            <div
              className="app-bottom-bar"
              style={{
                flexShrink: 0,
                height: 74,
                background: T.surface,
                borderTop: `1px solid ${T.border}`,
                boxShadow: "0 -1px 4px rgba(0,0,0,0.05)",
                alignItems: "center",
                padding: "0 28px",
                gap: 22,
              }}
            >
              <div style={{ display: "flex", gap: 20, flex: 1 }}>
                {zones.map((z) => (
                  <div
                    key={z.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => setActiveZone(z.id)}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: z.color,
                        border: "1px solid rgba(0,0,0,0.12)",
                        flexShrink: 0,
                        boxShadow:
                          activeZone === z.id ? `0 0 0 2px ${T.gold}` : "none",
                        transition: "box-shadow 0.2s",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 8.5,
                          letterSpacing: "0.1em",
                          color: T.dim,
                          textTransform: "uppercase",
                          marginBottom: 1,
                        }}
                      >
                        {z.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: T.muted }}>
                        {ralCode(z.color)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "0 22px",
                  borderLeft: `1px solid ${T.border}`,
                  borderRight: `1px solid ${T.border}`,
                }}
              >
                {[
                  ["H", dim.h],
                  ["L", dim.l],
                  ["P", dim.p],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 8.5,
                        letterSpacing: "0.12em",
                        color: T.dim,
                        textTransform: "uppercase",
                      }}
                    >
                      {lbl}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: T.text,
                        fontWeight: 700,
                        marginTop: 2,
                      }}
                    >
                      {val}
                      <span
                        style={{ fontSize: 8, color: T.dim, marginLeft: 1 }}
                      >
                        mm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <ExportBtn exporting={exporting} onClick={handleExport} />
            </div>
          </main>
        </div>
        {/* fin app-main */}

        {/* Bouton export fixe — mobile uniquement */}
        <div
          className="app-export-fixed"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            background: T.surface,
            borderTop: `1px solid ${T.border}`,
            boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
            padding: "10px 16px 12px",
          }}
        >
          <ExportBtnFull exporting={exporting} onClick={handleExport} />
        </div>
      </div>
    </>
  );
}

// ─── Composants ───────────────────────────────────────────────────────────────

function SectionLabel({ number, label }) {
  return (
    <div
      style={{
        padding: "14px 20px 10px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 9.5,
          letterSpacing: "0.14em",
          color: T.gold,
          fontWeight: 700,
          minWidth: 18,
        }}
      >
        {number}
      </span>
      <div style={{ width: 1, height: 13, background: T.goldD }} />
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.16em",
          color: T.gold,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Accordion({ number, label, badge, open, onToggle, children }) {
  return (
    <div>
      <div
        onClick={onToggle}
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
          background: open ? T.goldF : "transparent",
          transition: "background 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: "0.14em",
              color: open ? T.gold : T.dim,
              fontWeight: 700,
              minWidth: 18,
            }}
          >
            {number}
          </span>
          <div
            style={{
              width: 1,
              height: 13,
              background: open ? T.goldD : T.border,
            }}
          />
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              color: open ? T.gold : T.muted,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
          {badge && (
            <span
              style={{
                fontSize: 8,
                letterSpacing: "0.13em",
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "2px 7px",
                borderRadius: 10,
                color: open ? T.goldD : T.dim,
                background: open ? T.goldF : T.s2,
                border: `1px solid ${open ? T.gold : T.border}`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            lineHeight: 1,
            color: open ? T.gold : T.dim,
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        >
          ▸
        </span>
      </div>
      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? 700 : 0,
          transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ padding: "2px 20px 18px" }}>{children}</div>
      </div>
    </div>
  );
}

function GammeCard({ gKey, g, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 12px",
        borderRadius: 8,
        border: `1.5px solid ${active ? T.gold : T.border}`,
        background: active ? T.goldF : T.s2,
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {active && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${T.goldD}, ${T.gold}, ${T.goldD})`,
          }}
        />
      )}
      <div
        style={{
          fontSize: 8.5,
          letterSpacing: "0.2em",
          color: active ? T.gold : T.dim,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {g.badge}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: active ? T.text : T.muted,
          marginBottom: 6,
          lineHeight: 1,
        }}
      >
        {gKey}
      </div>
      <div
        style={{
          fontSize: 9.5,
          color: active ? T.muted : T.dim,
          lineHeight: 1.5,
        }}
      >
        {g.desc}
      </div>
    </div>
  );
}

function ModelCard({ model, dim, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "11px 8px",
        borderRadius: 7,
        border: `1.5px solid ${active ? T.gold : T.border}`,
        background: active ? T.goldF : T.s2,
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: active ? T.gold : T.text,
          marginBottom: 5,
        }}
      >
        {model}
      </div>
      <div style={{ fontSize: 9, color: T.dim, lineHeight: 1.7 }}>
        {dim.h}h × {dim.l}l<br />
        <span style={{ fontSize: 8 }}>mm</span>
      </div>
    </div>
  );
}

function ZoneTab({ zone, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="zone-tab"
      style={{
        flex: 1,
        border: `1px solid ${active ? T.gold : T.border}`,
        borderRadius: 6,
        background: active ? T.goldF : T.s2,
        color: active ? T.gold : T.muted,
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: zone.color,
          display: "inline-block",
          flexShrink: 0,
          border: "1px solid rgba(0,0,0,0.14)",
        }}
      />
      {zone.label}
    </button>
  );
}

function ColorSwatch({ ral, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      title={`${ral.code} · ${ral.name}`}
      style={{
        width: "100%",
        aspectRatio: "1",
        borderRadius: 6,
        background: ral.hex,
        cursor: "pointer",
        border: selected ? `2.5px solid ${T.gold}` : "2.5px solid transparent",
        outline: selected
          ? `1.5px solid ${T.goldD}`
          : "1.5px solid transparent",
        transition: "transform 0.15s ease",
        transform: selected ? "scale(1.14)" : "scale(1)",
        position: "relative",
        zIndex: selected ? 2 : 1,
        boxShadow: "0 1px 4px rgba(0,0,0,0.11)",
      }}
    />
  );
}

function Field({ label, value, onChange, type = "text", multiline = false }) {
  const base = {
    width: "100%",
    boxSizing: "border-box",
    background: T.s2,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    color: T.text,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
    resize: "none",
  };
  return (
    <div>
      <div
        style={{
          fontSize: 8.5,
          letterSpacing: "0.13em",
          color: T.dim,
          textTransform: "uppercase",
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {multiline ? (
        <textarea
          value={value}
          rows={2}
          onChange={(e) => onChange(e.target.value)}
          className="field-inp field-area"
          style={base}
          onFocus={(e) => (e.target.style.borderColor = T.gold)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field-inp"
          style={base}
          onFocus={(e) => (e.target.style.borderColor = T.gold)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
      )}
    </div>
  );
}

function ExportBtn({ exporting, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={exporting}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "0 28px",
        height: 42,
        background: exporting ? T.s3 : hov ? T.goldL : T.gold,
        color: exporting ? T.dim : "#fff",
        border: "none",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: exporting ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
        fontFamily: "inherit",
        boxShadow: !exporting && hov ? `0 4px 16px ${T.goldG}` : "none",
      }}
    >
      {exporting ? "Génération…" : "Exporter PDF"}
    </button>
  );
}

function ExportBtnFull({ exporting, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={exporting}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "block",
        width: "100%",
        height: 50,
        borderRadius: 10,
        background: exporting ? T.s3 : hov ? T.goldL : T.gold,
        color: exporting ? T.dim : "#fff",
        border: "none",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        cursor: exporting ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        fontFamily: "inherit",
        boxShadow: !exporting ? `0 4px 18px ${T.goldG}` : "none",
      }}
    >
      {exporting ? "Génération en cours…" : "Exporter PDF"}
    </button>
  );
}
