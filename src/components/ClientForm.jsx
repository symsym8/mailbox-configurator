import { useState } from 'react';

const FIELDS = [
  { name: 'nom', label: 'Nom', type: 'text', placeholder: 'Dupont', col: 1 },
  { name: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Jean', col: 1 },
  { name: 'email', label: 'Adresse email', type: 'email', placeholder: 'jean.dupont@entreprise.com', col: 2 },
  { name: 'societe', label: 'Nom de la société', type: 'text', placeholder: 'Ma Société SAS', col: 2 },
  { name: 'adresseLivraison', label: 'Adresse de livraison', type: 'text', placeholder: '12 rue de la Paix, 75001 Paris', col: 'full' },
];

function validate(data) {
  const errors = {};
  FIELDS.forEach(f => {
    if (!data[f.name]?.trim()) {
      errors[f.name] = 'Ce champ est obligatoire';
    }
  });
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Adresse email invalide';
  }
  return errors;
}

export default function ClientForm({ clientInfo, onChange, onNext }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (name, value) => {
    const updated = { ...clientInfo, [name]: value };
    onChange(updated);
    if (touched[name]) {
      const newErrors = validate(updated);
      setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const errs = validate(clientInfo);
    setErrors(prev => ({ ...prev, [name]: errs[name] }));
  };

  const handleNext = () => {
    const allTouched = Object.fromEntries(FIELDS.map(f => [f.name, true]));
    setTouched(allTouched);
    const errs = validate(clientInfo);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Informations client</h2>
            <p className="text-blue-200 text-sm mt-0.5">Ces informations figureront sur votre devis PDF</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FIELDS.map(field => (
            <div
              key={field.name}
              className={field.col === 'full' ? 'md:col-span-2' : ''}
            >
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {field.label}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type={field.type}
                value={clientInfo[field.name] || ''}
                placeholder={field.placeholder}
                onChange={e => handleChange(field.name, e.target.value)}
                onBlur={() => handleBlur(field.name)}
                className={`w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 text-sm transition-all outline-none focus:ring-2 ${
                  errors[field.name] && touched[field.name]
                    ? 'border-red-400 focus:ring-red-100 bg-red-50'
                    : 'border-slate-200 focus:ring-blue-100 focus:border-blue-400 bg-slate-50 hover:border-slate-300'
                }`}
              />
              {errors[field.name] && touched[field.name] && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm text-sm flex items-center gap-2"
          >
            Étape suivante
            <span className="text-lg leading-none">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
