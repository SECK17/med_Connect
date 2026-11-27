// Petite case « libellé / valeur » du dossier d'un rendez-vous.

export function InfoTile({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className={`text-[14px] font-bold ${highlight ? "text-red-600" : "text-gray-800"}`}>{value}</div>
    </div>
  );
}
