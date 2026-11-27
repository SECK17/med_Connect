import { useState, useEffect } from "react";
import CameraModal from "../../CameraModal";
import { motion, AnimatePresence } from "motion/react";
import { Search, User, FileText, FlaskConical, ChevronRight, Camera, CheckCircle2, Heart, BookOpen } from "lucide-react";
import { API } from "./dossierPatient/constantes.js";
import useCarnet from "./dossierPatient/useCarnet";
import useEnvoiOrdonnance from "./dossierPatient/useEnvoiOrdonnance";
import useEnvoiAnalyse from "./dossierPatient/useEnvoiAnalyse";
import OngletOrdonnances from "./dossierPatient/OngletOrdonnances";
import OngletAnalyses from "./dossierPatient/OngletAnalyses";
import OngletCarte from "./dossierPatient/OngletCarte";
import OngletCarnet from "./dossierPatient/OngletCarnet";

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

  const [toast, setToast] = useState(null);

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

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const etatCarnet = useCarnet({ token, showToast, selected });
  const { setPatientProfil, setConsultations, setShowNewConsult, setConsultForm, loadPatientProfil, loadCarnet, consultations } = etatCarnet;

  const etatEnvoiOrd = useEnvoiOrdonnance({ showToast, selected, token, loadOrdonnances });
  const { setShowUploadOrd, showOrdCam, setShowOrdCam, setOrdFile, setOrdPreview } = etatEnvoiOrd;
  const etatEnvoiAna = useEnvoiAnalyse({ showToast, selected, token, loadAnalyses });
  const { setShowUploadAna, showAnaCam, setShowAnaCam, setAnaFile, setAnaPreview } = etatEnvoiAna;

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
                  <OngletOrdonnances key="ord" {...etatEnvoiOrd} loadingOrd={loadingOrd} ordonnances={ordonnances} setOpenId={setOpenId} openId={openId} setPreview={setPreview} />
                )}

                {/* Analyses */}
                {tab === "analyses" && (
                  <OngletAnalyses key="ana" {...etatEnvoiAna} loadingAna={loadingAna} analyses={analyses} setPreview={setPreview} />
                )}
                {/* ── CARTE MÉDICALE ── */}
                {tab === "carte" && <OngletCarte key="carte" {...etatCarnet} ordonnances={ordonnances} selected={selected} />}

                {/* ── CARNET DE SANTÉ (médecin) ── */}
                {tab === "carnet" && (
                  <OngletCarnet key="carnet" {...etatCarnet} />
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
