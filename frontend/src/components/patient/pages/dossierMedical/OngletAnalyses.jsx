// Onglet « Analyses » : résultats d'analyses, aperçu, téléchargement.
import { motion } from "motion/react";
import { FileText, FlaskConical, Download, Printer, Eye } from "lucide-react";
import { fileUrl, isPdf, formatDate, handleDownload, handlePrint } from "../../../../utils/fichiers.js";

export default function OngletAnalyses({ loadingAnalyses, filteredAnalyses, setPreview }) {
  return (
    <motion.div key="lab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {loadingAnalyses && (
        <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
      )}
      {!loadingAnalyses && filteredAnalyses.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
          <FlaskConical size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500 font-medium">Aucune analyse pour l'instant</p>
          <p className="text-[12px] text-gray-400 mt-1">Vos résultats apparaîtront ici après votre consultation</p>
        </div>
      )}
      {!loadingAnalyses && filteredAnalyses.map(a => (
        <div key={a.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <FlaskConical size={16} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-gray-900">{a.doctorName}</div>
              <div className="text-[12px] text-gray-500">{formatDate(a.date)} · Résultat d'analyse</div>
            </div>
            <button
              onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
              className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0"
              title="Télécharger"
            >
              <Download size={13} />
            </button>
          </div>

          <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
            {isPdf(a.fichier) ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <FileText size={24} className="text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-800">Document PDF</div>
                  <div className="text-[11px] text-gray-500">Cliquez pour ouvrir</div>
                </div>
                <button onClick={() => window.open(fileUrl(a.fichier), "_blank")}
                  className="flex items-center gap-1 text-[12px] text-purple-600 hover:text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg"
                >
                  <Eye size={12} /> Ouvrir
                </button>
              </div>
            ) : (
              <div
                onClick={() => setPreview(fileUrl(a.fichier))}
                className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
              >
                <img
                  src={fileUrl(a.fichier)}
                  alt="analyse"
                  className="w-full max-h-72 object-contain bg-gray-50"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye size={28} className="text-white drop-shadow" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
                className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[12px] font-medium transition-colors"
              >
                <Download size={13} /> Télécharger
              </button>
              {!isPdf(a.fichier) && (
                <button onClick={() => handlePrint(a.fichier)}
                  className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[12px] font-medium transition-colors"
                >
                  <Printer size={13} /> Imprimer
                </button>
              )}
            </div>

            {a.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[12px] text-amber-800">
                Note du médecin : {a.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
