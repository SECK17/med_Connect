import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, AlertCircle, Loader2, Heart } from "lucide-react";
import { API_URL } from "../../config.js";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token    = params.get("token") || "";
  const [status, setStatus]   = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Lien invalide : aucun token fourni.");
  const sent = useRef(false); // évite le double appel en mode StrictMode

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        setStatus(res.ok ? "success" : "error");
        setMessage(data.message);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Impossible de contacter le serveur.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-blue-100 p-12 max-w-md w-full text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart size={15} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">MedConnect</span>
        </div>

        {status === "loading" && (
          <>
            <Loader2 size={40} className="text-blue-600 animate-spin mx-auto mb-6" />
            <p className="text-gray-500 text-[14px]">Vérification de votre email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Email confirmé</h2>
            <p className="text-gray-500 text-[14px] leading-relaxed mb-8">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Vérification impossible</h2>
            <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
              {message} Vous pouvez demander un nouveau lien depuis la page de connexion.
            </p>
          </>
        )}

        {status !== "loading" && (
          <Link
            to="/login"
            className="block w-full h-12 leading-[3rem] bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
          >
            Aller à la connexion
          </Link>
        )}
      </motion.div>
    </div>
  );
}
