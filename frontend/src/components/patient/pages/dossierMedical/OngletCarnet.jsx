// Onglet « Carnet de santé » : comptes-rendus de consultation.
import { motion } from "motion/react";
import { BookOpen, Stethoscope, MapPin, ClipboardList } from "lucide-react";

export default function OngletCarnet({ consultations, loadingCarnet }) {
  return (
    <motion.div key="carnet" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[16px] font-extrabold tracking-tight">Carnet de santé</div>
            <div className="text-white/60 text-[11px]">
              {consultations.length} consultation{consultations.length !== 1 ? "s" : ""} enregistrée{consultations.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {loadingCarnet && (
        <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
      )}

      {!loadingCarnet && consultations.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} className="text-blue-300" />
          </div>
          <p className="text-[13px] font-semibold text-gray-500">Carnet vide pour l'instant</p>
          <p className="text-[12px] text-gray-400 mt-1">Vos consultations apparaîtront ici après chaque visite</p>
        </div>
      )}

      {/* Timeline */}
      {!loadingCarnet && consultations.map((c, idx) => {
        const medecinNom = c.medecin?.user?.nom || "Médecin";
        const dateAff = c.date
          ? new Date(c.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : "—";
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* En-tête consultation */}
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={14} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900 capitalize">{dateAff}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                    <Stethoscope size={10} /> Dr. {medecinNom}
                  </span>
                  {c.hopital && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <MapPin size={9} /> {c.hopital}
                    </span>
                  )}
                </div>
              </div>
              {/* Numéro de visite */}
              <span className="text-[10px] font-bold text-blue-400 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                Visite #{consultations.length - idx}
              </span>
            </div>

            {/* Corps */}
            <div className="px-4 py-3 space-y-2.5">
              {c.motif && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Motif de consultation</div>
                  <div className="text-[13px] text-gray-700">{c.motif}</div>
                </div>
              )}
              {c.diagnostic && (
                <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wide mb-0.5">Diagnostic</div>
                  <div className="text-[13px] text-gray-800 font-medium">{c.diagnostic}</div>
                </div>
              )}
              {c.traitement && (
                <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mb-0.5">Traitement prescrit</div>
                  <div className="text-[13px] text-gray-800">{c.traitement}</div>
                </div>
              )}
              {c.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Notes du médecin</div>
                  <div className="text-[12px] text-amber-800">{c.notes}</div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
