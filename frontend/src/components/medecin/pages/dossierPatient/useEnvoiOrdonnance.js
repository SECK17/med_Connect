// Envoi d'une ordonnance en photo ou PDF pour le patient sélectionné.
import { useState } from "react";
import { API } from "./constantes.js";

export default function useEnvoiOrdonnance({ showToast, selected, token, loadOrdonnances }) {
  // Upload ordonnance
  const [showUploadOrd, setShowUploadOrd] = useState(false);
  const [ordFile, setOrdFile]             = useState(null);
  const [ordPreview, setOrdPreview]       = useState(null);
  const [ordNotes, setOrdNotes]           = useState("");
  const [savingOrd, setSavingOrd]         = useState(false);

  const [showOrdCam, setShowOrdCam] = useState(false);

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

  return {
    showUploadOrd,
    setShowUploadOrd,
    ordFile,
    setOrdFile,
    ordPreview,
    setOrdPreview,
    ordNotes,
    setOrdNotes,
    savingOrd,
    setSavingOrd,
    showOrdCam,
    setShowOrdCam,
    onOrdFile,
    submitOrd,
  };
}
