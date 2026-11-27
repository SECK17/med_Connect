// Section « Don de sang » : alertes de tous les hôpitaux.
import { motion } from "motion/react";
import { Heart, Droplets, Building2, Bell } from "lucide-react";

export default function DonSang({ setAlerteFilter, alerteFilter, allAlertes, loadingAlertes }) {
  return (
    <motion.div key="don_sang" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
            <Heart size={18} className="text-rose-500" /> Don de sang — Vue globale
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Toutes les alertes sang de la plateforme</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          {[
            { key: "active",   label: "Actives"   },
            { key: "terminee", label: "Terminées" },
            { key: "annulee",  label: "Annulées"  },
            { key: "all",      label: "Toutes"    },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setAlerteFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                alerteFilter === key ? "bg-indigo-950 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Stats rapides */}
      {(() => {
        const actives   = allAlertes.filter(a => a.statut === "active");
        const critiques = actives.filter(a => a.urgence === "Critique");
        const hopitaux_ = [...new Set(actives.map(a => a.hopital_nom))];
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Alertes actives",     val: actives.length,    bg: "bg-rose-50",    ico: "bg-rose-100 text-rose-600",    num: "text-rose-600"    },
              { label: "Niveaux critiques",   val: critiques.length,  bg: "bg-red-50",     ico: "bg-red-100 text-red-600",      num: "text-red-600"     },
              { label: "Hôpitaux concernés",  val: hopitaux_.length,  bg: "bg-violet-50",  ico: "bg-violet-100 text-violet-600",num: "text-violet-700"  },
              { label: "Total alertes",       val: allAlertes.length, bg: "bg-slate-50",   ico: "bg-slate-100 text-slate-600",  num: "text-slate-700"   },
            ].map(({ label, val, bg, ico, num }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`${bg} border border-gray-100 rounded-2xl p-4`}
              >
                <div className={`w-8 h-8 rounded-xl ${ico} flex items-center justify-center mb-3`}>
                  <Heart size={14} />
                </div>
                <div className={`text-[26px] font-extrabold leading-none mb-1 ${num}`}>{loadingAlertes ? "—" : val}</div>
                <div className="text-[11px] text-gray-500 font-medium">{label}</div>
              </motion.div>
            ))}
          </div>
        );
      })()}

      {/* Liste alertes */}
      {loadingAlertes ? (
        <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>
      ) : (() => {
        const filtered = alerteFilter === "all"
          ? allAlertes
          : allAlertes.filter(a => a.statut === alerteFilter);

        const URGENCE_CFG = {
          Critique: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200"    },
          Urgent:   { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
          Moyen:    { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200"  },
          Faible:   { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
        };
        const STATUT_CFG = {
          active:   { bg: "bg-emerald-100", text: "text-emerald-700", label: "Active"   },
          terminee: { bg: "bg-gray-100",    text: "text-gray-500",    label: "Terminée" },
          annulee:  { bg: "bg-red-100",     text: "text-red-500",     label: "Annulée"  },
        };

        if (filtered.length === 0) return (
          <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
            <Bell size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-[13px] text-gray-400">Aucune alerte pour ce filtre</p>
          </div>
        );

        return (
          <div className="space-y-3">
            {filtered.map((a, i) => {
              const ucfg = URGENCE_CFG[a.urgence] || URGENCE_CFG.Moyen;
              const scfg = STATUT_CFG[a.statut]   || STATUT_CFG.active;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Droplets size={18} className="text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[14px] font-bold text-gray-900">Groupe {a.groupe_sang}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ucfg.bg} ${ucfg.text} ${ucfg.border}`}>{a.urgence}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scfg.bg} ${scfg.text}`}>{scfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <Building2 size={10} className="text-gray-400" />
                      <span className="font-medium">{a.hopital_nom || "—"}</span>
                      {a.quantite && <span className="text-gray-300">·</span>}
                      {a.quantite && <span>{a.quantite}</span>}
                    </div>
                    {a.message && <div className="text-[11px] text-gray-400 italic mt-0.5">"{a.message}"</div>}
                  </div>
                  <div className="text-[11px] text-gray-300 flex-shrink-0">
                    {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      })()}
    </motion.div>
  );
}
