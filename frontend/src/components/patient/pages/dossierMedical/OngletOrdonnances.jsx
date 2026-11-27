// Onglet « Ordonnances » : ordonnances reçues, détail des médicaments, téléchargement.
import { motion, AnimatePresence } from "motion/react";
import { FileText, Pill, Download, ChevronDown, ChevronUp, Printer, Image, Eye } from "lucide-react";
import { fileUrl, isPdf, formatDate, handleDownload, handlePrint } from "../../../../utils/fichiers.js";

export default function OngletOrdonnances({ loading, filteredPresc, setOpenPrescId, openPrescId, setPreview }) {
  return (
    <motion.div key="ord" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
      )}
      {!loading && filteredPresc.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
          <FileText size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500 font-medium">Aucune ordonnance pour l'instant</p>
          <p className="text-[12px] text-gray-400 mt-1">Vos ordonnances apparaîtront ici après votre consultation</p>
        </div>
      )}
      {!loading && filteredPresc.map(p => (
        <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            onClick={() => setOpenPrescId(openPrescId === p.id ? null : p.id)}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              {p.fichier ? <Image size={16} className="text-blue-600" /> : <FileText size={16} className="text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-gray-900">{p.doctorName}</div>
              <div className="text-[12px] text-gray-500">
                {formatDate(p.date)}
                {p.fichier ? " · Photo" : ` · ${p.drugs.length} médicament(s)`}
              </div>
            </div>
            {/* Action rapide download */}
            {p.fichier && (
              <button
                onClick={e => { e.stopPropagation(); handleDownload(p.fichier, `ordonnance-${p.id}`); }}
                className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"
                title="Télécharger"
              >
                <Download size={13} />
              </button>
            )}
            {openPrescId === p.id ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
          </button>

          <AnimatePresence>
            {openPrescId === p.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">

                  {/* Affichage photo */}
                  {p.fichier && (
                    <div className="space-y-2">
                      {isPdf(p.fichier) ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                          <FileText size={24} className="text-red-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-[13px] font-medium text-gray-800">Document PDF</div>
                            <div className="text-[11px] text-gray-500">Cliquez pour ouvrir</div>
                          </div>
                          <button onClick={() => window.open(fileUrl(p.fichier), "_blank")}
                            className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg"
                          >
                            <Eye size={12} /> Ouvrir
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setPreview(fileUrl(p.fichier))}
                          className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                        >
                          <img
                            src={fileUrl(p.fichier)}
                            alt="ordonnance"
                            className="w-full max-h-72 object-contain bg-gray-50"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye size={28} className="text-white drop-shadow" />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(p.fichier, `ordonnance-${p.id}`)}
                          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-medium transition-colors"
                        >
                          <Download size={13} /> Télécharger
                        </button>
                        {!isPdf(p.fichier) && (
                          <button onClick={() => handlePrint(p.fichier)}
                            className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[12px] font-medium transition-colors"
                          >
                            <Printer size={13} /> Imprimer
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Médicaments texte (si pas de photo) */}
                  {!p.fichier && p.drugs.length > 0 && (
                    <div className="space-y-2">
                      {p.drugs.map((d, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                          <Pill size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-[13px] font-medium text-gray-900">{d.name}</div>
                            <div className="text-[12px] text-gray-500">{d.dosage}{d.duration ? ` · ${d.duration}` : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {p.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[12px] text-amber-800">
                      Note : {p.notes}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}
