// Fenêtre « Nouvelle ordonnance » : photo/PDF ou saisie des médicaments, envoi.
import { useState } from "react";
import { API_URL } from "../../../../config.js";

export default function useModaleOrdonnance({ showToast, token }) {
  /* ── Modal ordonnance ── */
  const [prescModal,   setPrescModal]   = useState(null); // { patientId, patientNom }
  const [prescMode,    setPrescMode]    = useState("photo");
  const [prescFile,    setPrescFile]    = useState(null);
  const [prescPreview, setPrescPreview] = useState(null);
  const [meds,  setMeds]  = useState([{ nom: "", dosage: "", duree: "" }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [showPrescCam,   setShowPrescCam]   = useState(false);

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

  return {
    prescModal,
    setPrescModal,
    prescMode,
    setPrescMode,
    prescFile,
    setPrescFile,
    prescPreview,
    setPrescPreview,
    meds,
    setMeds,
    notes,
    setNotes,
    saving,
    setSaving,
    showPrescCam,
    setShowPrescCam,
    openPresc,
    onPrescFile,
    submitPhotoPresc,
    addMed,
    removeMed,
    updateMed,
    submitTextPresc,
  };
}
