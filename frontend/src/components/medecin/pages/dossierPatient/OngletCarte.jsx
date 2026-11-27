// Onglet « Carte médicale » : groupe sanguin, allergies, antécédents, traitements en cours.
import { motion } from "motion/react";
import { Pill, Heart, Shield, Droplets, Activity } from "lucide-react";

export default function OngletCarte({ patientProfil, ordonnances, selected }) {
  const grp  = patientProfil.groupeSanguin || "";
  const alls = patientProfil.allergies   || [];
  const ants = patientProfil.antecedents || [];
  const meds = (ordonnances[0]?.drugs || []).filter(d => d.name);
  return (
    <motion.div key="carte" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

      {/* En-tête */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 p-4 text-white shadow-md shadow-blue-200">
        <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[14px] font-extrabold">{selected?.nom}</div>
            <div className="text-white/60 text-[11px]">Carte médicale — lecture seule</div>
          </div>
        </div>
      </div>

      {/* Groupe sanguin */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Droplets size={13} className="text-rose-500" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Groupe sanguin</span>
        </div>
        <div className={`text-[28px] font-extrabold leading-none ${grp ? "text-rose-600" : "text-gray-200"}`}>
          {grp || "—"}
        </div>
        {grp === "O-"  && <span className="text-[10px] bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">Donneur universel</span>}
        {grp === "AB+" && <span className="text-[10px] bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">Receveur universel</span>}
      </div>

      {/* Allergies */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Shield size={13} className="text-amber-500" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Allergies connues</span>
        </div>
        {alls.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {alls.map((al, i) => (
              <span key={i} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full">{al}</span>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-gray-400 italic">Aucune allergie renseignée</p>
        )}
      </div>

      {/* Antécédents */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={13} className="text-blue-500" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Antécédents médicaux</span>
        </div>
        {ants.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ants.map((ant, i) => (
              <span key={i} className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 font-medium px-2.5 py-0.5 rounded-full">{ant}</span>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-gray-400 italic">Aucun antécédent renseigné</p>
        )}
      </div>

      {/* Traitements — tirés des ordonnances */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Pill size={13} className="text-violet-500" />
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Traitements en cours</span>
          </div>
          <span className="text-[10px] text-gray-400">Dernière ordonnance</span>
        </div>
        {meds.length > 0 ? (
          <div className="space-y-1.5">
            {meds.map((m, i) => (
              <div key={i} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-2">
                <Pill size={11} className="text-violet-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-gray-800">{m.name}</div>
                  {(m.dosage || m.duration) && (
                    <div className="text-[10px] text-gray-500">{m.dosage}{m.duration ? ` · ${m.duration}` : ""}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-gray-400 italic">Aucun traitement enregistré</p>
        )}
      </div>

    </motion.div>
  );
}
