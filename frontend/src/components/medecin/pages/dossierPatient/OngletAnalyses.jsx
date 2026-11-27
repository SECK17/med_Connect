// Onglet « Analyses » du dossier patient : résultats, aperçu, envoi d'un résultat.
import { motion, AnimatePresence } from "motion/react";
import { FileText, FlaskConical, Download, Printer, Eye, Upload, Camera, X } from "lucide-react";
import { fileUrl, isPdf, formatDate, handleDownload, handlePrint } from "../../../../utils/fichiers.js";

export default function OngletAnalyses({ showUploadAna, setShowUploadAna, setAnaFile, setAnaPreview, anaPreview, anaFile, onAnaFile, setShowAnaCam, anaNotes, setAnaNotes, submitAna, savingAna, loadingAna, analyses, setPreview }) {
  return (
    <motion.div key="ana" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

      <AnimatePresence>
        {showUploadAna && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-purple-50 border border-purple-200 rounded-xl overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-purple-800">Nouveau résultat d'analyse</div>
                <button onClick={() => { setShowUploadAna(false); setAnaFile(null); setAnaPreview(null); }}
                  className="text-purple-400 hover:text-purple-600"><X size={14} /></button>
              </div>
              <label htmlFor="ana-file-input"
                className="block border-2 border-dashed border-purple-300 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-100 transition-colors"
              >
                {anaPreview ? (
                  <img src={anaPreview} alt="" className="max-h-36 mx-auto rounded-lg object-contain" />
                ) : anaFile ? (
                  <div className="flex items-center gap-2 justify-center text-[12px] text-purple-700">
                    <FileText size={16} /> {anaFile.name}
                  </div>
                ) : (
                  <div className="text-[12px] text-purple-500">
                    <Upload size={18} className="mx-auto mb-1 text-purple-400" />
                    Choisir un fichier
                  </div>
                )}
              </label>
              <input id="ana-file-input" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onAnaFile} />
              {!anaFile && (
                <>
                  <p className="text-center text-[10px] text-gray-400">— ou —</p>
                  <button type="button"
                    onClick={() => setShowAnaCam(true)}
                    className="flex items-center justify-center gap-1.5 py-2 w-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[12px] font-semibold rounded-lg transition-colors"
                  >
                    <Camera size={13} /> Prendre une photo
                  </button>
                </>
              )}
              <textarea value={anaNotes} onChange={e => setAnaNotes(e.target.value)}
                placeholder="Notes (optionnel)…" rows={2}
                className="w-full px-3 py-2 border border-purple-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-purple-400 resize-none"
              />
              <button onClick={submitAna} disabled={savingAna}
                className="w-full h-9 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {savingAna ? "Envoi…" : <><Upload size={13} /> Envoyer</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadingAna && <div className="text-center py-8 text-[13px] text-slate-400">Chargement…</div>}
      {!loadingAna && analyses.length === 0 && !showUploadAna && (
        <div className="text-center py-10">
          <FlaskConical size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-[13px] text-slate-400">Aucune analyse</p>
        </div>
      )}
      {!loadingAna && analyses.map(a => (
        <div key={a.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={14} className="text-purple-600" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-800">{formatDate(a.date)}</div>
                <div className="text-[11px] text-slate-500">Résultat d'analyse</div>
              </div>
            </div>
            <button onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
              className="w-7 h-7 rounded-lg bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-600"
            >
              <Download size={12} />
            </button>
          </div>

          {isPdf(a.fichier) ? (
            <button onClick={() => window.open(fileUrl(a.fichier), "_blank")}
              className="flex items-center gap-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-slate-700 hover:bg-gray-50"
            >
              <FileText size={14} className="text-red-500" /> Ouvrir le PDF
            </button>
          ) : (
            <div onClick={() => setPreview(fileUrl(a.fichier))}
              className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
            >
              <img src={fileUrl(a.fichier)} alt="" className="w-full max-h-56 object-contain bg-white" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye size={22} className="text-white drop-shadow" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-medium rounded-lg transition-colors"
            >
              <Download size={11} /> Télécharger
            </button>
            {!isPdf(a.fichier) && (
              <button onClick={() => handlePrint(a.fichier)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 text-[11px] font-medium rounded-lg transition-colors"
              >
                <Printer size={11} /> Imprimer
              </button>
            )}
          </div>

          {a.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-800">
              Note : {a.notes}
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}
