// Fenêtre de rejet d'une demande de changement d'hôpital (avec motif).
import { motion, AnimatePresence } from "motion/react";
import { Loader2, XCircle as XCircleIcon } from "lucide-react";

export default function ModaleRejetDemande({ rejetModal, setRejetModal, rejetMotif, setRejetMotif, rejeterDemande, actionLoading }) {
  return (
    <AnimatePresence>
      {rejetModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setRejetModal(null)}
        >
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircleIcon size={20} className="text-red-600" />
              </div>
              <div>
                <div className="font-bold text-gray-900">Rejeter la demande</div>
                <div className="text-[12px] text-gray-500">{rejetModal.medecin?.nom}</div>
              </div>
            </div>
            <div className="text-[13px] text-gray-600 mb-3">
              <span className="font-semibold">{rejetModal.hopital_actuel || "Non renseigné"}</span>
              {" → "}
              <span className="font-semibold text-violet-700">{rejetModal.hopital_demande}</span>
            </div>
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Motif du rejet (optionnel)</label>
              <textarea
                value={rejetMotif}
                onChange={e => setRejetMotif(e.target.value)}
                placeholder="Ex: Documents insuffisants, demande non justifiée…"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={rejeterDemande} disabled={actionLoading === rejetModal.id + "_rej"}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {actionLoading === rejetModal.id + "_rej"
                  ? <Loader2 size={13} className="animate-spin" />
                  : <XCircleIcon size={13} />}
                Confirmer le rejet
              </button>
              <button onClick={() => setRejetModal(null)} className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors">
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
