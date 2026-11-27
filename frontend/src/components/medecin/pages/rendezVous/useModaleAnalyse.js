// Fenêtre « Nouvelle analyse » : photo/PDF du résultat, envoi.
import { useState } from "react";
import { API_URL } from "../../../../config.js";

export default function useModaleAnalyse({ showToast, token }) {
  /* ── Modal analyse ── */
  const [analyseModal,   setAnalyseModal]   = useState(null);
  const [analyseFile,    setAnalyseFile]    = useState(null);
  const [analysePreview, setAnalysePreview] = useState(null);
  const [analyseNotes,   setAnalyseNotes]   = useState("");
  const [savingAnalyse,  setSavingAnalyse]  = useState(false);

  const [showAnalyseCam, setShowAnalyseCam] = useState(false);

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

  return {
    analyseModal,
    setAnalyseModal,
    analyseFile,
    setAnalyseFile,
    analysePreview,
    setAnalysePreview,
    analyseNotes,
    setAnalyseNotes,
    savingAnalyse,
    setSavingAnalyse,
    showAnalyseCam,
    setShowAnalyseCam,
    openAnalyse,
    onAnalyseFile,
    submitAnalyse,
  };
}
