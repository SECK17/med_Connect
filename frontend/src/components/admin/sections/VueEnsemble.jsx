// Section « Vue d'ensemble » : chiffres clés, comptes en attente, activité récente.
import { motion } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Stethoscope, Clock, User, Droplets, AlertCircle, Activity, ChevronRight, TrendingUp, Zap, Building2 } from "lucide-react";
import { ROLE_CFG, HEALTH } from "../constantes.js";

export default function VueEnsemble({ adminNom, stats, loading, users, setSection, activity }) {
  return (
    <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

      {/* Titre */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-indigo-950 tracking-tight">
            Bonjour, {adminNom} 👋
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Vue d'ensemble du système MedConnect</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[12px] text-emerald-700 font-semibold">Système opérationnel</span>
        </div>
      </div>

      {/* Stat cards — gradient */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Utilisateurs",  value: stats.total,            icon: Users,       from: "from-violet-500",  to: "to-indigo-700",  glow: "shadow-violet-500/30"  },
          { label: "Patients",      value: stats.patients,         icon: User,        from: "from-sky-400",     to: "to-blue-600",    glow: "shadow-sky-500/30"     },
          { label: "Médecins",      value: stats.medecins,         icon: Stethoscope, from: "from-emerald-400", to: "to-teal-600",    glow: "shadow-emerald-500/30" },
          { label: "Admins",         value: stats.admins_hopital,   icon: Building2,   from: "from-orange-400",  to: "to-amber-500",   glow: "shadow-orange-500/30"  },
          { label: "En attente",    value: stats.pendingMedecins,  icon: Clock,       from: "from-amber-400",   to: "to-orange-500",  glow: "shadow-amber-500/30"   },
          { label: "Donneurs",      value: stats.donneurs,         icon: Droplets,    from: "from-rose-400",    to: "to-pink-600",    glow: "shadow-rose-500/30"    },
        ].map(({ label, value, icon: Icon, from, to, glow }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-5 text-white shadow-lg ${glow}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon size={17} className="text-white" />
              </div>
              <TrendingUp size={14} className="text-white/50" />
            </div>
            <div className="text-3xl font-extrabold">{value}</div>
            <div className="text-[11px] text-white/75 mt-0.5 font-medium">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Graphe inscriptions par mois ── */}
      {!loading && users.length > 0 && (() => {
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setDate(1);
          d.setMonth(d.getMonth() - (5 - i));
          const y = d.getFullYear(), m = d.getMonth();
          return {
            label: d.toLocaleDateString("fr-FR", { month: "short" }),
            patients:  users.filter(u => u.role === "patient"  && new Date(u.createdAt).getFullYear() === y && new Date(u.createdAt).getMonth() === m).length,
            medecins:  users.filter(u => u.role === "medecin"  && new Date(u.createdAt).getFullYear() === y && new Date(u.createdAt).getMonth() === m).length,
            total:     users.filter(u => new Date(u.createdAt).getFullYear() === y && new Date(u.createdAt).getMonth() === m).length,
          };
        });
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={14} className="text-violet-500"/> Inscriptions — 6 derniers mois
              </h2>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"/>Patients</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>Médecins</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={months} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                  formatter={(v, n) => [v, n === "patients" ? "Patients" : "Médecins"]}/>
                <Area type="monotone" dataKey="patients" stroke="#0EA5E9" strokeWidth={2} fill="url(#gradPat)" dot={false}/>
                <Area type="monotone" dataKey="medecins" stroke="#10B981" strokeWidth={2} fill="url(#gradMed)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        );
      })()}

      {/* Alerte validation */}
      {stats.pendingMedecins > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5"
        >
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={15} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-amber-800">
              {stats.pendingMedecins} médecin{stats.pendingMedecins > 1 ? "s" : ""} en attente de validation
            </div>
            <div className="text-[11px] text-amber-600">Ces comptes ne peuvent pas se connecter tant qu'ils ne sont pas validés.</div>
          </div>
          <button onClick={() => setSection("validations")}
            className="flex items-center gap-1 text-[12px] font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap"
          >
            Voir <ChevronRight size={13} />
          </button>
        </motion.div>
      )}

      {/* Deux colonnes : activité + santé */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

        {/* Feed activité */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity size={15} className="text-violet-500" />
            <h2 className="text-[14px] font-bold text-gray-900">Activité récente</h2>
            <span className="ml-auto text-[11px] text-gray-400">Dernières inscriptions</span>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-8 text-center text-[13px] text-gray-400">Chargement…</div>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-gray-400">Aucune activité</div>
            ) : activity.map((u, i) => {
              const rc = ROLE_CFG[u.role] || ROLE_CFG.patient;
              return (
                <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 ${rc.avatar}`}>
                    {(u.nom || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900 truncate">{u.nom}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                        {rc.label}
                      </span>
                      <span className="text-[11px] text-gray-400 truncate">{u.email}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-400 flex-shrink-0">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Santé système */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Zap size={14} className="text-emerald-500" />
              <h2 className="text-[14px] font-bold text-gray-900">Santé du système</h2>
            </div>
            <div className="px-5 py-3 space-y-3">
              {HEALTH.map(({ label, icon: Icon, status }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Icon size={13} className="text-emerald-600" />
                    </div>
                    <span className="text-[13px] text-gray-700 font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[11px] text-emerald-600 font-semibold">OK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition rapide */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-[13px] font-bold text-gray-900 mb-4">Répartition</h3>
            <div className="space-y-3">
              {[
                { label: "Patients",     value: stats.patients,       total: stats.total, color: "bg-sky-500"    },
                { label: "Médecins",     value: stats.medecins,       total: stats.total, color: "bg-emerald-500"},
                { label: "Donneurs",     value: stats.donneurs,       total: stats.total, color: "bg-rose-500"   },
                { label: "Admins",       value: stats.admins_hopital, total: stats.total, color: "bg-orange-500" },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[12px] text-gray-600 font-medium">{label}</span>
                      <span className="text-[12px] text-gray-400">{value} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
