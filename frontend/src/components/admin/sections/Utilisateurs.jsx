// Section « Utilisateurs » : tous les comptes, filtrés par rôle ou par recherche.
import { motion } from "motion/react";
import { Users, Clock, CheckCircle2, XCircle, Trash2, Search, Building2 } from "lucide-react";
import { ROLE_CFG } from "../constantes.js";

export default function Utilisateurs({ stats, setUserFilter, userFilter, userSearch, setUserSearch, loading, filteredUsers, hopitalAdmins, hopitaux, handleValidate, setRejectModal, setDeleteModal }) {
  return (
    <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div>
        <h1 className="text-[20px] font-extrabold text-indigo-950 tracking-tight">Utilisateurs</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Gérer tous les comptes de la plateforme</p>
      </div>

      {/* Filtres + recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          {[
            { key: "tous",          label: "Tous",          count: stats.total           },
            { key: "patient",       label: "Patients",      count: stats.patients        },
            { key: "medecin",       label: "Médecins",      count: stats.medecins        },
            { key: "donneur",       label: "Donneurs",      count: stats.donneurs        },
            { key: "admin_hopital", label: "Admins hôp.",   count: stats.admins_hopital  },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setUserFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                userFilter === key
                  ? "bg-indigo-950 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                userFilter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>{count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder="Rechercher…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grille de cartes */}
      {loading ? (
        <div className="text-center py-16 text-[13px] text-gray-400">Chargement…</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16">
          <Users size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-[13px] text-gray-400">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((u, i) => {
            const rc = ROLE_CFG[u.role] || ROLE_CFG.patient;
            return (
              <motion.div key={u.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-[15px] flex-shrink-0 ${rc.avatar}`}>
                    {(u.nom || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[14px] font-bold text-gray-900 truncate">{u.nom}</div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                        {rc.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 truncate mt-0.5">{u.email}</div>
                    {u.role === "medecin" && (
                      <div className="space-y-1 mt-1.5">
                        <div className="flex items-center gap-1">
                          {u.isVerified
                            ? <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><CheckCircle2 size={9}/> Validé</span>
                            : <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full"><Clock size={9}/> En attente</span>
                          }
                          {u.specialite && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{u.specialite}</span>
                          )}
                        </div>
                        {u.hopital && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Building2 size={9} className="text-gray-400" />
                            <span className="truncate">{u.hopital}</span>
                          </div>
                        )}
                        {!u.hopital && (
                          <div className="text-[10px] text-gray-300 italic">Hôpital non renseigné</div>
                        )}
                      </div>
                    )}
                    {u.role === "admin_hopital" && (() => {
                      const ha = hopitalAdmins.find(a => a.user?.id === u.id);
                      const hop = ha ? hopitaux.find(h => h.id === ha.hopital_id) : null;
                      return (
                        <div className="mt-1.5">
                          {hop ? (
                            <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full w-fit">
                              <Building2 size={9}/> <span className="truncate max-w-[120px]">{hop.nom}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-300 italic">Hôpital non assigné</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {u.role === "medecin" && !u.isVerified && u.isActive !== false && (
                      <>
                        <button onClick={() => handleValidate(u.id)}
                          className="flex items-center gap-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={9} /> Valider
                        </button>
                        <button onClick={() => setRejectModal(u)}
                          className="flex items-center gap-1 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-lg transition-colors"
                        >
                          <XCircle size={9} /> Rejeter
                        </button>
                      </>
                    )}
                    <button onClick={() => setDeleteModal(u)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
