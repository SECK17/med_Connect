import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Mail, Save, Pencil, Camera, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { API_URL } from "../../../config.js";
import DeconnexionPartout from "../../DeconnexionPartout.jsx";
import { signalerErreur } from "../../../utils/erreurs.js";
import { ANNEE_MIN, ANNEE_MAX, DEFAULT } from "./profil/constantes.js";
import InfosGenerales from "./profil/InfosGenerales";
import InfosMedicales from "./profil/InfosMedicales";
import HopitalExercice from "./profil/HopitalExercice";

export default function MedecinProfil() {
  const [profile, setProfile] = useState(DEFAULT);
  const [draft,   setDraft]   = useState(DEFAULT);
  const [edit,    setEdit]    = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [savedMsg, setSavedMsg] = useState("Profil mis à jour avec succès !");
  const [error,   setError]   = useState("");
  const [photo,   setPhoto]   = useState(() => localStorage.getItem("medconnect_medecin_photo") || null);

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
        const res = await fetch(`${API_URL}/api/medecins/${userId}`, {
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
      } catch (err) { signalerErreur(err); }

      // Charger la demande en attente depuis le backend
      try {
        const rDem = await fetch(`${API_URL}/api/demandes-hopital/moi`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rDem.ok) {
          const dem = await rDem.json();
          if (dem) setHopitalPending(dem);
        }
      } catch (err) { signalerErreur(err); }

      setLoading(false);
    };
    load();
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
      const res = await fetch(`${API_URL}/api/medecins/${userId}`, {
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

      const res = await fetch(`${API_URL}/api/demandes-hopital`, {
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
      await fetch(`${API_URL}/api/demandes-hopital/moi`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) { signalerErreur(err); }
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
      <InfosGenerales edit={edit} p={p} set={set} />

      {/* Informations médicales */}
      <InfosMedicales profile={profile} edit={edit} p={p} set={set} />

      {/* Hôpital d'exercice */}
      <HopitalExercice hopitalPending={hopitalPending} annulerDemandeHopital={annulerDemandeHopital} edit={edit} p={p} profile={profile} set={set} showHopitalChange={showHopitalChange} setShowHopitalChange={setShowHopitalChange} setNewHopital={setNewHopital} setHopitalFile={setHopitalFile} setHopitalFileName={setHopitalFileName} newHopital={newHopital} hopitalFileRef={hopitalFileRef} hopitalFileName={hopitalFileName} onHopitalFile={onHopitalFile} submitHopitalChange={submitHopitalChange} savingHopital={savingHopital} hopitalFile={hopitalFile} />

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

      {/* Déconnexion de tous les appareils */}
      <DeconnexionPartout />
    </div>
  );
}
