import { RAL_COLORS, findRALByHex } from '../utils/colors';

const GAMMES = [
  { id: 'ELITE',      desc: 'Anti-effraction Grade 5', badge: 'Premium'  },
  { id: 'DISCRETION', desc: 'Design épuré',             badge: 'Classique' },
];

const MODELES = [
  {
    id: 'A1',
    hint: '1 boîte aux lettres',
    detail: '1 ligne — 1 colonne',
    hauteur: 359,
    largeur: 424,
    profondeur: 365,
    visual: [1],
  },
  {
    id: 'A2',
    hint: '2 boîtes aux lettres',
    detail: '2 lignes — 1 colonne',
    hauteur: 638,
    largeur: 424,
    profondeur: 365,
    visual: [1, 1],
  },
];

const COLOR_PARTS = [
  { key: 'couleurCoffre',    label: 'Coffre',    desc: 'Corps principal' },
  { key: 'couleurCadre',     label: 'Cadre',     desc: 'Encadrement'     },
  { key: 'couleurPortillon', label: 'Portillon', desc: 'Porte frontale'  },
];

// ─── Nuancier RAL ──────────────────────────────
function RalSwatch({ color, selected, onSelect }) {
  return (
    <button
      type="button"
      title={`${color.name} — ${color.code}`}
      onClick={() => onSelect(color.hex)}
      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
        selected
          ? 'border-blue-600 bg-blue-50 shadow-sm'
          : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
      }`}
    >
      {/* Pastille couleur */}
      <span
        className="w-9 h-9 rounded-lg border border-black/10 shadow-sm flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ backgroundColor: color.hex }}
      />
      {/* Code RAL */}
      <span className={`text-[10px] font-semibold leading-tight text-center ${
        selected ? 'text-blue-700' : 'text-slate-500'
      }`}>
        {color.code.replace('RAL ', '')}
      </span>
    </button>
  );
}

// ─── Sélecteur de couleur pour une partie ──────
function ColorSelector({ label, desc, value, onChange }) {
  const selected = RAL_COLORS.find(c => c.hex === value);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      {/* En-tête de la section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-slate-800 text-sm">{label}</div>
          <div className="text-xs text-slate-400">{desc}</div>
        </div>
        {/* Couleur sélectionnée */}
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg border border-black/10 shadow-sm"
            style={{ backgroundColor: value }}
          />
          <div className="text-right">
            <div className="text-xs font-bold text-slate-700">{selected?.code ?? '—'}</div>
            <div className="text-[10px] text-slate-400 font-mono">{value}</div>
          </div>
        </div>
      </div>

      {/* Grille de pastilles */}
      <div className="flex flex-wrap gap-1">
        {RAL_COLORS.map(color => (
          <RalSwatch
            key={color.hex}
            color={color}
            selected={color.hex === value}
            onSelect={onChange}
          />
        ))}
      </div>

      {/* Nom de la couleur sélectionnée */}
      {selected && (
        <p className="mt-3 text-xs text-slate-500 text-center">
          <span className="font-semibold text-slate-700">{selected.name}</span>
          {' '}— {selected.code}
        </p>
      )}
    </div>
  );
}

// ─── Composant principal ───────────────────────
export default function ConfiguratorStep({ config, onChange, onNext, onBack }) {
  const update = (key, value) => onChange({ ...config, [key]: value });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configuration</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              Choisissez votre gamme, modèle et vos couleurs RAL
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* ── Gamme ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Gamme
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMMES.map(g => (
              <button
                key={g.id}
                onClick={() => update('gamme', g.id)}
                className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                  config.gamme === g.id
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {config.gamme === g.id && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </span>
                )}
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${
                  config.gamme === g.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {g.badge}
                </span>
                <div className={`text-lg font-bold ${config.gamme === g.id ? 'text-blue-700' : 'text-slate-700'}`}>
                  {g.id}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Modèle ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Modèle
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODELES.map(m => (
              <button
                key={m.id}
                onClick={() => update('modele', m.id)}
                className={`relative p-5 rounded-xl border-2 text-left transition-all flex items-center gap-5 ${
                  config.modele === m.id
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {config.modele === m.id && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </span>
                )}

                {/* Représentation visuelle des BAL empilées */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {m.visual.map((_, i) => (
                    <div
                      key={i}
                      className={`w-10 h-6 rounded border-2 ${
                        config.modele === m.id
                          ? 'border-blue-400 bg-blue-200'
                          : 'border-slate-300 bg-slate-100'
                      }`}
                    />
                  ))}
                </div>

                {/* Texte */}
                <div>
                  <div className={`text-lg font-bold ${config.modele === m.id ? 'text-blue-700' : 'text-slate-700'}`}>
                    Modèle {m.id}
                  </div>
                  <div className="text-sm font-semibold text-slate-600 mt-0.5">{m.hint}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.detail}</div>
                  {/* Dimensions en 3 lignes lisibles */}
                  <div className="mt-2 space-y-0.5">
                    {[
                      ['Hauteur',    m.hauteur],
                      ['Largeur',    m.largeur],
                      ['Profondeur', m.profondeur],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${config.modele === m.id ? 'text-blue-500' : 'text-slate-400'}`}>
                          {label} :
                        </span>
                        <span className={`text-sm font-bold ${config.modele === m.id ? 'text-blue-700' : 'text-slate-700'}`}>
                          {val} mm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Couleurs RAL ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Couleurs RAL
          </h3>
          <div className="space-y-4">
            {COLOR_PARTS.map(({ key, label, desc }) => (
              <ColorSelector
                key={key}
                label={label}
                desc={desc}
                value={config[key]}
                onChange={val => update(key, val)}
              />
            ))}
          </div>

          {/* ── Récapitulatif couleurs en temps réel ── */}
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">
              Récapitulatif de vos couleurs
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {COLOR_PARTS.map(({ key, label }) => {
                const hex = config[key];
                const ral = findRALByHex(hex);
                return (
                  <div key={key}
                    className="flex items-center gap-3 flex-1 bg-white rounded-lg px-4 py-3 border border-blue-100 shadow-sm">
                    <span
                      className="w-9 h-9 rounded-lg border border-black/10 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div>
                      <div className="text-xs text-slate-500 font-medium">{label}</div>
                      <div className="text-sm font-bold text-slate-800">
                        {ral ? ral.name : hex}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {ral ? ral.code : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="px-8 pb-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
        >
          ← Retour
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm flex items-center gap-2"
        >
          Voir l'aperçu
          <span className="text-lg leading-none">→</span>
        </button>
      </div>
    </div>
  );
}
