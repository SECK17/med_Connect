import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Droplets, Bell, Heart, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { API_URL } from "../../../config.js";

const COMPATIBILITE = {
  "O-":  { donneA: ["O-","O+","A-","A+","B-","B+","AB-","AB+"], label: "Donneur universel" },
  "O+":  { donneA: ["O+","A+","B+","AB+"],                      label: "" },
  "A-":  { donneA: ["A-","A+","AB-","AB+"],                     label: "" },
  "A+":  { donneA: ["A+","AB+"],                                label: "" },
  "B-":  { donneA: ["B-","B+","AB-","AB+"],                     label: "" },
  "B+":  { donneA: ["B+","AB+"],                                label: "" },
  "AB-": { donneA: ["AB-","AB+"],                               label: "" },
  "AB+": { donneA: ["AB+"],                                     label: "Receveur universel" },
};

export default function DonneurAccueil() {
  const navigate = useNavigate();
  const [profil,  setProfil]  = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("token");
  const nom   = sessionStorage.getItem("nom") || "Donneur";

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/donneur/profil`,       { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/api/alertes-sang/donneur`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([pr, al]) => {
      setProfil(pr);
      setAlertes(al);
      setLoading(false);
    });
  }, []);

  const alertesActives = alertes.filter(a => a.statut === "active");
  const groupe = profil?.groupe_sanguin;
  const compat = groupe ? COMPATIBILITE[groupe] : null;

  return (
    <div className="space-y-5">

      {/* ── HERO ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-500 p-5 text-white shadow-lg shadow-red-200"
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-[11px] text-white/60 font-medium mb-1">Bonjour</p>
          <h1 className="text-[20px] font-extrabold tracking-tight mb-1">{nom}</h1>
          <p className="text-[12px] text-white/70">
            {groupe ? `Votre sang ${groupe} peut sauver des vies.` : "Complétez votre profil pour recevoir des alertes."}
          </p>
        </div>

        {groupe && (
          <div className="relative flex items-center gap-4 mt-4">
            <div className="bg-white/20 rounded-2xl px-4 py-2 border border-white/20 text-center">
              <div className="text-[22px] font-black">{groupe}</div>
              <div className="text-[9px] text-white/60 uppercase tracking-wide">Mon groupe</div>
            </div>
            {compat?.label && (
              <div className="bg-white/15 rounded-xl px-3 py-1.5 text-[11px] font-semibold border border-white/20">
                {compat.label}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Alertes actives",  val: loading ? "—" : alertesActives.length, color: "text-red-600",   bg: "bg-red-50 border-red-100"   },
          { label: "Total alertes",    val: loading ? "—" : alertes.length,         color: "text-gray-800",  bg: "bg-gray-50 border-gray-200"  },
          { label: "Statut",           val: "✓",                                   color: "text-green-700", bg: "bg-green-50 border-green-100" },
        ].map(s => (
          <div key={s.label} className={`border rounded-xl p-3 text-center ${s.bg}`}>
            <div className={`text-[22px] font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ALERTES URGENTES ── */}
      {alertesActives.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-red-600" />
            <span className="text-[13px] font-bold text-red-700">
              {alertesActives.length} alerte{alertesActives.length > 1 ? "s" : ""} compatible{alertesActives.length > 1 ? "s" : ""}
            </span>
          </div>
          {alertesActives.slice(0, 2).map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 mb-2 border border-red-100">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-[14px] font-black text-red-600">{a.groupe_sang}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-gray-900 truncate">{a.hopital_nom}</div>
                <div className="text-[11px] text-red-600 font-medium">{a.urgence}</div>
              </div>
              <Heart size={14} className="text-red-400 flex-shrink-0" />
            </div>
          ))}
          <button onClick={() => navigate("../don-sang")}
            className="w-full mt-1 flex items-center justify-center gap-2 text-[13px] font-semibold text-red-700 hover:text-red-800 transition-colors">
            Voir toutes les alertes <ArrowRight size={13} />
          </button>
        </motion.div>
      )}

      {/* ── COMPATIBILITÉ ── */}
      {compat && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-[13px] font-bold text-gray-900 mb-3">Je peux donner à</div>
          <div className="flex flex-wrap gap-2">
            {compat.donneA.map(g => (
              <span key={g} className="text-[12px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100">{g}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIONS RAPIDES ── */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("../don-sang")}
          className="bg-red-600 hover:bg-red-700 text-white rounded-2xl p-4 text-left transition-colors shadow-sm shadow-red-200">
          <Droplets size={20} className="mb-2 opacity-80" />
          <div className="text-[13px] font-bold">Voir les alertes</div>
          <div className="text-[11px] text-red-200 mt-0.5">Répondre aux besoins</div>
        </button>
        <button onClick={() => navigate("../profil")}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-2xl p-4 text-left transition-colors">
          <CheckCircle2 size={20} className="mb-2 text-gray-400" />
          <div className="text-[13px] font-bold">Mon profil</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Gérer mes infos</div>
        </button>
      </div>

      {/* ── CONSEILS RAPIDES ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Avant de donner</div>
        <div className="space-y-2">
          {[
            { icon: "💧", txt: "Buvez beaucoup d'eau" },
            { icon: "🍽️", txt: "Mangez avant le don, jamais à jeun" },
            { icon: "😴", txt: "Dormez suffisamment la veille" },
            { icon: "🚫", txt: "Évitez l'alcool 24h avant" },
          ].map(c => (
            <div key={c.txt} className="flex items-center gap-3 text-[13px] text-gray-700">
              <span className="text-[16px]">{c.icon}</span> {c.txt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
