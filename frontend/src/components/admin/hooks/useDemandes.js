// Demandes de changement d'hôpital des médecins : liste filtrée, validation, rejet.
import { useState } from "react";
import { API_URL } from "../../../config.js";

export default function useDemandes({ token, showToast }) {
  // Demandes changement hôpital
  const [demandes, setDemandes]           = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(false);
  const [demandeFilter, setDemandeFilter] = useState("en_attente");
  const [rejetModal, setRejetModal]       = useState(null);
  const [rejetMotif, setRejetMotif]       = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDemandes = async (statut = "en_attente") => {
    setLoadingDemandes(true);
    try {
      const res = await fetch(`${API_URL}/api/demandes-hopital?statut=${statut}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDemandes(await res.json());
    } catch {}
    finally { setLoadingDemandes(false); }
  };

  const validerDemande = async (id) => {
    setActionLoading(id + "_val");
    try {
      const res = await fetch(`${API_URL}/api/demandes-hopital/${id}/valider`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Demande validée — hôpital mis à jour !"); fetchDemandes(demandeFilter); }
      else { const d = await res.json(); showToast(d.message, "error"); }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setActionLoading(null); }
  };

  const rejeterDemande = async () => {
    const id = rejetModal?.id;
    if (!id) return;
    setActionLoading(id + "_rej");
    try {
      const res = await fetch(`${API_URL}/api/demandes-hopital/${id}/rejeter`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ motif: rejetMotif }),
      });
      if (res.ok) {
        showToast("Demande rejetée.", "info");
        setRejetModal(null);
        setRejetMotif("");
        fetchDemandes(demandeFilter);
      } else { const d = await res.json(); showToast(d.message, "error"); }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setActionLoading(null); }
  };

  return {
    demandes,
    setDemandes,
    loadingDemandes,
    setLoadingDemandes,
    demandeFilter,
    setDemandeFilter,
    rejetModal,
    setRejetModal,
    rejetMotif,
    setRejetMotif,
    actionLoading,
    setActionLoading,
    fetchDemandes,
    validerDemande,
    rejeterDemande,
  };
}
