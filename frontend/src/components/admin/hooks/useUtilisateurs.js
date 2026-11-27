// Comptes utilisateurs : liste, filtres, validation, rejet et suppression, statistiques dérivées.
import { useState } from "react";
import { API_URL } from "../../../config.js";

export default function useUtilisateurs({ token, showToast }) {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);

  const [userFilter, setUserFilter]   = useState("tous");
  const [userSearch, setUserSearch]   = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const handleValidate = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/validate`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Compte médecin validé !"); fetchUsers(); }
      else { const d = await res.json(); throw new Error(d.message); }
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleReject = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/reject`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Compte rejeté.", "info"); setRejectModal(null); fetchUsers(); }
      else { const d = await res.json(); throw new Error(d.message); }
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { showToast("Utilisateur supprimé.", "info"); setDeleteModal(null); fetchUsers(); }
      else { const d = await res.json(); throw new Error(d.message); }
    } catch (err) { showToast(err.message, "error"); }
  };

  /* Stats dérivées */
  const stats = {
    total:           users.length,
    patients:        users.filter(u => u.role === "patient").length,
    medecins:        users.filter(u => u.role === "medecin").length,
    donneurs:        users.filter(u => u.role === "donneur").length,
    admins_hopital:  users.filter(u => u.role === "admin_hopital").length,
    pendingMedecins: users.filter(u => u.role === "medecin" && !u.isVerified && u.isActive !== false).length,
  };

  const pendingList = users.filter(u => u.role === "medecin" && !u.isVerified && u.isActive !== false);

  const activity = [...users]
    .filter(u => u.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 9);

  const filteredUsers = users.filter(u => {
    if (userFilter !== "tous" && u.role !== userFilter) return false;
    const q = userSearch.toLowerCase();
    if (q && !u.nom?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    return true;
  });

  return {
    users,
    setUsers,
    loading,
    setLoading,
    userFilter,
    setUserFilter,
    userSearch,
    setUserSearch,
    rejectModal,
    setRejectModal,
    deleteModal,
    setDeleteModal,
    fetchUsers,
    handleValidate,
    handleReject,
    handleDelete,
    stats,
    pendingList,
    activity,
    filteredUsers,
  };
}
