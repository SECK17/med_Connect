// Onglet « Carnet de santé » : comptes-rendus de consultation et ajout d'un nouveau.
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, BookOpen, MapPin, ClipboardList, Save } from "lucide-react";
import { INPUT } from "./constantes.js";

export default function OngletCarnet({ showNewConsult, setShowNewConsult, setConsultForm, consultForm, submitConsult, savingConsult, loadingCarnet, consultations }) {
  return (
    <motion.div key="carnet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

      {/* Bouton nouveau compte-rendu */}
      {!showNewConsult && (
        <button
          onClick={() => setShowNewConsult(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} /> Nouveau compte-rendu
        </button>
      )}

      {/* Formulaire compte-rendu */}
      <AnimatePresence>
        {showNewConsult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={14} className="text-blue-600" />
                  <span className="text-[13px] font-bold text-blue-800">Nouveau compte-rendu</span>
                </div>
                <button
                  onClick={() => { setShowNewConsult(false); setConsultForm({ motif: "", diagnostic: "", traitement: "", notes: "" }); }}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide block mb-1">Motif de consultation</label>
                <input
                  value={consultForm.motif}
                  onChange={e => setConsultForm(f => ({ ...f, motif: e.target.value }))}
                  placeholder="Ex: Fièvre, douleurs abdominales…"
                  className={INPUT + " bg-white"}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide block mb-1">Diagnostic</label>
                <textarea
                  value={consultForm.diagnostic}
                  onChange={e => setConsultForm(f => ({ ...f, diagnostic: e.target.value }))}
                  placeholder="Résultat de l'examen clinique…"
                  rows={2}
                  className={INPUT + " bg-white resize-none"}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide block mb-1">Traitement prescrit</label>
                <textarea
                  value={consultForm.traitement}
                  onChange={e => setConsultForm(f => ({ ...f, traitement: e.target.value }))}
                  placeholder="Médicaments, posologie, durée…"
                  rows={2}
                  className={INPUT + " bg-white resize-none"}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide block mb-1">Notes supplémentaires</label>
                <textarea
                  value={consultForm.notes}
                  onChange={e => setConsultForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Prochaine visite, recommandations…"
                  rows={2}
                  className={INPUT + " bg-white resize-none"}
                />
              </div>

              <button
                onClick={submitConsult}
                disabled={savingConsult}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {savingConsult ? "Enregistrement…" : <><Save size={14} /> Enregistrer dans le carnet</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des consultations */}
      {loadingCarnet && (
        <div className="text-center py-8 text-[13px] text-slate-400">Chargement…</div>
      )}

      {!loadingCarnet && consultations.length === 0 && !showNewConsult && (
        <div className="text-center py-10">
          <BookOpen size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-[13px] text-slate-400">Aucune consultation enregistrée</p>
          <p className="text-[11px] text-slate-300 mt-1">Ajoutez un compte-rendu après chaque consultation</p>
        </div>
      )}

      {!loadingCarnet && consultations.map((c, idx) => {
        const dateAff = c.date
          ? new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : "—";
        return (
          <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={13} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-slate-800">{dateAff}</div>
                {c.hopital && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <MapPin size={9} /> {c.hopital}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-blue-400 bg-blue-100 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                #{consultations.length - idx}
              </span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {c.motif && (
                <div className="text-[12px] text-slate-600">
                  <span className="font-semibold text-slate-700">Motif : </span>{c.motif}
                </div>
              )}
              {c.diagnostic && (
                <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wide mb-0.5">Diagnostic</div>
                  <div className="text-[12px] text-gray-800">{c.diagnostic}</div>
                </div>
              )}
              {c.traitement && (
                <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mb-0.5">Traitement</div>
                  <div className="text-[12px] text-gray-800">{c.traitement}</div>
                </div>
              )}
              {c.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-800">
                  <span className="font-semibold">Note : </span>{c.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
