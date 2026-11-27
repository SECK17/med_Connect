import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { FlaskConical, Pill, Search, Heart, BookOpen, Share2 } from "lucide-react";
import { API_URL } from "../../../config.js";
import usePartages from "./dossierMedical/usePartages";
import useCarteMedicale from "./dossierMedical/useCarteMedicale";
import OngletOrdonnances from "./dossierMedical/OngletOrdonnances";
import OngletAnalyses from "./dossierMedical/OngletAnalyses";
import OngletCarte from "./dossierMedical/OngletCarte";
import OngletCarnet from "./dossierMedical/OngletCarnet";
import OngletPartages from "./dossierMedical/OngletPartages";
import ModalePartage from "./dossierMedical/ModalePartage";

const API = API_URL;

export default function DossierMedical() {
  const location = useLocation();
  const [tab, setTab]                   = useState(location.state?.tab || "ordonnances");
  const [prescriptions, setPrescriptions] = useState([]);
  const [analyses, setAnalyses]           = useState([]);
  const [search, setSearch]               = useState("");
  const [openPrescId, setOpenPrescId]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [consultations, setConsultations]   = useState([]);
  const [loadingCarnet, setLoadingCarnet]   = useState(true);
  const [preview, setPreview]               = useState(null);

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");
  const etatPartages = usePartages({ userId, token });
  const { fetchPartages, fetchMedecins } = etatPartages;

  useEffect(() => {
    if (!token || !userId) { setLoading(false); setLoadingAnalyses(false); setLoadingCarnet(false); return; }
    fetchOrdonnances();
    fetchAnalyses();
    fetchCarnet();
    fetchPartages();
    fetchMedecins();
  }, []);

  const fetchOrdonnances = () => {
    fetch(`${API}/api/ordonnances/patient/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setPrescriptions(data.map(o => ({
          id: String(o.id),
          doctorName: o.medecin?.user?.nom ? `Dr. ${o.medecin.user.nom}` : "Médecin",
          date: o.date,
          notes: o.notes || "",
          fichier: o.fichier || null,
          drugs: (o.medicaments || []).map(m => ({
            name: m.nom || m.name || "",
            dosage: m.dosage || "",
            duration: m.duree || m.duration || "",
          })),
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchCarnet = () => {
    fetch(`${API}/api/consultations/patient/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setConsultations(data))
      .catch(() => {})
      .finally(() => setLoadingCarnet(false));
  };

  const fetchAnalyses = () => {
    fetch(`${API}/api/analyses/patient/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setAnalyses(data.map(a => ({
          id: String(a.id),
          doctorName: a.medecin?.user?.nom ? `Dr. ${a.medecin.user.nom}` : "Médecin",
          date: a.date,
          notes: a.notes || "",
          fichier: a.fichier,
        })));
      })
      .catch(() => {})
      .finally(() => setLoadingAnalyses(false));
  };

  const filteredPresc = prescriptions.filter(p =>
    p.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    p.drugs.some(d => d.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredAnalyses = analyses.filter(a =>
    a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    (a.notes || "").toLowerCase().includes(search.toLowerCase())
  );

  const etatCarte = useCarteMedicale({ prescriptions });

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Dossier médical</h1>
          <p className="text-sm text-gray-500 mt-1">Vos documents et résultats de santé</p>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[["ordonnances", Pill, "Ordonnances"], ["analyses", FlaskConical, "Analyses"], ["carte", Heart, "Carte médicale"], ["carnet", BookOpen, "Carnet de santé"], ["partages", Share2, "Partages"]].map(([k, Icon, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors flex-shrink-0 whitespace-nowrap ${
              tab === k ? "text-blue-600 border-blue-600" : "text-gray-500 border-transparent hover:text-gray-800"
            }`}
          >
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── ORDONNANCES ── */}
        {tab === "ordonnances" && (
          <OngletOrdonnances key="ord" loading={loading} filteredPresc={filteredPresc} setOpenPrescId={setOpenPrescId} openPrescId={openPrescId} setPreview={setPreview} />
        )}

        {/* ── ANALYSES ── */}
        {tab === "analyses" && (
          <OngletAnalyses key="lab" loadingAnalyses={loadingAnalyses} filteredAnalyses={filteredAnalyses} setPreview={setPreview} />
        )}

        {/* ── CARTE MÉDICALE ── */}
        {tab === "carte" && (
          <OngletCarte key="carte" {...etatCarte} />
        )}

        {/* ── CARNET DE SANTÉ ── */}
        {tab === "carnet" && (
          <OngletCarnet key="carnet" consultations={consultations} loadingCarnet={loadingCarnet} />
        )}
        {/* ── PARTAGES ── */}
        {tab === "partages" && (
          <OngletPartages key="partages" {...etatPartages} />
        )}

      </AnimatePresence>

      {/* ── Modal partage ── */}
      <ModalePartage {...etatPartages} />

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setPreview(null)}
            >
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                src={preview}
                alt="aperçu"
                className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
                onClick={e => e.stopPropagation()}
              />
              <button
                onClick={() => setPreview(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
              >
                ✕
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
