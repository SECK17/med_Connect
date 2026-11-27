import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Search, Clock, CheckCircle2, X, FilePlus,
  FlaskConical, Camera, FileText, Upload, Plus, Trash2,
  LayoutList, CalendarRange, ChevronLeft, ChevronRight, User,
} from "lucide-react";
import CameraModal from "../../CameraModal";
import { API_URL } from "../../../config.js";

const STATUT_CFG = {
  en_attente: { label: "En attente", bg: "bg-amber-100",   text: "text-amber-700"   },
  transfere:  { label: "Transmis",   bg: "bg-blue-100",    text: "text-blue-700"    },
  confirme:   { label: "Confirmé",   bg: "bg-emerald-100", text: "text-emerald-700" },
  annule:     { label: "Annulé",     bg: "bg-red-100",     text: "text-red-600"     },
};

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function MedecinRendezVous() {
  const [rdvs,    setRdvs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("confirme");
  const [search,  setSearch]  = useState("");
  const [view,    setView]    = useState("liste"); // "liste" | "agenda"
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semaine courante

  /* ── Modal ordonnance ── */
  const [prescModal,   setPrescModal]   = useState(null); // { patientId, patientNom }
  const [prescMode,    setPrescMode]    = useState("photo");
  const [prescFile,    setPrescFile]    = useState(null);
  const [prescPreview, setPrescPreview] = useState(null);
  const [meds,  setMeds]  = useState([{ nom: "", dosage: "", duree: "" }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Modal analyse ── */
  const [analyseModal,   setAnalyseModal]   = useState(null);
  const [analyseFile,    setAnalyseFile]    = useState(null);
  const [analysePreview, setAnalysePreview] = useState(null);
  const [analyseNotes,   setAnalyseNotes]   = useState("");
  const [savingAnalyse,  setSavingAnalyse]  = useState(false);

  const [toast, setToast] = useState(null);
  const [dossierModal, setDossierModal] = useState(null); // rdv complet
  const [showPrescCam,   setShowPrescCam]   = useState(false);
  const [showAnalyseCam, setShowAnalyseCam] = useState(false);

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

  /* ── Ordonnance ── */
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
    setPrescPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const submitPhotoPresc = async () => {
    if (!prescFile) return showToast("Sélectionnez une photo", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fichier", prescFile);
      fd.append("patient_id", prescModal.patientId);
      if (notes.trim()) fd.append("notes", notes.trim());
      const res = await fetch(`${API_URL}/api/ordonnances/upload`, {
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
      const res = await fetch(`${API_URL}/api/ordonnances`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id:  prescModal.patientId,
          medicaments: valid,
          notes:       notes.trim() || null,
          date:        new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) throw new Error();
      showToast(`Ordonnance envoyée à ${prescModal.patientNom}`);
      setPrescModal(null);
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally { setSaving(false); }
  };

  /* ── Analyse ── */
  const openAnalyse = (rdv) => {
    const u = rdv.patient?.user || {};
    setAnalyseModal({ patientId: rdv.patient_id, patientNom: u.nom || "Patient" });
    setAnalyseFile(null); setAnalysePreview(null); setAnalyseNotes("");
  };

  const onAnalyseFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAnalyseFile(f);
    setAnalysePreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const submitAnalyse = async () => {
    if (!analyseFile) return showToast("Sélectionnez une photo", "error");
    setSavingAnalyse(true);
    try {
      const fd = new FormData();
      fd.append("fichier", analyseFile);
      fd.append("patient_id", analyseModal.patientId);
      if (analyseNotes.trim()) fd.append("notes", analyseNotes.trim());
      const res = await fetch(`${API_URL}/api/analyses/upload`, {
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
        {filtered.map((r, i) => {
          const u   = r.patient?.user || {};
          const cfg = STATUT_CFG[r.statut] || STATUT_CFG.en_attente;
          const isToday = r.date_rdv?.split("T")[0] === today;
          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-white border rounded-2xl p-4 hover:shadow-sm transition-all ${isToday ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200"}`}
            >
              <div className="flex items-start gap-3">
                {/* Bloc date */}
                <div className={`text-center px-3 py-2 rounded-xl min-w-[54px] flex-shrink-0 ${isToday ? "bg-emerald-600" : "bg-blue-600"}`}>
                  <div className="text-[18px] font-extrabold text-white leading-none">
                    {r.date_rdv ? new Date(r.date_rdv).getDate() : "—"}
                  </div>
                  <div className="text-[9px] font-semibold text-white/80 uppercase mt-0.5">
                    {r.date_rdv ? new Date(r.date_rdv).toLocaleDateString("fr-FR", { month: "short" }) : ""}
                  </div>
                </div>

                {/* Infos + Actions */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {/* Infos */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold text-gray-900">{u.nom || "Patient inconnu"}</span>
                      {isToday && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Aujourd'hui</span>}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={9}/> {r.heure || "—"}</span>
                      {r.motif && <span className="truncate">· {r.motif}</span>}
                    </div>
                    {u.email && <div className="text-[11px] text-gray-400 mt-0.5">{u.email}</div>}
                  </div>

                  {/* Actions — full width on mobile, right-aligned on desktop */}
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setDossierModal(r)}
                      className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-semibold px-2.5 py-2 rounded-lg transition-colors flex-1 sm:flex-none"
                    >
                      <User size={11}/> Dossier
                    </button>
                    <button
                      onClick={() => openPresc(r)}
                      className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2.5 py-2 rounded-lg transition-colors flex-1 sm:flex-none"
                    >
                      <FilePlus size={11}/> Ordonnance
                    </button>
                    <button
                      onClick={() => openAnalyse(r)}
                      className="flex items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-semibold px-2.5 py-2 rounded-lg transition-colors flex-1 sm:flex-none"
                    >
                      <FlaskConical size={11}/> Analyse
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>}

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
                      <label htmlFor="rdv-presc-file"
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
                      <input id="rdv-presc-file" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onPrescFile} />
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
                  )}

                  {/* Notes */}
                  <div>
                    <label className="text-[13px] font-semibold text-gray-700 block mb-1.5">Notes / Conseils</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Instructions particulières…"
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
                  <label htmlFor="rdv-analyse-file"
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
                  <input id="rdv-analyse-file" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={onAnalyseFile} />
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

      {/* ── Modal dossier patient ── */}
      <AnimatePresence>
        {dossierModal && (() => {
          const u = dossierModal.patient?.user || {};
          const p = dossierModal.patient || {};
          const age = p.dateNaissance
            ? new Date().getFullYear() - new Date(p.dateNaissance).getFullYear()
            : null;
          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40" onClick={() => setDossierModal(null)} />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 px-5 pt-5 pb-8 max-w-lg mx-auto"
              >
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[18px] font-bold text-blue-700">{(u.nom || "P")[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-bold text-gray-900">{u.nom || "Patient inconnu"}</div>
                    <div className="text-[12px] text-gray-400">{u.email || ""}</div>
                  </div>
                  <button onClick={() => setDossierModal(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <InfoTile label="Groupe sanguin" value={p.groupeSanguin || "—"} highlight={!!p.groupeSanguin} />
                  <InfoTile label="Âge" value={age ? `${age} ans` : "—"} />
                  <InfoTile label="Téléphone" value={u.telephone || "—"} />
                  <InfoTile label="Adresse" value={p.adresse || "—"} />
                </div>

                {p.groupeSanguin && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[12px] text-red-700 font-medium">
                    🩸 Groupe sanguin : <strong>{p.groupeSanguin}</strong>
                  </div>
                )}
              </motion.div>
            </>
          );
        })()}
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

function InfoTile({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className={`text-[14px] font-bold ${highlight ? "text-red-600" : "text-gray-800"}`}>{value}</div>
    </div>
  );
}

/* ── Composant Agenda Visuel ─────────────────────────────────────────── */
const HEURES = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
                "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

const STATUT_COLOR = {
  confirme:   "bg-emerald-500 text-white border-emerald-600",
  transfere:  "bg-blue-500 text-white border-blue-600",
  en_attente: "bg-amber-400 text-white border-amber-500",
  annule:     "bg-red-400 text-white border-red-500",
};

function AgendaView({ rdvs, weekOffset, setWeekOffset }) {
  const [detail, setDetail] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lundi de la semaine courante + offset
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const isToday = (d) => d.toDateString() === new Date().toDateString();

  // Utilise les composantes locales pour éviter le décalage UTC
  const isoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Normalise "08h00" → "08:00" et "08:00" → "08:00"
  const normalizeH = (h) => (h || "").replace("h", ":").slice(0, 5);

  const rdvsByDay = (day) =>
    rdvs.filter(r => r.date_rdv?.split("T")[0] === isoDate(day) && r.statut !== "annule")
        .sort((a, b) => normalizeH(a.heure).localeCompare(normalizeH(b.heure)));

  const weekLabel = `Semaine du ${days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au ${days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Navigation semaine */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-bold text-gray-900">{weekLabel}</div>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[11px] text-blue-600 hover:underline">
              Revenir à cette semaine
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Grille */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* En-têtes jours */}
          <div className="grid grid-cols-8 border-b border-gray-100">
            <div className="py-3 px-2 text-[10px] text-gray-400 font-semibold text-center" />
            {days.map((d, i) => (
              <div key={i} className={`py-3 px-2 text-center border-l border-gray-100 ${isToday(d) ? "bg-blue-50" : ""}`}>
                <div className={`text-[11px] font-semibold uppercase ${isToday(d) ? "text-blue-600" : "text-gray-400"}`}>
                  {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div className={`text-[18px] font-extrabold leading-none mt-0.5 ${isToday(d) ? "text-blue-700" : "text-gray-800"}`}>
                  {d.getDate()}
                </div>
                {rdvsByDay(d).length > 0 && (
                  <div className="mt-1">
                    <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                      {rdvsByDay(d).length}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Lignes horaires */}
          {HEURES.map((heure) => (
            <div key={heure} className="grid grid-cols-8 border-b border-gray-50 min-h-[44px]">
              <div className="py-2 px-2 text-[10px] text-gray-400 font-semibold text-right pr-3 flex-shrink-0 self-start pt-2.5">
                {heure}
              </div>
              {days.map((d, i) => {
                const rdvsIci = rdvsByDay(d).filter(r => normalizeH(r.heure) === heure);
                return (
                  <div key={i} className={`border-l border-gray-100 py-1 px-1 ${isToday(d) ? "bg-blue-50/30" : ""}`}>
                    {rdvsIci.map(r => {
                      const u = r.patient?.user || {};
                      const colorCls = STATUT_COLOR[r.statut] || STATUT_COLOR.en_attente;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setDetail(r)}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-semibold border truncate leading-tight ${colorCls} hover:opacity-90 transition-opacity`}
                        >
                          {u.nom || "Patient"}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal détail RDV */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40" onClick={() => setDetail(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[15px] font-bold text-gray-900">Détail du rendez-vous</div>
                  <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div><span className="text-gray-500">Patient :</span> <span className="font-semibold text-gray-900">{detail.patient?.user?.nom || "—"}</span></div>
                  <div><span className="text-gray-500">Date :</span> <span className="font-semibold">{detail.date_rdv ? new Date(detail.date_rdv).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "—"}</span></div>
                  <div><span className="text-gray-500">Heure :</span> <span className="font-semibold">{detail.heure || "—"}</span></div>
                  <div><span className="text-gray-500">Statut :</span> <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${STATUT_CFG[detail.statut]?.bg} ${STATUT_CFG[detail.statut]?.text}`}>{STATUT_CFG[detail.statut]?.label}</span></div>
                  {detail.motif && <div><span className="text-gray-500">Motif :</span> <span className="text-gray-700 italic">"{detail.motif}"</span></div>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
