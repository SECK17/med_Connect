const { sequelize } = require('../config/db');
const User = require('./User');
const Patient = require('./Patient');
const Medecin = require('./Medecin');
const RendezVous = require('./RendezVous');
const Hopital = require('./Hopital');
const Ordonnance = require('./Ordonnance');
const Analyse = require('./Analyse');
const Consultation = require('./Consultation');
const DossierPartage  = require('./DossierPartage');
const AdminHopital    = require('./AdminHopital');
const AlerteSang      = require('./AlerteSang');
const DemandeHopital  = require('./DemandeHopital');
const Message            = require('./Message');
const PushSubscription   = require('./PushSubscription');
const Evaluation         = require('./Evaluation');
const DonneurReponse     = require('./DonneurReponse');

/**
 * Définition des relations entre les modèles
 */

// User a un Patient (hasOne) - foreignKey est 'id'
User.hasOne(Patient, {
  foreignKey: 'id',
  as: 'profil_patient',
  onDelete: 'CASCADE',
});

// Patient appartient à un User (belongsTo)
Patient.belongsTo(User, {
  foreignKey: 'id',
  as: 'user',
});

// User a un Medecin (hasOne) - foreignKey est 'id'
User.hasOne(Medecin, {
  foreignKey: 'id',
  as: 'profil_medecin',
  onDelete: 'CASCADE',
});

// Medecin appartient à un User (belongsTo)
Medecin.belongsTo(User, {
  foreignKey: 'id',
  as: 'user',
});

// Patient a plusieurs RendezVous (hasMany)
Patient.hasMany(RendezVous, {
  foreignKey: 'patient_id',
  as: 'rendezVous',
  onDelete: 'CASCADE',
});

// RendezVous appartient à un Patient (belongsTo)
RendezVous.belongsTo(Patient, {
  foreignKey: 'patient_id',
  as: 'patient',
});

// Medecin a plusieurs RendezVous (hasMany)
Medecin.hasMany(RendezVous, {
  foreignKey: 'medecin_id',
  as: 'rendezVous',
  onDelete: 'CASCADE',
});

// RendezVous appartient à un Medecin (belongsTo)
RendezVous.belongsTo(Medecin, {
  foreignKey: 'medecin_id',
  as: 'medecin',
});

// RendezVous appartient à un User (médecin) pour les includes
RendezVous.belongsTo(User, {
  foreignKey: 'medecin_id',
  as: 'medecin_user',
  targetKey: 'id',
});

// Ordonnance appartient à Patient et Medecin
Ordonnance.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Patient.hasMany(Ordonnance, { foreignKey: 'patient_id', as: 'ordonnances' });
Ordonnance.belongsTo(Medecin, { foreignKey: 'medecin_id', as: 'medecin' });
Medecin.hasMany(Ordonnance, { foreignKey: 'medecin_id', as: 'ordonnances' });

// Analyse appartient à Patient et Medecin
Analyse.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Patient.hasMany(Analyse, { foreignKey: 'patient_id', as: 'analyses' });
Analyse.belongsTo(Medecin, { foreignKey: 'medecin_id', as: 'medecin' });
Medecin.hasMany(Analyse, { foreignKey: 'medecin_id', as: 'analyses' });

// Consultation appartient à Patient et Medecin
Consultation.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Patient.hasMany(Consultation, { foreignKey: 'patient_id', as: 'consultations' });
Consultation.belongsTo(Medecin, { foreignKey: 'medecin_id', as: 'medecin' });
Medecin.hasMany(Consultation, { foreignKey: 'medecin_id', as: 'consultations' });

// DossierPartage — patient partage son dossier avec un médecin
DossierPartage.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
DossierPartage.belongsTo(User, { foreignKey: 'medecin_id', as: 'medecin' });
User.hasMany(DossierPartage, { foreignKey: 'patient_id', as: 'dossiersPartages' });
User.hasMany(DossierPartage, { foreignKey: 'medecin_id', as: 'dossiersRecus' });

// AdminHopital — lien entre user admin_hopital et un hôpital
AdminHopital.belongsTo(User,    { foreignKey: 'user_id',    as: 'user' });
AdminHopital.belongsTo(Hopital, { foreignKey: 'hopital_id', as: 'hopital' });
User.hasOne(AdminHopital,    { foreignKey: 'user_id',    as: 'admin_hopital_profil' });
Hopital.hasMany(AdminHopital,{ foreignKey: 'hopital_id', as: 'admins' });

// AlerteSang — alertes créées par admin_hopital
AlerteSang.belongsTo(Hopital, { foreignKey: 'hopital_id', as: 'hopital' });
Hopital.hasMany(AlerteSang,   { foreignKey: 'hopital_id', as: 'alertes' });

// DemandeHopital — demandes de changement d'hôpital par les médecins
DemandeHopital.belongsTo(User, { foreignKey: 'medecin_id', as: 'medecin' });
User.hasMany(DemandeHopital,   { foreignKey: 'medecin_id', as: 'demandes_hopital' });

// DonneurReponse — traçabilité des réponses aux alertes
DonneurReponse.belongsTo(AlerteSang, { foreignKey: 'alerte_id',  as: 'alerte'  });
DonneurReponse.belongsTo(User,       { foreignKey: 'donneur_id', as: 'donneur' });
AlerteSang.hasMany(DonneurReponse,   { foreignKey: 'alerte_id',  as: 'reponses' });

/**
 * Synchronisation des modèles avec la base de données
 */
const syncDatabase = async () => {
  // Convertir les colonnes ENUM → VARCHAR pour éviter les restrictions PostgreSQL
  try {
    await sequelize.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR(50) USING "role"::text`
    );
  } catch (_) {}
  try {
    await sequelize.query(
      `ALTER TABLE "rendez_vous" ALTER COLUMN "statut" TYPE VARCHAR(30) USING "statut"::text`
    );
  } catch (_) {}

  // Sync par modèle dans l'ordre des dépendances FK
  // Chaque erreur est loguée sans bloquer les suivants
  const ordered = [
    User, Patient, Medecin, Hopital,
    AdminHopital, AlerteSang, DemandeHopital,
    RendezVous, Ordonnance, Analyse, Consultation, DossierPartage, Message, PushSubscription, Evaluation, DonneurReponse,
  ];

  let errors = 0;
  for (const model of ordered) {
    try {
      await model.sync({ alter: true });
    } catch (e) {
      errors++;
      console.warn(`[sync] ${model.getTableName()} : ${e.message}`);
    }
  }

  if (errors === 0) {
    console.log('Modèles synchronisés avec la base de données ✓');
  } else {
    console.log(`Modèles synchronisés avec ${errors} avertissement(s) ✓`);
  }
};

module.exports = {
  sequelize,
  User,
  Patient,
  Medecin,
  RendezVous,
  Hopital,
  Ordonnance,
  Analyse,
  Consultation,
  DossierPartage,
  AdminHopital,
  AlerteSang,
  DemandeHopital,
  Message,
  PushSubscription,
  Evaluation,
  DonneurReponse,
  syncDatabase,
};

