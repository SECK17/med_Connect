-- 0001 — Schéma de référence de MedConnect (novembre 2026).
-- Généré à partir de pg_dump d'une base créée par les modèles Sequelize, puis rendu idempotent :
--   * base vide      → crée tout le schéma ;
--   * base existante (créée autrefois par sequelize.sync) → ajoute seulement ce qui manque
--     (types, tables, colonnes, contraintes, index) sans modifier ni supprimer de données.
-- NE PAS MODIFIER ce fichier : toute évolution du schéma passe par une nouvelle migration.

-- Anciennes bases : quelques colonnes ENUM sont devenues des VARCHAR
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
             AND table_name = 'users' AND column_name = 'role' AND data_type = 'USER-DEFINED') THEN
    ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.users ALTER COLUMN role TYPE VARCHAR(50) USING role::text;
    ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'patient';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
             AND table_name = 'rendez_vous' AND column_name = 'statut' AND data_type = 'USER-DEFINED') THEN
    ALTER TABLE public.rendez_vous ALTER COLUMN statut DROP DEFAULT;
    ALTER TABLE public.rendez_vous ALTER COLUMN statut TYPE VARCHAR(30) USING statut::text;
    ALTER TABLE public.rendez_vous ALTER COLUMN statut SET DEFAULT 'en_attente';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_alertes_sang_groupe_sang AS ENUM (
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-'
);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  END $$;

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'A+';

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'A-';

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'B+';

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'B-';

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'AB+';

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'AB-';

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'O+';

ALTER TYPE public.enum_alertes_sang_groupe_sang ADD VALUE IF NOT EXISTS 'O-';

DO $$ BEGIN
  CREATE TYPE public.enum_alertes_sang_statut AS ENUM (
    'active',
    'terminee',
    'annulee'
);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  END $$;

ALTER TYPE public.enum_alertes_sang_statut ADD VALUE IF NOT EXISTS 'active';

ALTER TYPE public.enum_alertes_sang_statut ADD VALUE IF NOT EXISTS 'terminee';

ALTER TYPE public.enum_alertes_sang_statut ADD VALUE IF NOT EXISTS 'annulee';

DO $$ BEGIN
  CREATE TYPE public.enum_alertes_sang_urgence AS ENUM (
    'Faible',
    'Moyen',
    'Urgent',
    'Critique'
);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  END $$;

ALTER TYPE public.enum_alertes_sang_urgence ADD VALUE IF NOT EXISTS 'Faible';

ALTER TYPE public.enum_alertes_sang_urgence ADD VALUE IF NOT EXISTS 'Moyen';

ALTER TYPE public.enum_alertes_sang_urgence ADD VALUE IF NOT EXISTS 'Urgent';

ALTER TYPE public.enum_alertes_sang_urgence ADD VALUE IF NOT EXISTS 'Critique';

DO $$ BEGIN
  CREATE TYPE public.enum_hopitaux_type AS ENUM (
    'Hôpital',
    'Clinique',
    'CHU',
    'Centre'
);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  END $$;

ALTER TYPE public.enum_hopitaux_type ADD VALUE IF NOT EXISTS 'Hôpital';

ALTER TYPE public.enum_hopitaux_type ADD VALUE IF NOT EXISTS 'Clinique';

ALTER TYPE public.enum_hopitaux_type ADD VALUE IF NOT EXISTS 'CHU';

ALTER TYPE public.enum_hopitaux_type ADD VALUE IF NOT EXISTS 'Centre';

DO $$ BEGIN
  CREATE TYPE public.enum_patients_groupe_sanguin AS ENUM (
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-'
);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  END $$;

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'A+';

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'A-';

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'B+';

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'B-';

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'AB+';

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'AB-';

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'O+';

ALTER TYPE public.enum_patients_groupe_sanguin ADD VALUE IF NOT EXISTS 'O-';

CREATE TABLE IF NOT EXISTS public.admin_hopitaux (
    id integer NOT NULL,
    user_id integer NOT NULL,
    hopital_id integer NOT NULL,
    hopital_nom character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL
);

ALTER TABLE public.admin_hopitaux ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.admin_hopitaux ADD COLUMN IF NOT EXISTS user_id integer;

ALTER TABLE public.admin_hopitaux ADD COLUMN IF NOT EXISTS hopital_id integer;

ALTER TABLE public.admin_hopitaux ADD COLUMN IF NOT EXISTS hopital_nom character varying(255);

ALTER TABLE public.admin_hopitaux ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.admin_hopitaux_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.admin_hopitaux_id_seq OWNED BY public.admin_hopitaux.id;

CREATE TABLE IF NOT EXISTS public.alertes_sang (
    id integer NOT NULL,
    hopital_id integer NOT NULL,
    hopital_nom character varying(255) NOT NULL,
    admin_id integer NOT NULL,
    groupe_sang public.enum_alertes_sang_groupe_sang NOT NULL,
    groupes_donneurs json NOT NULL,
    quantite character varying(50),
    message text,
    urgence public.enum_alertes_sang_urgence DEFAULT 'Urgent'::public.enum_alertes_sang_urgence NOT NULL,
    statut public.enum_alertes_sang_statut DEFAULT 'active'::public.enum_alertes_sang_statut NOT NULL,
    latitude double precision,
    longitude double precision,
    rayon_km integer,
    duree_heures integer,
    expire_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS hopital_id integer;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS hopital_nom character varying(255);

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS admin_id integer;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS groupe_sang public.enum_alertes_sang_groupe_sang;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS groupes_donneurs json;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS quantite character varying(50);

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS message text;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS urgence public.enum_alertes_sang_urgence DEFAULT 'Urgent'::public.enum_alertes_sang_urgence NOT NULL;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS statut public.enum_alertes_sang_statut DEFAULT 'active'::public.enum_alertes_sang_statut NOT NULL;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS latitude double precision;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS rayon_km integer;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS duree_heures integer;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS expire_at timestamp with time zone;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

ALTER TABLE public.alertes_sang ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.alertes_sang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.alertes_sang_id_seq OWNED BY public.alertes_sang.id;

CREATE TABLE IF NOT EXISTS public.analyses (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    medecin_id integer NOT NULL,
    fichier character varying(255) NOT NULL,
    notes text,
    date date NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS patient_id integer;

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS medecin_id integer;

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS fichier character varying(255);

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS date date;

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.analyses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.analyses_id_seq OWNED BY public.analyses.id;

CREATE TABLE IF NOT EXISTS public.consultations (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    medecin_id integer NOT NULL,
    rdv_id integer,
    date date NOT NULL,
    hopital character varying(255),
    motif character varying(255),
    diagnostic text,
    traitement text,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS patient_id integer;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS medecin_id integer;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS rdv_id integer;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS date date;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS hopital character varying(255);

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS motif character varying(255);

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS diagnostic text;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS traitement text;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.consultations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.consultations_id_seq OWNED BY public.consultations.id;

CREATE TABLE IF NOT EXISTS public.demandes_hopital (
    id integer NOT NULL,
    medecin_id integer NOT NULL,
    hopital_actuel character varying(200),
    hopital_demande character varying(200) NOT NULL,
    justificatif character varying(500),
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    motif_rejet text,
    created_at timestamp with time zone NOT NULL
);

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS medecin_id integer;

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS hopital_actuel character varying(200);

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS hopital_demande character varying(200);

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS justificatif character varying(500);

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS statut character varying(20) DEFAULT 'en_attente'::character varying;

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS motif_rejet text;

ALTER TABLE public.demandes_hopital ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.demandes_hopital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.demandes_hopital_id_seq OWNED BY public.demandes_hopital.id;

CREATE TABLE IF NOT EXISTS public.donneur_reponses (
    id integer NOT NULL,
    alerte_id integer NOT NULL,
    donneur_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE public.donneur_reponses ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.donneur_reponses ADD COLUMN IF NOT EXISTS alerte_id integer;

ALTER TABLE public.donneur_reponses ADD COLUMN IF NOT EXISTS donneur_id integer;

ALTER TABLE public.donneur_reponses ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

ALTER TABLE public.donneur_reponses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.donneur_reponses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.donneur_reponses_id_seq OWNED BY public.donneur_reponses.id;

CREATE TABLE IF NOT EXISTS public.dossier_partages (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    medecin_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);

ALTER TABLE public.dossier_partages ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.dossier_partages ADD COLUMN IF NOT EXISTS patient_id integer;

ALTER TABLE public.dossier_partages ADD COLUMN IF NOT EXISTS medecin_id integer;

ALTER TABLE public.dossier_partages ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.dossier_partages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.dossier_partages_id_seq OWNED BY public.dossier_partages.id;

CREATE TABLE IF NOT EXISTS public.evaluations (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    medecin_id integer NOT NULL,
    rdv_id integer,
    note integer NOT NULL,
    commentaire text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS patient_id integer;

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS medecin_id integer;

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS rdv_id integer;

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS note integer;

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS commentaire text;

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.evaluations_id_seq OWNED BY public.evaluations.id;

CREATE TABLE IF NOT EXISTS public.hopitaux (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    type public.enum_hopitaux_type DEFAULT 'Hôpital'::public.enum_hopitaux_type NOT NULL,
    ville character varying(255) NOT NULL,
    adresse text,
    telephone character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS nom character varying(255);

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS type public.enum_hopitaux_type DEFAULT 'Hôpital'::public.enum_hopitaux_type NOT NULL;

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS ville character varying(255);

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS adresse text;

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS telephone character varying(255);

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone;

ALTER TABLE public.hopitaux ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.hopitaux_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.hopitaux_id_seq OWNED BY public.hopitaux.id;

CREATE TABLE IF NOT EXISTS public.journal_acces (
    id bigint NOT NULL,
    acteur_id integer NOT NULL,
    acteur_nom character varying(100),
    acteur_role character varying(50) NOT NULL,
    patient_id integer,
    action character varying(20) NOT NULL,
    ressource character varying(30) NOT NULL,
    ressource_id integer,
    details character varying(255),
    autorise boolean NOT NULL,
    statut_http smallint NOT NULL,
    methode character varying(10) NOT NULL,
    chemin character varying(255) NOT NULL,
    ip character varying(64),
    user_agent character varying(255),
    created_at timestamp with time zone NOT NULL
);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS id bigint;

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS acteur_id integer;

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS acteur_nom character varying(100);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS acteur_role character varying(50);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS patient_id integer;

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS action character varying(20);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS ressource character varying(30);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS ressource_id integer;

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS details character varying(255);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS autorise boolean;

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS statut_http smallint;

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS methode character varying(10);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS chemin character varying(255);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS ip character varying(64);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS user_agent character varying(255);

ALTER TABLE public.journal_acces ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.journal_acces_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.journal_acces_id_seq OWNED BY public.journal_acces.id;

CREATE TABLE IF NOT EXISTS public.medecins (
    id integer NOT NULL,
    specialite character varying(100),
    num_licence character varying(50),
    valide boolean DEFAULT false,
    disponible boolean DEFAULT true,
    hopital character varying(200),
    experience integer,
    tarif character varying(50),
    disponibilites jsonb
);

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS specialite character varying(100);

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS num_licence character varying(50);

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS valide boolean DEFAULT false;

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS disponible boolean DEFAULT true;

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS hopital character varying(200);

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS experience integer;

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS tarif character varying(50);

ALTER TABLE public.medecins ADD COLUMN IF NOT EXISTS disponibilites jsonb;

CREATE TABLE IF NOT EXISTS public.messages (
    id integer NOT NULL,
    expediteur_id integer NOT NULL,
    destinataire_id integer NOT NULL,
    contenu text NOT NULL,
    lu boolean DEFAULT false,
    supprime boolean DEFAULT false,
    modifie boolean DEFAULT false,
    modifie_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS expediteur_id integer;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS destinataire_id integer;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS contenu text;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS lu boolean DEFAULT false;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS supprime boolean DEFAULT false;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS modifie boolean DEFAULT false;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS modifie_at timestamp with time zone;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;

CREATE TABLE IF NOT EXISTS public.ordonnances (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    medecin_id integer NOT NULL,
    fichier character varying(255),
    medicaments text,
    notes text,
    date date NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS patient_id integer;

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS medecin_id integer;

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS fichier character varying(255);

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS medicaments text;

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS date date;

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.ordonnances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.ordonnances_id_seq OWNED BY public.ordonnances.id;

CREATE TABLE IF NOT EXISTS public.patients (
    id integer NOT NULL,
    date_naissance date,
    adresse character varying(200),
    groupe_sanguin public.enum_patients_groupe_sanguin,
    donneur_disponible boolean DEFAULT false,
    latitude double precision,
    longitude double precision,
    allergies json DEFAULT '[]'::json,
    antecedents json DEFAULT '[]'::json,
    traitements json DEFAULT '[]'::json,
    vaccinations json DEFAULT '[]'::json
);

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_naissance date;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS adresse character varying(200);

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS groupe_sanguin public.enum_patients_groupe_sanguin;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS donneur_disponible boolean DEFAULT false;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS latitude double precision;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies json DEFAULT '[]'::json;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS antecedents json DEFAULT '[]'::json;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS traitements json DEFAULT '[]'::json;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS vaccinations json DEFAULT '[]'::json;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone NOT NULL
);

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_id integer;

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS endpoint text;

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS p256dh text;

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS auth text;

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    revoked_reason character varying(20),
    user_agent character varying(255),
    created_at timestamp with time zone NOT NULL
);

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS user_id integer;

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS token_hash character varying(64);

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone;

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS revoked_reason character varying(20);

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS user_agent character varying(255);

ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;

CREATE TABLE IF NOT EXISTS public.rendez_vous (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    medecin_id integer NOT NULL,
    date_rdv timestamp with time zone NOT NULL,
    heure character varying(10) NOT NULL,
    motif character varying(500),
    statut character varying(30) DEFAULT 'en_attente'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS patient_id integer;

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS medecin_id integer;

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS date_rdv timestamp with time zone;

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS heure character varying(10);

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS motif character varying(500);

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS statut character varying(30) DEFAULT 'en_attente'::character varying NOT NULL;

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS created_at timestamp with time zone;

ALTER TABLE public.rendez_vous ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.rendez_vous_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.rendez_vous_id_seq OWNED BY public.rendez_vous.id;

CREATE TABLE IF NOT EXISTS public.users (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    telephone character varying(20) NOT NULL,
    role character varying(50) DEFAULT 'patient'::character varying NOT NULL,
    photo character varying(255),
    email_verifie boolean DEFAULT true NOT NULL,
    token_version integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id integer;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nom character varying(100);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email character varying(150);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password character varying(255);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telephone character varying(20);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role character varying(50) DEFAULT 'patient'::character varying NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo character varying(255);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verifie boolean DEFAULT true NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_version integer DEFAULT 0 NOT NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone;

CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

ALTER TABLE ONLY public.admin_hopitaux ALTER COLUMN id SET DEFAULT nextval('public.admin_hopitaux_id_seq'::regclass);

ALTER TABLE ONLY public.alertes_sang ALTER COLUMN id SET DEFAULT nextval('public.alertes_sang_id_seq'::regclass);

ALTER TABLE ONLY public.analyses ALTER COLUMN id SET DEFAULT nextval('public.analyses_id_seq'::regclass);

ALTER TABLE ONLY public.consultations ALTER COLUMN id SET DEFAULT nextval('public.consultations_id_seq'::regclass);

ALTER TABLE ONLY public.demandes_hopital ALTER COLUMN id SET DEFAULT nextval('public.demandes_hopital_id_seq'::regclass);

ALTER TABLE ONLY public.donneur_reponses ALTER COLUMN id SET DEFAULT nextval('public.donneur_reponses_id_seq'::regclass);

ALTER TABLE ONLY public.dossier_partages ALTER COLUMN id SET DEFAULT nextval('public.dossier_partages_id_seq'::regclass);

ALTER TABLE ONLY public.evaluations ALTER COLUMN id SET DEFAULT nextval('public.evaluations_id_seq'::regclass);

ALTER TABLE ONLY public.hopitaux ALTER COLUMN id SET DEFAULT nextval('public.hopitaux_id_seq'::regclass);

ALTER TABLE ONLY public.journal_acces ALTER COLUMN id SET DEFAULT nextval('public.journal_acces_id_seq'::regclass);

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);

ALTER TABLE ONLY public.ordonnances ALTER COLUMN id SET DEFAULT nextval('public.ordonnances_id_seq'::regclass);

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);

ALTER TABLE ONLY public.rendez_vous ALTER COLUMN id SET DEFAULT nextval('public.rendez_vous_id_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

DO $$ BEGIN
  ALTER TABLE ONLY public.admin_hopitaux
    ADD CONSTRAINT admin_hopitaux_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.admin_hopitaux
    ADD CONSTRAINT admin_hopitaux_user_id_key UNIQUE (user_id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.alertes_sang
    ADD CONSTRAINT alertes_sang_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.demandes_hopital
    ADD CONSTRAINT demandes_hopital_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.donneur_reponses
    ADD CONSTRAINT donneur_reponses_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.dossier_partages
    ADD CONSTRAINT dossier_partages_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.hopitaux
    ADD CONSTRAINT hopitaux_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.journal_acces
    ADD CONSTRAINT journal_acces_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.medecins
    ADD CONSTRAINT medecins_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS donneur_reponses_alerte_id_donneur_id ON public.donneur_reponses USING btree (alerte_id, donneur_id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS dossier_partages_patient_id_medecin_id ON public.dossier_partages USING btree (patient_id, medecin_id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS evaluations_patient_id_medecin_id ON public.evaluations USING btree (patient_id, medecin_id);
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

CREATE INDEX IF NOT EXISTS journal_acces_acteur_id_created_at ON public.journal_acces USING btree (acteur_id, created_at);

CREATE INDEX IF NOT EXISTS journal_acces_created_at ON public.journal_acces USING btree (created_at);

CREATE INDEX IF NOT EXISTS journal_acces_patient_id_created_at ON public.journal_acces USING btree (patient_id, created_at);

CREATE INDEX IF NOT EXISTS messages_destinataire_id_lu ON public.messages USING btree (destinataire_id, lu);

CREATE INDEX IF NOT EXISTS messages_expediteur_id_destinataire_id_created_at ON public.messages USING btree (expediteur_id, destinataire_id, created_at);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);

DO $$ BEGIN
  ALTER TABLE ONLY public.admin_hopitaux
    ADD CONSTRAINT admin_hopitaux_hopital_id_fkey FOREIGN KEY (hopital_id) REFERENCES public.hopitaux(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.admin_hopitaux
    ADD CONSTRAINT admin_hopitaux_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.alertes_sang
    ADD CONSTRAINT alertes_sang_hopital_id_fkey FOREIGN KEY (hopital_id) REFERENCES public.hopitaux(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_rdv_id_fkey FOREIGN KEY (rdv_id) REFERENCES public.rendez_vous(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.demandes_hopital
    ADD CONSTRAINT demandes_hopital_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.donneur_reponses
    ADD CONSTRAINT donneur_reponses_alerte_id_fkey FOREIGN KEY (alerte_id) REFERENCES public.alertes_sang(id) ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.donneur_reponses
    ADD CONSTRAINT donneur_reponses_donneur_id_fkey FOREIGN KEY (donneur_id) REFERENCES public.users(id) ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.dossier_partages
    ADD CONSTRAINT dossier_partages_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.dossier_partages
    ADD CONSTRAINT dossier_partages_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.medecins
    ADD CONSTRAINT medecins_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;

DO $$ BEGIN
  ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object OR duplicate_table OR invalid_table_definition THEN NULL;
  WHEN foreign_key_violation OR unique_violation OR check_violation OR not_null_violation THEN
    RAISE WARNING 'Migration de référence, contrainte non appliquée : %', SQLERRM;
  END $$;
