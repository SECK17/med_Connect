// Fenêtre « Dossier » : informations du patient et du rendez-vous.
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { InfoTile } from "./InfoTile.jsx";

export default function ModaleDossier({ dossierModal, setDossierModal }) {
  return (
    <AnimatePresence>
      {dossierModal && (() => {
        const u = dossierModal.patient?.user || {};
        const p = dossierModal.patient || {};
        const age = p.dateNaissance
          ? new Date().getFullYear() - new Date(p.dateNaissance).getFullYear()
          : null;
        return (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={() => setDossierModal(null)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 px-5 pt-5 pb-8 max-w-lg mx-auto"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[18px] font-bold text-blue-700">{(u.nom || "P")[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="text-[16px] font-bold text-gray-900">{u.nom || "Patient inconnu"}</div>
                  <div className="text-[12px] text-gray-400">{u.email || ""}</div>
                </div>
                <button onClick={() => setDossierModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoTile label="Groupe sanguin" value={p.groupeSanguin || "—"} highlight={!!p.groupeSanguin} />
                <InfoTile label="Âge" value={age ? `${age} ans` : "—"} />
                <InfoTile label="Téléphone" value={u.telephone || "—"} />
                <InfoTile label="Adresse" value={p.adresse || "—"} />
              </div>

              {p.groupeSanguin && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[12px] text-red-700 font-medium">
                  🩸 Groupe sanguin : <strong>{p.groupeSanguin}</strong>
                </div>
              )}
            </motion.div>
          </>
        );
      })()}
    </AnimatePresence>
  );
}
