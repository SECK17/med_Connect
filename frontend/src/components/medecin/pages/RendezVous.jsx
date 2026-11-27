import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Search, CheckCircle2, LayoutList, CalendarRange } from "lucide-react";
import CameraModal from "../../CameraModal";
import { API_URL } from "../../../config.js";
import { AgendaView } from "./rendezVous/AgendaView.jsx";
import useModaleOrdonnance from "./rendezVous/useModaleOrdonnance";
import useModaleAnalyse from "./rendezVous/useModaleAnalyse";
import ListeRendezVous from "./rendezVous/ListeRendezVous";
import ModaleOrdonnance from "./rendezVous/ModaleOrdonnance";
import ModaleAnalyse from "./rendezVous/ModaleAnalyse";
import ModaleDossier from "./rendezVous/ModaleDossier";

export default function MedecinRendezVous() {
  const [rdvs,    setRdvs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("confirme");
  const [search,  setSearch]  = useState("");
  const [view,    setView]    = useState("liste"); // "liste" | "agenda"
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semaine courante

  const [toast, setToast] = useState(null);
  const [dossierModal, setDossierModal] = useState(null); // rdv complet

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    if (!token || !userId) { setLoading(false); return; }
    fetch(`${API_URL}/api/rendezvous/medecin/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setRdvs)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const etatOrdonnance = useModaleOrdonnance({ showToast, token });
  const { showPrescCam, setShowPrescCam, setPrescFile, setPrescPreview } = etatOrdonnance;
  const etatAnalyse = useModaleAnalyse({ showToast, token });
  const { showAnalyseCam, setShowAnalyseCam, setAnalyseFile, setAnalysePreview } = etatAnalyse;

  /* ── Filtres ── */
  const today = new Date().toISOString().split("T")[0];

  const matchSearch = (r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const u = r.patient?.user || {};
    return (u.nom || "").toLowerCase().includes(q) || (r.motif || "").toLowerCase().includes(q);
  };

  const filtered = rdvs.filter(r => {
    if (filter === "confirme" && !(r.statut === "confirme" && r.date_rdv?.split("T")[0] >= today)) return false;
    if (filter === "passes"   && !(r.statut === "confirme" && r.date_rdv?.split("T")[0] < today))  return false;
    if (filter === "attente"  && !["en_attente", "transfere"].includes(r.statut)) return false;
    if (filter === "annule"   && r.statut !== "annule") return false;
    return matchSearch(r);
  }).sort((a, b) => {
    // Ordre global dans "tous" : confirmés à venir → passés → en attente → annulés
    const priority = (r) => {
      if (r.statut === "confirme" && r.date_rdv?.split("T")[0] >= today) return 0;
      if (r.statut === "confirme" && r.date_rdv?.split("T")[0] < today)  return 1;
      if (["en_attente","transfere"].includes(r.statut)) return 2;
      return 3;
    };
    const diff = priority(a) - priority(b);
    if (diff !== 0) return diff;
    return new Date(a.date_rdv) - new Date(b.date_rdv);
  });

  const counts = {
    confirme: rdvs.filter(r => r.statut === "confirme" && r.date_rdv?.split("T")[0] >= today).length,
    passes:   rdvs.filter(r => r.statut === "confirme" && r.date_rdv?.split("T")[0] < today).length,
    attente:  rdvs.filter(r => ["en_attente", "transfere"].includes(r.statut)).length,
    annule:   rdvs.filter(r => r.statut === "annule").length,
    tous:     rdvs.length,
  };

  return (
    <div className="space-y-5">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium ${
              toast.type === "error" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            }`}
          >
            <CheckCircle2 size={15} /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200"
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight">Mes rendez-vous</h1>
            <p className="text-blue-100 text-[13px] mt-0.5">{rdvs.length} au total</p>
          </div>
          <div className="flex gap-2">
            <div className="text-center bg-white/15 border border-white/20 rounded-xl px-3 py-2">
              <div className="text-[18px] font-black text-white">{counts.confirme}</div>
              <div className="text-[9px] text-blue-200 font-semibold">Confirmés</div>
            </div>
            <div className="text-center bg-white/15 border border-white/20 rounded-xl px-3 py-2">
              <div className="text-[18px] font-black text-white">{counts.attente}</div>
              <div className="text-[9px] text-blue-200 font-semibold">En attente</div>
            </div>
            <div className="text-center bg-white/15 border border-white/20 rounded-xl px-3 py-2">
              <div className="text-[18px] font-black text-white">{counts.passes}</div>
              <div className="text-[9px] text-blue-200 font-semibold">Passés</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toggle vue */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setView("liste")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
            view === "liste" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <LayoutList size={13} /> Liste
        </button>
        <button onClick={() => setView("agenda")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border ${
            view === "agenda" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <CalendarRange size={13} /> Agenda
        </button>
      </div>

      {/* ── VUE AGENDA ── */}
      {view === "agenda" && <AgendaView rdvs={rdvs} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />}

      {/* Filtres + recherche */}
      {view === "liste" && <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 flex-wrap">
          {[
            { key: "confirme", label: "Confirmés"  },
            { key: "passes",   label: "Passés"     },
            { key: "attente",  label: "En attente" },
            { key: "annule",   label: "Annulés"    },
            { key: "tous",     label: "Tous"       },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                filter === key ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            placeholder="Rechercher patient ou motif…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>}

      {/* ── VUE LISTE ── */}
      {view === "liste" && loading && <div className="text-center py-16 text-gray-400 text-sm">Chargement…</div>}

      {view === "liste" && !loading && filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
          <CalendarDays size={30} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-[13px] text-gray-400">Aucun rendez-vous pour ce filtre.</p>
        </div>
      )}

      {view === "liste" && <div className="space-y-3">
        <ListeRendezVous {...etatOrdonnance} {...etatAnalyse} filtered={filtered} today={today} setDossierModal={setDossierModal} />
      </div>}

      {/* ── Modal Ordonnance ── */}
      <ModaleOrdonnance {...etatOrdonnance} />

      {/* ── Modal Analyse ── */}
      <ModaleAnalyse {...etatAnalyse} />

      {/* ── Modal dossier patient ── */}
      <ModaleDossier dossierModal={dossierModal} setDossierModal={setDossierModal} />

      {/* ── Caméras ── */}
      <CameraModal
        isOpen={showPrescCam}
        onClose={() => setShowPrescCam(false)}
        onCapture={(file, url) => { setPrescFile(file); setPrescPreview(url); setShowPrescCam(false); }}
      />
      <CameraModal
        isOpen={showAnalyseCam}
        onClose={() => setShowAnalyseCam(false)}
        onCapture={(file, url) => { setAnalyseFile(file); setAnalysePreview(url); setShowAnalyseCam(false); }}
      />
    </div>
  );
}
