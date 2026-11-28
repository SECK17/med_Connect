import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Bell, Building2, Droplets, CheckCircle2, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { API_URL } from "../../../config.js";

const URGENCE_CFG = {
  Critique: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500"    },
  Urgent:   { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  Moyen:    { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500"  },
  Faible:   { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-400"   },
};

export default function AdminHopitalAccueil() {
  const [alertes,  setAlertes]  = useState([]);
  const [donneurs, setDonneurs] = useState([]);
  const [hopital,  setHopital]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/admin-hopital/me`,      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/alertes-sang/moi`,      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/api/admin-hopital/donneurs`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
    ]).then(([hop, al, don]) => {
      setHopital(hop);
      setAlertes(al);
      setDonneurs(don);
      setLoading(false);
    });
  }, []);

  const alertesActives = alertes.filter(a => a.statut === 'active');
  const groupeStats = donneurs.reduce((acc, d) => {
    if (d.groupe) acc[d.groupe] = (acc[d.groupe] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-rose-500 to-red-500 p-6 text-white shadow-lg shadow-rose-200"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={14} className="text-white/70" />
            <span className="text-[12px] text-white/70 font-medium">{hopital?.hopital_nom || "Hôpital"}</span>
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Tableau de bord</h1>
          <p className="text-white/60 text-[12px] mt-0.5">Gestion du don de sang</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Donneurs",        val: donneurs.length,       icon: Users,         bg: "bg-blue-50",   ico: "bg-blue-100 text-blue-600",   num: "text-blue-700" },
          { label: "Alertes actives", val: alertesActives.length, icon: Bell,          bg: "bg-rose-50",   ico: "bg-rose-100 text-rose-600",   num: "text-rose-600" },
          { label: "Groupes couverts",val: Object.keys(groupeStats).length, icon: Droplets, bg: "bg-amber-50", ico: "bg-amber-100 text-amber-600", num: "text-amber-700" },
          { label: "Alertes totales", val: alertes.length,        icon: Activity,      bg: "bg-violet-50", ico: "bg-violet-100 text-violet-600",num: "text-violet-700" },
        ].map(({ label, val, icon: Icon, bg, ico, num }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`${bg} border border-gray-100 rounded-2xl p-4 shadow-sm`}
          >
            <div className={`w-9 h-9 rounded-xl ${ico} flex items-center justify-center mb-3`}>
              <Icon size={16} />
            </div>
            <div className={`text-[28px] font-extrabold leading-none mb-1 ${num}`}>{loading ? "—" : val}</div>
            <div className="text-[11px] text-gray-500 font-medium">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Alertes actives */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Bell size={14} className="text-rose-500" />
          <span className="text-[14px] font-bold text-gray-900">Alertes actives</span>
          {alertesActives.length > 0 && (
            <span className="ml-auto bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{alertesActives.length}</span>
          )}
        </div>
        {alertesActives.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-[13px] text-gray-400">Aucune alerte active</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {alertesActives.slice(0, 5).map(a => {
              const cfg = URGENCE_CFG[a.urgence] || URGENCE_CFG.Moyen;
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Droplets size={16} className="text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-gray-900">Besoin de sang {a.groupe_sang}</div>
                    <div className="text-[11px] text-gray-400">{a.quantite || "Quantité non précisée"} · {new Date(a.created_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {a.urgence}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Répartition donneurs par groupe */}
      {Object.keys(groupeStats).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={14} className="text-rose-500" />
            <span className="text-[14px] font-bold text-gray-900">Donneurs par groupe sanguin</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => ({ groupe: g, count: groupeStats[g] || 0 }))}
              margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
            >
              <XAxis dataKey="groupe" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                formatter={(v) => [v, "Donneurs"]}/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g, i) => (
                  <Cell key={g} fill={groupeStats[g] ? "#E11D48" : "#F3F4F6"} opacity={groupeStats[g] ? 0.75 + (i % 2) * 0.15 : 1}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
