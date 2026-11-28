// Signalement des erreurs réseau ou inattendues.
// Avant, beaucoup d'appels à l'API se terminaient par `catch {}` : en cas de panne, l'écran
// restait vide sans explication. signalerErreur() garde une trace dans la console et affiche
// un bandeau (composant BandeauErreur, monté une seule fois dans App).
export const EVENEMENT_ERREUR = "medconnect:erreur";

export const MESSAGE_RESEAU = "Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.";

export function signalerErreur(err, message = MESSAGE_RESEAU) {
  console.error(err);
  window.dispatchEvent(new CustomEvent(EVENEMENT_ERREUR, { detail: { message } }));
}
