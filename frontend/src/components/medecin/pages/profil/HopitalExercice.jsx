// Section « Hôpital d'exercice » : hôpital actuel et demande de changement (avec justificatif).
import { motion, AnimatePresence } from "motion/react";
import { Building2, Upload, FileText, X, AlertTriangle } from "lucide-react";
import { HOPITAUX, INPUT_EDIT } from "./constantes.js";

export default function HopitalExercice({ hopitalPending, annulerDemandeHopital, edit, p, profile, set, showHopitalChange, setShowHopitalChange, setNewHopital, setHopitalFile, setHopitalFileName, newHopital, hopitalFileRef, hopitalFileName, onHopitalFile, submitHopitalChange, savingHopital, hopitalFile }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
        <Building2 size={14} className="text-blue-600" /> Hôpital d'exercice
      </div>

      {/* Demande en attente */}
      {hopitalPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
            <AlertTriangle size={14} className="text-amber-500" /> Demande en attente de validation
          </div>
          <div className="text-[12px] text-amber-700">
            Changement demandé vers : <strong>{hopitalPending.hopitalDemande}</strong>
          </div>
          <div className="text-[11px] text-amber-600">
            Justificatif : {hopitalPending.justificatif} · Soumis le {new Date(hopitalPending.date).toLocaleDateString("fr-FR")}
          </div>
          <button
            onClick={annulerDemandeHopital}
            className="text-[11px] text-red-500 hover:text-red-700 underline"
          >
            Annuler la demande
          </button>
        </motion.div>
      )}

      {/* Hôpital actuel */}
      <div>
        <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Hôpital / Clinique actuel</label>

        {/* Mode lecture ou édition sans hôpital défini */}
        {!edit && (
          <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
            <Building2 size={12} className="text-gray-400" /> {p.hopital || "—"}
          </div>
        )}

        {/* Mode édition — premier hôpital (pas encore défini) */}
        {edit && !profile.hopital && (
          <>
            <select value={p.hopital} onChange={e => set("hopital", e.target.value)} className={INPUT_EDIT}>
              <option value="">Choisir un hôpital</option>
              {HOPITAUX.map(h => <option key={h}>{h}</option>)}
            </select>
            <p className="text-[11px] text-gray-400 mt-1.5">Visible par les patients sur votre fiche.</p>
          </>
        )}

        {/* Mode édition — hôpital déjà défini → demande de changement */}
        {edit && profile.hopital && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <Building2 size={12} className="text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-[13px] text-gray-700">{profile.hopital}</span>
              {hopitalPending
                ? <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-medium flex-shrink-0">En attente</span>
                : <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Actuel</span>
              }
            </div>

            {!hopitalPending && !showHopitalChange && (
              <button
                onClick={() => setShowHopitalChange(true)}
                className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Demander un changement d'hôpital →
              </button>
            )}

            {/* Formulaire demande de changement */}
            <AnimatePresence>
              {showHopitalChange && !hopitalPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-blue-800">Demande de changement d'hôpital</span>
                      <button onClick={() => { setShowHopitalChange(false); setNewHopital(""); setHopitalFile(null); setHopitalFileName(""); }}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide block mb-1">Nouvel hôpital</label>
                      <select value={newHopital} onChange={e => setNewHopital(e.target.value)} className={INPUT_EDIT + " bg-white"}>
                        <option value="">Choisir…</option>
                        {HOPITAUX.filter(h => h !== profile.hopital).map(h => <option key={h}>{h}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide block mb-1">
                        Justificatif <span className="text-red-500">*</span>
                      </label>
                      <div
                        onClick={() => hopitalFileRef.current.click()}
                        className="border-2 border-dashed border-blue-200 rounded-xl p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-100 transition-colors"
                      >
                        {hopitalFileName ? (
                          <div className="flex items-center gap-2 justify-center text-[12px] text-blue-700">
                            <FileText size={14} /> {hopitalFileName}
                          </div>
                        ) : (
                          <div className="text-[12px] text-blue-500">
                            <Upload size={18} className="mx-auto mb-1 text-blue-400" />
                            Lettre d'affectation, contrat ou attestation
                          </div>
                        )}
                      </div>
                      <input ref={hopitalFileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={onHopitalFile} />
                    </div>

                    <button
                      onClick={submitHopitalChange}
                      disabled={savingHopital || !newHopital || !hopitalFile}
                      className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      {savingHopital ? "Envoi…" : <><Upload size={13} /> Soumettre la demande</>}
                    </button>
                    <p className="text-[10px] text-blue-500 text-center">
                      Le changement sera effectif après validation par l'administration.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
