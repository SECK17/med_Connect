// Message de confirmation ou d'erreur affiché quelques secondes en haut à droite.
import { useState } from "react";

export default function useToast() {
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  return {
    toast,
    setToast,
    showToast,
  };
}
