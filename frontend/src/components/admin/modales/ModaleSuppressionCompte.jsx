// Fenêtre de confirmation de la suppression d'un compte.
import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";

export default function ModaleSuppressionCompte({ deleteModal, setDeleteModal, handleDelete }) {
  return (
    <AnimatePresence>
      {deleteModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDeleteModal(null)}
        >
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div className="font-bold text-gray-900">Supprimer cet utilisateur ?</div>
            </div>
            <p className="text-[13px] text-gray-500 mb-5">
              <span className="font-bold text-gray-800">{deleteModal.nom}</span> sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteModal.id)} className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-xl transition-colors">
                Supprimer
              </button>
              <button onClick={() => setDeleteModal(null)} className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors">
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
