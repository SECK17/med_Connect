// Carte médicale du patient : informations affichées et téléchargement au format texte.

export default function useCarteMedicale({ prescriptions }) {
  // ── Carte médicale ──
  const nom         = sessionStorage.getItem("nom") || "Patient";
  const profil      = JSON.parse(localStorage.getItem("medconnect_profile") || "{}");
  const groupe      = profil.bloodGroup || profil.groupeSanguin || "Non renseigné";
  const allergies   = Array.isArray(profil.allergies)   ? profil.allergies   : [];
  const antecedents = Array.isArray(profil.antecedents) ? profil.antecedents : [];
  const medsEnCours = (prescriptions[0]?.drugs || []).filter(d => d.name);

  const downloadCarte = () => {
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const content = [
      "╔══════════════════════════════════════╗",
      "║         CARTE MÉDICALE               ║",
      "║            MedConnect                ║",
      "╚══════════════════════════════════════╝",
      "",
      `Patient      : ${nom}`,
      `Généré le    : ${date}`,
      "",
      "────────── DONNÉES DE SANTÉ ───────────",
      `Groupe sanguin   : ${groupe}`,
      `Allergies        : ${allergies.length > 0 ? allergies.join(", ") : "Aucune"}`,
      `Antécédents      : ${antecedents.length > 0 ? antecedents.join(", ") : "Aucun"}`,
      `Traitements      : ${medsEnCours.length > 0 ? medsEnCours.map(m => m.name).join(", ") : "Aucun en cours"}`,
      "",
      "───────────────────────────────────────",
      "Document confidentiel — MedConnect",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.download = `carte-medicale-${nom.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    nom,
    profil,
    groupe,
    allergies,
    antecedents,
    medsEnCours,
    downloadCarte,
  };
}
