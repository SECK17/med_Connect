import { useState, useEffect } from "react";
import CameraModal from "../../CameraModal";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, Users, Clock, Droplets, Phone, User, FilePlus,
  FlaskConical, Plus, Trash2, X, CheckCircle2, Camera, Upload,
  FileText, Image, ClipboardList, ArrowRight, Stethoscope, TrendingUp,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function MedecinAccueil() {
  const navigate = useNavigate();
  const [stats, setStats]           = useState({ rendezvous: 0, patients: 0, today: 0, avenir: 0, consultations: 0 });
  const [rendezvous, setRendezvous] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Modal ordonnance
  const [prescModal, setPrescModal] = useState(null); // { patientId, patientNom }
  const [prescMode, setPrescMode]   = useState("photo"); // "photo" | "texte"
  const [prescFile, setPrescFile]   = useState(null);
  const [prescPreview, setPrescPreview] = useState(null);
  const [meds, setMeds]   = useState([{ nom: "", dosage: "", duree: "" }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving]   = useState(false);

  // Modal analyse
  const [analyseModal, setAnalyseModal] = useState(null); // { patientId, patientNom }
  const [analyseFile, setAnalyseFile]   = useState(null);
  const [analysePreview, setAnalysePreview] = useState(null);
  const [analyseNotes, setAnalyseNotes]     = useState("");
  const [savingAnalyse, setSavingAnalyse]   = useState(false);

  const [toast, setToast] = useState(null);
  const [showPrescCam,   setShowPrescCam]   = useState(false);
  const [showAnalyseCam, setShowAnalyseCam] = useState(false);


  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");
  const nom    = sessionStorage.getItem("nom") || "Docteur";

  useEffect(() => { fetchMedecinData(); }, []);

  const fetchMedecinData = async () => {
    if (!token || !userId) { setLoading(false); return; }
    try {
      const [rdvRes, consultRes] = await Promise.all([
        fetch(`http://localhost:5000/api/rendezvous/medecin/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:5000/api/consultations/medecin/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const rdvData     = rdvRes.ok     ? await rdvRes.json()     : [];
      const consultData = consultRes.ok ? await consultRes.json() : [];
      setRendezvous(rdvData);
      setConsultations(consultData);
      const today = new Date().toISOString().split("T")[0];
      setStats({
        rendezvous:   rdvData.length,
        patients:     [...new Set(rdvData.map(r => r.patient_id))].length,
        today:        rdvData.filter(r => r.date_rdv?.startsWith(today)).length,
        avenir:       rdvData.filter(r => r.statut === "confirme" && r.date_rdv?.split("T")[0] >= today).length,
        consultations: consultData.length,
      });
    } catch {}
    setLoading(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Ordonnance ─────────────────────────────────── */
  const openPresc = (rdv) => {
    const u = rdv.patient?.user || {};
    setPrescModal({ patientId: rdv.patient_id, patientNom: u.nom || "Patient" });
    setPrescMode("photo");
    setPrescFile(null); setPrescPreview(null);
    setMeds([{ nom: "", dosage: "", duree: "" }]);
    setNotes("");
  };

  const onPrescFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPrescFile(f);
    if (f.type.startsWith("image/")) setPrescPreview(URL.createObjectURL(f));
    else setPrescPreview(null);
  };

  const submitPhotoPresc = async () => {
    if (!prescFile) return showToast("Sélectionnez une photo", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fichier", prescFile);
      fd.append("patient_id", prescModal.patientId);
      if (notes.trim()) fd.append("notes", notes.trim());

      const res = await fetch("http://localhost:5000/api/ordonnances/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      showToast(`Ordonnance envoyée à ${prescModal.patientNom}`);
      setPrescModal(null);
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally { setSaving(false); }
  };

  const addMed    = () => setMeds(m => [...m, { nom: "", dosage: "", duree: "" }]);
  const removeMed = (i) => setMeds(m => m.filter((_, idx) => idx !== i));
  const updateMed = (i, key, val) => setMeds(m => m.map((med, idx) => idx === i ? { ...med, [key]: val } : med));

  const submitTextPresc = async () => {
    const valid = meds.filter(m => m.nom.trim());
    if (!valid.length) return showToast("Ajoutez au moins un médicament", "error");
    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/ordonnances", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: prescModal.patientId,
          medicaments: valid,
          notes: notes.trim() || null,
          date: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) throw new Error();
      showToast(`Ordonnance envoyée à ${prescModal.patientNom}`);
      setPrescModal(null);
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally { setSaving(false); }
  };

  /* ── Analyse ────────────────────────────────────── */
  const openAnalyse = (rdv) => {
    const u = rdv.patient?.user || {};
    setAnalyseModal({ patientId: rdv.patient_id, patientNom: u.nom || "Patient" });
    setAnalyseFile(null); setAnalysePreview(null); setAnalyseNotes("");
  };

  const onAnalyseFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAnalyseFile(f);
    if (f.type.startsWith("image/")) setAnalysePreview(URL.createObjectURL(f));
    else setAnalysePreview(null);
  };

  const submitAnalyse = async () => {
    if (!analyseFile) return showToast("Sélectionnez une photo", "error");
    setSavingAnalyse(true);
    try {
      const fd = new FormData();
      fd.append("fichier", analyseFile);
      fd.append("patient_id", analyseModal.patientId);
      if (analyseNotes.trim()) fd.append("notes", analyseNotes.trim());

      const res = await fetch("http://localhost:5000/api/analyses/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      showToast(`Résultat envoyé à ${analyseModal.patientNom}`);
      setAnalyseModal(null);
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally { setSavingAnalyse(false); }
  };

  /* ── UI ─────────────────────────────────────────── */
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

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-6 text-white shadow-lg shadow-blue-200"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-16 w-24 h-24 rounded-full bg-blue-800/40" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="text-white/60 text-[12px] font-medium mb-1 capitalize">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="text-[24px] font-extrabold tracking-tight">Bonjour, Dr {nom.split(" ")[0]}</h1>
            <p className="text-blue-100 text-[13px] mt-1">
              {loading ? "Chargement…" : `${stats.today} consultation${stats.today > 1 ? "s" : ""} aujourd'hui · ${stats.rendezvous} au total`}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
            <Users size={26} className="text-white" />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Aujourd'hui",   value: stats.today,        icon: Clock,         bg: "bg-blue-50",    ico: "text-blue-600",    num: "text-blue-700"    },
          { label: "Total RDV",     value: stats.rendezvous,   icon: CalendarDays,  bg: "bg-blue-50",    ico: "text-blue-500",    num: "text-blue-800"    },
          { label: "Patients",      value: stats.patients,     icon: Users,         bg: "bg-amber-50",   ico: "text-amber-500",   num: "text-amber-700"   },
          { label: "À venir",       value: stats.avenir,       icon: CalendarDays,  bg: "bg-emerald-50", ico: "text-emerald-600", num: "text-emerald-700" },
          { label: "Consultations", value: stats.consultations,icon: ClipboardList, bg: "bg-purple-50",  ico: "text-purple-600",  num: "text-purple-700"  },
        ].map(({ label, value, icon: Icon, bg, ico, num }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2.5`}>
              <Icon size={16} className={ico} />
            </div>
            <div className={`text-[26px] font-extrabold leading-none ${num}`}>{loading ? "—" : value}</div>
            <div className="text-[11px] text-gray-500 mt-1 font-medium">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Graphe Activité RDV ── */}
      {!loading && rendezvous.length > 0 && (() => {
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          const key = d.toISOString().split("T")[0];
          return {
            label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
            confirme: rendezvous.filter(r => r.date_rdv?.startsWith(key) && r.statut === "confirme").length,
            annule:   rendezvous.filter(r => r.date_rdv?.startsWith(key) && r.statut === "annule").length,
            total:    rendezvous.filter(r => r.date_rdv?.startsWith(key)).length,
          };
        });
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-600"/> Activité RDV — 14 derniers jours
              </h2>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/>Confirmés</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/>Annulés</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={days} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradAnn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F87171" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={1}/>
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
                  formatter={(v, n) => [v, n === "confirme" ? "Confirmés" : "Annulés"]}/>
                <Area type="monotone" dataKey="confirme" stroke="#2563EB" strokeWidth={2} fill="url(#gradConf)" dot={false}/>
                <Area type="monotone" dataKey="annule"   stroke="#F87171" strokeWidth={2} fill="url(#gradAnn)"  dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        );
      })()}

      {/* Prochain rendez-vous */}
      {(() => {
        const today = new Date().toISOString().split("T")[0];
        const prochain = rendezvous
          .filter(r => r.statut === "confirme" && r.date_rdv?.split("T")[0] >= today)
          .sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv))[0];
        if (!prochain || loading) return null;
        const u = prochain.patient?.user || {};
        const p = prochain.patient || {};
        const isToday = prochain.date_rdv?.split("T")[0] === today;
        return (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-500 p-5 text-white shadow-lg shadow-emerald-100"
          >
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10"/>
            <div className="relative flex items-center gap-4">
              <div className="flex-1">
                <div className="text-emerald-100 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  {isToday ? "Prochain RDV — Aujourd'hui" : "Prochain rendez-vous"}
                </div>
                <div className="text-[18px] font-extrabold">{u.nom || "Patient"}</div>
                <div className="text-emerald-100 text-[13px] mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={11}/> {prochain.heure} · {new Date(prochain.date_rdv).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                  {p.groupeSanguin && <span className="flex items-center gap-1"><Droplets size={10}/> {p.groupeSanguin}</span>}
                </div>
                {prochain.motif && <div className="text-emerald-200 text-[12px] mt-1 italic">"{prochain.motif}"</div>}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => openPresc(prochain)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <FilePlus size={12}/> Ordonnance
                </button>
                <button onClick={() => openAnalyse(prochain)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <FlaskConical size={12}/> Analyse
                </button>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* 2 colonnes : Actions rapides + Demandes en attente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Actions rapides */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Plus size={14} className="text-blue-600"/> Actions rapides
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Nouvelle consultation", icon: ClipboardList, to: "/dashboard/medecin/consultations",  color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"    },
              { label: "Mes disponibilités",    icon: Clock,         to: "/dashboard/medecin/disponibilites", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
              { label: "Mes rendez-vous",       icon: CalendarDays,  to: "/dashboard/medecin/rendezvous",     color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
              { label: "Demandes RDV",          icon: Stethoscope,   to: "/dashboard/medecin/demandes",       color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"   },
            ].map(({ label, icon: Icon, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-colors ${color}`}
              >
                <Icon size={15}/>
                <span className="text-[12px] font-semibold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demandes transmises en attente */}
        {(() => {
          const demandes = rendezvous.filter(r => r.statut === "transfere");
          return (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays size={14} className="text-amber-500"/> Demandes transmises
                </h2>
                {demandes.length > 0 && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{demandes.length}</span>
                )}
              </div>
              {demandes.length === 0 ? (
                <div className="py-6 text-center">
                  <CalendarDays size={24} className="mx-auto text-gray-200 mb-2"/>
                  <p className="text-[12px] text-gray-400">Aucune demande en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {demandes.slice(0, 4).map(r => {
                    const u = r.patient?.user || {};
                    return (
                      <div key={r.id} className="flex items-center gap-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                        <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-bold text-[12px] flex-shrink-0">
                          {(u.nom || "P")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-gray-900 truncate">{u.nom || "—"}</div>
                          <div className="text-[11px] text-gray-500">{r.date_rdv ? new Date(r.date_rdv).toLocaleDateString("fr-FR") : "—"} · {r.heure}</div>
                        </div>
                        <button onClick={() => navigate("demandes")}
                          className="w-7 h-7 bg-white border border-amber-200 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-100 transition-colors flex-shrink-0"
                        >
                          <ArrowRight size={12}/>
                        </button>
                      </div>
                    );
                  })}
                  {demandes.length > 4 && (
                    <button onClick={() => navigate("demandes")} className="w-full text-[12px] text-amber-600 font-semibold py-1 hover:underline">
                      +{demandes.length - 4} de plus →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Consultations récentes */}
      {consultations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList size={14} className="text-purple-600"/> Consultations récentes
            </h2>
            <button onClick={() => navigate("consultations")}
              className="text-[12px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              Tout voir <ArrowRight size={11}/>
            </button>
          </div>
          <div className="space-y-2">
            {consultations.slice(0, 3).map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-[12px] flex-shrink-0">
                  {(c.patient?.user?.nom || "P")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-900">{c.patient?.user?.nom || "—"}</span>
                    <span className="text-[11px] text-gray-400">{c.date ? new Date(c.date).toLocaleDateString("fr-FR") : "—"}</span>
                  </div>
                  {c.diagnostic && <div className="text-[12px] text-gray-600 truncate mt-0.5">{c.diagnostic}</div>}
                  {c.motif && !c.diagnostic && <div className="text-[12px] text-gray-500 truncate mt-0.5 italic">{c.motif}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal Ordonnance ── */}
      <AnimatePresence>
        {prescModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={() => setPrescModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <div className="text-[15px] font-bold text-gray-900">Nouvelle ordonnance</div>
                    <div className="text-[12px] text-gray-500">Pour : {prescModal.patientNom}</div>
                  </div>
                  <button onClick={() => setPrescModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={16} />
                  </button>
                </div>

                {/* Mode tabs */}
                <div className="flex border-b border-gray-100 px-6">
                  {[["photo", Camera, "Photo"], ["texte", FileText, "Texte"]].map(([k, Icon, l]) => (
                    <button key={k} onClick={() => setPrescMode(k)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                        prescMode === k ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-700"
                      }`}
                    >
                      <Icon size={13} /> {l}
                    </button>
                  ))}
                </div>

                {/* Corps */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {prescMode === "photo" ? (
                    <>
                      {/* Zone upload photo */}
                      <label htmlFor="presc-file-input"
                        className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        {prescPreview ? (
                          <img src={prescPreview} alt="aperçu" className="max-h-52 mx-auto rounded-lg object-contain" />
                        ) : prescFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <FileText size={40} className="text-blue-400" />
                            <div className="text-[13px] font-medium text-gray-700">{prescFile.name}</div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto">
                              <Upload size={22} className="text-blue-500" />
                            </div>
                            <div className="text-[13px] font-medium text-gray-700">Choisir un fichier</div>
                            <div className="text-[11px] text-gray-400">JPG, PNG ou PDF · Max 10 Mo</div>
                          </div>
                        )}
                      </label>
                      <input id="presc-file-input" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onPrescFile} />
                      {!prescFile && (
                        <>
                          <p className="text-center text-[11px] text-gray-400">— ou —</p>
                          <button type="button"
                            onClick={() => setShowPrescCam(true)}
                            className="flex items-center justify-center gap-2 py-2.5 w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[13px] font-semibold rounded-xl transition-colors"
                          >
                            <Camera size={14} /> Prendre une photo
                          </button>
                        </>
                      )}
                      {prescFile && (
                        <button onClick={() => { setPrescFile(null); setPrescPreview(null); }}
                          className="text-[12px] text-red-400 hover:text-red-600 flex items-center gap-1"
                        >
                          <X size={11} /> Supprimer
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[13px] font-semibold text-gray-700">Médicaments *</label>
                          <button onClick={addMed}
                            className="flex items-center gap-1 text-[11px] text-blue-600 border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Plus size={11} /> Ajouter
                          </button>
                        </div>
                        <div className="space-y-2">
                          {meds.map((m, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input value={m.nom}    onChange={e => updateMed(i, "nom", e.target.value)}
                                  placeholder="Médicament" className={INPUT} />
                                <input value={m.dosage} onChange={e => updateMed(i, "dosage", e.target.value)}
                                  placeholder="Dosage" className={INPUT} />
                                <input value={m.duree}  onChange={e => updateMed(i, "duree", e.target.value)}
                                  placeholder="Durée" className={INPUT} />
                              </div>
                              {meds.length > 1 && (
                                <button onClick={() => removeMed(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg mt-0.5">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes (commun aux deux modes) */}
                  <div>
                    <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Notes / Conseils</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Instructions particulières, contre-indications…"
                      rows={2} className={`${INPUT} resize-none`}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={prescMode === "photo" ? submitPhotoPresc : submitTextPresc}
                    disabled={saving}
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? "Envoi…" : <><Upload size={14} /> Envoyer l'ordonnance</>}
                  </button>
                  <button onClick={() => setPrescModal(null)}
                    className="px-5 h-10 border border-gray-200 text-gray-600 rounded-xl text-[13px] hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal Analyse ── */}
      <AnimatePresence>
        {analyseModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={() => setAnalyseModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <div className="text-[15px] font-bold text-gray-900">Résultat d'analyse</div>
                    <div className="text-[12px] text-gray-500">Pour : {analyseModal.patientNom}</div>
                  </div>
                  <button onClick={() => setAnalyseModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <label htmlFor="analyse-file-input"
                    className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    {analysePreview ? (
                      <img src={analysePreview} alt="aperçu" className="max-h-52 mx-auto rounded-lg object-contain" />
                    ) : analyseFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={40} className="text-purple-400" />
                        <div className="text-[13px] font-medium text-gray-700">{analyseFile.name}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto">
                          <Upload size={22} className="text-purple-500" />
                        </div>
                        <div className="text-[13px] font-medium text-gray-700">Choisir un fichier</div>
                        <div className="text-[11px] text-gray-400">JPG, PNG ou PDF · Max 10 Mo</div>
                      </div>
                    )}
                  </label>
                  <input id="analyse-file-input" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onAnalyseFile} />
                  {!analyseFile && (
                    <>
                      <p className="text-center text-[11px] text-gray-400">— ou —</p>
                      <button type="button"
                        onClick={() => setShowAnalyseCam(true)}
                        className="flex items-center justify-center gap-2 py-2.5 w-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[13px] font-semibold rounded-xl transition-colors"
                      >
                        <Camera size={14} /> Prendre une photo
                      </button>
                    </>
                  )}
                  {analyseFile && (
                    <button onClick={() => { setAnalyseFile(null); setAnalysePreview(null); }}
                      className="text-[12px] text-red-400 hover:text-red-600 flex items-center gap-1"
                    >
                      <X size={11} /> Supprimer
                    </button>
                  )}

                  <div>
                    <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Notes / Commentaires</label>
                    <textarea value={analyseNotes} onChange={e => setAnalyseNotes(e.target.value)}
                      placeholder="Interprétation, recommandations…"
                      rows={2} className={`${INPUT} resize-none`}
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                  <button onClick={submitAnalyse} disabled={savingAnalyse}
                    className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2"
                  >
                    {savingAnalyse ? "Envoi…" : <><Upload size={14} /> Envoyer le résultat</>}
                  </button>
                  <button onClick={() => setAnalyseModal(null)}
                    className="px-5 h-10 border border-gray-200 text-gray-600 rounded-xl text-[13px] hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
