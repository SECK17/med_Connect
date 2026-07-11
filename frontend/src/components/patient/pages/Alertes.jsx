import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Info, CheckCircle2, AlertTriangle, XCircle, X, CheckCheck } from "lucide-react";


const TYPE_CONFIG = {
  info:    { icon: Info,          bg: "bg-blue-50",    text: "text-blue-600",   badge: "bg-blue-100 text-blue-700",   border: "border-l-blue-400",   label: "Info" },
  success: { icon: CheckCircle2,  bg: "bg-emerald-50", text: "text-emerald-600",badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-400", label: "Succès" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50",   text: "text-amber-600",  badge: "bg-amber-100 text-amber-700", border: "border-l-amber-400",  label: "Attention" },
  error:   { icon: XCircle,       bg: "bg-red-50",     text: "text-red-600",    badge: "bg-red-100 text-red-700",     border: "border-l-red-400",    label: "Alerte" },
};

const FILTRES = ["Toutes", "Non lues", "info", "success", "warning", "error"];
const FILTRE_LABEL = { Toutes: "Toutes", "Non lues": "Non lues", info: "Info", success: "Succès", warning: "Attention", error: "Alertes" };

export default function Alertes() {
  const [notifs, setNotifs]   = useState([]);
  const [filtre, setFiltre]   = useState("Toutes");
  const [loading, setLoading] = useState(true);

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const load = async () => {
      // Notifs manuelles stockées en localStorage (ex: confirmations médecin)
      const manuelles = JSON.parse(localStorage.getItem("medconnect_notifications") || "[]");

      // Notifs générées depuis les vrais RDV
      let rdvNotifs = [];
      try {
        const res = await fetch(`http://localhost:5000/api/rendezvous/patient/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const rdvs = await res.json();
          rdvNotifs = rdvs
            .filter(r => r.statut === "confirme" || r.statut === "annule")
            .map(r => {
              const nomMedecin = r.medecin?.user?.nom ? `Dr. ${r.medecin.user.nom}` : "votre médecin";
              const date = r.date_rdv ? new Date(r.date_rdv).toLocaleDateString("fr-FR") : "";
              const heure = r.heure || "";
              return {
                id: `rdv-${r.id}`,
                type: r.statut === "confirme" ? "success" : "error",
                title: r.statut === "confirme" ? "Rendez-vous confirmé" : "Rendez-vous annulé",
                content: r.statut === "confirme"
                  ? `Votre RDV avec ${nomMedecin} est confirmé${date ? ` le ${date}` : ""}${heure ? ` à ${heure}` : ""}.`
                  : `Votre RDV${date ? ` du ${date}` : ""} avec ${nomMedecin} a été annulé.`,
                date: r.updated_at || r.created_at || new Date().toISOString(),
                read: false,
              };
            });
        }
      } catch {}

      // Fusionner en dédupliquant par id
      const ids = new Set(manuelles.map(n => n.id));
      const merged = [...manuelles, ...rdvNotifs.filter(n => !ids.has(n.id))];
      merged.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifs(merged);
      setLoading(false);
    };
    load();
  }, []);

  const save = (updated) => {
    const manuelles = updated.filter(n => !n.id.startsWith("rdv-"));
    localStorage.setItem("medconnect_notifications", JSON.stringify(manuelles));
    setNotifs(updated);
  };

  const marquerLu = (id) => save(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  const toutMarquer = () => save(notifs.map(n => ({ ...n, read: true })));
  const supprimer = (id) => save(notifs.filter(n => n.id !== id));

  const filtered = notifs.filter(n => {
    if (filtre === "Toutes")   return true;
    if (filtre === "Non lues") return !n.read;
    return n.type === filtre;
  });

  const unread = notifs.filter(n => !n.read).length;
  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement…</div>
  );

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Bell size={20} className="text-blue-600" /> Alertes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unread > 0 ? `${unread} alerte(s) non lue(s)` : "Toutes les alertes sont lues"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={toutMarquer}
            className="flex items-center gap-1.5 text-[13px] text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <CheckCheck size={14} /> Tout marquer lu
          </button>
        )}
      </motion.div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {FILTRES.map(f => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${
              filtre === f
                ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {FILTRE_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">
            Aucune alerte dans cette catégorie.
          </div>
        )}
        <AnimatePresence>
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => marquerLu(n.id)}
                className={`bg-white border border-gray-200 border-l-4 ${cfg.border} rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:shadow-sm transition-all ${!n.read ? "ring-1 ring-blue-100" : ""}`}
              >
                <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={17} className={cfg.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-semibold text-gray-900">{n.title}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <div className="text-[13px] text-gray-600 leading-relaxed">{n.content}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{formatDate(n.date)}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); supprimer(n.id); }}
                  className="p-1 rounded text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
