import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Building2, Mail, Phone, ShieldCheck, Droplets } from "lucide-react";

export default function AdminHopitalProfil() {
  const [profil,  setProfil]  = useState(null);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("token");
  const nom   = sessionStorage.getItem("nom") || "Admin";

  useEffect(() => {
    fetch("http://localhost:5000/api/admin-hopital/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setProfil(d); setLoading(false); });
  }, []);

  return (
    <div className="space-y-5 max-w-lg">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <User size={20} className="text-rose-500" /> Mon profil
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Vos informations d'administrateur hôpital</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>
      ) : (
        <>
          {/* Carte identité */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-br from-rose-600 to-red-500 px-6 pt-6 pb-10 relative">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="w-16 h-16 rounded-2xl bg-white/25 border border-white/30 flex items-center justify-center text-white text-[24px] font-extrabold">
                {nom.charAt(0).toUpperCase()}
              </div>
              <div className="mt-3">
                <div className="text-[18px] font-extrabold text-white">{nom}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck size={12} className="text-white/70" />
                  <span className="text-[12px] text-white/70 font-medium">Administrateur hôpital</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 -mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {profil?.user?.email && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <Mail size={13} className="text-rose-500" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Email</div>
                      <div className="text-[13px] font-semibold text-gray-800">{profil.user.email}</div>
                    </div>
                  </div>
                )}
                {profil?.user?.telephone && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <Phone size={13} className="text-rose-500" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Téléphone</div>
                      <div className="text-[13px] font-semibold text-gray-800">{profil.user.telephone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Hôpital assigné */}
          {(profil?.hopital_nom || profil?.hopital) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={14} className="text-rose-500" />
                <span className="text-[14px] font-bold text-gray-900">Hôpital assigné</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-rose-600" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-gray-900">{profil.hopital_nom || profil.hopital?.nom}</div>
                  {profil.hopital?.ville && (
                    <div className="text-[12px] text-gray-500 mt-0.5">{profil.hopital.ville}</div>
                  )}
                  {profil.hopital?.type && (
                    <span className="mt-1.5 inline-block text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full">
                      {profil.hopital.type}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Rôle */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Droplets size={20} className="text-rose-600" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-rose-800">Gestionnaire don de sang</div>
              <div className="text-[12px] text-rose-600 mt-0.5">
                Vous gérez les alertes de don de sang pour votre hôpital. Les donneurs compatibles reçoivent vos alertes.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
