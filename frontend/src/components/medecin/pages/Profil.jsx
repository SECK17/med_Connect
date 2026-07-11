import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Stethoscope, Building2, Phone, Mail, Hash, Save,
  Pencil, Camera, Lock, CheckCircle2, AlertCircle, Loader2,
  Upload, FileText, X, AlertTriangle,
} from "lucide-react";

const HOPITAUX = [
  "Hôpital Principal de Dakar",
  "CHU de Fann",
  "Hôpital Aristide Le Dantec",
  "Hôpital Général de Grand Yoff (HOGGY)",
  "Hôpital de Pikine",
  "Hôpital Abass Ndao",
  "Hôpital Roi Baudouin (Guédiawaye)",
  "Hôpital de Ouakam",
  "Polyclinique SUMA",
  "Clinique Pasteur",
];

const SPECIALITES = [
  "Généraliste","Cardiologue","Dentiste","Gynécologue","Pédiatre",
  "Dermatologue","Ophtalmologue","ORL","Neurologue","Pneumologue",
  "Gastro-entérologue","Urologue","Psychiatre","Oncologue","Radiologue",
  "Urgentiste","Endocrinologue","Rhumatologue","Néphrologue","Chirurgien",
];

const ANNEE_MIN = 1960;
const ANNEE_MAX = new Date().getFullYear();

const DEFAULT = { nom: "", email: "", telephone: "", specialite: "", numeroOrdre: "", anneeDebutPratique: "", hopital: "" };
const INPUT_EDIT = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function MedecinProfil() {
  const [profile, setProfile] = useState(DEFAULT);
  const [draft,   setDraft]   = useState(DEFAULT);
  const [edit,    setEdit]    = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [savedMsg, setSavedMsg] = useState("Profil mis à jour avec succès !");
  const [error,   setError]   = useState("");
  const [photo,   setPhoto]   = useState(null);

  // Changement d'hôpital
  const [hopitalPending,    setHopitalPending]    = useState(null);
  const [showHopitalChange, setShowHopitalChange] = useState(false);
  const [newHopital,        setNewHopital]        = useState("");
  const [hopitalFile,       setHopitalFile]       = useState(null);
  const [hopitalFileName,   setHopitalFileName]   = useState("");
  const [savingHopital,     setSavingHopital]     = useState(false);

  const fileRef      = useRef();
  const hopitalFileRef = useRef();

  const token  = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/medecins/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          const p = d.profil_medecin || {};
          const data = {
            nom:               d.nom           || sessionStorage.getItem("nom")   || "",
            email:             d.email         || sessionStorage.getItem("email") || "",
            telephone:         d.telephone     || "",
            specialite:        p.specialite    || "",
            numeroOrdre:       p.numLicence    || "",
            anneeDebutPratique: p.experience != null ? String(p.experience) : "",
            hopital:           p.hopital       || "",
          };
          setProfile(data);
          setDraft(data);
        }
      } catch {}

      // Charger la demande en attente depuis le backend
      try {
        const rDem = await fetch("http://localhost:5000/api/demandes-hopital/moi", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rDem.ok) {
          const dem = await rDem.json();
          if (dem) setHopitalPending(dem);
        }
      } catch {}

      setLoading(false);
    };
    load();
    const savedPhoto = localStorage.getItem("medconnect_medecin_photo");
    if (savedPhoto) setPhoto(savedPhoto);
  }, []);

  const calcExperience = (annee) => {
    if (!annee) return null;
    const y = parseInt(annee);
    if (isNaN(y) || y < ANNEE_MIN || y > ANNEE_MAX) return null;
    return ANNEE_MAX - y;
  };

  const startEdit  = () => { setDraft({ ...profile }); setEdit(true); setError(""); };
  const cancelEdit = () => setEdit(false);

  const handleSave = async () => {
    setError(""); setSaving(true);
    try {
      const { anneeDebutPratique, ...rest } = draft;
      const res = await fetch(`http://localhost:5000/api/medecins/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...rest, experience: anneeDebutPratique }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      sessionStorage.setItem("nom", draft.nom);
      setProfile({ ...draft });
      setEdit(false);
      showSaved("Profil mis à jour avec succès !");
    } catch (err) {
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const showSaved = (msg = "Profil mis à jour avec succès !") => {
    setSavedMsg(msg);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPhoto(ev.target.result);
      localStorage.setItem("medconnect_medecin_photo", ev.target.result);
    };
    reader.readAsDataURL(f);
  };

  const onHopitalFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setHopitalFile(f);
    setHopitalFileName(f.name);
  };

  const submitHopitalChange = async () => {
    if (!newHopital) return;
    if (!hopitalFile) return setError("Veuillez joindre un document justificatif.");
    setSavingHopital(true);
    try {
      const fd = new FormData();
      fd.append("hopital_actuel",  profile.hopital || "");
      fd.append("hopital_demande", newHopital);
      fd.append("justificatif",    hopitalFile);

      const res = await fetch("http://localhost:5000/api/demandes-hopital", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      const demande = await res.json();
      setHopitalPending(demande);
      setShowHopitalChange(false);
      setNewHopital("");
      setHopitalFile(null);
      setHopitalFileName("");
      showSaved("Demande de changement envoyée — en attente de validation.");
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi");
    } finally {
      setSavingHopital(false);
    }
  };

  const annulerDemandeHopital = async () => {
    try {
      await fetch("http://localhost:5000/api/demandes-hopital/moi", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setHopitalPending(null);
  };

  const p   = edit ? draft : profile;
  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const experience = calcExperience(p.anneeDebutPratique);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── HERO ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-200"
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight">Mon profil</h1>
            <p className="text-blue-100 text-[13px] mt-0.5">Informations professionnelles</p>
          </div>
          {!edit && (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Pencil size={13} /> Modifier
            </button>
          )}
        </div>
      </motion.div>

      {/* Banners */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-[13px] px-4 py-3 rounded-lg"
          >
            <CheckCircle2 size={14} /> {savedMsg}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-lg"
          >
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo + identité */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {photo
              ? <img src={photo} alt="profil" className="w-20 h-20 rounded-full object-cover border-2 border-blue-100" />
              : <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-3xl font-bold">
                  {p.nom?.[0]?.toUpperCase() || "D"}
                </div>
            }
            {edit && (
              <>
                <button type="button" onClick={() => fileRef.current.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Camera size={12} />
                </button>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhoto} />
              </>
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">Dr. {p.nom || "—"}</div>
            <div className="text-[13px] text-blue-600 font-medium mt-0.5">{p.specialite || "Médecin"} · MedConnect</div>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-1"><Mail size={12} /> {p.email || "—"}</div>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5"><Phone size={12} /> {p.telephone || "—"}</div>
            {experience != null && (
              <span className="inline-flex items-center gap-1 mt-2 bg-blue-50 text-blue-700 text-[12px] font-medium px-3 py-1 rounded-full border border-blue-100">
                {experience} ans d'expérience
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
          <User size={14} className="text-blue-600" /> Informations générales
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Nom — modifiable */}
          <div>
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Nom complet</label>
            {edit ? (
              <input type="text" value={p.nom} onChange={e => set("nom", e.target.value)} className={INPUT_EDIT} />
            ) : (
              <div className="text-[13px] text-gray-900 py-2 border-b border-gray-100">{p.nom || "—"}</div>
            )}
          </div>

          {/* Téléphone — modifiable */}
          <div>
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Téléphone</label>
            {edit ? (
              <input type="tel" value={p.telephone} onChange={e => set("telephone", e.target.value)} className={INPUT_EDIT} />
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
                <Phone size={12} className="text-gray-400" /> {p.telephone || "—"}
              </div>
            )}
          </div>

          {/* Email — toujours verrouillé */}
          <div className="sm:col-span-2">
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
              Email <Lock size={9} className="text-gray-300" />
            </label>
            {edit ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                <Mail size={12} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-[13px] text-gray-600">{p.email || "—"}</span>
                <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
                <Mail size={12} className="text-gray-400" /> {p.email || "—"}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Informations médicales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
          <Stethoscope size={14} className="text-blue-600" /> Informations médicales
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Spécialité — verrouillée une fois définie */}
          <div className="sm:col-span-2">
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
              Spécialité {profile.specialite && <Lock size={9} className="text-gray-300" />}
            </label>
            {edit ? (
              profile.specialite ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <Stethoscope size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-[13px] text-gray-700">{profile.specialite}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
                </div>
              ) : (
                <select value={p.specialite} onChange={e => set("specialite", e.target.value)} className={INPUT_EDIT}>
                  <option value="">Choisir une spécialité</option>
                  {SPECIALITES.map(s => <option key={s}>{s}</option>)}
                </select>
              )
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
                <Stethoscope size={12} className="text-gray-400" /> {p.specialite || "—"}
              </div>
            )}
          </div>

          {/* Numéro d'ordre — verrouillé une fois défini */}
          <div>
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
              Numéro d'ordre {profile.numeroOrdre && <Lock size={9} className="text-gray-300" />}
            </label>
            {edit ? (
              profile.numeroOrdre ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <Hash size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-[13px] text-gray-700">{profile.numeroOrdre}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
                </div>
              ) : (
                <input value={p.numeroOrdre} onChange={e => set("numeroOrdre", e.target.value)} placeholder="SN-XXXXX" className={INPUT_EDIT} />
              )
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
                <Hash size={12} className="text-gray-400" /> {p.numeroOrdre || "—"}
              </div>
            )}
          </div>

          {/* Année de début de pratique — verrouillée une fois définie */}
          <div>
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
              Année de début de pratique {profile.anneeDebutPratique && <Lock size={9} className="text-gray-300" />}
            </label>
            {edit ? (
              profile.anneeDebutPratique ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex-1">
                    <div className="text-[13px] text-gray-700 font-semibold">Depuis {ANNEE_MAX - parseInt(profile.anneeDebutPratique)} · {profile.anneeDebutPratique} ans de pratique</div>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Non modifiable</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="number"
                    min={ANNEE_MIN}
                    max={ANNEE_MAX}
                    value={p.anneeDebutPratique}
                    onChange={e => set("anneeDebutPratique", e.target.value)}
                    placeholder={`Ex: ${ANNEE_MAX - 10}`}
                    className={INPUT_EDIT}
                  />
                  <p className="text-[10px] text-amber-600">⚠ Une fois définie, cette année ne pourra plus être modifiée</p>
                </div>
              )
            ) : (
              <div className="text-[13px] text-gray-900 py-2 border-b border-gray-100">
                {p.anneeDebutPratique
                  ? `Depuis ${ANNEE_MAX - parseInt(p.anneeDebutPratique)} · ${p.anneeDebutPratique} ans de pratique`
                  : "—"}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Hôpital d'exercice */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
          <Building2 size={14} className="text-blue-600" /> Hôpital d'exercice
        </div>

        {/* Demande en attente */}
        {hopitalPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
              <AlertTriangle size={14} className="text-amber-500" /> Demande en attente de validation
            </div>
            <div className="text-[12px] text-amber-700">
              Changement demandé vers : <strong>{hopitalPending.hopitalDemande}</strong>
            </div>
            <div className="text-[11px] text-amber-600">
              Justificatif : {hopitalPending.justificatif} · Soumis le {new Date(hopitalPending.date).toLocaleDateString("fr-FR")}
            </div>
            <button
              onClick={annulerDemandeHopital}
              className="text-[11px] text-red-500 hover:text-red-700 underline"
            >
              Annuler la demande
            </button>
          </motion.div>
        )}

        {/* Hôpital actuel */}
        <div>
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Hôpital / Clinique actuel</label>

          {/* Mode lecture ou édition sans hôpital défini */}
          {!edit && (
            <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
              <Building2 size={12} className="text-gray-400" /> {p.hopital || "—"}
            </div>
          )}

          {/* Mode édition — premier hôpital (pas encore défini) */}
          {edit && !profile.hopital && (
            <>
              <select value={p.hopital} onChange={e => set("hopital", e.target.value)} className={INPUT_EDIT}>
                <option value="">Choisir un hôpital</option>
                {HOPITAUX.map(h => <option key={h}>{h}</option>)}
              </select>
              <p className="text-[11px] text-gray-400 mt-1.5">Visible par les patients sur votre fiche.</p>
            </>
          )}

          {/* Mode édition — hôpital déjà défini → demande de changement */}
          {edit && profile.hopital && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-[13px] text-gray-700">{profile.hopital}</span>
                {hopitalPending
                  ? <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-medium flex-shrink-0">En attente</span>
                  : <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Actuel</span>
                }
              </div>

              {!hopitalPending && !showHopitalChange && (
                <button
                  onClick={() => setShowHopitalChange(true)}
                  className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Demander un changement d'hôpital →
                </button>
              )}

              {/* Formulaire demande de changement */}
              <AnimatePresence>
                {showHopitalChange && !hopitalPending && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-blue-800">Demande de changement d'hôpital</span>
                        <button onClick={() => { setShowHopitalChange(false); setNewHopital(""); setHopitalFile(null); setHopitalFileName(""); }}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide block mb-1">Nouvel hôpital</label>
                        <select value={newHopital} onChange={e => setNewHopital(e.target.value)} className={INPUT_EDIT + " bg-white"}>
                          <option value="">Choisir…</option>
                          {HOPITAUX.filter(h => h !== profile.hopital).map(h => <option key={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide block mb-1">
                          Justificatif <span className="text-red-500">*</span>
                        </label>
                        <div
                          onClick={() => hopitalFileRef.current.click()}
                          className="border-2 border-dashed border-blue-200 rounded-xl p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-100 transition-colors"
                        >
                          {hopitalFileName ? (
                            <div className="flex items-center gap-2 justify-center text-[12px] text-blue-700">
                              <FileText size={14} /> {hopitalFileName}
                            </div>
                          ) : (
                            <div className="text-[12px] text-blue-500">
                              <Upload size={18} className="mx-auto mb-1 text-blue-400" />
                              Lettre d'affectation, contrat ou attestation
                            </div>
                          )}
                        </div>
                        <input ref={hopitalFileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={onHopitalFile} />
                      </div>

                      <button
                        onClick={submitHopitalChange}
                        disabled={savingHopital || !newHopital || !hopitalFile}
                        className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        {savingHopital ? "Envoi…" : <><Upload size={13} /> Soumettre la demande</>}
                      </button>
                      <p className="text-[10px] text-blue-500 text-center">
                        Le changement sera effectif après validation par l'administration.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Boutons save/cancel */}
      <AnimatePresence>
        {edit && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            <button onClick={handleSave} disabled={saving}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> Enregistrer</>}
            </button>
            <button onClick={cancelEdit}
              className="px-6 h-11 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sécurité */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
          <Lock size={14} className="text-blue-600" /> Sécurité
        </div>
        <div className="flex gap-3">
          <button className="text-[13px] border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
            Changer le mot de passe
          </button>
          <button className="text-[13px] border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
            Supprimer mon compte
          </button>
        </div>
      </div>

    </div>
  );
}
