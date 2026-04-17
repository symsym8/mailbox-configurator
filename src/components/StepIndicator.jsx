const STEPS = [
  { id: 1, label: 'Informations client', desc: 'Vos coordonnées' },
  { id: 2, label: 'Configuration', desc: 'Gamme, modèle & couleurs' },
  { id: 3, label: 'Aperçu & Export', desc: 'Visualisation & PDF' },
];

export default function StepIndicator({ currentStep, onStepClick, step }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-200 mx-12 z-0" />

        {STEPS.map((s, index) => {
          const isDone = currentStep > s.id;
          const isCurrent = currentStep === s.id;
          const canClick = s.id < currentStep || (s.id === 1);

          return (
            <div
              key={s.id}
              className="flex flex-col items-center gap-2 relative z-10 flex-1"
            >
              <button
                onClick={() => canClick && onStepClick(s.id)}
                disabled={!canClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2 ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                    : isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border-slate-300 text-slate-400 cursor-default'
                }`}
              >
                {isDone ? '✓' : s.id}
              </button>
              <div className="text-center">
                <p className={`text-xs font-semibold ${isCurrent ? 'text-blue-700' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {s.label}
                </p>
                <p className="text-xs text-slate-400 hidden sm:block">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
