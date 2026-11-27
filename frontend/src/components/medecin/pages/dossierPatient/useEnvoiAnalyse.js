// Envoi d'un résultat d'analyse en photo ou PDF pour le patient sélectionné.
import { useState } from "react";
import { API } from "./constantes.js";

export default function useEnvoiAnalyse({ showToast, selected, token, loadAnalyses }) {
  // Upload analyse
  const [showUploadAna, setShowUploadAna] = useState(false);
  const [anaFile, setAnaFile]             = useState(null);
  const [anaPreview, setAnaPreview]       = useState(null);
  const [anaNotes, setAnaNotes]           = useState("");
  const [savingAna, setSavingAna]         = useState(false);

  const [showAnaCam, setShowAnaCam] = useState(false);

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

  return {
    showUploadAna,
    setShowUploadAna,
    anaFile,
    setAnaFile,
    anaPreview,
    setAnaPreview,
    anaNotes,
    setAnaNotes,
    savingAna,
    setSavingAna,
    showAnaCam,
    setShowAnaCam,
    onAnaFile,
    submitAna,
  };
}
