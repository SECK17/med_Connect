// Alertes de don de sang de tous les hôpitaux.
import { useState } from "react";
import { API_URL } from "../../../config.js";
import { signalerErreur } from "../../../utils/erreurs.js";

export default function useAlertesSang({ token }) {
  // Don de sang global
  const [allAlertes, setAllAlertes]         = useState([]);
  const [loadingAlertes, setLoadingAlertes] = useState(false);
  const [alerteFilter, setAlerteFilter]     = useState("active");

  const fetchAllAlertes = async () => {
    setLoadingAlertes(true);
    try {
      const res = await fetch(`${API_URL}/api/alertes-sang/toutes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAllAlertes(await res.json());
    } catch (err) { signalerErreur(err); }
    finally { setLoadingAlertes(false); }
  };

  return {
    allAlertes,
    setAllAlertes,
    loadingAlertes,
    setLoadingAlertes,
    alerteFilter,
    setAlerteFilter,
    fetchAllAlertes,
  };
}
