import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, KeyRound, AlertCircle, CheckCircle, Heart, ArrowLeft } from "lucide-react";
import { API_URL } from "../../config.js";

const inputClass =
  "w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-blue-50/50 focus:bg-white transition-colors";

export default function ResetPassword() {
  const [params]  = useSearchParams();
  const token     = params.get("token") || "";
  const navigate  = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState(token ? "" : "Lien invalide : aucun token fourni.");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-100 p-10"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart size={15} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">MedConnect</span>
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">Nouveau mot de passe</h2>
        <p className="text-gray-400 text-sm mb-8">Choisissez un mot de passe d'au moins 8 caractères.</p>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-[13px] border bg-red-50 border-red-200 text-red-700">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {success ? (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-[13px] border bg-green-50 border-green-200 text-green-700">
            <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />
            <div className="font-medium">{success} Redirection…</div>
          </div>
        ) : token && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={8} autoComplete="new-password" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••" required minLength={8} autoComplete="new-password" className={inputClass} />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 shadow-md shadow-blue-200"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><KeyRound size={16} /> Modifier le mot de passe</>
              }
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          {!success && error && error.includes("expiré") && (
            <Link to="/forgot-password" className="block mb-3 text-blue-600 font-semibold hover:text-blue-700">
              Refaire une demande
            </Link>
          )}
          <Link to="/login" className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700">
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
