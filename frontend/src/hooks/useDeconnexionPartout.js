// Déconnexion de tous les appareils du compte, puis retour à la page de connexion avec un message.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deconnexionPartout } from "../auth.js";

export const MESSAGE_DECONNEXION_PARTOUT = "Vous avez été déconnecté de tous vos appareils. Reconnectez-vous pour continuer.";

export default function useDeconnexionPartout() {
  const navigate = useNavigate();
  const [enCours, setEnCours] = useState(false);
  const deconnecterPartout = async () => {
    setEnCours(true);
    await deconnexionPartout();
    navigate("/login", { replace: true, state: { message: MESSAGE_DECONNEXION_PARTOUT } });
  };
  return { enCours, deconnecterPartout };
}
