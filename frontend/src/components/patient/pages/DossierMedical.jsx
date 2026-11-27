import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, FlaskConical, Pill, Download, Search,
  ChevronDown, ChevronUp, Printer, Image, Eye,
  Heart, Shield, Droplets, Activity, BookOpen,
  Stethoscope, MapPin, ClipboardList,
  Share2, UserCheck, Trash2, Plus, X, Loader2,
} from "lucide-react";
import { API_URL } from "../../../config.js";

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
  const [partages, setPartages]             = useState([]);
  const [loadingPartages, setLoadingPartages] = useState(true);
  const [medecinsListe, setMedecinsListe]   = useState([]);
  const [showModal, setShowModal]           = useState(false);
  const [partageSearch, setPartageSearch]   = useState("");
  const [partageLoading, setPartageLoading] = useState(false);

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

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

  const fetchPartages = () => {
    fetch(`${API}/api/partages/patient/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setPartages)
      .catch(() => {})
      .finally(() => setLoadingPartages(false));
  };

  const fetchMedecins = () => {
    fetch(`${API}/api/medecins`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setMedecinsListe)
      .catch(() => {});
  };

  const addPartage = async (medecinId) => {
    setPartageLoading(true);
    try {
      const res = await fetch(`${API}/api/partages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ medecin_id: medecinId }),
      });
      if (res.ok) { fetchPartages(); setShowModal(false); setPartageSearch(""); }
    } catch {}
    setPartageLoading(false);
  };

  const revoquerPartage = async (partageId) => {
    await fetch(`${API}/api/partages/${partageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPartages();
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

  const filteredPresc = prescriptions.filter(p =>
    p.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    p.drugs.some(d => d.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredAnalyses = analyses.filter(a =>
    a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    (a.notes || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Carte médicale ──
  const nom         = sessionStorage.getItem("nom") || "Patient";
  const profil      = JSON.parse(localStorage.getItem("medconnect_profile") || "{}");
  const groupe      = profil.bloodGroup || profil.groupeSanguin || "Non renseigné";
  const allergies   = Array.isArray(profil.allergies)   ? profil.allergies   : [];
  const antecedents = Array.isArray(profil.antecedents) ? profil.antecedents : [];
  const medsEnCours = (prescriptions[0]?.drugs || []).filter(d => d.name);

  const downloadCarte = () => {
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const content = [
      "╔══════════════════════════════════════╗",
      "║         CARTE MÉDICALE               ║",
      "║            MedConnect                ║",
      "╚══════════════════════════════════════╝",
      "",
      `Patient      : ${nom}`,
      `Généré le    : ${date}`,
      "",
      "────────── DONNÉES DE SANTÉ ───────────",
      `Groupe sanguin   : ${groupe}`,
      `Allergies        : ${allergies.length > 0 ? allergies.join(", ") : "Aucune"}`,
      `Antécédents      : ${antecedents.length > 0 ? antecedents.join(", ") : "Aucun"}`,
      `Traitements      : ${medsEnCours.length > 0 ? medsEnCours.map(m => m.name).join(", ") : "Aucun en cours"}`,
      "",
      "───────────────────────────────────────",
      "Document confidentiel — MedConnect",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.download = `carte-medicale-${nom.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          <motion.div key="ord" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {loading && (
              <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
            )}
            {!loading && filteredPresc.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
                <FileText size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-500 font-medium">Aucune ordonnance pour l'instant</p>
                <p className="text-[12px] text-gray-400 mt-1">Vos ordonnances apparaîtront ici après votre consultation</p>
              </div>
            )}
            {!loading && filteredPresc.map(p => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setOpenPrescId(openPrescId === p.id ? null : p.id)}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    {p.fichier ? <Image size={16} className="text-blue-600" /> : <FileText size={16} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900">{p.doctorName}</div>
                    <div className="text-[12px] text-gray-500">
                      {formatDate(p.date)}
                      {p.fichier ? " · Photo" : ` · ${p.drugs.length} médicament(s)`}
                    </div>
                  </div>
                  {/* Action rapide download */}
                  {p.fichier && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDownload(p.fichier, `ordonnance-${p.id}`); }}
                      className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"
                      title="Télécharger"
                    >
                      <Download size={13} />
                    </button>
                  )}
                  {openPrescId === p.id ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {openPrescId === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">

                        {/* Affichage photo */}
                        {p.fichier && (
                          <div className="space-y-2">
                            {isPdf(p.fichier) ? (
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                                <FileText size={24} className="text-red-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="text-[13px] font-medium text-gray-800">Document PDF</div>
                                  <div className="text-[11px] text-gray-500">Cliquez pour ouvrir</div>
                                </div>
                                <button onClick={() => window.open(fileUrl(p.fichier), "_blank")}
                                  className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg"
                                >
                                  <Eye size={12} /> Ouvrir
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => setPreview(fileUrl(p.fichier))}
                                className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                              >
                                <img
                                  src={fileUrl(p.fichier)}
                                  alt="ordonnance"
                                  className="w-full max-h-72 object-contain bg-gray-50"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Eye size={28} className="text-white drop-shadow" />
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => handleDownload(p.fichier, `ordonnance-${p.id}`)}
                                className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-medium transition-colors"
                              >
                                <Download size={13} /> Télécharger
                              </button>
                              {!isPdf(p.fichier) && (
                                <button onClick={() => handlePrint(p.fichier)}
                                  className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[12px] font-medium transition-colors"
                                >
                                  <Printer size={13} /> Imprimer
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Médicaments texte (si pas de photo) */}
                        {!p.fichier && p.drugs.length > 0 && (
                          <div className="space-y-2">
                            {p.drugs.map((d, i) => (
                              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                                <Pill size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-[13px] font-medium text-gray-900">{d.name}</div>
                                  <div className="text-[12px] text-gray-500">{d.dosage}{d.duration ? ` · ${d.duration}` : ""}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {p.notes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[12px] text-amber-800">
                            Note : {p.notes}
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

        {/* ── ANALYSES ── */}
        {tab === "analyses" && (
          <motion.div key="lab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {loadingAnalyses && (
              <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
            )}
            {!loadingAnalyses && filteredAnalyses.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
                <FlaskConical size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-500 font-medium">Aucune analyse pour l'instant</p>
                <p className="text-[12px] text-gray-400 mt-1">Vos résultats apparaîtront ici après votre consultation</p>
              </div>
            )}
            {!loadingAnalyses && filteredAnalyses.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FlaskConical size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-900">{a.doctorName}</div>
                    <div className="text-[12px] text-gray-500">{formatDate(a.date)} · Résultat d'analyse</div>
                  </div>
                  <button
                    onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
                    className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0"
                    title="Télécharger"
                  >
                    <Download size={13} />
                  </button>
                </div>

                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  {isPdf(a.fichier) ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                      <FileText size={24} className="text-red-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-gray-800">Document PDF</div>
                        <div className="text-[11px] text-gray-500">Cliquez pour ouvrir</div>
                      </div>
                      <button onClick={() => window.open(fileUrl(a.fichier), "_blank")}
                        className="flex items-center gap-1 text-[12px] text-purple-600 hover:text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg"
                      >
                        <Eye size={12} /> Ouvrir
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setPreview(fileUrl(a.fichier))}
                      className="relative rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                    >
                      <img
                        src={fileUrl(a.fichier)}
                        alt="analyse"
                        className="w-full max-h-72 object-contain bg-gray-50"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye size={28} className="text-white drop-shadow" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => handleDownload(a.fichier, `analyse-${a.id}`)}
                      className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[12px] font-medium transition-colors"
                    >
                      <Download size={13} /> Télécharger
                    </button>
                    {!isPdf(a.fichier) && (
                      <button onClick={() => handlePrint(a.fichier)}
                        className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[12px] font-medium transition-colors"
                      >
                        <Printer size={13} /> Imprimer
                      </button>
                    )}
                  </div>

                  {a.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[12px] text-amber-800">
                      Note du médecin : {a.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── CARTE MÉDICALE ── */}
        {tab === "carte" && (
          <motion.div key="carte" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Hero + download */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Heart size={15} className="text-white/80" />
                    <span className="text-[13px] font-semibold text-white/80">Carte médicale</span>
                  </div>
                  <div className="text-[20px] font-extrabold tracking-tight">{nom}</div>
                  <div className="text-white/60 text-[11px] mt-0.5">Résumé de santé personnel</div>
                </div>
                <button
                  onClick={downloadCarte}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                >
                  <Download size={13} /> Télécharger
                </button>
              </div>
            </div>

            {/* Groupe sanguin */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={15} className="text-rose-500" />
                <span className="text-[13px] font-bold text-gray-800">Groupe sanguin</span>
              </div>
              <div className="flex items-end gap-3">
                <div className={`text-[36px] font-extrabold leading-none ${groupe !== "Non renseigné" ? "text-rose-600" : "text-gray-200"}`}>
                  {groupe}
                </div>
                {groupe === "O-"  && <span className="text-[11px] bg-rose-100 text-rose-600 font-semibold px-2.5 py-0.5 rounded-full mb-1">Donneur universel</span>}
                {groupe === "AB+" && <span className="text-[11px] bg-rose-100 text-rose-600 font-semibold px-2.5 py-0.5 rounded-full mb-1">Receveur universel</span>}
              </div>
              {groupe === "Non renseigné" && (
                <p className="text-[11px] text-gray-400 mt-1">À compléter dans Mon profil → Informations médicales</p>
              )}
            </div>

            {/* Allergies */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={15} className="text-amber-500" />
                <span className="text-[13px] font-bold text-gray-800">Allergies connues</span>
              </div>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((al, i) => (
                    <span key={i} className="text-[12px] bg-amber-50 text-amber-700 border border-amber-200 font-medium px-3 py-1 rounded-full">{al}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">Aucune allergie renseignée</p>
              )}
            </div>

            {/* Antécédents */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={15} className="text-blue-500" />
                <span className="text-[13px] font-bold text-gray-800">Antécédents médicaux</span>
              </div>
              {antecedents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {antecedents.map((ant, i) => (
                    <span key={i} className="text-[12px] bg-blue-50 text-blue-700 border border-blue-100 font-medium px-3 py-1 rounded-full">{ant}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">Aucun antécédent renseigné</p>
              )}
            </div>

            {/* Traitements en cours */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pill size={15} className="text-violet-500" />
                  <span className="text-[13px] font-bold text-gray-800">Traitements en cours</span>
                </div>
                <span className="text-[10px] text-gray-400">Dernière ordonnance</span>
              </div>
              {medsEnCours.length > 0 ? (
                <div className="space-y-2">
                  {medsEnCours.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2.5">
                      <Pill size={12} className="text-violet-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-gray-800">{m.name}</div>
                        {(m.dosage || m.duration) && (
                          <div className="text-[11px] text-gray-500">{m.dosage}{m.duration ? ` · ${m.duration}` : ""}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-gray-400 italic">Aucun traitement en cours</p>
              )}
            </div>

            {/* Lien profil */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
              <p className="text-[12px] text-blue-600">
                Complétez votre carte dans <strong>Mon profil → Informations médicales</strong>
              </p>
            </div>
          </motion.div>
        )}

        {/* ── CARNET DE SANTÉ ── */}
        {tab === "carnet" && (
          <motion.div key="carnet" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-[16px] font-extrabold tracking-tight">Carnet de santé</div>
                  <div className="text-white/60 text-[11px]">
                    {consultations.length} consultation{consultations.length !== 1 ? "s" : ""} enregistrée{consultations.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>

            {loadingCarnet && (
              <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
            )}

            {!loadingCarnet && consultations.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen size={24} className="text-blue-300" />
                </div>
                <p className="text-[13px] font-semibold text-gray-500">Carnet vide pour l'instant</p>
                <p className="text-[12px] text-gray-400 mt-1">Vos consultations apparaîtront ici après chaque visite</p>
              </div>
            )}

            {/* Timeline */}
            {!loadingCarnet && consultations.map((c, idx) => {
              const medecinNom = c.medecin?.user?.nom || "Médecin";
              const dateAff = c.date
                ? new Date(c.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : "—";
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* En-tête consultation */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-gray-900 capitalize">{dateAff}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                          <Stethoscope size={10} /> Dr. {medecinNom}
                        </span>
                        {c.hopital && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <MapPin size={9} /> {c.hopital}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Numéro de visite */}
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      Visite #{consultations.length - idx}
                    </span>
                  </div>

                  {/* Corps */}
                  <div className="px-4 py-3 space-y-2.5">
                    {c.motif && (
                      <div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Motif de consultation</div>
                        <div className="text-[13px] text-gray-700">{c.motif}</div>
                      </div>
                    )}
                    {c.diagnostic && (
                      <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                        <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wide mb-0.5">Diagnostic</div>
                        <div className="text-[13px] text-gray-800 font-medium">{c.diagnostic}</div>
                      </div>
                    )}
                    {c.traitement && (
                      <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                        <div className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mb-0.5">Traitement prescrit</div>
                        <div className="text-[13px] text-gray-800">{c.traitement}</div>
                      </div>
                    )}
                    {c.notes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Notes du médecin</div>
                        <div className="text-[12px] text-amber-800">{c.notes}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        {/* ── PARTAGES ── */}
        {tab === "partages" && (
          <motion.div key="partages" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Share2 size={15} className="text-white/80" />
                    <span className="text-[13px] font-semibold text-white/80">Partage de dossier</span>
                  </div>
                  <div className="text-[17px] font-extrabold tracking-tight">Accès médecins</div>
                  <div className="text-white/60 text-[11px] mt-0.5">
                    {partages.length} médecin{partages.length !== 1 ? "s ont" : " a"} accès à votre dossier
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                >
                  <Plus size={13} /> Partager
                </button>
              </div>
            </div>

            {/* Explication */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[12px] text-blue-700">
              Comme un carnet rouge que vous tendez à un nouveau médecin — il pourra voir votre carte médicale, carnet de santé et ordonnances.
            </div>

            {/* Liste des partages */}
            {loadingPartages && (
              <div className="bg-white border border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">Chargement…</div>
            )}

            {!loadingPartages && partages.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <UserCheck size={24} className="text-blue-300" />
                </div>
                <p className="text-[13px] font-semibold text-gray-500">Aucun partage actif</p>
                <p className="text-[12px] text-gray-400 mt-1">Cliquez sur "Partager" pour donner accès à un médecin</p>
              </div>
            )}

            {!loadingPartages && partages.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-gray-200 rounded-xl flex items-center gap-4 px-4 py-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-[14px] flex items-center justify-center flex-shrink-0">
                  {(p.medecin?.nom || "M")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900">Dr. {p.medecin?.nom || "—"}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {p.medecin?.profil_medecin?.specialite && (
                      <span className="flex items-center gap-1 text-[11px] text-blue-600">
                        <Stethoscope size={9} /> {p.medecin.profil_medecin.specialite}
                      </span>
                    )}
                    {p.medecin?.profil_medecin?.hopital && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <MapPin size={9} /> {p.medecin.profil_medecin.hopital}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-300 mt-0.5">
                    Depuis le {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <button
                  onClick={() => revoquerPartage(p.id)}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 border border-red-100"
                >
                  <Trash2 size={11} /> Révoquer
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Modal partage ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Share2 size={15} className="text-blue-600" />
                  <span className="text-[15px] font-bold text-gray-900">Partager mon dossier</span>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Rechercher un médecin…"
                    value={partageSearch}
                    onChange={e => setPartageSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {medecinsListe
                    .filter(m =>
                      (m.nom || "").toLowerCase().includes(partageSearch.toLowerCase()) ||
                      (m.specialite || "").toLowerCase().includes(partageSearch.toLowerCase())
                    )
                    .filter(m => !partages.some(p => String(p.medecin_id) === String(m.id)))
                    .map(m => (
                      <button
                        key={m.id}
                        onClick={() => addPartage(m.id)}
                        disabled={partageLoading}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-[13px] flex items-center justify-center flex-shrink-0">
                          {(m.nom || "M")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-gray-900">Dr. {m.nom}</div>
                          <div className="text-[11px] text-blue-500">{m.specialite || "Généraliste"}{m.hopital ? ` · ${m.hopital}` : ""}</div>
                        </div>
                        {partageLoading
                          ? <Loader2 size={14} className="animate-spin text-gray-300 flex-shrink-0" />
                          : <Plus size={14} className="text-blue-400 flex-shrink-0" />
                        }
                      </button>
                    ))
                  }
                  {medecinsListe.filter(m =>
                    (m.nom || "").toLowerCase().includes(partageSearch.toLowerCase()) &&
                    !partages.some(p => String(p.medecin_id) === String(m.id))
                  ).length === 0 && (
                    <p className="text-center text-[12px] text-gray-400 py-6">Aucun médecin trouvé</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
