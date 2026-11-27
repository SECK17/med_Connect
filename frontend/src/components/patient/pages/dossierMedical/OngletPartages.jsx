// Onglet « Partages » : médecins ayant accès au dossier, révocation.
import { motion } from "motion/react";
import { Stethoscope, MapPin, Share2, UserCheck, Trash2, Plus } from "lucide-react";

export default function OngletPartages({ partages, setShowModal, loadingPartages, revoquerPartage }) {
  return (
    <motion.div key="partages" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Share2 size={15} className="text-white/80" />
              <span className="text-[13px] font-semibold text-white/80">Partage de dossier</span>
            </div>
            <div className="text-[17px] font-extrabold tracking-tight">Accès médecins</div>
            <div className="text-white/60 text-[11px] mt-0.5">
              {partages.length} médecin{partages.length !== 1 ? "s ont" : " a"} accès à votre dossier
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
          >
            <Plus size={13} /> Partager
          </button>
        </div>
      </div>

      {/* Explication */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[12px] text-blue-700">
        Comme un carnet rouge que vous tendez à un nouveau médecin — il pourra voir votre carte médicale, carnet de santé et ordonnances.
      </div>

      {/* Liste des partages */}
      {loadingPartages && (
        <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
      )}

      {!loadingPartages && partages.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserCheck size={24} className="text-blue-300" />
          </div>
          <p className="text-[13px] font-semibold text-gray-500">Aucun partage actif</p>
          <p className="text-[12px] text-gray-400 mt-1">Cliquez sur "Partager" pour donner accès à un médecin</p>
        </div>
      )}

      {!loadingPartages && partages.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-200 rounded-xl flex items-center gap-4 px-4 py-3.5"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-[14px] flex items-center justify-center flex-shrink-0">
            {(p.medecin?.nom || "M")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-gray-900">Dr. {p.medecin?.nom || "—"}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {p.medecin?.profil_medecin?.specialite && (
                <span className="flex items-center gap-1 text-[11px] text-blue-600">
                  <Stethoscope size={9} /> {p.medecin.profil_medecin.specialite}
                </span>
              )}
              {p.medecin?.profil_medecin?.hopital && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <MapPin size={9} /> {p.medecin.profil_medecin.hopital}
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-300 mt-0.5">
              Depuis le {new Date(p.created_at).toLocaleDateString("fr-FR")}
            </div>
          </div>
          <button
            onClick={() => revoquerPartage(p.id)}
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 border border-red-100"
          >
            <Trash2 size={11} /> Révoquer
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
