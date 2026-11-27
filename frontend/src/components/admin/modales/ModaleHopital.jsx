// Fenêtre de création ou de modification d'un hôpital.
import { motion, AnimatePresence } from "motion/react";
import { Building2, Plus, X, Loader2, CheckCircle } from "lucide-react";

export default function ModaleHopital({ hopitalModal, setHopitalModal, hopitalForm, setHopitalForm, saveHopital, savingHop }) {
  return (
    <AnimatePresence>
      {hopitalModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setHopitalModal(null)}
        >
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={15} className="text-indigo-500" />
                {hopitalModal.mode === "create" ? "Ajouter un hôpital" : "Modifier l'hôpital"}
              </span>
              <button onClick={() => setHopitalModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: "nom",       label: "Nom *",      placeholder: "Ex : Hôpital Principal de Dakar" },
                { key: "ville",     label: "Ville *",    placeholder: "Ex : Dakar" },
                { key: "telephone", label: "Téléphone",  placeholder: "Ex : 33 000 00 00" },
                { key: "adresse",   label: "Adresse",    placeholder: "Ex : Avenue Cheikh Anta Diop" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                  <input
                    value={hopitalForm[key]}
                    onChange={e => setHopitalForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {["Hôpital", "Clinique", "CHU", "Centre"].map(t => (
                    <button key={t} onClick={() => setHopitalForm(f => ({ ...f, type: t }))}
                      className={`py-2 rounded-lg text-[12px] font-semibold border transition-all ${hopitalForm.type === t ? "bg-indigo-950 text-white border-indigo-950" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <button onClick={saveHopital} disabled={savingHop || !hopitalForm.nom || !hopitalForm.ville}
                className="w-full h-11 bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-1"
              >
                {savingHop ? <Loader2 size={16} className="animate-spin" /> : hopitalModal.mode === "create" ? <><Plus size={14} /> Créer l'hôpital</> : <><CheckCircle size={14} /> Enregistrer</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
