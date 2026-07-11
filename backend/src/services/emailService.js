const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `"MedConnect" <${process.env.EMAIL_USER}>`;

// ── Styles partagés ──────────────────────────────────────────
const BASE = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;background:#f8fafc;padding:32px 16px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.07);">
`;
const FOOTER = `
      <div style="padding:20px 32px 28px;text-align:center;border-top:1px solid #f1f5f9;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          Vous recevez cet email car vous êtes inscrit sur MedConnect.<br>
          Si ce n'est pas vous, ignorez ce message.
        </p>
      </div>
    </div>
  </div>
`;

const ROLE_LABELS = {
  patient: "Patient",
  donneur: "Donneur de sang",
  medecin: "Médecin",
  admin_hopital: "Administrateur d'hôpital",
};

const ROLE_COLORS = {
  patient: "#3B82F6",
  donneur: "#EF4444",
  medecin: "#10B981",
  admin_hopital: "#F59E0B",
};

// ── Envoi générique (fire-and-forget) ───────────────────────
async function send(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[email] → ${to} : ${subject}`);
  } catch (err) {
    console.error(`[email] Erreur envoi vers ${to} :`, err.message);
  }
}

// ── 1. Bienvenue à l'inscription ────────────────────────────
async function sendBienvenue(email, nom, role) {
  const color = ROLE_COLORS[role] || "#3B82F6";
  const label = ROLE_LABELS[role] || role;
  const isMedecin = role === "medecin";

  const html = BASE + `
    <div style="background:linear-gradient(135deg,${color} 0%,${color}cc 100%);padding:36px 32px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">❤️</span>
      </div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:-.5px;">MedConnect</h1>
      <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:13px;">Votre santé, connectée.</p>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Bienvenue, ${nom} 👋</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Votre compte <strong style="color:${color};">${label}</strong> a été créé avec succès sur MedConnect.
        ${isMedecin
          ? "Votre dossier est actuellement <strong>en cours de vérification</strong> par notre équipe. Vous recevrez un email dès que votre compte sera validé."
          : "Vous pouvez dès maintenant vous connecter à votre espace personnel."}
      </p>

      ${!isMedecin ? `
      <div style="text-align:center;margin:28px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login"
           style="background:${color};color:#fff;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;display:inline-block;">
          Accéder à mon espace →
        </a>
      </div>` : ""}

      <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-top:24px;border-left:3px solid ${color};">
        <p style="margin:0;font-size:13px;color:#475569;">
          <strong>Email :</strong> ${email}<br>
          <strong>Rôle :</strong> ${label}
        </p>
      </div>
    </div>
  ` + FOOTER;

  await send(email, "Bienvenue sur MedConnect — Compte créé", html);
}

// ── 2. Médecin validé ────────────────────────────────────────
async function sendMedecinValide(email, nom) {
  const html = BASE + `
    <div style="background:linear-gradient(135deg,#10B981 0%,#059669 100%);padding:36px 32px;text-align:center;">
      <span style="font-size:48px;">✅</span>
      <h1 style="color:#fff;margin:12px 0 0;font-size:22px;font-weight:800;">Compte validé !</h1>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">Félicitations, Dr. ${nom}</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Votre compte médecin a été <strong style="color:#10B981;">validé par l'administrateur</strong> de MedConnect.
        Vous pouvez maintenant vous connecter et accéder à votre espace médecin.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login"
           style="background:#10B981;color:#fff;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;display:inline-block;">
          Se connecter maintenant →
        </a>
      </div>

      <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;border-left:3px solid #10B981;">
        <p style="margin:0;font-size:13px;color:#166534;">
          🩺 Gérez vos rendez-vous, consultations et ordonnances directement depuis votre tableau de bord.
        </p>
      </div>
    </div>
  ` + FOOTER;

  await send(email, "MedConnect — Votre compte médecin est validé ✅", html);
}

// ── 3. Médecin rejeté ────────────────────────────────────────
async function sendMedecinRejete(email, nom) {
  const html = BASE + `
    <div style="background:linear-gradient(135deg,#EF4444 0%,#DC2626 100%);padding:36px 32px;text-align:center;">
      <span style="font-size:48px;">❌</span>
      <h1 style="color:#fff;margin:12px 0 0;font-size:22px;font-weight:800;">Compte non validé</h1>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">Bonjour Dr. ${nom},</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Après examen de votre dossier, votre demande d'inscription en tant que médecin sur MedConnect
        n'a pas pu être <strong style="color:#EF4444;">approuvée</strong> pour le moment.
      </p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Cela peut être dû à des informations manquantes ou incorrectes. Vous pouvez créer un nouveau compte
        avec des informations complètes et valides.
      </p>

      <div style="background:#fef2f2;border-radius:12px;padding:16px 20px;border-left:3px solid #EF4444;">
        <p style="margin:0;font-size:13px;color:#991b1b;">
          Pour toute question, contactez l'administration de MedConnect.
        </p>
      </div>
    </div>
  ` + FOOTER;

  await send(email, "MedConnect — Décision sur votre dossier médecin", html);
}

// ── 4. RDV confirmé (email au patient) ──────────────────────
async function sendRdvConfirme(emailPatient, nomPatient, nomMedecin, dateRdv, heure) {
  const dateStr = dateRdv
    ? new Date(dateRdv).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Date à confirmer";

  const html = BASE + `
    <div style="background:linear-gradient(135deg,#3B82F6 0%,#2563EB 100%);padding:36px 32px;text-align:center;">
      <span style="font-size:48px;">📅</span>
      <h1 style="color:#fff;margin:12px 0 0;font-size:22px;font-weight:800;">Rendez-vous confirmé</h1>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">Bonjour ${nomPatient},</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Votre rendez-vous a été <strong style="color:#3B82F6;">confirmé</strong> par le médecin. Voici les détails :
      </p>

      <div style="background:#eff6ff;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#64748b;font-size:13px;padding:6px 0;width:40%;">👨‍⚕️ Médecin</td>
            <td style="color:#1e293b;font-size:13px;font-weight:600;padding:6px 0;">Dr. ${nomMedecin}</td>
          </tr>
          <tr>
            <td style="color:#64748b;font-size:13px;padding:6px 0;">📅 Date</td>
            <td style="color:#1e293b;font-size:13px;font-weight:600;padding:6px 0;">${dateStr}</td>
          </tr>
          ${heure ? `
          <tr>
            <td style="color:#64748b;font-size:13px;padding:6px 0;">🕐 Heure</td>
            <td style="color:#1e293b;font-size:13px;font-weight:600;padding:6px 0;">${heure}</td>
          </tr>` : ""}
        </table>
      </div>

      <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;border-left:3px solid #10B981;">
        <p style="margin:0;font-size:13px;color:#166534;">
          💡 Présentez-vous 10 minutes avant l'heure prévue. En cas d'empêchement, annulez votre RDV depuis l'application.
        </p>
      </div>
    </div>
  ` + FOOTER;

  await send(emailPatient, `MedConnect — RDV confirmé avec Dr. ${nomMedecin}`, html);
}

// ── 5. RDV annulé (email au patient) ────────────────────────
async function sendRdvAnnule(emailPatient, nomPatient, nomMedecin, dateRdv) {
  const dateStr = dateRdv
    ? new Date(dateRdv).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "Date inconnue";

  const html = BASE + `
    <div style="background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);padding:36px 32px;text-align:center;">
      <span style="font-size:48px;">⚠️</span>
      <h1 style="color:#fff;margin:12px 0 0;font-size:22px;font-weight:800;">Rendez-vous annulé</h1>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">Bonjour ${nomPatient},</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Votre rendez-vous du <strong>${dateStr}</strong> avec <strong>Dr. ${nomMedecin}</strong>
        a été <strong style="color:#F59E0B;">annulé</strong>.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login"
           style="background:#3B82F6;color:#fff;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;display:inline-block;">
          Prendre un nouveau RDV →
        </a>
      </div>
    </div>
  ` + FOOTER;

  await send(emailPatient, `MedConnect — Rendez-vous annulé`, html);
}

module.exports = { sendBienvenue, sendMedecinValide, sendMedecinRejete, sendRdvConfirme, sendRdvAnnule };
