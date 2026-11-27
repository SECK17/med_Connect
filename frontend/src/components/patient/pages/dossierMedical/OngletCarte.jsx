// Onglet « Carte médicale » : groupe sanguin, allergies, antécédents, traitements.
import { motion } from "motion/react";
import { Pill, Download, Heart, Shield, Droplets, Activity } from "lucide-react";

export default function OngletCarte({ nom, downloadCarte, groupe, allergies, antecedents, medsEnCours }) {
  return (
    <motion.div key="carte" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

      {/* Hero + download */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={15} className="text-white/80" />
              <span className="text-[13px] font-semibold text-white/80">Carte médicale</span>
            </div>
            <div className="text-[20px] font-extrabold tracking-tight">{nom}</div>
            <div className="text-white/60 text-[11px] mt-0.5">Résumé de santé personnel</div>
          </div>
          <button
            onClick={downloadCarte}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            <Download size={13} /> Télécharger
          </button>
        </div>
      </div>

      {/* Groupe sanguin */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Droplets size={15} className="text-rose-500" />
          <span className="text-[13px] font-bold text-gray-800">Groupe sanguin</span>
        </div>
        <div className="flex items-end gap-3">
          <div className={`text-[36px] font-extrabold leading-none ${groupe !== "Non renseigné" ? "text-rose-600" : "text-gray-200"}`}>
            {groupe}
          </div>
          {groupe === "O-"  && <span className="text-[11px] bg-rose-100 text-rose-600 font-semibold px-2.5 py-0.5 rounded-full mb-1">Donneur universel</span>}
          {groupe === "AB+" && <span className="text-[11px] bg-rose-100 text-rose-600 font-semibold px-2.5 py-0.5 rounded-full mb-1">Receveur universel</span>}
        </div>
        {groupe === "Non renseigné" && (
          <p className="text-[11px] text-gray-400 mt-1">À compléter dans Mon profil → Informations médicales</p>
        )}
      </div>

      {/* Allergies */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={15} className="text-amber-500" />
          <span className="text-[13px] font-bold text-gray-800">Allergies connues</span>
        </div>
        {allergies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allergies.map((al, i) => (
              <span key={i} className="text-[12px] bg-amber-50 text-amber-700 border border-amber-200 font-medium px-3 py-1 rounded-full">{al}</span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-gray-400 italic">Aucune allergie renseignée</p>
        )}
      </div>

      {/* Antécédents */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={15} className="text-blue-500" />
          <span className="text-[13px] font-bold text-gray-800">Antécédents médicaux</span>
        </div>
        {antecedents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {antecedents.map((ant, i) => (
              <span key={i} className="text-[12px] bg-blue-50 text-blue-700 border border-blue-100 font-medium px-3 py-1 rounded-full">{ant}</span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-gray-400 italic">Aucun antécédent renseigné</p>
        )}
      </div>

      {/* Traitements en cours */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pill size={15} className="text-violet-500" />
            <span className="text-[13px] font-bold text-gray-800">Traitements en cours</span>
          </div>
          <span className="text-[10px] text-gray-400">Dernière ordonnance</span>
        </div>
        {medsEnCours.length > 0 ? (
          <div className="space-y-2">
            {medsEnCours.map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2.5">
                <Pill size={12} className="text-violet-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-gray-800">{m.name}</div>
                  {(m.dosage || m.duration) && (
                    <div className="text-[11px] text-gray-500">{m.dosage}{m.duration ? ` · ${m.duration}` : ""}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-gray-400 italic">Aucun traitement en cours</p>
        )}
      </div>

      {/* Lien profil */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
        <p className="text-[12px] text-blue-600">
          Complétez votre carte dans <strong>Mon profil → Informations médicales</strong>
        </p>
      </div>
    </motion.div>
  );
}
