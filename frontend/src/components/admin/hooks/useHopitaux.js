// Hôpitaux : liste, statistiques, fiche détaillée, création/modification/suppression, admins d'hôpital.
import { useState } from "react";
import { API_URL } from "../../../config.js";
import { signalerErreur } from "../../../utils/erreurs.js";

export default function useHopitaux({ token, showToast }) {
  // Hôpitaux
  const [hopitaux, setHopitaux]               = useState([]);
  const [selectedHopital, setSelectedHopital] = useState(null);
  const [hopitalTab, setHopitalTab]           = useState("admin");
  const [hopitalMedecins, setHopitalMedecins] = useState([]);
  const [hopitalPatients, setHopitalPatients] = useState([]);
  const [loadingHop, setLoadingHop]           = useState(false);
  const [hopitalAdmins, setHopitalAdmins]     = useState([]);
  const [showHopAdminCreate, setShowHopAdminCreate] = useState(false);

  // Stats RDV par hôpital { [hopital_id]: { total, confirme, en_attente, annule } }
  const [hopitauxRdvStats, setHopitauxRdvStats] = useState({});
  // Stats RDV détaillées pour le drawer hôpital sélectionné
  const [hopRdvStats, setHopRdvStats] = useState(null);

  // Gestion CRUD hôpitaux
  const [hopitalModal, setHopitalModal]     = useState(null); // null | { mode: 'create'|'edit', data: {} }
  const [hopitalForm, setHopitalForm]       = useState({ nom: "", type: "Hôpital", ville: "", telephone: "", adresse: "" });
  const [savingHop, setSavingHop]           = useState(false);
  const [deletingHop, setDeletingHop]       = useState(null);

  // Formulaire création admin hôpital (inline dans le panel hôpital)
  const [createForm, setCreateForm]   = useState({ nom: "", email: "", password: "", telephone: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const fetchHopitauxRdvStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hopitaux/rdv-stats-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach(s => { map[s.hopital_id] = s; });
        setHopitauxRdvStats(map);
      }
    } catch (err) { signalerErreur(err); }
  };

  const fetchHopitaux = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hopitaux`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHopitaux(await res.json());
    } catch (err) { signalerErreur(err); }
  };

  const selectHopital = async (hop) => {
    setSelectedHopital(hop);
    setHopitalTab("admin");
    setShowHopAdminCreate(false);
    setCreateForm({ nom: "", email: "", password: "", telephone: "" });
    setHopitalMedecins([]);
    setHopitalPatients([]);
    setHopRdvStats(null);
    setLoadingHop(true);
    try {
      const [rMed, rPat, rRdv] = await Promise.all([
        fetch(`${API_URL}/api/hopitaux/${hop.id}/medecins`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/hopitaux/${hop.id}/patients`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/hopitaux/${hop.id}/rdv-stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (rMed.ok) setHopitalMedecins(await rMed.json());
      if (rPat.ok) setHopitalPatients(await rPat.json());
      if (rRdv.ok) setHopRdvStats(await rRdv.json());
    } catch (err) { signalerErreur(err); }
    setLoadingHop(false);
  };

  const openCreateHopital = () => {
    setHopitalForm({ nom: "", type: "Hôpital", ville: "", telephone: "", adresse: "" });
    setHopitalModal({ mode: "create" });
  };

  const openEditHopital = (hop) => {
    setHopitalForm({ nom: hop.nom, type: hop.type, ville: hop.ville, telephone: hop.telephone || "", adresse: hop.adresse || "" });
    setHopitalModal({ mode: "edit", id: hop.id });
  };

  const saveHopital = async () => {
    if (!hopitalForm.nom || !hopitalForm.ville) return showToast("Nom et ville requis.", "error");
    setSavingHop(true);
    try {
      const isEdit = hopitalModal.mode === "edit";
      const url    = isEdit ? `${API_URL}/api/hopitaux/${hopitalModal.id}` : `${API_URL}/api/hopitaux`;
      const res = await fetch(url, {
        method:  isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify(hopitalForm),
      });
      if (res.ok) {
        showToast(isEdit ? "Hôpital mis à jour !" : "Hôpital créé !");
        setHopitalModal(null);
        fetchHopitaux();
      } else {
        const d = await res.json();
        showToast(d.message || "Erreur", "error");
      }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setSavingHop(false); }
  };

  const deleteHopital = async (id) => {
    setDeletingHop(id);
    try {
      const res = await fetch(`${API_URL}/api/hopitaux/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok) { showToast("Hôpital supprimé.", "info"); fetchHopitaux(); setSelectedHopital(null); }
      else showToast(d.message, "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setDeletingHop(null); }
  };

  const fetchHopitalAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHopitalAdmins(await res.json());
    } catch (err) { signalerErreur(err); }
  };

  const createAdminHop = async () => {
    if (!createForm.nom || !createForm.email || !createForm.password || !selectedHopital) return;
    setCreatingAdmin(true);
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, hopital_id: selectedHopital.id }),
      });
      if (res.ok) {
        showToast("Admin créé avec succès !");
        setShowHopAdminCreate(false);
        setCreateForm({ nom: "", email: "", password: "", telephone: "" });
        fetchHopitalAdmins();
      } else {
        const d = await res.json();
        showToast(d.message || "Erreur lors de la création", "error");
      }
    } catch { showToast("Erreur réseau", "error"); }
    finally { setCreatingAdmin(false); }
  };

  const deleteAdminHop = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin-hopital/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Admin retiré.", "info"); fetchHopitalAdmins(); }
      else { const d = await res.json(); showToast(d.message || "Erreur", "error"); }
    } catch { showToast("Erreur réseau", "error"); }
  };

  return {
    hopitaux,
    setHopitaux,
    selectedHopital,
    setSelectedHopital,
    hopitalTab,
    setHopitalTab,
    hopitalMedecins,
    setHopitalMedecins,
    hopitalPatients,
    setHopitalPatients,
    loadingHop,
    setLoadingHop,
    hopitalAdmins,
    setHopitalAdmins,
    showHopAdminCreate,
    setShowHopAdminCreate,
    hopitauxRdvStats,
    setHopitauxRdvStats,
    hopRdvStats,
    setHopRdvStats,
    hopitalModal,
    setHopitalModal,
    hopitalForm,
    setHopitalForm,
    savingHop,
    setSavingHop,
    deletingHop,
    setDeletingHop,
    createForm,
    setCreateForm,
    creatingAdmin,
    setCreatingAdmin,
    fetchHopitauxRdvStats,
    fetchHopitaux,
    selectHopital,
    openCreateHopital,
    openEditHopital,
    saveHopital,
    deleteHopital,
    fetchHopitalAdmins,
    createAdminHop,
    deleteAdminHop,
  };
}
