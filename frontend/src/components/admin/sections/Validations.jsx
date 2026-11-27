// Section « Validations » : médecins en attente de vérification.
import { motion } from "motion/react";
import { Stethoscope, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function Validations({ stats, pendingList, handleValidate, setRejectModal }) {
  return (
    <motion.div key="validations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight">Validations médecins</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Comptes en attente de vérification</p>
        </div>
        {stats.pendingMedecins > 0 && (
          <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 text-amber-800 text-[13px] font-semibold px-4 py-2 rounded-xl">
            <Clock size={14} />
            {stats.pendingMedecins} en attente
          </div>
        )}
      </div>

      {pendingList.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white border border-gray-200 rounded-2xl py-20 text-center"
        >
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <p className="text-[15px] font-semibold text-gray-700">Tout est à jour</p>
          <p className="text-[13px] text-gray-400 mt-1">Aucun compte médecin en attente de validation</p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingList.map((u, i) => (
            <motion.div key={u.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border-2 border-amber-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-amber-100 transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-extrabold text-[16px] flex-shrink-0">
                  {(u.nom || "M").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-gray-900">{u.nom}</div>
                  <div className="text-[12px] text-gray-500 truncate">{u.email}</div>
                  {u.specialite && (
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <Stethoscope size={10} /> {u.specialite}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0">
                  <Clock size={9} /> En attente
                </div>
              </div>

              <div className="text-[11px] text-gray-400 mb-4">
                Inscrit le {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleValidate(u.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition-colors shadow-md shadow-emerald-200"
                >
                  <CheckCircle2 size={14} /> Valider
                </button>
                <button onClick={() => setRejectModal(u)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[13px] font-bold rounded-xl transition-colors"
                >
                  <XCircle size={14} /> Rejeter
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
