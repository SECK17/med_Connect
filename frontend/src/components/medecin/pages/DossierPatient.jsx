import { useState, useEffect } from "react";
import CameraModal from "../../CameraModal";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, User, FileText, FlaskConical, Download, Printer,
  Eye, Image, Pill, ChevronRight, ChevronDown, ChevronUp,
  Upload, Camera, X, Plus, Trash2, CheckCircle2,
  Heart, Shield, Droplets, Activity, BookOpen,
  Stethoscope, MapPin, ClipboardList, Save,
} from "lucide-react";
import { API_URL } from "../../../config.js";

const API = API_URL;
const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function DossierPatient() {
  const [patients, setPatients]       = useState([]);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);    // { id, nom }
  const [tab, setTab]                 = useState("ordonnances");
  const [ordonnances, setOrdonnances] = useState([]);
  const [analyses, setAnalyses]       = useState([]);
  const [loadingOrd, setLoadingOrd]   = useState(false);
  const [loadingAna, setLoadingAna]   = useState(false);
  const [openId, setOpenId]           = useState(null);
  const [preview, setPreview]         = useState(null);

  // Upload ordonnance
  const [showUploadOrd, setShowUploadOrd] = useState(false);
  const [ordFile, setOrdFile]             = useState(null);
  const [ordPreview, setOrdPreview]       = useState(null);
  const [ordNotes, setOrdNotes]           = useState("");
  const [savingOrd, setSavingOrd]         = useState(false);

  // Upload analyse
  const [showUploadAna, setShowUploadAna] = useState(false);
  const [anaFile, setAnaFile]             = useState(null);
  const [anaPreview, setAnaPreview]       = useState(null);
  const [anaNotes, setAnaNotes]           = useState("");
  const [savingAna, setSavingAna]         = useState(false);

  const [patientProfil, setPatientProfil]   = useState({});
  const [consultations, setConsultations]   = useState([]);
  const [loadingCarnet, setLoadingCarnet]   = useState(false);
  const [showNewConsult, setShowNewConsult] = useState(false);
  const [savingConsult, setSavingConsult]   = useState(false);
  const [consultForm, setConsultForm]       = useState({ motif: "", diagnostic: "", traitement: "", notes: "" });
  const [toast, setToast] = useState(null);
  const [showOrdCam, setShowOrdCam] = useState(false);
  const [showAnaCam, setShowAnaCam] = useState(false);


  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  // Charger la liste des patients via les RDV du médecin
  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${API}/api/rendezvous/medecin/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(rdvs => {
        const seen = new Set();
        const list = [];
        rdvs.forEach(rdv => {
          if (rdv.patient_id && !seen.has(rdv.patient_id)) {
            seen.add(rdv.patient_id);
            const u = rdv.patient?.user || {};
            list.push({
              id: rdv.patient_id,
              nom: u.nom || "Patient inconnu",
              telephone: u.telephone || "",
            });
          }
        });
        setPatients(list);
      })
      .catch(() => {});
  }, []);

  const filtered = patients.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  const selectPatient = (p) => {
    setSelected(p);
    setTab("ordonnances");
    setOpenId(null);
    setPatientProfil({});
    setConsultations([]);
    setShowNewConsult(false);
    setConsultForm({ motif: "", diagnostic: "", traitement: "", notes: "" });
    loadOrdonnances(p.id);
    loadAnalyses(p.id);
    loadPatientProfil(p.id);
    loadCarnet(p.id);
  };

  const loadOrdonnances = (pid) => {
    setLoadingOrd(true);
    fetch(`${API}/api/ordonnances/patient/${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrdonnances(data.map(o => ({
        id: String(o.id),
        date: o.date,
        notes: o.notes || "",
        fichier: o.fichier || null,
        drugs: (o.medicaments || []).map(m => ({
          name: m.nom || m.name || "",
          dosage: m.dosage || "",
          duration: m.duree || m.duration || "",
        })),
      }))))
      .catch(() => {})
      .finally(() => setLoadingOrd(false));
  };

  const loadAnalyses = (pid) => {
    setLoadingAna(true);
    fetch(`${API}/api/analyses/patient/${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setAnalyses(data.map(a => ({
        id: String(a.id),
        date: a.date,
        notes: a.notes || "",
        fichier: a.fichier,
      }))))
      .catch(() => {})
      .finally(() => setLoadingAna(false));
  };

  const loadCarnet = (pid) => {
    setLoadingCarnet(true);
    fetch(`${API}/api/consultations/patient/${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setConsultations(data))
      .catch(() => {})
      .finally(() => setLoadingCarnet(false));
  };

  const submitConsult = async () => {
    if (!consultForm.motif && !consultForm.diagnostic) {
      return showToast("Remplissez au moins le motif ou le diagnostic.", "error");
    }
    setSavingConsult(true);
    try {
      const medecinProfil = JSON.parse(localStorage.getItem("medconnect_medecin_profil") || "{}");
      const res = await fetch(`${API}/api/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: selected.id,
          hopital:    medecinProfil.hopital || "",
          motif:      consultForm.motif,
          diagnostic: consultForm.diagnostic,
          traitement: consultForm.traitement,
          notes:      consultForm.notes,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Compte-rendu enregistré dans le carnet");
      setShowNewConsult(false);
      setConsultForm({ motif: "", diagnostic: "", traitement: "", notes: "" });
      loadCarnet(selected.id);
    } catch {
      showToast("Erreur lors de l'enregistrement.", "error");
    } finally {
      setSavingConsult(false);
    }
  };

  const loadPatientProfil = (pid) => {
    fetch(`${API}/api/patients/${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const p = data.profil_patient || data.profil || data;
        setPatientProfil({
          groupeSanguin: p.groupeSanguin || p.groupe_sanguin || "",
          allergies:     Array.isArray(p.allergies)   ? p.allergies   : [],
          antecedents:   Array.isArray(p.antecedents) ? p.antecedents : [],
        });
      })
      .catch(() => {});
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fileUrl  = (path) => `${API}/${path}`;
  const isPdf    = (path) => path?.toLowerCase().endsWith(".pdf");
  const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const handleDownload = async (path, name) => {
    try {
      const res  = await fetch(fileUrl(path), { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(fileUrl(path), "_blank");
    }
  };

  const handlePrint = (path) => {
    const win = window.open(fileUrl(path), "_blank");
    win?.addEventListener("load", () => win.print());
  };

  /* ── Upload ordonnance ── */
  const onOrdFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setOrdFile(f);
    setOrdPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const submitOrd = async () => {
    if (!ordFile) return showToast("Sélectionnez une photo", "error");
    setSavingOrd(true);
    try {
      const fd = new FormData();
      fd.append("fichier", ordFile);
      fd.append("patient_id", selected.id);
      if (ordNotes.trim()) fd.append("notes", ordNotes.trim());

      const res = await fetch(`${API}/api/ordonnances/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      showToast("Ordonnance envoyée");
      setShowUploadOrd(false);
      setOrdFile(null); setOrdPreview(null); setOrdNotes("");
      loadOrdonnances(selected.id);
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally { setSavingOrd(false); }
  };

  /* ── Upload analyse ── */
  const onAnaFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAnaFile(f);
    setAnaPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const submitAna = async () => {
    if (!anaFile) return showToast("Sélectionnez une photo", "error");
    setSavingAna(true);
    try {
      const fd = new FormData();
      fd.append("fichier", anaFile);
      fd.append("patient_id", selected.id);
      if (anaNotes.trim()) fd.append("notes", anaNotes.trim());

      const res = await fetch(`${API}/api/analyses/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      showToast("Analyse envoyée");
      setShowUploadAna(false);
      setAnaFile(null); setAnaPreview(null); setAnaNotes("");
      loadAnalyses(selected.id);
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally { setSavingAna(false); }
  };

  /* ── UI ── */
  return (
    <div className="flex gap-5 h-[calc(100vh-104px)]">

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

      {/* ── Colonne gauche : liste patients ── */}
      <div className="w-[260px] flex-shrink-0 flex flex-col gap-3">
        <div className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-2xl p-4 text-white shadow-md shadow-blue-200">
          <h1 className="text-[16px] font-extrabold tracking-tight">Dossiers patients</h1>
          <p className="text-blue-100 text-[11px] mt-0.5">
            {patients.length} patient{patients.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Rechercher un patient…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <User size={28} className="mx-auto text-slate-200 mb-2" />
              <p className="text-[12px] text-slate-400">
                {search ? "Aucun patient trouvé" : "Aucun patient pour l'instant"}
              </p>
            </div>
          )}
          {filtered.map(p => (
            <motion.button
              key={p.id}
              whileHover={{ x: 2 }}
              onClick={() => selectPatient(p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                selected?.id === p.id
                  ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                  : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                selected?.id === p.id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
              }`}>
                {p.nom.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-semibold truncate ${selected?.id === p.id ? "text-white" : "text-slate-900"}`}>
                  {p.nom}
                </div>
                {p.telephone && (
                  <div className={`text-[11px] truncate ${selected?.id === p.id ? "text-blue-100" : "text-slate-400"}`}>
                    {p.telephone}
                  </div>
                )}
              </div>
              <ChevronRight size={13} className={selected?.id === p.id ? "text-white/70" : "text-slate-300"} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Colonne droite : dossier ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!selected ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-200"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpenIcon />
            </div>
            <p className="text-[15px] font-semibold text-slate-700">Sélectionnez un patient</p>
            <p className="text-[13px] text-slate-400 mt-1">Recherchez un patient à gauche pour voir son dossier</p>
          </motion.div>
        ) : (
          <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl border border-gray-200"
          >
            {/* Header dossier */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-[14px]">
                  {selected.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-900">{selected.nom}</div>
                  <div className="text-[12px] text-slate-400">
                    {ordonnances.length} ordonnance(s) · {analyses.length} analyse(s)
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowUploadOrd(true); setTab("ordonnances"); }}
                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Camera size={12} /> Ordonnance
                </button>
                <button
                  onClick={() => { setShowUploadAna(true); setTab("analyses"); }}
                  className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Camera size={12} /> Analyse
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-5">
              {[["ordonnances", FileText, "Ordonnances"], ["analyses", FlaskConical, "Analyses"], ["carte", Heart, "Carte médicale"], ["carnet", BookOpen, "Carnet"]].map(([k, Icon, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                    tab === k ? "text-blue-600 border-blue-500" : "text-slate-400 border-transparent hover:text-slate-700"
                  }`}
                >
                  <Icon size={13} /> {l}
                  {k !== "carte" && k !== "carnet" && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      tab === k ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {k === "ordonnances" ? ordonnances.length : analyses.length}
                    </span>
                  )}
                  {k === "carnet" && consultations.length > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      tab === k ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {consultations.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Corps */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="wait">

                {/* Ordonnances */}
                {tab === "ordonnances" && (
                  <motion.div key="ord" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

                    {/* Form upload inline */}
                    <AnimatePresence>
                      {showUploadOrd && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-[13px] font-semibold text-blue-800">Nouvelle ordonnance</div>
                              <button onClick={() => { setShowUploadOrd(false); setOrdFile(null); setOrdPreview(null); }}
                                className="text-blue-400 hover:text-blue-600"><X size={14} /></button>
                            </div>
                            <label htmlFor="ord-file-input"
                              className="block border-2 border-dashed border-blue-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-colors"
                            >
                              {ordPreview ? (
                                <img src={ordPreview} alt="" className="max-h-36 mx-auto rounded-lg object-contain" />
                              ) : ordFile ? (
                                <div className="flex items-center gap-2 justify-center text-[12px] text-blue-700">
                                  <FileText size={16} /> {ordFile.name}
                                </div>
                              ) : (
                                <div className="text-[12px] text-blue-500">
                                  <Upload size={18} className="mx-auto mb-1 text-blue-400" />
                                  Choisir un fichier
                                </div>
                              )}
                            </label>
                            <input id="ord-file-input" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onOrdFile} />
                            {!ordFile && (
                              <>
                                <p className="text-center text-[10px] text-gray-400">— ou —</p>
                                <button type="button"
                                  onClick={() => setShowOrdCam(true)}
                                  className="flex items-center justify-center gap-1.5 py-2 w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-semibold rounded-lg transition-colors"
                                >
                                  <Camera size={13} /> Prendre une photo
                                </button>
                              </>
                            )}
                            <textarea value={ordNotes} onChange={e => setOrdNotes(e.target.value)}
                              placeholder="Notes (optionnel)…" rows={2}
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-blue-400 resize-none"
                            />
                            <button onClick={submitOrd} disabled={savingOrd}
                              className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              {savingOrd ? "Envoi…" : <><Upload size={13} /> Envoyer</>}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {loadingOrd && <div className="text-center py-8 text-[13px] text-slate-400">Chargement…</div>}
                    {!loadingOrd && ordonnances.length === 0 && !showUploadOrd && (
                      <div className="text-center py-10">
                        <FileText size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[13px] text-slate-400">Aucune ordonnance</p>
                      </div>
                    )}
                    {!loadingOrd && ordonnances.map(o => (
                      <div key={o.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                        <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                          onClick={() => setOpenId(openId === o.id ? null : o.id)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {o.fichier ? <Image size={14} className="text-blue-600" /> : <Pill size={14} className="text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] font-semibold text-slate-800">{formatDate(o.date)}</div>
                            <div className="text-[11px] text-slate-500">
                              {o.fichier ? "Photo d'ordonnance" : `${o.drugs.length} médicament(s)`}
                            </div>
                          </div>
                          {o.fichier && (
                            <button onClick={e => { e.stopPropagation(); handleDownload(o.fichier, `ord-${o.id}`); }}
                              className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center text-sky-600 hover:bg-sky-200"
                            >
                              <Download size={11} />
                            </button>
                          )}
                          {openId === o.id ? <ChevronUp size={13} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />}
                        </button>

                        <AnimatePresence>
                          {openId === o.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-3">
                                {o.fichier && (
                                  <>
                                    {isPdf(o.fichier) ? (
                                      <button onClick={() => window.open(fileUrl(o.fichier), "_blank")}
                                        className="flex items-center gap-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-slate-700 hover:bg-gray-50"
                                      >
                                        <FileText size={14} className="text-red-500" /> Ouvrir le PDF
                                      </button>
                                    ) : (
                                      <div onClick={() => setPreview(fileUrl(o.fichier))}
                                        className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                                      >
                                        <img src={fileUrl(o.fichier)} alt="" className="w-full max-h-56 object-contain bg-white" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <Eye size={22} className="text-white drop-shadow" />
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <button onClick={() => handleDownload(o.fichier, `ord-${o.id}`)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-medium rounded-lg transition-colors"
                                      >
                                        <Download size={11} /> Télécharger
                                      </button>
                                      {!isPdf(o.fichier) && (
                                        <button onClick={() => handlePrint(o.fichier)}
                                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 text-[11px] font-medium rounded-lg transition-colors"
                                        >
                                          <Printer size={11} /> Imprimer
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                                {!o.fichier && o.drugs.map((d, i) => (
                                  <div key={i} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2">
                                    <Pill size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <div className="text-[12px] font-medium text-slate-800">{d.name}</div>
                                      <div className="text-[11px] text-slate-500">{d.dosage}{d.duration ? ` · ${d.duration}` : ""}</div>
                                    </div>
                                  </div>
                                ))}
                                {o.notes && (
                                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-800">
                                    Note : {o.notes}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Analyses */}
                {tab === "analyses" && (
                  <motion.div key="ana" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

                    <AnimatePresence>
                      {showUploadAna && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="bg-purple-50 border border-purple-200 rounded-xl overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-[13px] font-semibold text-purple-800">Nouveau résultat d'analyse</div>
                              <button onClick={() => { setShowUploadAna(false); setAnaFile(null); setAnaPreview(null); }}
                                className="text-purple-400 hover:text-purple-600"><X size={14} /></button>
                            </div>
                            <label htmlFor="ana-file-input"
                              className="block border-2 border-dashed border-purple-300 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-100 transition-colors"
                            >
                              {anaPreview ? (
                                <img src={anaPreview} alt="" className="max-h-36 mx-auto rounded-lg object-contain" />
                              ) : anaFile ? (
                                <div className="flex items-center gap-2 justify-center text-[12px] text-purple-700">
                                  <FileText size={16} /> {anaFile.name}
                                </div>
                              ) : (
                                <div className="text-[12px] text-purple-500">
                                  <Upload size={18} className="mx-auto mb-1 text-purple-400" />
                                  Choisir un fichier
                                </div>
                              )}
                            </label>
                            <input id="ana-file-input" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onAnaFile} />
                            {!anaFile && (
                              <>
                                <p className="text-center text-[10px] text-gray-400">— ou —</p>
                                <button type="button"
                                  onClick={() => setShowAnaCam(true)}
                                  className="flex items-center justify-center gap-1.5 py-2 w-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[12px] font-semibold rounded-lg transition-colors"
                                >
                                  <Camera size={13} /> Prendre une photo
                                </button>
                              </>
                            )}
                            <textarea value={anaNotes} onChange={e => setAnaNotes(e.target.value)}
                              placeholder="Notes (optionnel)…" rows={2}
                              className="w-full px-3 py-2 border border-purple-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-purple-400 resize-none"
                            />
                            <button onClick={submitAna} disabled={savingAna}
                              className="w-full h-9 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              {savingAna ? "Envoi…" : <><Upload size={13} /> Envoyer</>}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {loadingAna && <div className="text-center py-8 text-[13px] text-slate-400">Chargement…</div>}
                    {!loadingAna && analyses.length === 0 && !showUploadAna && (
                      <div className="text-center py-10">
                        <FlaskConical size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[13px] text-slate-400">Aucune analyse</p>
                      </div>
                    )}
                    {!loadingAna && analyses.map(a => (
                      <div key={a.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <FlaskConical size={14} className="text-purple-600" />
                            </div>
                            <div>
                              <div className="text-[12px] font-semibold text-slate-800">{formatDate(a.date)}</div>
                              <div className="text-[11px] text-slate-500">Résultat d'analyse</div>
                            </div>
                          </div>
                          <button onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
                            className="w-7 h-7 rounded-lg bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-600"
                          >
                            <Download size={12} />
                          </button>
                        </div>

                        {isPdf(a.fichier) ? (
                          <button onClick={() => window.open(fileUrl(a.fichier), "_blank")}
                            className="flex items-center gap-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-slate-700 hover:bg-gray-50"
                          >
                            <FileText size={14} className="text-red-500" /> Ouvrir le PDF
                          </button>
                        ) : (
                          <div onClick={() => setPreview(fileUrl(a.fichier))}
                            className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                          >
                            <img src={fileUrl(a.fichier)} alt="" className="w-full max-h-56 object-contain bg-white" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Eye size={22} className="text-white drop-shadow" />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-medium rounded-lg transition-colors"
                          >
                            <Download size={11} /> Télécharger
                          </button>
                          {!isPdf(a.fichier) && (
                            <button onClick={() => handlePrint(a.fichier)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-slate-600 text-[11px] font-medium rounded-lg transition-colors"
                            >
                              <Printer size={11} /> Imprimer
                            </button>
                          )}
                        </div>

                        {a.notes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-800">
                            Note : {a.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
                {/* ── CARTE MÉDICALE ── */}
                {tab === "carte" && (() => {
                  const grp  = patientProfil.groupeSanguin || "";
                  const alls = patientProfil.allergies   || [];
                  const ants = patientProfil.antecedents || [];
                  const meds = (ordonnances[0]?.drugs || []).filter(d => d.name);
                  return (
                    <motion.div key="carte" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

                      {/* En-tête */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 p-4 text-white shadow-md shadow-blue-200">
                        <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Heart size={18} className="text-white" />
                          </div>
                          <div>
                            <div className="text-[14px] font-extrabold">{selected?.nom}</div>
                            <div className="text-white/60 text-[11px]">Carte médicale — lecture seule</div>
                          </div>
                        </div>
                      </div>

                      {/* Groupe sanguin */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Droplets size={13} className="text-rose-500" />
                          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Groupe sanguin</span>
                        </div>
                        <div className={`text-[28px] font-extrabold leading-none ${grp ? "text-rose-600" : "text-gray-200"}`}>
                          {grp || "—"}
                        </div>
                        {grp === "O-"  && <span className="text-[10px] bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">Donneur universel</span>}
                        {grp === "AB+" && <span className="text-[10px] bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">Receveur universel</span>}
                      </div>

                      {/* Allergies */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Shield size={13} className="text-amber-500" />
                          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Allergies connues</span>
                        </div>
                        {alls.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {alls.map((al, i) => (
                              <span key={i} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full">{al}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-gray-400 italic">Aucune allergie renseignée</p>
                        )}
                      </div>

                      {/* Antécédents */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Activity size={13} className="text-blue-500" />
                          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Antécédents médicaux</span>
                        </div>
                        {ants.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {ants.map((ant, i) => (
                              <span key={i} className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 font-medium px-2.5 py-0.5 rounded-full">{ant}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-gray-400 italic">Aucun antécédent renseigné</p>
                        )}
                      </div>

                      {/* Traitements — tirés des ordonnances */}
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Pill size={13} className="text-violet-500" />
                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Traitements en cours</span>
                          </div>
                          <span className="text-[10px] text-gray-400">Dernière ordonnance</span>
                        </div>
                        {meds.length > 0 ? (
                          <div className="space-y-1.5">
                            {meds.map((m, i) => (
                              <div key={i} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-2">
                                <Pill size={11} className="text-violet-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-semibold text-gray-800">{m.name}</div>
                                  {(m.dosage || m.duration) && (
                                    <div className="text-[10px] text-gray-500">{m.dosage}{m.duration ? ` · ${m.duration}` : ""}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-gray-400 italic">Aucun traitement enregistré</p>
                        )}
                      </div>

                    </motion.div>
                  );
                })()}

                {/* ── CARNET DE SANTÉ (médecin) ── */}
                {tab === "carnet" && (
                  <motion.div key="carnet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

                    {/* Bouton nouveau compte-rendu */}
                    {!showNewConsult && (
                      <button
                        onClick={() => setShowNewConsult(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-colors"
                      >
                        <Plus size={15} /> Nouveau compte-rendu
                      </button>
                    )}

                    {/* Formulaire compte-rendu */}
                    <AnimatePresence>
                      {showNewConsult && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ClipboardList size={14} className="text-blue-600" />
                                <span className="text-[13px] font-bold text-blue-800">Nouveau compte-rendu</span>
                              </div>
                              <button
                                onClick={() => { setShowNewConsult(false); setConsultForm({ motif: "", diagnostic: "", traitement: "", notes: "" }); }}
                                className="text-blue-400 hover:text-blue-600"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide block mb-1">Motif de consultation</label>
                              <input
                                value={consultForm.motif}
                                onChange={e => setConsultForm(f => ({ ...f, motif: e.target.value }))}
                                placeholder="Ex: Fièvre, douleurs abdominales…"
                                className={INPUT + " bg-white"}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide block mb-1">Diagnostic</label>
                              <textarea
                                value={consultForm.diagnostic}
                                onChange={e => setConsultForm(f => ({ ...f, diagnostic: e.target.value }))}
                                placeholder="Résultat de l'examen clinique…"
                                rows={2}
                                className={INPUT + " bg-white resize-none"}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide block mb-1">Traitement prescrit</label>
                              <textarea
                                value={consultForm.traitement}
                                onChange={e => setConsultForm(f => ({ ...f, traitement: e.target.value }))}
                                placeholder="Médicaments, posologie, durée…"
                                rows={2}
                                className={INPUT + " bg-white resize-none"}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide block mb-1">Notes supplémentaires</label>
                              <textarea
                                value={consultForm.notes}
                                onChange={e => setConsultForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Prochaine visite, recommandations…"
                                rows={2}
                                className={INPUT + " bg-white resize-none"}
                              />
                            </div>

                            <button
                              onClick={submitConsult}
                              disabled={savingConsult}
                              className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                              {savingConsult ? "Enregistrement…" : <><Save size={14} /> Enregistrer dans le carnet</>}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Liste des consultations */}
                    {loadingCarnet && (
                      <div className="text-center py-8 text-[13px] text-slate-400">Chargement…</div>
                    )}

                    {!loadingCarnet && consultations.length === 0 && !showNewConsult && (
                      <div className="text-center py-10">
                        <BookOpen size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[13px] text-slate-400">Aucune consultation enregistrée</p>
                        <p className="text-[11px] text-slate-300 mt-1">Ajoutez un compte-rendu après chaque consultation</p>
                      </div>
                    )}

                    {!loadingCarnet && consultations.map((c, idx) => {
                      const dateAff = c.date
                        ? new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                        : "—";
                      return (
                        <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <ClipboardList size={13} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-slate-800">{dateAff}</div>
                              {c.hopital && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                  <MapPin size={9} /> {c.hopital}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-blue-400 bg-blue-100 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              #{consultations.length - idx}
                            </span>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            {c.motif && (
                              <div className="text-[12px] text-slate-600">
                                <span className="font-semibold text-slate-700">Motif : </span>{c.motif}
                              </div>
                            )}
                            {c.diagnostic && (
                              <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                                <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wide mb-0.5">Diagnostic</div>
                                <div className="text-[12px] text-gray-800">{c.diagnostic}</div>
                              </div>
                            )}
                            {c.traitement && (
                              <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                                <div className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mb-0.5">Traitement</div>
                                <div className="text-[12px] text-gray-800">{c.traitement}</div>
                              </div>
                            )}
                            {c.notes && (
                              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-800">
                                <span className="font-semibold">Note : </span>{c.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Caméras ── */}
      <CameraModal
        isOpen={showOrdCam}
        onClose={() => setShowOrdCam(false)}
        onCapture={(file, url) => { setOrdFile(file); setOrdPreview(url); setShowOrdCam(false); }}
      />
      <CameraModal
        isOpen={showAnaCam}
        onClose={() => setShowAnaCam(false)}
        onCapture={(file, url) => { setAnaFile(file); setAnaPreview(url); setShowAnaCam(false); }}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={preview} alt=""
              className="max-w-full max-h-full rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={() => setPreview(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FolderOpenIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"
    >
      <path d="M3 7c0-1.1.9-2 2-2h4l2 2h8a2 2 0 012 2v2" />
      <path d="M21 17a2 2 0 01-2 2H5a2 2 0 01-2-2l1-8h16l1 8z" />
    </svg>
  );
}
