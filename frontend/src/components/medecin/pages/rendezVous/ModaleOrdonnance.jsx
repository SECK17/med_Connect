// Fenêtre « Nouvelle ordonnance ».
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, FileText, Upload, Plus, Trash2 } from "lucide-react";
import { INPUT } from "./constantes.js";

export default function ModaleOrdonnance({ prescModal, setPrescModal, setPrescMode, prescMode, prescPreview, prescFile, onPrescFile, setShowPrescCam, setPrescFile, setPrescPreview, addMed, meds, updateMed, removeMed, notes, setNotes, submitPhotoPresc, submitTextPresc, saving }) {
  return (
    <AnimatePresence>
      {prescModal && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40" onClick={() => setPrescModal(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <div className="text-[15px] font-bold text-gray-900">Nouvelle ordonnance</div>
                  <div className="text-[12px] text-gray-500">Pour : {prescModal.patientNom}</div>
                </div>
                <button onClick={() => setPrescModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              {/* Mode tabs */}
              <div className="flex border-b border-gray-100 px-6">
                {[["photo", Camera, "Photo"], ["texte", FileText, "Texte"]].map(([k, Icon, l]) => (
                  <button key={k} onClick={() => setPrescMode(k)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                      prescMode === k ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-700"
                    }`}
                  >
                    <Icon size={13} /> {l}
                  </button>
                ))}
              </div>

              {/* Corps */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {prescMode === "photo" ? (
                  <>
                    <label htmlFor="rdv-presc-file"
                      className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      {prescPreview ? (
                        <img src={prescPreview} alt="aperçu" className="max-h-52 mx-auto rounded-lg object-contain" />
                      ) : prescFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={40} className="text-blue-400" />
                          <div className="text-[13px] font-medium text-gray-700">{prescFile.name}</div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto">
                            <Upload size={22} className="text-blue-500" />
                          </div>
                          <div className="text-[13px] font-medium text-gray-700">Choisir un fichier</div>
                          <div className="text-[11px] text-gray-400">JPG, PNG ou PDF · Max 10 Mo</div>
                        </div>
                      )}
                    </label>
                    <input id="rdv-presc-file" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onPrescFile} />
                    {!prescFile && (
                      <>
                        <p className="text-center text-[11px] text-gray-400">— ou —</p>
                        <button type="button"
                          onClick={() => setShowPrescCam(true)}
                          className="flex items-center justify-center gap-2 py-2.5 w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[13px] font-semibold rounded-xl transition-colors"
                        >
                          <Camera size={14} /> Prendre une photo
                        </button>
                      </>
                    )}
                    {prescFile && (
                      <button onClick={() => { setPrescFile(null); setPrescPreview(null); }}
                        className="text-[12px] text-red-400 hover:text-red-600 flex items-center gap-1"
                      >
                        <X size={11} /> Supprimer
                      </button>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[13px] font-semibold text-gray-700">Médicaments *</label>
                      <button onClick={addMed}
                        className="flex items-center gap-1 text-[11px] text-blue-600 border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Plus size={11} /> Ajouter
                      </button>
                    </div>
                    <div className="space-y-2">
                      {meds.map((m, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input value={m.nom}    onChange={e => updateMed(i, "nom", e.target.value)}
                              placeholder="Médicament" className={INPUT} />
                            <input value={m.dosage} onChange={e => updateMed(i, "dosage", e.target.value)}
                              placeholder="Dosage" className={INPUT} />
                            <input value={m.duree}  onChange={e => updateMed(i, "duree", e.target.value)}
                              placeholder="Durée" className={INPUT} />
                          </div>
                          {meds.length > 1 && (
                            <button onClick={() => removeMed(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg mt-0.5">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Notes / Conseils</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Instructions particulières…"
                    rows={2} className={`${INPUT} resize-none`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={prescMode === "photo" ? submitPhotoPresc : submitTextPresc}
                  disabled={saving}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? "Envoi…" : <><Upload size={14} /> Envoyer l'ordonnance</>}
                </button>
                <button onClick={() => setPrescModal(null)}
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
