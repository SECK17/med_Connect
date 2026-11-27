// Fenêtre de choix d'un médecin avec qui partager le dossier.
import { motion, AnimatePresence } from "motion/react";
import { Search, Share2, Plus, X, Loader2 } from "lucide-react";

export default function ModalePartage({ showModal, setShowModal, partageSearch, setPartageSearch, medecinsListe, partages, addPartage, partageLoading }) {
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Share2 size={15} className="text-blue-600" />
                <span className="text-[15px] font-bold text-gray-900">Partager mon dossier</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Rechercher un médecin…"
                  value={partageSearch}
                  onChange={e => setPartageSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {medecinsListe
                  .filter(m =>
                    (m.nom || "").toLowerCase().includes(partageSearch.toLowerCase()) ||
                    (m.specialite || "").toLowerCase().includes(partageSearch.toLowerCase())
                  )
                  .filter(m => !partages.some(p => String(p.medecin_id) === String(m.id)))
                  .map(m => (
                    <button
                      key={m.id}
                      onClick={() => addPartage(m.id)}
                      disabled={partageLoading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-[13px] flex items-center justify-center flex-shrink-0">
                        {(m.nom || "M")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-gray-900">Dr. {m.nom}</div>
                        <div className="text-[11px] text-blue-500">{m.specialite || "Généraliste"}{m.hopital ? ` · ${m.hopital}` : ""}</div>
                      </div>
                      {partageLoading
                        ? <Loader2 size={14} className="animate-spin text-gray-300 flex-shrink-0" />
                        : <Plus size={14} className="text-blue-400 flex-shrink-0" />
                      }
                    </button>
                  ))
                }
                {medecinsListe.filter(m =>
                  (m.nom || "").toLowerCase().includes(partageSearch.toLowerCase()) &&
                  !partages.some(p => String(p.medecin_id) === String(m.id))
                ).length === 0 && (
                  <p className="text-center text-[12px] text-gray-400 py-6">Aucun médecin trouvé</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
