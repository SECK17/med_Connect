// Partage du dossier avec des médecins : liste, recherche d'un médecin, ajout, révocation.
import { useState } from "react";
import { API_URL } from "../../../../config.js";
import { signalerErreur } from "../../../../utils/erreurs.js";

export default function usePartages({ userId, token }) {
  const [partages, setPartages]             = useState([]);
  const [loadingPartages, setLoadingPartages] = useState(true);
  const [medecinsListe, setMedecinsListe]   = useState([]);
  const [showModal, setShowModal]           = useState(false);
  const [partageSearch, setPartageSearch]   = useState("");
  const [partageLoading, setPartageLoading] = useState(false);

  const fetchPartages = () => {
    fetch(`${API_URL}/api/partages/patient/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setPartages)
      .catch(() => {})
      .finally(() => setLoadingPartages(false));
  };

  const fetchMedecins = () => {
    fetch(`${API_URL}/api/medecins`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setMedecinsListe)
      .catch(() => {});
  };

  const addPartage = async (medecinId) => {
    setPartageLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/partages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ medecin_id: medecinId }),
      });
      if (res.ok) { fetchPartages(); setShowModal(false); setPartageSearch(""); }
    } catch (err) { signalerErreur(err); }
    setPartageLoading(false);
  };

  const revoquerPartage = async (partageId) => {
    await fetch(`${API_URL}/api/partages/${partageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPartages();
  };

  return {
    partages,
    setPartages,
    loadingPartages,
    setLoadingPartages,
    medecinsListe,
    setMedecinsListe,
    showModal,
    setShowModal,
    partageSearch,
    setPartageSearch,
    partageLoading,
    setPartageLoading,
    fetchPartages,
    fetchMedecins,
    addPartage,
    revoquerPartage,
  };
}
