// Section « Hôpitaux » : liste des établissements et fiche détaillée (admin, médecins, patients, rendez-vous).
import { motion, AnimatePresence } from "motion/react";
import { Stethoscope, CheckCircle2, Trash2, ShieldCheck, User, Droplets, ChevronRight, Building2, MapPin, Phone, Plus, X, Loader2, Mail, Pencil, AlertTriangle, CalendarDays } from "lucide-react";

export default function Hopitaux({ hopitaux, openCreateHopital, hopitalAdmins, selectHopital, openEditHopital, deleteHopital, deletingHop, hopitauxRdvStats, selectedHopital, setSelectedHopital, setShowHopAdminCreate, hopitalMedecins, hopitalPatients, hopRdvStats, setHopitalTab, hopitalTab, loadingHop, deleteAdminHop, showHopAdminCreate, createForm, setCreateForm, createAdminHop, creatingAdmin, handleValidate }) {
  return (
    <>
      <motion.div key="hopitaux" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="space-y-6"
      >
        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold text-indigo-950 tracking-tight">Hôpitaux</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">{hopitaux.length} établissement(s) enregistré(s)</p>
          </div>
          <button onClick={openCreateHopital}
            className="flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-indigo-200"
          >
            <Plus size={14} /> Ajouter un hôpital
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total",            val: hopitaux.length,                                  bg: "bg-indigo-50",  icon: Building2,      ico: "text-indigo-600",  num: "text-indigo-950" },
            { label: "Avec admin",  val: hopitalAdmins.length,                             bg: "bg-emerald-50", icon: ShieldCheck,    ico: "text-emerald-600", num: "text-emerald-700" },
            { label: "Sans admin",  val: Math.max(0, hopitaux.length - hopitalAdmins.length), bg: "bg-amber-50",   icon: AlertTriangle, ico: "text-amber-600",   num: "text-amber-700"  },
          ].map(({ label, val, bg, icon: Icon, ico, num }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={ico} />
              </div>
              <div>
                <div className={`text-[26px] font-extrabold leading-none ${num}`}>{val}</div>
                <div className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Grille des cards ── */}
        {hopitaux.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center">
            <Building2 size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-[14px] font-semibold text-gray-600 mb-1">Aucun hôpital enregistré</p>
            <button onClick={openCreateHopital} className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 mt-1">
              + Ajouter le premier hôpital
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hopitaux.map((h, i) => {
              const admin = hopitalAdmins.find(a => a.hopital_id === h.id);
              return (
                <motion.div key={h.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => selectHopital(h)}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all group cursor-pointer"
                >
                  {/* Card top */}
                  <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-white px-5 py-4 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                        <Building2 size={19} className="text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-extrabold text-gray-900 truncate">{h.nom}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{h.type}</span>
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-400"><MapPin size={9}/> {h.ville}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); openEditHopital(h); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        ><Pencil size={12}/></button>
                        <button onClick={e => { e.stopPropagation(); deleteHopital(h.id); }}
                          disabled={deletingHop === h.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          {deletingHop === h.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-3.5">
                    {admin ? (
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 font-bold text-[11px] flex-shrink-0">
                          {(admin.user?.nom || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-gray-900 truncate">{admin.user?.nom}</div>
                          <div className="text-[10px] text-gray-400">Admin</div>
                        </div>
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                          <CheckCircle2 size={8}/> Actif
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        <AlertTriangle size={11} className="text-amber-500 flex-shrink-0"/>
                        <span className="text-[11px] text-amber-700 font-medium">Aucun admin assigné</span>
                      </div>
                    )}
                    {/* Stats RDV de cet hôpital */}
                    {(() => {
                      const s = hopitauxRdvStats[h.id];
                      if (!s) return null;
                      return (
                        <div className="flex items-center gap-2 mb-3 text-[11px]">
                          <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                            <CalendarDays size={9}/> {s.total} RDV
                          </span>
                          {s.confirme > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{s.confirme} confirmés</span>
                          )}
                          {s.en_attente > 0 && (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{s.en_attente} en attente</span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-medium">Voir les détails</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"/>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Drawer détail hôpital ── */}
        <AnimatePresence>
          {selectedHopital && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
                onClick={() => { setSelectedHopital(null); setShowHopAdminCreate(false); }}
              />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] bg-white z-50 shadow-2xl flex flex-col"
              >
                {/* Drawer header gradient */}
                <div className="bg-gradient-to-br from-indigo-950 to-indigo-700 px-5 pt-5 pb-0">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 size={20} className="text-white"/>
                      </div>
                      <div>
                        <div className="text-[16px] font-extrabold text-white leading-tight">{selectedHopital.nom}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full">{selectedHopital.type}</span>
                          <span className="flex items-center gap-0.5 text-[11px] text-indigo-200"><MapPin size={9}/> {selectedHopital.ville}</span>
                          {selectedHopital.telephone && (
                            <span className="flex items-center gap-0.5 text-[11px] text-indigo-200"><Phone size={9}/> {selectedHopital.telephone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedHopital(null); setShowHopAdminCreate(false); }}
                      className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-lg flex items-center justify-center text-white transition-colors flex-shrink-0 mt-0.5"
                    ><X size={16}/></button>
                  </div>

                  {/* Tabs dans le header */}
                  <div className="flex gap-0.5">
                    {[
                      { k: "admin",    l: "Admin",     Icon: ShieldCheck,  count: null                      },
                      { k: "medecins", l: "Médecins",  Icon: Stethoscope, count: hopitalMedecins.length    },
                      { k: "patients", l: "Patients",  Icon: User,        count: hopitalPatients.length    },
                      { k: "rdvs",     l: "RDVs",      Icon: CalendarDays, count: hopRdvStats?.total ?? null },
                    ].map(({ k, l, Icon, count }) => (
                      <button key={k} onClick={() => setHopitalTab(k)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-[12px] font-semibold transition-all ${
                          hopitalTab === k
                            ? "bg-white text-indigo-950"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon size={12}/> {l}
                        {count !== null && (
                          <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                            hopitalTab === k ? "bg-indigo-100 text-indigo-700" : "bg-white/20 text-white"
                          }`}>{count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drawer body */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                  {loadingHop ? (
                    <div className="flex items-center justify-center h-40 text-[13px] text-gray-400">Chargement…</div>
                  ) : (
                    <AnimatePresence mode="wait">

                      {/* ── Secrétaire ── */}
                      {hopitalTab === "admin" && (() => {
                        const admin = hopitalAdmins.find(a => a.hopital_id === selectedHopital.id);
                        return (
                          <motion.div key="adm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                            {admin ? (
                              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
                                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-extrabold text-[22px] flex-shrink-0">
                                  {(admin.user?.nom || "A").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[15px] font-bold text-gray-900">{admin.user?.nom}</div>
                                  <div className="flex items-center gap-1 text-[12px] text-gray-500 mt-0.5">
                                    <Mail size={11}/> {admin.user?.email}
                                  </div>
                                  {admin.user?.telephone && admin.user.telephone !== "—" && (
                                    <div className="flex items-center gap-1 text-[12px] text-gray-500">
                                      <Phone size={11}/> {admin.user.telephone}
                                    </div>
                                  )}
                                  <span className="inline-flex items-center gap-1 mt-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={9}/> Admin actif
                                  </span>
                                </div>
                                <button onClick={() => deleteAdminHop(admin.id)}
                                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                  title="Retirer"
                                ><Trash2 size={15}/></button>
                              </div>
                            ) : showHopAdminCreate ? (
                              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                                <div className="text-[13px] font-semibold text-gray-700">
                                  Assigner un admin à <span className="text-indigo-600">{selectedHopital.nom}</span>
                                </div>
                                {[
                                  { key: "nom",       label: "Nom complet *",   placeholder: "Ex: Kouyaté Mamadou",  type: "text"     },
                                  { key: "email",     label: "Email *",          placeholder: "admin@hopital.gn",     type: "email"    },
                                  { key: "password",  label: "Mot de passe *",   placeholder: "Minimum 6 caractères", type: "password" },
                                  { key: "telephone", label: "Téléphone",        placeholder: "Ex: 620 00 00 00",     type: "text"     },
                                ].map(({ key, label, placeholder, type }) => (
                                  <div key={key}>
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                                    <input type={type} value={createForm[key] || ""}
                                      onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                                      placeholder={placeholder}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    />
                                  </div>
                                ))}
                                <div className="flex gap-2 pt-1">
                                  <button onClick={createAdminHop}
                                    disabled={creatingAdmin || !createForm.nom || !createForm.email || !createForm.password}
                                    className="flex-1 h-10 bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    {creatingAdmin ? <Loader2 size={13} className="animate-spin"/> : <><Plus size={13}/> Créer</>}
                                  </button>
                                  <button onClick={() => setShowHopAdminCreate(false)}
                                    className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] rounded-xl transition-colors"
                                  >Annuler</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                                  <ShieldCheck size={26} className="text-indigo-300"/>
                                </div>
                                <p className="text-[14px] font-semibold text-gray-700 mb-1">Aucun admin</p>
                                <p className="text-[12px] text-gray-400 mb-5 text-center">Cet hôpital n'a pas encore d'admin assigné.</p>
                                <button
                                  onClick={() => { setShowHopAdminCreate(true); setCreateForm({ nom: "", email: "", password: "", telephone: "" }); }}
                                  className="flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors"
                                >
                                  <Plus size={14}/> Assigner un admin
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })()}

                      {/* ── Médecins ── */}
                      {hopitalTab === "medecins" && (
                        <motion.div key="med" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {hopitalMedecins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                              <Stethoscope size={28} className="text-gray-200 mb-2"/>
                              <p className="text-[13px] text-gray-400">Aucun médecin enregistré ici</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {hopitalMedecins.map((m, i) => (
                                <motion.div key={m.id}
                                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                  className="flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-[13px] flex-shrink-0">
                                    {m.nom.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-gray-900 truncate">{m.nom}</div>
                                    <div className="text-[11px] text-gray-400 truncate">{m.email}</div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {m.specialite && m.specialite !== "—" && (
                                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">{m.specialite}</span>
                                    )}
                                    {m.valide ? (
                                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium"><CheckCircle2 size={9}/> Validé</span>
                                    ) : (
                                      <button
                                        onClick={() => handleValidate(m.id)}
                                        className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-full transition-colors"
                                      >
                                        <CheckCircle2 size={9}/> Valider
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* ── Patients ── */}
                      {hopitalTab === "patients" && (
                        <motion.div key="pat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {hopitalPatients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                              <User size={28} className="text-gray-200 mb-2"/>
                              <p className="text-[13px] text-gray-400">Aucun patient n'a encore consulté ici</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {hopitalPatients.map((p, i) => (
                                <motion.div key={p.id}
                                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                  className="flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-bold text-[13px] flex-shrink-0">
                                    {p.nom.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-gray-900 truncate">{p.nom}</div>
                                    <div className="text-[11px] text-gray-400 truncate">{p.email}</div>
                                  </div>
                                  {p.groupeSanguin && p.groupeSanguin !== "—" && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200 flex-shrink-0">
                                      <Droplets size={9}/> {p.groupeSanguin}
                                    </span>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* ── RDVs ── */}
                      {hopitalTab === "rdvs" && (
                        <motion.div key="rdvs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-3">
                          {!hopRdvStats ? (
                            <div className="text-center py-10 text-gray-400 text-sm">Chargement…</div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { label: "Total",      val: hopRdvStats.total,      bg: "bg-slate-50",   num: "text-slate-800",   border: "border-slate-200"   },
                                  { label: "Confirmés",  val: hopRdvStats.confirme,   bg: "bg-emerald-50", num: "text-emerald-700", border: "border-emerald-200" },
                                  { label: "En attente", val: hopRdvStats.en_attente, bg: "bg-amber-50",   num: "text-amber-700",   border: "border-amber-200"   },
                                  { label: "Transmis",   val: hopRdvStats.transfere,  bg: "bg-blue-50",    num: "text-blue-700",    border: "border-blue-200"    },
                                  { label: "Annulés",    val: hopRdvStats.annule,     bg: "bg-red-50",     num: "text-red-600",     border: "border-red-200"     },
                                ].map(({ label, val, bg, num, border }) => (
                                  <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                                    <div className={`text-[30px] font-extrabold leading-none ${num}`}>{val}</div>
                                    <div className="text-[11px] text-gray-500 font-medium mt-1">{label}</div>
                                  </div>
                                ))}
                              </div>
                              {hopRdvStats.total === 0 && (
                                <div className="text-center py-6 text-[13px] text-gray-400">
                                  Aucun rendez-vous enregistré pour cet hôpital.
                                </div>
                              )}
                            </>
                          )}
                        </motion.div>
                      )}

                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </motion.div>
    </>
  );
}
