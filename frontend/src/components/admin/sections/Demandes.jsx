// Section « Demandes hôpital » : demandes de changement d'hôpital des médecins.
import { motion } from "motion/react";
import { Loader2, ArrowRightLeft, FileText, CheckCircle, XCircle as XCircleIcon } from "lucide-react";
import { API_URL } from "../../../config.js";
import { jetonActuel } from "../../../auth.js";

export default function Demandes({ setDemandeFilter, demandeFilter, loadingDemandes, demandes, validerDemande, actionLoading, setRejetModal, setRejetMotif }) {
  return (
    <motion.div key="demandes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-violet-500" /> Demandes de changement d'hôpital
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Validez ou rejetez les demandes des médecins</p>
        </div>
        {/* Filtres statut */}
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          {[
            { key: "en_attente", label: "En attente", color: "bg-amber-500" },
            { key: "validee",    label: "Validées",   color: "bg-emerald-500" },
            { key: "rejetee",    label: "Rejetées",   color: "bg-red-500" },
          ].map(({ key, label, color }) => (
            <button key={key} onClick={() => setDemandeFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                demandeFilter === key ? "bg-indigo-950 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${demandeFilter === key ? "bg-white" : color}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loadingDemandes ? (
        <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>
      ) : demandes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center">
          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowRightLeft size={26} className="text-violet-300" />
          </div>
          <p className="text-[15px] font-semibold text-gray-700">Aucune demande</p>
          <p className="text-[13px] text-gray-400 mt-1">
            {demandeFilter === "en_attente" ? "Pas de demande en attente pour l'instant." :
             demandeFilter === "validee"    ? "Aucune demande validée." :
             "Aucune demande rejetée."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {demandes.map((d, i) => (
            <motion.div key={d.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`bg-white border rounded-2xl p-5 ${
                d.statut === "en_attente" ? "border-amber-200 shadow-sm shadow-amber-50" :
                d.statut === "validee"    ? "border-emerald-200" : "border-red-100"
              }`}
            >
              <div className="flex items-start gap-4 flex-wrap">
                {/* Avatar médecin */}
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-extrabold text-[16px] flex-shrink-0">
                  {(d.medecin?.nom || "M").charAt(0).toUpperCase()}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[15px] font-bold text-gray-900">{d.medecin?.nom || "—"}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      d.statut === "en_attente" ? "bg-amber-100 text-amber-700" :
                      d.statut === "validee"    ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {d.statut === "en_attente" ? "En attente" : d.statut === "validee" ? "Validée" : "Rejetée"}
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-500 mb-2">{d.medecin?.email}</div>

                  {/* Flèche hôpital */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                      {d.hopital_actuel || "Non renseigné"}
                    </span>
                    <ArrowRightLeft size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[12px] bg-violet-100 text-violet-700 px-2.5 py-1 rounded-lg font-bold">
                      {d.hopital_demande}
                    </span>
                  </div>

                  {/* Justificatif */}
                  {d.justificatif && (
                    <a
                      href={`${API_URL}/uploads/demandes/${d.justificatif}`}
                      onClick={(e) => { e.preventDefault(); window.open(`${API_URL}/uploads/demandes/${d.justificatif}?token=${encodeURIComponent(jetonActuel())}`, "_blank", "noreferrer"); }}
                      target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline"
                    >
                      <FileText size={11} /> {d.justificatif}
                    </a>
                  )}

                  {/* Motif rejet */}
                  {d.statut === "rejetee" && d.motif_rejet && (
                    <div className="mt-2 text-[11px] text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                      Motif : {d.motif_rejet}
                    </div>
                  )}

                  <div className="text-[11px] text-gray-300 mt-1.5">
                    Soumise le {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>

                {/* Actions */}
                {d.statut === "en_attente" && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => validerDemande(d.id)}
                      disabled={actionLoading === d.id + "_val"}
                      className="flex items-center gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm shadow-emerald-200"
                    >
                      {actionLoading === d.id + "_val"
                        ? <Loader2 size={12} className="animate-spin" />
                        : <CheckCircle size={12} />}
                      Valider
                    </button>
                    <button
                      onClick={() => { setRejetModal(d); setRejetMotif(""); }}
                      className="flex items-center gap-1.5 h-9 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12px] font-bold rounded-xl transition-colors"
                    >
                      <XCircleIcon size={12} /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
