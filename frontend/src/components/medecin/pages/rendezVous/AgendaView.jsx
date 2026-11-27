// Vue agenda : rendez-vous de la semaine sur une grille horaire.
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { STATUT_CFG } from "./constantes.js";

/* ── Composant Agenda Visuel ─────────────────────────────────────────── */
const HEURES = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
                "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

const STATUT_COLOR = {
  confirme:   "bg-emerald-500 text-white border-emerald-600",
  transfere:  "bg-blue-500 text-white border-blue-600",
  en_attente: "bg-amber-400 text-white border-amber-500",
  annule:     "bg-red-400 text-white border-red-500",
};

export function AgendaView({ rdvs, weekOffset, setWeekOffset }) {
  const [detail, setDetail] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lundi de la semaine courante + offset
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const isToday = (d) => d.toDateString() === new Date().toDateString();

  // Utilise les composantes locales pour éviter le décalage UTC
  const isoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Normalise "08h00" → "08:00" et "08:00" → "08:00"
  const normalizeH = (h) => (h || "").replace("h", ":").slice(0, 5);

  const rdvsByDay = (day) =>
    rdvs.filter(r => r.date_rdv?.split("T")[0] === isoDate(day) && r.statut !== "annule")
        .sort((a, b) => normalizeH(a.heure).localeCompare(normalizeH(b.heure)));

  const weekLabel = `Semaine du ${days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au ${days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-bold text-gray-900">{weekLabel}</div>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[11px] text-blue-600 hover:underline">
              Revenir à cette semaine
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Grille */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* En-têtes jours */}
          <div className="grid grid-cols-8 border-b border-gray-100">
            <div className="py-3 px-2 text-[10px] text-gray-400 font-semibold text-center" />
            {days.map((d, i) => (
              <div key={i} className={`py-3 px-2 text-center border-l border-gray-100 ${isToday(d) ? "bg-blue-50" : ""}`}>
                <div className={`text-[11px] font-semibold uppercase ${isToday(d) ? "text-blue-600" : "text-gray-400"}`}>
                  {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div className={`text-[18px] font-extrabold leading-none mt-0.5 ${isToday(d) ? "text-blue-700" : "text-gray-800"}`}>
                  {d.getDate()}
                </div>
                {rdvsByDay(d).length > 0 && (
                  <div className="mt-1">
                    <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                      {rdvsByDay(d).length}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Lignes horaires */}
          {HEURES.map((heure) => (
            <div key={heure} className="grid grid-cols-8 border-b border-gray-50 min-h-[44px]">
              <div className="py-2 px-2 text-[10px] text-gray-400 font-semibold text-right pr-3 flex-shrink-0 self-start pt-2.5">
                {heure}
              </div>
              {days.map((d, i) => {
                const rdvsIci = rdvsByDay(d).filter(r => normalizeH(r.heure) === heure);
                return (
                  <div key={i} className={`border-l border-gray-100 py-1 px-1 ${isToday(d) ? "bg-blue-50/30" : ""}`}>
                    {rdvsIci.map(r => {
                      const u = r.patient?.user || {};
                      const colorCls = STATUT_COLOR[r.statut] || STATUT_COLOR.en_attente;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setDetail(r)}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-semibold border truncate leading-tight ${colorCls} hover:opacity-90 transition-opacity`}
                        >
                          {u.nom || "Patient"}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal détail RDV */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40" onClick={() => setDetail(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[15px] font-bold text-gray-900">Détail du rendez-vous</div>
                  <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div><span className="text-gray-500">Patient :</span> <span className="font-semibold text-gray-900">{detail.patient?.user?.nom || "—"}</span></div>
                  <div><span className="text-gray-500">Date :</span> <span className="font-semibold">{detail.date_rdv ? new Date(detail.date_rdv).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "—"}</span></div>
                  <div><span className="text-gray-500">Heure :</span> <span className="font-semibold">{detail.heure || "—"}</span></div>
                  <div><span className="text-gray-500">Statut :</span> <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${STATUT_CFG[detail.statut]?.bg} ${STATUT_CFG[detail.statut]?.text}`}>{STATUT_CFG[detail.statut]?.label}</span></div>
                  {detail.motif && <div><span className="text-gray-500">Motif :</span> <span className="text-gray-700 italic">"{detail.motif}"</span></div>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
