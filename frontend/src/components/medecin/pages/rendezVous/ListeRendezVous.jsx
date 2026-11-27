// Vue liste : une carte par rendez-vous, avec les actions (dossier, ordonnance, analyse).
import { motion } from "motion/react";
import { Clock, FilePlus, FlaskConical, User } from "lucide-react";
import { STATUT_CFG } from "./constantes.js";

export default function ListeRendezVous({ filtered, today, setDossierModal, openPresc, openAnalyse }) {
  return (
    <>
      {filtered.map((r, i) => {
        const u   = r.patient?.user || {};
        const cfg = STATUT_CFG[r.statut] || STATUT_CFG.en_attente;
        const isToday = r.date_rdv?.split("T")[0] === today;
        return (
          <motion.div key={r.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={`bg-white border rounded-2xl p-4 hover:shadow-sm transition-all ${isToday ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200"}`}
          >
            <div className="flex items-start gap-3">
              {/* Bloc date */}
              <div className={`text-center px-3 py-2 rounded-xl min-w-[54px] flex-shrink-0 ${isToday ? "bg-emerald-600" : "bg-blue-600"}`}>
                <div className="text-[18px] font-extrabold text-white leading-none">
                  {r.date_rdv ? new Date(r.date_rdv).getDate() : "—"}
                </div>
                <div className="text-[9px] font-semibold text-white/80 uppercase mt-0.5">
                  {r.date_rdv ? new Date(r.date_rdv).toLocaleDateString("fr-FR", { month: "short" }) : ""}
                </div>
              </div>

              {/* Infos + Actions */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                {/* Infos */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-bold text-gray-900">{u.nom || "Patient inconnu"}</span>
                    {isToday && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Aujourd'hui</span>}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={9}/> {r.heure || "—"}</span>
                    {r.motif && <span className="truncate">· {r.motif}</span>}
                  </div>
                  {u.email && <div className="text-[11px] text-gray-400 mt-0.5">{u.email}</div>}
                </div>

                {/* Actions — full width on mobile, right-aligned on desktop */}
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setDossierModal(r)}
                    className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-semibold px-2.5 py-2 rounded-lg transition-colors flex-1 sm:flex-none"
                  >
                    <User size={11}/> Dossier
                  </button>
                  <button
                    onClick={() => openPresc(r)}
                    className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2.5 py-2 rounded-lg transition-colors flex-1 sm:flex-none"
                  >
                    <FilePlus size={11}/> Ordonnance
                  </button>
                  <button
                    onClick={() => openAnalyse(r)}
                    className="flex items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-semibold px-2.5 py-2 rounded-lg transition-colors flex-1 sm:flex-none"
                  >
                    <FlaskConical size={11}/> Analyse
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}
