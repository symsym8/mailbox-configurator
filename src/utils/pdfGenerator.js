import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { findRALByHex } from "./colors";

const DIMENSIONS = {
  A1: { hauteur: 359, largeur: 424, profondeur: 365 },
  A2: { hauteur: 638, largeur: 424, profondeur: 365 },
  A3: { hauteur: 918, largeur: 424, profondeur: 365 },
  B2: { hauteur: 359, largeur: 732, profondeur: 365 },
  B4: { hauteur: 638, largeur: 732, profondeur: 365 },
  B6: { hauteur: 918, largeur: 732, profondeur: 365 },
};

const DESCRIPTIFS = {
  ELITE: [
    "Coffre acier 10/10 galvanisé assemblé monobloc avec chants droits",
    "Finition peinture époxy-polyester cuite au four",
    "Portillon galbé embouti en tôle d'acier galvanisé 15/10 avec fenêtre d'introduction du courrier avec chicane antivol, condamnation par dispositif renforcé",
    "Cadre ouvrant tube acier mécanosoudé avec verrouillage multipoints",
    "Tablettes et séparations intérieures en tôle d'acier galvanisé",
    "Anti-effraction grade 5 — NF D 27404",
  ],
  DISCRETION: [
    "Coffre acier 10/10 galvanisé assemblé monobloc avec chants droits",
    "Finition peinture époxy-polyester cuite au four",
    "Portillon plat 12/10 avec fenêtre d'introduction du courrier avec chicane antivol, condamnation par came",
    "Cadre ouvrant tube acier mécanosoudé avec verrouillage multipoints",
    "Tablettes et séparations intérieures en tôle d'acier galvanisé",
    "NF D 27404",
  ],
};

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 128, g: 128, b: 128 };
}

// Capture la div de prévisualisation avec html2canvas
async function capturePreview(element) {
  if (!element) return null;
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// Charge le logo comme data URL
async function loadLogoDataUrl() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      resolve({
        dataUrl: c.toDataURL("image/png"),
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
    };
    img.onerror = () => resolve(null);
    img.src = "/logo.png";
  });
}

// En-tête bleu commun aux deux pages
function drawHeader(pdf, logoInfo, subtitle, pageWidth, margin) {
  pdf.setFillColor(29, 78, 216);
  pdf.rect(0, 0, pageWidth, 38, "F");

  if (logoInfo) {
    const logoH = 22;
    const logoW = (logoInfo.w / logoInfo.h) * logoH;
    pdf.addImage(logoInfo.dataUrl, "PNG", margin, 8, logoW, logoH);
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(15);
  pdf.setFont("helvetica", "bold");
  pdf.text("Configurateur BAL — CTS", pageWidth - margin, 17, {
    align: "right",
  });
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(subtitle, pageWidth - margin, 28, { align: "right" });
}

// Pied de page
function drawFooter(pdf, pageLabel, pageWidth, pageHeight, margin) {
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.3);
  pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("CTS — Configurateur de Boîtes aux Lettres", margin, pageHeight - 7);
  pdf.text(pageLabel, pageWidth - margin, pageHeight - 7, { align: "right" });
}

// Bandeau de section (fond gris clair + titre bleu)
function drawSection(pdf, label, y, margin, contentWidth) {
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "F");
  pdf.setTextColor(29, 78, 216);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(label, margin + 4, y + 5.5);
  return y + 12;
}

// ─── Export PDF principal ──────────────────────────────────────────────────
export async function generatePDF(previewElement, config, clientInfo) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - 2 * margin;

  const [logoInfo, previewDataUrl] = await Promise.all([
    loadLogoDataUrl(),
    capturePreview(previewElement),
  ]);

  const dims = DIMENSIONS[config.modele];
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ═══════════════════════════════════════════
  //  PAGE 1 — Récapitulatif
  // ═══════════════════════════════════════════
  drawHeader(
    pdf,
    logoInfo,
    `Gamme ${config.gamme} — Modèle ${config.modele}`,
    pageWidth,
    margin,
  );

  let y = 46;

  // Date
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Configuration générée le ${dateStr}`, pageWidth - margin, y, {
    align: "right",
  });
  y += 10;

  // ── Informations client
  y = drawSection(pdf, "INFORMATIONS CLIENT", y, margin, contentWidth);

  const clientRows = [
    ["Nom & Prénom", `${clientInfo.prenom} ${clientInfo.nom}`],
    ["Email", clientInfo.email],
    ["Société", clientInfo.societe],
    ["Adresse de livraison", clientInfo.adresseLivraison],
  ];

  clientRows.forEach(([label, val]) => {
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.text(label + " :", margin + 2, y);
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(9.5);
    pdf.setFont("helvetica", "bold");
    const lines = pdf.splitTextToSize(val || "—", contentWidth - 52);
    pdf.text(lines, margin + 50, y);
    y += Math.max(lines.length * 5.5, 6);
  });

  y += 5;

  // ── Configuration choisie
  y = drawSection(pdf, "CONFIGURATION CHOISIE", y, margin, contentWidth);

  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.text("Gamme :", margin + 2, y);
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(config.gamme, margin + 50, y);

  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.text("Modèle :", margin + 90, y);
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(config.modele, margin + 140, y);
  y += 10;

  // Couleurs RAL
  [
    ["Coffre", config.couleurCoffre],
    ["Cadre", config.couleurCadre],
    ["Portillon", config.couleurPortillon],
  ].forEach(([label, hex]) => {
    const { r, g, b } = hexToRgb(hex);
    const ralInfo = findRALByHex(hex);
    const ralLabel = ralInfo ? `${ralInfo.name} — ${ralInfo.code}` : hex;

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.text(label + " :", margin + 2, y + 4);

    // Carré de couleur
    pdf.setFillColor(r, g, b);
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin + 50, y, 8, 6, 1, 1, "FD");

    // Nom + code RAL
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(ralLabel, margin + 62, y + 4.5);

    y += 9;
  });

  y += 5;

  // ── Dimensions
  y = drawSection(pdf, "DIMENSIONS", y, margin, contentWidth);

  [
    ["Hauteur", `${dims.hauteur} mm`],
    ["Largeur", `${dims.largeur} mm`],
    ["Profondeur", `${dims.profondeur} mm`],
  ].forEach(([label, val], i) => {
    const x = margin + i * (contentWidth / 3);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x + 2, y, contentWidth / 3 - 6, 16, 2, 2, "FD");
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(label, x + (contentWidth / 3 - 6) / 2 + 2, y + 5.5, {
      align: "center",
    });
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(val, x + (contentWidth / 3 - 6) / 2 + 2, y + 12.5, {
      align: "center",
    });
  });

  y += 22;

  // ── Aperçu visuel (capture html2canvas)
  if (previewDataUrl) {
    y = drawSection(pdf, "APERÇU VISUEL", y, margin, contentWidth);

    const ratio = previewElement
      ? previewElement.offsetWidth / previewElement.offsetHeight
      : 1.2;
    // Utilise toute la hauteur disponible pour l'aperçu
    const availH = pageHeight - y - margin - 14;
    const imgH = Math.min(availH, ratio < 1 ? 160 : 110);
    const imgW = Math.min(imgH * ratio, contentWidth - 4);
    const imgX = margin + (contentWidth - imgW) / 2;

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y - 2, contentWidth, imgH + 10, 3, 3, "FD");
    pdf.addImage(previewDataUrl, "PNG", imgX, y + 3, imgW, imgH);
  }

  drawFooter(pdf, "Page 1 / 2", pageWidth, pageHeight, margin);

  // ═══════════════════════════════════════════
  //  PAGE 2 — Descriptif technique
  // ═══════════════════════════════════════════
  pdf.addPage();
  drawHeader(pdf, logoInfo, "Descriptif Technique", pageWidth, margin);

  y = 48;

  // Badge gamme
  pdf.setFillColor(29, 78, 216);
  pdf.roundedRect(margin, y, 36, 10, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(config.gamme, margin + 18, y + 7, { align: "center" });
  y += 16;

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Descriptif technique — Gamme ${config.gamme}`, margin, y);
  y += 5;

  pdf.setDrawColor(29, 78, 216);
  pdf.setLineWidth(0.6);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Points du descriptif
  DESCRIPTIFS[config.gamme].forEach((item) => {
    pdf.setFillColor(29, 78, 216);
    pdf.circle(margin + 2.5, y - 0.5, 1.8, "F");
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(9.5);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(item, contentWidth - 12);
    pdf.text(lines, margin + 9, y);
    y += lines.length * 5.5 + 4;
  });

  // Badge certification ELITE
  if (config.gamme === "ELITE") {
    y += 8;
    pdf.setFillColor(5, 150, 105);
    pdf.roundedRect(margin, y, contentWidth, 14, 2.5, 2.5, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      "Certifié Anti-effraction Grade 5 — NF D 27404",
      pageWidth / 2,
      y + 9,
      { align: "center" },
    );
    y += 20;
  }

  if (config.gamme === "DISCRETION") {
    y += 8;
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, 14, 2.5, 2.5, "FD");
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Conforme NF D 27404", pageWidth / 2, y + 9, { align: "center" });
    y += 20;
  }

  // Ligne de pied récap
  y += 6;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Client : ${clientInfo.prenom} ${clientInfo.nom} — ${clientInfo.societe}`,
    margin,
    y,
  );
  pdf.text(
    `${config.gamme} ${config.modele} — ${dateStr}`,
    pageWidth - margin,
    y,
    { align: "right" },
  );

  drawFooter(pdf, "Page 2 / 2", pageWidth, pageHeight, margin);

  // Sauvegarde
  const safeNom = (clientInfo.nom || "client").replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save(`CTS_BAL_${config.gamme}_${config.modele}_${safeNom}.pdf`);
}
