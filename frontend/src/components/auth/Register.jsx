import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, Stethoscope, Droplets, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Heart, Loader2, Shield } from "lucide-react";

const ROLES = [
  { value: "patient", label: "Patient",        icon: User,        desc: "Prenez des rendez-vous et gérez votre santé" },
  { value: "medecin", label: "Médecin",         icon: Stethoscope, desc: "Gérez vos consultations et patients" },
  { value: "donneur", label: "Donneur de sang", icon: Droplets,    desc: "Contribuez à sauver des vies" },
];

const HOPITAUX = [
  "Hôpital Principal de Dakar",
  "CHU de Fann",
  "Hôpital Aristide Le Dantec",
  "Hôpital Général de Grand Yoff (HOGGY)",
  "Hôpital de Pikine",
  "Hôpital Abass Ndao",
  "Hôpital Roi Baudouin (Guédiawaye)",
  "Hôpital de Ouakam",
  "Polyclinique SUMA",
  "Clinique Pasteur",
];

const SPECIALITES = [
  "Généraliste","Cardiologue","Dentiste","Gynécologue","Pédiatre",
  "Dermatologue","Ophtalmologue","ORL","Neurologue","Pneumologue",
  "Gastro-entérologue","Urologue","Psychiatre","Oncologue","Radiologue",
  "Urgentiste","Endocrinologue","Rhumatologue","Néphrologue","Chirurgien",
];

const GROUPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

const INPUT = "w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] bg-blue-50/40 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [role, setRole]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({
    nom: "", email: "", password: "", confirm: "", telephone: "",
    dateNaissance: "", adresse: "", groupeSanguin: "",
    specialite: "", numeroOrdre: "", hopital: "", experience: "",
  });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      const body = { role, ...form };
      delete body.confirm;
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) { const d = text ? JSON.parse(text) : {}; throw new Error(d.message || "Inscription échouée"); }
      if (!text) throw new Error("Réponse serveur vide");
      const data = JSON.parse(text);
      if (role === "medecin") { setStep(2); return; }
      sessionStorage.setItem("token",  data.token);
      sessionStorage.setItem("role",   data.user.role);
      sessionStorage.setItem("nom",    data.user.nom);
      sessionStorage.setItem("email",  data.user.email);
      sessionStorage.setItem("userId", data.user.id);
      navigate(data.user.role === "donneur" ? "/dashboard/donneur/don-sang" : "/dashboard/patient/accueil");
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  /* ── Succès ── */
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-blue-100 p-12 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Compte créé !</h2>
          <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
            {role === "medecin"
              ? "Votre compte médecin est en attente de validation par l'administrateur. Vous pourrez vous connecter une fois validé."
              : `Votre compte ${ROLES.find(r => r.value === role)?.label} a été créé avec succès.`}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
          >
            Aller à la connexion
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Étape 0 : choix du rôle ── */
  if (step === 0) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center bg-blue-50 p-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-100 p-10"
          >
            <MobileLogo />
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Créer un compte</h2>
            <p className="text-gray-400 text-sm mb-8">Quel est votre rôle sur MedConnect ?</p>

            <div className="space-y-3 mb-6">
              {ROLES.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value} type="button" onClick={() => setRole(value)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all text-left ${
                    role === value
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    role === value ? "bg-blue-700 shadow-md shadow-blue-200" : "bg-gray-100"
                  }`}>
                    <Icon size={20} className={role === value ? "text-white" : "text-gray-500"} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-gray-900">{label}</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              disabled={!role} onClick={() => setStep(1)}
              className="w-full h-12 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
            >
              Continuer <ArrowRight size={16} />
            </button>
            <p className="text-center text-sm text-gray-400 mt-5">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">Se connecter</Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Étape 1 : formulaire ── */
  const currentRole = ROLES.find(r => r.value === role);
  const RoleIcon = currentRole?.icon;

  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center bg-blue-50 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-blue-100 p-10 my-6"
        >
          <button
            onClick={() => setStep(0)}
            className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Retour
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-md shadow-blue-200">
              {RoleIcon && <RoleIcon size={18} className="text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Inscription — {currentRole?.label}</h2>
              <p className="text-[12px] text-gray-400">Remplissez vos informations</p>
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Infos communes */}
            <Section title="Informations générales">
              <TwoCol>
                <Field label="Nom complet *">
                  <input name="nom" value={form.nom} onChange={set} placeholder="Prénom Nom" required className={INPUT} />
                </Field>
                <Field label="Téléphone *">
                  <input name="telephone" type="tel" value={form.telephone} onChange={set} placeholder="+221 77 000 00 00" required className={INPUT} />
                </Field>
              </TwoCol>
              <Field label="Adresse email *">
                <input name="email" type="email" value={form.email} onChange={set} placeholder="vous@exemple.com" required className={INPUT} />
              </Field>
              <TwoCol>
                <Field label="Mot de passe *">
                  <input name="password" type="password" value={form.password} onChange={set} placeholder="Min. 8 caractères" required minLength={8} className={INPUT} />
                </Field>
                <Field label="Confirmer *">
                  <input name="confirm" type="password" value={form.confirm} onChange={set} placeholder="••••••••" required className={INPUT} />
                </Field>
              </TwoCol>
            </Section>

            {/* Patient / Donneur */}
            {(role === "patient" || role === "donneur") && (
              <Section title="Informations du profil">
                <TwoCol>
                  <Field label="Date de naissance *">
                    <input name="dateNaissance" type="date" value={form.dateNaissance} onChange={set} required className={INPUT} />
                  </Field>
                  <Field label="Groupe sanguin *">
                    <select name="groupeSanguin" value={form.groupeSanguin} onChange={set} required className={INPUT}>
                      <option value="">Sélectionner</option>
                      {GROUPES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </Field>
                </TwoCol>
                <Field label="Adresse *">
                  <input name="adresse" value={form.adresse} onChange={set} placeholder="Quartier, Ville" required className={INPUT} />
                </Field>
              </Section>
            )}

            {/* Médecin */}
            {role === "medecin" && (
              <Section title="Informations médicales">
                <Field label="Spécialité *">
                  <select name="specialite" value={form.specialite} onChange={set} required className={INPUT}>
                    <option value="">Choisir une spécialité</option>
                    {SPECIALITES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <TwoCol>
                  <Field label="Numéro d'ordre *">
                    <input name="numeroOrdre" value={form.numeroOrdre} onChange={set} placeholder="SN-XXXXX" required className={INPUT} />
                  </Field>
                  <Field label="Années d'expérience">
                    <input name="experience" type="number" min="0" value={form.experience} onChange={set} placeholder="Ex: 10" className={INPUT} />
                  </Field>
                </TwoCol>
                <Field label="Hôpital / Clinique *">
                  <select name="hopital" value={form.hopital} onChange={set} required className={INPUT}>
                    <option value="">Choisir un hôpital</option>
                    {HOPITAUX.map(h => <option key={h}>{h}</option>)}
                  </select>
                </Field>
              </Section>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">Se connecter</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[45%] bg-blue-700 flex-col justify-between px-14 py-12 relative overflow-hidden">
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

      {/* Texte */}
      <div className="relative z-10">
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
          Rejoignez<br />MedConnect.
        </h1>
        <p className="text-blue-100 text-[15px] leading-relaxed max-w-sm">
          Créez votre compte et accédez à une plateforme de santé numérique adaptée à votre rôle.
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
  );
}

function MobileLogo() {
  return (
    <div className="flex items-center gap-2 mb-8 lg:hidden">
      <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
        <Heart size={15} className="text-white" />
      </div>
      <span className="text-lg font-bold text-gray-900">MedConnect</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-2">{title}</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TwoCol({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
