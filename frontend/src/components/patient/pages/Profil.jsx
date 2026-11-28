import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Phone, MapPin, Calendar, Droplets, Pencil, Save, X, Camera, Lock, ShieldAlert, Plus } from "lucide-react";
import { API_URL } from "../../../config.js";
import DeconnexionPartout from "../../DeconnexionPartout.jsx";

const DEFAULT_PROFILE = {
  name: "", email: "", phone: "", address: "", dob: "",
  bloodGroup: "", allergies: [], antecedents: [], treatments: [], vaccinations: [],
};

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export default function Profil() {
  // Profil enregistré sur cet appareil, sinon valeurs de la session (complétées ensuite par l'API)
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("medconnect_profile") || "null") || {
    ...DEFAULT_PROFILE,
    name:  sessionStorage.getItem("nom")   || "",
    email: sessionStorage.getItem("email") || "",
    phone: sessionStorage.getItem("tel")   || "",
  });
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState(() => localStorage.getItem("medconnect_profile_photo") || null);
  const [tagInputs, setTagInputs] = useState({ allergies: "", antecedents: "", treatments: "", vaccinations: "" });
  const fileRef = useRef();
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    if (token && userId) {
      fetch(`${API_URL}/api/patients/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const local = JSON.parse(localStorage.getItem("medconnect_profile") || "{}");
          const merged = {
            name:         data.nom        || "",
            email:        data.email      || "",
            phone:        data.telephone  || "",
            address:      data.profil_patient?.adresse        || "",
            dob:          data.profil_patient?.dateNaissance   || "",
            bloodGroup:   data.profil_patient?.groupeSanguin   || "",
            allergies:    data.profil_patient?.allergies    ?? (local.allergies    || []),
            antecedents:  data.profil_patient?.antecedents  ?? (local.antecedents  || []),
            treatments:   data.profil_patient?.traitements  ?? (local.treatments   || []),
            vaccinations: data.profil_patient?.vaccinations ?? (local.vaccinations || []),
          };
          localStorage.setItem("medconnect_profile", JSON.stringify(merged));
          setProfile(merged);
        })
        .catch(() => {});
    }
  }, []);

  const startEdit = () => { setDraft({ ...profile }); setEdit(true); };
  const cancelEdit = () => { setEdit(false); };

  const handleSave = async () => {
    localStorage.setItem("medconnect_profile", JSON.stringify(draft));
    setProfile(draft);
    sessionStorage.setItem("nom", draft.name);
    sessionStorage.setItem("email", draft.email);

    if (token && userId) {
      fetch(`${API_URL}/api/patients/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          adresse:       draft.address,
          dateNaissance: draft.dob,
          groupeSanguin: draft.bloodGroup,
          telephone:     draft.phone,
          allergies:     draft.allergies,
          antecedents:   draft.antecedents,
          traitements:   draft.treatments,
          vaccinations:  draft.vaccinations,
        }),
      }).catch(() => {});
    }

    setEdit(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      setPhoto(url);
      localStorage.setItem("medconnect_profile_photo", url);
    };
    reader.readAsDataURL(f);
  };

  const addTag = (field) => {
    const val = tagInputs[field].trim();
    if (!val) return;
    setDraft(d => ({ ...d, [field]: [...(d[field] || []), val] }));
    setTagInputs(t => ({ ...t, [field]: "" }));
  };

  const removeTag = (field, idx) => {
    setDraft(d => ({ ...d, [field]: d[field].filter((_, i) => i !== idx) }));
  };

  const p = edit ? draft : profile;
  const setP = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Mon profil</h1>
          <p className="text-sm text-gray-500 mt-1">Informations personnelles et médicales</p>
        </div>
        {!edit && (
          <button onClick={startEdit} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
            <Pencil size={13} /> Modifier
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-[13px] px-4 py-3 rounded-lg">
            <Save size={14} /> Profil mis à jour avec succès !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {photo
              ? <img src={photo} alt="profil" className="w-20 h-20 rounded-full object-cover border-3 border-blue-100" />
              : <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-3xl font-bold border-3 border-blue-100">
                  {p.name?.[0]?.toUpperCase() || "P"}
                </div>
            }
            {edit && (
              <>
                <button onClick={() => fileRef.current.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Camera size={12} />
                </button>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhoto} />
              </>
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{p.name || "Patient"}</div>
            <div className="text-[13px] text-blue-600 font-medium mt-0.5">Patient · MedConnect</div>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-1"><Mail size={12} /> {p.email || "—"}</div>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-0.5"><Phone size={12} /> {p.phone || "—"}</div>
            {p.bloodGroup && (
              <span className="inline-block mt-2 bg-red-100 text-red-700 text-[12px] font-bold px-3 py-1 rounded-full">
                {p.bloodGroup}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
          <User size={14} className="text-blue-600" /> Informations personnelles
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "name",  label: "Nom complet",      type: "text",  icon: User,     locked: false          },
            { key: "email", label: "Email",             type: "email", icon: Mail,     locked: false          },
            { key: "phone", label: "Téléphone",         type: "tel",   icon: Phone,    locked: false          },
            { key: "dob",   label: "Date de naissance", type: "date",  icon: Calendar, locked: !!profile.dob  },
          ].map(({ key, label, type, icon: Icon, locked }) => (
            <div key={key}>
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                {label} {locked && <Lock size={9} className="text-gray-300" />}
              </label>
              {edit ? (
                locked ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                    <Icon size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-[13px] text-gray-700">
                      {key === "dob" && p[key]
                        ? new Date(p[key]).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                        : p[key] || "—"}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
                  </div>
                ) : (
                  <input
                    type={type}
                    value={p[key]}
                    onChange={e => setP(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                )
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
                  <Icon size={12} className="text-gray-400" />
                  {key === "dob" && p[key]
                    ? new Date(p[key]).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                    : p[key] || "—"}
                </div>
              )}
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Adresse</label>
            {edit ? (
              <input value={p.address} onChange={e => setP("address", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-gray-900 py-2 border-b border-gray-100">
                <MapPin size={12} className="text-gray-400" /> {p.address || "—"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations médicales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
          <ShieldAlert size={14} className="text-blue-600" /> Informations médicales
        </div>
        {/* Groupe sanguin */}
        <div className="mb-4">
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
            Groupe sanguin {profile.bloodGroup && <Lock size={9} className="text-gray-300" />}
          </label>
          {edit ? (
            profile.bloodGroup ? (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                <span className="text-[22px] font-extrabold text-red-500 leading-none">{profile.bloodGroup}</span>
                <div className="flex-1">
                  <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-medium">Non modifiable</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Contactez votre médecin pour toute correction</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map(g => (
                    <button key={g} type="button" onClick={() => setP("bloodGroup", g)}
                      className={`px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
                        draft.bloodGroup === g ? "bg-red-500 text-white border-red-500" : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                      }`}
                    >{g}</button>
                  ))}
                </div>
                <p className="text-[11px] text-amber-600 flex items-center gap-1">
                  ⚠ Une fois défini, le groupe sanguin ne pourra plus être modifié
                </p>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 text-[13px] text-gray-900">
              <Droplets size={12} className="text-red-500" /> {p.bloodGroup || "—"}
            </div>
          )}
        </div>

        {/* Tags fields */}
        {[
          { key: "allergies",    label: "Allergies",           color: "bg-red-100 text-red-700"     },
          { key: "antecedents",  label: "Antécédents médicaux",color: "bg-amber-100 text-amber-700" },
          { key: "treatments",   label: "Traitements en cours",color: "bg-blue-100 text-blue-700"   },
          { key: "vaccinations", label: "Vaccinations",         color: "bg-purple-100 text-purple-700" },
        ].map(({ key, label, color }) => (
          <div key={key} className="mb-4">
            <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wide block mb-2">{label}</label>
            <div className="flex flex-wrap gap-1.5">
              {(p[key] || []).map((item, i) => (
                <span key={i} className={`inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full ${color}`}>
                  {item}
                  {edit && (
                    <button onClick={() => removeTag(key, i)} className="ml-0.5 hover:opacity-70">
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
              {edit && (
                <div className="flex items-center gap-1">
                  <input
                    value={tagInputs[key]}
                    onChange={e => setTagInputs(t => ({ ...t, [key]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(key))}
                    placeholder="Ajouter…"
                    className="px-2 py-1 border border-gray-200 rounded-lg text-[12px] w-28 focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={() => addTag(key)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Plus size={13} />
                  </button>
                </div>
              )}
              {!edit && (p[key] || []).length === 0 && <span className="text-[13px] text-gray-400">—</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Boutons edit */}
      <AnimatePresence>
        {edit && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
            <button onClick={handleSave} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Save size={14} /> Enregistrer
            </button>
            <button onClick={cancelEdit} className="px-6 h-11 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sécurité */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 mb-4">
          <Lock size={14} className="text-blue-600" /> Sécurité
        </div>
        <div className="flex gap-3">
          <button className="text-[13px] border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
            Changer le mot de passe
          </button>
          <button className="text-[13px] border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
            Supprimer mon compte
          </button>
        </div>
      </div>

      {/* Déconnexion de tous les appareils */}
      <DeconnexionPartout />
    </div>
  );
}
