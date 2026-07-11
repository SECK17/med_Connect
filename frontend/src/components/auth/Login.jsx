import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, LogIn, AlertCircle, Clock, Heart, Stethoscope, Shield } from "lucide-react";

export default function Login() {
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setPending(false); setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      sessionStorage.setItem("token",  data.token);
      sessionStorage.setItem("role",   data.user.role);
      sessionStorage.setItem("nom",    data.user.nom);
      sessionStorage.setItem("email",  data.user.email);
      sessionStorage.setItem("userId", data.user.id);

      if (data.user.role === "admin")        navigate("/dashboard");
      else if (data.user.role === "medecin") navigate("/dashboard/medecin/accueil");
      else if (data.user.role === "donneur") navigate("/dashboard/donneur/don-sang");
      else                                   navigate("/dashboard/patient/accueil");
    } catch (err) {
      const msg = err.message || "Erreur de connexion";
      setError(msg);
      if (msg.includes("attente") || msg.includes("validation")) setPending(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── PANNEAU GAUCHE — bleu foncé (thème patient) ── */}
      <div className="hidden lg:flex w-[45%] bg-blue-700 flex-col justify-between px-14 py-12 relative overflow-hidden">
        {/* Déco */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -left-10 w-52 h-52 rounded-full bg-blue-600/60" />
        <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-blue-800/60" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
            <Heart size={20} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">MedConnect</span>
        </div>

        {/* Texte principal */}
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Votre santé,<br />notre priorité.
          </h1>
          <p className="text-blue-100 text-[15px] leading-relaxed max-w-sm">
            Connectez-vous à votre espace santé numérique et gérez vos rendez-vous, dossiers médicaux et bien plus encore.
          </p>
        </div>

        {/* Fonctionnalités */}
        <div className="relative z-10 space-y-3">
          {[
            [Stethoscope, "Consultez les meilleurs médecins"],
            [Shield,      "Données médicales sécurisées"],
            [Heart,       "Suivi de santé personnalisé"],
          ].map(([Icon, txt]) => (
            <div key={txt} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-white" />
              </div>
              <span className="text-blue-100 text-[13px]">{txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PANNEAU DROIT — fond bleu-50 (thème patient) ── */}
      <div className="flex-1 flex items-center justify-center bg-blue-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-100 p-10"
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart size={15} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">MedConnect</span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">Connexion</h2>
          <p className="text-gray-400 text-sm mb-8">Accédez à votre espace santé</p>

          {/* Erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-[13px] border ${
                pending
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {pending
                ? <Clock size={15} className="flex-shrink-0 mt-0.5" />
                : <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              }
              <div>
                <div className="font-medium">{error}</div>
                {pending && (
                  <div className="mt-1 text-amber-700">
                    Vous serez notifié une fois votre compte validé par l'administrateur.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="email" type="email" value={form.email} onChange={set}
                  placeholder="vous@exemple.com" required
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-blue-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="password" type="password" value={form.password} onChange={set}
                  placeholder="••••••••" required
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-blue-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 shadow-md shadow-blue-200"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn size={16} /> Se connecter</>
              }
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">
              S'inscrire
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
