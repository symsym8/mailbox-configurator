import { useRef, useState } from 'react';
import { findRALByHex } from '../utils/colors';
import { generatePDF } from '../utils/pdfGenerator';
import MailboxSVGViewer from './MailboxSVGViewer';

const DIMENSIONS = {
  A1: { hauteur: 359, largeur: 424, profondeur: 365 },
  A2: { hauteur: 638, largeur: 424, profondeur: 365 },
};

const DESCRIPTIFS = {
  ELITE: [
    'Coffre acier 10/10 galvanisé assemblé monobloc avec chants droits',
    'Finition peinture époxy-polyester cuite au four',
    "Portillon galbé embouti en tôle d'acier galvanisé 15/10 avec fenêtre d'introduction du courrier avec chicane antivol, condamnation par dispositif renforcé",
    'Cadre ouvrant tube acier mécanosoudé avec verrouillage multipoints',
    "Tablettes et séparations intérieures en tôle d'acier galvanisé",
    'Anti-effraction grade 5 — NF D 27404',
  ],
  DISCRETION: [
    'Coffre acier 10/10 galvanisé assemblé monobloc avec chants droits',
    'Finition peinture époxy-polyester cuite au four',
    "Portillon plat 12/10 avec fenêtre d'introduction du courrier avec chicane antivol, condamnation par came",
    'Cadre ouvrant tube acier mécanosoudé avec verrouillage multipoints',
    "Tablettes et séparations intérieures en tôle d'acier galvanisé",
    'NF D 27404',
  ],
};

export default function MailboxPreview({ config, clientInfo, onBack }) {
  const previewRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const { gamme, modele, couleurCoffre, couleurCadre, couleurPortillon } = config;
  const dims = DIMENSIONS[modele];

  const ralLabel = (hex) => {
    const ral = findRALByHex(hex);
    return ral ? `${ral.name} (${ral.code})` : hex;
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await generatePDF(previewRef.current, config, clientInfo);
    } catch (err) {
      console.error('Erreur export PDF :', err);
      alert('Une erreur est survenue lors de la génération du PDF.');
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6">

      {/* ── Carte aperçu ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">3</div>
            <div>
              <h2 className="text-xl font-bold text-white">Aperçu de votre configuration</h2>
              <p className="text-blue-200 text-sm mt-0.5">Rendu SVG en temps réel — couleurs mises à jour instantanément</p>
            </div>
          </div>
        </div>

        <div className="p-6">

          {/* Badges récap */}
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg">Gamme {gamme}</span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg">Modèle {modele}</span>
            {[
              { label: 'Coffre',    color: couleurCoffre    },
              { label: 'Cadre',     color: couleurCadre     },
              { label: 'Portillon', color: couleurPortillon },
            ].map(({ label, color }) => (
              <span key={label}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200">
                <span className="w-4 h-4 rounded border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: color }} />
                {label} : <span className="font-semibold">{ralLabel(color)}</span>
              </span>
            ))}
          </div>

          {/* ─── Zone de rendu SVG — pleine largeur, hauteur maximale ─── */}
          <div
            ref={previewRef}
            className="w-full bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center"
            style={{
              aspectRatio: modele === 'A2' ? '424/638' : '424/359',
              maxHeight: '85vh',
            }}
          >
            <MailboxSVGViewer
              gamme={gamme}
              modele={modele}
              couleurCoffre={couleurCoffre}
              couleurCadre={couleurCadre}
              couleurPortillon={couleurPortillon}
            />
          </div>

          {/* Dimensions */}
          <div className="mt-5 flex justify-center gap-10">
            {[
              ['Hauteur',    dims.hauteur],
              ['Largeur',    dims.largeur],
              ['Profondeur', dims.profondeur],
            ].map(([label, val]) => (
              <div key={label} className="text-center">
                <div className="text-xs text-slate-500 font-medium">{label}</div>
                <div className="text-base font-bold text-slate-800">{val} mm</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Descriptif technique ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">{gamme}</span>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Descriptif technique</h3>
        </div>
        <ul className="p-6 space-y-3">
          {DESCRIPTIFS[gamme].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        {gamme === 'ELITE' && (
          <div className="mx-6 mb-6 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold text-center">
            Certifié Anti-effraction Grade 5 — NF D 27404
          </div>
        )}
        {gamme === 'DISCRETION' && (
          <div className="mx-6 mb-6 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold text-center">
            Conforme NF D 27404
          </div>
        )}
      </div>

      {/* ── Récap client ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Informations client</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            ['Nom & Prénom', `${clientInfo.prenom} ${clientInfo.nom}`],
            ['Email',        clientInfo.email],
            ['Société',      clientInfo.societe],
          ].map(([label, val]) => (
            <div key={label}>
              <span className="text-slate-400">{label} : </span>
              <span className="text-slate-700 font-semibold">{val}</span>
            </div>
          ))}
          <div className="sm:col-span-2">
            <span className="text-slate-400">Adresse de livraison : </span>
            <span className="text-slate-700 font-semibold">{clientInfo.adresseLivraison}</span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-between items-center">
        <button onClick={onBack}
          className="px-6 py-3.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm">
          ← Modifier la configuration
        </button>
        <button onClick={handleExportPDF} disabled={exporting}
          className="px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm text-sm flex items-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
          {exporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter en PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
