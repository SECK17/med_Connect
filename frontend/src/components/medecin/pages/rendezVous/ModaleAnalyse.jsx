// Fenêtre « Nouvelle analyse ».
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, FileText, Upload } from "lucide-react";
import { INPUT } from "./constantes.js";

export default function ModaleAnalyse({ analyseModal, setAnalyseModal, analysePreview, analyseFile, onAnalyseFile, setShowAnalyseCam, setAnalyseFile, setAnalysePreview, analyseNotes, setAnalyseNotes, submitAnalyse, savingAnalyse }) {
  return (
    <AnimatePresence>
      {analyseModal && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40" onClick={() => setAnalyseModal(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <div className="text-[15px] font-bold text-gray-900">Résultat d'analyse</div>
                  <div className="text-[12px] text-gray-500">Pour : {analyseModal.patientNom}</div>
                </div>
                <button onClick={() => setAnalyseModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <label htmlFor="rdv-analyse-file"
                  className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  {analysePreview ? (
                    <img src={analysePreview} alt="aperçu" className="max-h-52 mx-auto rounded-lg object-contain" />
                  ) : analyseFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={40} className="text-purple-400" />
                      <div className="text-[13px] font-medium text-gray-700">{analyseFile.name}</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto">
                        <Upload size={22} className="text-purple-500" />
                      </div>
                      <div className="text-[13px] font-medium text-gray-700">Choisir un fichier</div>
                      <div className="text-[11px] text-gray-400">JPG, PNG ou PDF · Max 10 Mo</div>
                    </div>
                  )}
                </label>
                <input id="rdv-analyse-file" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onAnalyseFile} />
                {!analyseFile && (
                  <>
                    <p className="text-center text-[11px] text-gray-400">— ou —</p>
                    <button type="button"
                      onClick={() => setShowAnalyseCam(true)}
                      className="flex items-center justify-center gap-2 py-2.5 w-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[13px] font-semibold rounded-xl transition-colors"
                    >
                      <Camera size={14} /> Prendre une photo
                    </button>
                  </>
                )}
                {analyseFile && (
                  <button onClick={() => { setAnalyseFile(null); setAnalysePreview(null); }}
                    className="text-[12px] text-red-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <X size={11} /> Supprimer
                  </button>
                )}

                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Notes / Commentaires</label>
                  <textarea value={analyseNotes} onChange={e => setAnalyseNotes(e.target.value)}
                    placeholder="Interprétation, recommandations…"
                    rows={2} className={`${INPUT} resize-none`}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={submitAnalyse} disabled={savingAnalyse}
                  className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
                >
                  {savingAnalyse ? "Envoi…" : <><Upload size={14} /> Envoyer le résultat</>}
                </button>
                <button onClick={() => setAnalyseModal(null)}
                  className="px-5 h-10 border border-gray-200 text-gray-600 rounded-xl text-[13px] hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
