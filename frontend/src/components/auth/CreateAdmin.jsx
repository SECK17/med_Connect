import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Phone, Lock, ShieldCheck, AlertCircle, Loader2, Heart } from "lucide-react";

const INPUT = "w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors";

export default function CreateAdmin() {
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", password: "", adminCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const endpoint = token ? "/api/auth/create-admin" : "/api/auth/create-first-admin";
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST", headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.token) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("role",  data.user.role);
        sessionStorage.setItem("nom",   data.user.nom);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">MedConnect</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Créer un administrateur</h2>
            <p className="text-[12px] text-gray-500">Accès restreint — code requis</p>
          </div>
        </div>

        <div className="mt-4 mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800">
          ⚠️ Cette page est réservée à la création du premier compte administrateur.
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-xl mb-5"
            >
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField icon={User}       name="nom"       type="text"     label="Nom complet *"        placeholder="Prénom Nom"         value={form.nom}       onChange={set} />
          <InputField icon={Mail}       name="email"     type="email"    label="Email *"              placeholder="admin@exemple.com"  value={form.email}     onChange={set} />
          <InputField icon={Phone}      name="telephone" type="tel"      label="Téléphone *"          placeholder="+221 77 000 00 00"  value={form.telephone} onChange={set} />
          <InputField icon={Lock}       name="password"  type="password" label="Mot de passe *"       placeholder="Min. 8 caractères"  value={form.password}  onChange={set} minLength={8} />
          <InputField icon={ShieldCheck} name="adminCode" type="password" label="Code administrateur *" placeholder="Code secret"       value={form.adminCode} onChange={set} />

          <button type="submit" disabled={loading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><ShieldCheck size={16} /> Créer l'administrateur</>}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
            ← Retour à la connexion
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function InputField({ icon: Icon, name, type, label, placeholder, value, onChange, minLength }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
          required minLength={minLength}
          className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
        />
      </div>
    </div>
  );
}
