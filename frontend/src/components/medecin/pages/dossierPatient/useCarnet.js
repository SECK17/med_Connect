// Carnet de santé et profil médical du patient sélectionné : chargement, nouveau compte-rendu de consultation.
import { useState } from "react";
import { API } from "./constantes.js";

export default function useCarnet({ token, showToast, selected }) {
  const [patientProfil, setPatientProfil]   = useState({});
  const [consultations, setConsultations]   = useState([]);
  const [loadingCarnet, setLoadingCarnet]   = useState(false);
  const [showNewConsult, setShowNewConsult] = useState(false);
  const [savingConsult, setSavingConsult]   = useState(false);
  const [consultForm, setConsultForm]       = useState({ motif: "", diagnostic: "", traitement: "", notes: "" });

  const loadCarnet = (pid) => {
    setLoadingCarnet(true);
    fetch(`${API}/api/consultations/patient/${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setConsultations(data))
      .catch(() => {})
      .finally(() => setLoadingCarnet(false));
  };

  const submitConsult = async () => {
    if (!consultForm.motif && !consultForm.diagnostic) {
      return showToast("Remplissez au moins le motif ou le diagnostic.", "error");
    }
    setSavingConsult(true);
    try {
      const medecinProfil = JSON.parse(localStorage.getItem("medconnect_medecin_profil") || "{}");
      const res = await fetch(`${API}/api/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: selected.id,
          hopital:    medecinProfil.hopital || "",
          motif:      consultForm.motif,
          diagnostic: consultForm.diagnostic,
          traitement: consultForm.traitement,
          notes:      consultForm.notes,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Compte-rendu enregistré dans le carnet");
      setShowNewConsult(false);
      setConsultForm({ motif: "", diagnostic: "", traitement: "", notes: "" });
      loadCarnet(selected.id);
    } catch {
      showToast("Erreur lors de l'enregistrement.", "error");
    } finally {
      setSavingConsult(false);
    }
  };

  const loadPatientProfil = (pid) => {
    fetch(`${API}/api/patients/${pid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const p = data.profil_patient || data.profil || data;
        setPatientProfil({
          groupeSanguin: p.groupeSanguin || p.groupe_sanguin || "",
          allergies:     Array.isArray(p.allergies)   ? p.allergies   : [],
          antecedents:   Array.isArray(p.antecedents) ? p.antecedents : [],
        });
      })
      .catch(() => {});
  };

  return {
    patientProfil,
    setPatientProfil,
    consultations,
    setConsultations,
    loadingCarnet,
    setLoadingCarnet,
    showNewConsult,
    setShowNewConsult,
    savingConsult,
    setSavingConsult,
    consultForm,
    setConsultForm,
    loadCarnet,
    submitConsult,
    loadPatientProfil,
  };
}
