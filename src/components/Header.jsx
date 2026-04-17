export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-5">
        <img
          src="/logo.png"
          alt="CTS"
          className="h-12 object-contain"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">
            Configurateur de Boîtes aux Lettres
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Personnalisez votre BAL et exportez votre devis en PDF
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Configurateur en ligne
        </div>
      </div>
    </header>
  );
}
