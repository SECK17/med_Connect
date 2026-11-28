import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CalendarDays, CheckCircle2, Clock, X, Search, User, ArrowRight } from "lucide-react";
import { API_URL } from "../../../config.js";

const STATUT_CFG = {
  en_attente: { label: "En attente",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: Clock        },
  transfere:  { label: "Transmis",    bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    icon: ArrowRight   },
  confirme:   { label: "Confirmé",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  annule:     { label: "Annulé",      bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     icon: X            },
};

export default function AdminHopitalRendezVous() {
  const [rdvs,    setRdvs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("en_attente");
  const [search,  setSearch]  = useState("");
  const [acting,  setActing]  = useState(null);
  const [toast,   setToast]   = useState(null);
  const token = sessionStorage.getItem("token");

  // recuperer…() fait la requête sans toucher à l'état : utilisable tel quel au montage.
  const recupererRdvs = () => fetch(`${API_URL}/api/admin-hopital/rendez-vous`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.ok ? r.json() : []);

  // Mise à jour de la liste + notifications de la secrétaire si un médecin a répondu à un transfert
  const appliquerRdvs = (data) => {
    // Détection changement de statut après transfert → notifications secrétaire
    const seen = JSON.parse(localStorage.getItem("medconnect_secretaire_rdv_seen") || "{}");
    const newNotifs = [];
    data.forEach(r => {
      const prev = seen[String(r.id)];
      const cur  = r.statut;
      if (prev === "transfere" && cur !== prev) {
        const doc     = r.medecin?.nom || "le médecin";
        const patient = r.patient?.nom || "le patient";
        if (cur === "confirme") {
          newNotifs.push({ title: "RDV confirmé par le médecin", message: `Dr. ${doc} a confirmé le RDV de ${patient}.`, type: "success", date: new Date().toISOString(), read: false });
        } else if (cur === "annule") {
          newNotifs.push({ title: "RDV refusé par le médecin", message: `Dr. ${doc} a annulé le RDV de ${patient}.`, type: "error", date: new Date().toISOString(), read: false });
        }
      }
      seen[String(r.id)] = cur;
    });
    localStorage.setItem("medconnect_secretaire_rdv_seen", JSON.stringify(seen));
    if (newNotifs.length > 0) {
      const existing = JSON.parse(localStorage.getItem("medconnect_secretaire_notifications") || "[]");
      localStorage.setItem("medconnect_secretaire_notifications", JSON.stringify([...newNotifs, ...existing]));
    }
    setRdvs(data);
  };
  const load = () => {
    setLoading(true);
    recupererRdvs().then(appliquerRdvs).finally(() => setLoading(false));
  };

  useEffect(() => {
    recupererRdvs().then(appliquerRdvs).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const transferer = async (id) => {
    setActing(id + "transfere");
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital/rendez-vous/${id}/transferer`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok) { showToast(d.message); load(); }
      else showToast(d.message || "Erreur", "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setActing(null); }
  };

  const annuler = async (id) => {
    setActing(id + "annule");
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital/rendez-vous/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "annule" }),
      });
      const d = await res.json();
      if (res.ok) { showToast(d.message); load(); }
      else showToast(d.message || "Erreur", "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setActing(null); }
  };

  const filtered = rdvs.filter(r => {
    if (filter !== "tous" && r.statut !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.patient?.nom?.toLowerCase().includes(q) || r.medecin?.nom?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    tous:       rdvs.length,
    en_attente: rdvs.filter(r => r.statut === "en_attente").length,
    transfere:  rdvs.filter(r => r.statut === "transfere").length,
    confirme:   rdvs.filter(r => r.statut === "confirme").length,
    annule:     rdvs.filter(r => r.statut === "annule").length,
  };


  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold border ${
          toast.type === "error"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          <CheckCircle2 size={13}/> {toast.msg}
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays size={20} className="text-rose-500" /> Rendez-vous
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {counts.en_attente > 0
            ? <span className="text-amber-600 font-semibold">{counts.en_attente} en attente de transmission</span>
            : `${rdvs.length} rendez-vous dans votre hôpital`}
        </p>
      </motion.div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 flex-wrap">
          {[
            { key: "en_attente", label: "À transférer" },
            { key: "transfere",  label: "Transmis"     },
            { key: "confirme",   label: "Confirmés"    },
            { key: "annule",     label: "Annulés"      },
            { key: "tous",       label: "Tous"         },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                filter === key ? "bg-rose-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${filter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white"
            placeholder="Rechercher patient ou médecin…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}

      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
          <CalendarDays size={30} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-[13px] text-gray-400">
            {filter === "en_attente" ? "Aucune demande en attente de transmission." : "Aucun rendez-vous pour ce filtre."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((r, i) => {
          const cfg = STATUT_CFG[r.statut] || STATUT_CFG.en_attente;
          const Icon = cfg.icon;
          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Bloc date */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-center flex-shrink-0 min-w-[58px]">
                  <div className="text-[18px] font-extrabold text-rose-600 leading-none">
                    {r.date_rdv ? new Date(r.date_rdv).getDate() : "—"}
                  </div>
                  <div className="text-[9px] font-semibold text-rose-400 uppercase mt-0.5">
                    {r.date_rdv ? new Date(r.date_rdv).toLocaleDateString("fr-FR", { month: "short" }) : ""}
                  </div>
                  <div className="text-[10px] text-rose-500 font-bold mt-0.5">{r.heure}</div>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[14px] font-bold text-gray-900">{r.patient?.nom || "—"}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <Icon size={9}/> {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <User size={10} className="text-emerald-500"/> Dr. {r.medecin?.nom || "—"}
                  </div>
                  {r.motif && r.motif !== "—" && (
                    <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">Motif : {r.motif}</div>
                  )}
                </div>

                {/* Actions */}
                {r.statut === "en_attente" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => transferer(r.id)}
                      disabled={acting === r.id + "transfere"}
                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <ArrowRight size={11}/>
                      {acting === r.id + "transfere" ? "…" : "Transférer au médecin"}
                    </button>
                    <button onClick={() => annuler(r.id)}
                      disabled={acting === r.id + "annule"}
                      className="h-8 px-3 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <X size={11}/>
                      {acting === r.id + "annule" ? "…" : "Annuler"}
                    </button>
                  </div>
                )}

                {r.statut === "transfere" && (
                  <div className="flex-shrink-0">
                    <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                      <ArrowRight size={10}/> Chez le médecin
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
