-- ============================================================
--  NutriCare — Schéma propre de la base `nutrition_db`
-- ------------------------------------------------------------
--  Supprime les tables en double / incohérentes et recrée
--  uniquement les tables utilisées par le backend Flask :
--    user, patient, nutritionniste, rendez_vous, disponibilite
--
--  ATTENTION : ce script efface toutes les données existantes
--  (comptes de test inclus). Re-exécutable sans risque.
--
--  Exécution :
--    mysql -u root -pspanzo -h 127.0.0.1 nutrition_db < backend/migrations/clean_schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `rendez_vous`;
DROP TABLE IF EXISTS `disponibilite`;
DROP TABLE IF EXISTS `disponibilites`;
DROP TABLE IF EXISTS `consultation`;
DROP TABLE IF EXISTS `consultations`;
DROP TABLE IF EXISTS `calendrier`;
DROP TABLE IF EXISTS `regimes`;
DROP TABLE IF EXISTS `aliments`;
DROP TABLE IF EXISTS `patient`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `nutritionniste`;
DROP TABLE IF EXISTS `nutritionnistes`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
--  user
-- ------------------------------------------------------------
CREATE TABLE `user` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `nom`            VARCHAR(255) DEFAULT NULL,
  `prenom`         VARCHAR(255) DEFAULT NULL,
  `ddn`            DATE DEFAULT NULL,
  `email`          VARCHAR(255) DEFAULT NULL,
  `password`       VARCHAR(255) DEFAULT NULL,
  `telephone`      VARCHAR(20) DEFAULT NULL,
  `status`         ENUM('temporaire','actif') DEFAULT 'actif',
  `oauth_provider` VARCHAR(50) DEFAULT NULL,
  `oauth_id`       VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `oauth_unique` (`oauth_provider`,`oauth_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
--  patient
-- ------------------------------------------------------------
CREATE TABLE `patient` (
  `id_patient`        INT NOT NULL AUTO_INCREMENT,
  `id_user`           INT NOT NULL,
  `sexe`              ENUM('M','F') DEFAULT NULL,
  `adresse`           VARCHAR(255) DEFAULT NULL,
  `allergie`          VARCHAR(255) DEFAULT NULL,
  `maladie_chronique` VARCHAR(255) DEFAULT NULL,
  `objectif`          VARCHAR(255) DEFAULT NULL,
  `ddc`               DATE DEFAULT NULL,
  PRIMARY KEY (`id_patient`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `patient_user_fk` FOREIGN KEY (`id_user`)
    REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
--  nutritionniste
-- ------------------------------------------------------------
CREATE TABLE `nutritionniste` (
  `id_nutritionniste` INT NOT NULL AUTO_INCREMENT,
  `id_user`           INT NOT NULL,
  PRIMARY KEY (`id_nutritionniste`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `nutritionniste_user_fk` FOREIGN KEY (`id_user`)
    REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
--  rendez_vous
-- ------------------------------------------------------------
CREATE TABLE `rendez_vous` (
  `id_rendez_vous`    INT NOT NULL AUTO_INCREMENT,
  `id_patient`        INT NOT NULL,
  `id_nutritionniste` INT NOT NULL,
  `date_rendez_vous`  DATE NOT NULL,
  `heure`             TIME NOT NULL,
  `statut`            ENUM('en_attente','confirme','annule') DEFAULT 'en_attente',
  PRIMARY KEY (`id_rendez_vous`),
  UNIQUE KEY `creneau_unique` (`id_nutritionniste`,`date_rendez_vous`,`heure`),
  KEY `id_patient` (`id_patient`),
  CONSTRAINT `rdv_patient_fk` FOREIGN KEY (`id_patient`)
    REFERENCES `patient` (`id_patient`) ON DELETE CASCADE,
  CONSTRAINT `rdv_nutritionniste_fk` FOREIGN KEY (`id_nutritionniste`)
    REFERENCES `nutritionniste` (`id_nutritionniste`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
--  disponibilite
-- ------------------------------------------------------------
CREATE TABLE `disponibilite` (
  `id_disponibilite`  INT NOT NULL AUTO_INCREMENT,
  `id_nutritionniste` INT NOT NULL,
  `jour`              VARCHAR(20) DEFAULT NULL,
  `date`              DATE DEFAULT NULL,
  `heure_debut`       TIME NOT NULL,
  `heure_fin`         TIME NOT NULL,
  `statut`            ENUM('disponible','indisponible') DEFAULT 'disponible',
  PRIMARY KEY (`id_disponibilite`),
  KEY `id_nutritionniste` (`id_nutritionniste`),
  CONSTRAINT `dispo_nutritionniste_fk` FOREIGN KEY (`id_nutritionniste`)
    REFERENCES `nutritionniste` (`id_nutritionniste`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
--  consultation  (mesures relevées lors d'un rendez-vous)
-- ------------------------------------------------------------
CREATE TABLE `consultation` (
  `id_consultation`    INT NOT NULL AUTO_INCREMENT,
  `id_rendez_vous`     INT NOT NULL,
  `date_consultation`  DATE DEFAULT NULL,
  `poids`              DECIMAL(5,2) DEFAULT NULL,
  `taille`             DECIMAL(4,2) DEFAULT NULL,
  `glycemie`           DECIMAL(4,2) DEFAULT NULL,
  `tension_arterielle` VARCHAR(20) DEFAULT NULL,
  `diagnostic`         VARCHAR(255) DEFAULT NULL,
  `remarque`           VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_consultation`),
  KEY `id_rendez_vous` (`id_rendez_vous`),
  CONSTRAINT `consultation_rdv_fk` FOREIGN KEY (`id_rendez_vous`)
    REFERENCES `rendez_vous` (`id_rendez_vous`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Données de base — le nutritionniste unique du cabinet
--  Connexion : sarah.benali@nutricare.tn  /  nutricare2026
-- ============================================================
INSERT INTO `user` (`id`, `nom`, `prenom`, `ddn`, `email`, `password`, `telephone`, `status`)
VALUES (1, 'Benali', 'Sarah', NULL, 'sarah.benali@nutricare.tn',
        '$2b$12$O7.PzSfmQ2uE5WcRllpsM.Oi/Ws5ihKVul/QryqfQCEHmGrZxz1dy',
        '+216 71 234 567', 'actif');

INSERT INTO `nutritionniste` (`id_nutritionniste`, `id_user`) VALUES (1, 1);

-- Disponibilités hebdomadaires : Lundi → Vendredi, 09:00-12:00 et 15:00-17:00
INSERT INTO `disponibilite` (`id_nutritionniste`, `jour`, `date`, `heure_debut`, `heure_fin`, `statut`) VALUES
(1, 'Lundi',    NULL, '09:00:00', '12:00:00', 'disponible'),
(1, 'Lundi',    NULL, '15:00:00', '17:00:00', 'disponible'),
(1, 'Mardi',    NULL, '09:00:00', '12:00:00', 'disponible'),
(1, 'Mardi',    NULL, '15:00:00', '17:00:00', 'disponible'),
(1, 'Mercredi', NULL, '09:00:00', '12:00:00', 'disponible'),
(1, 'Mercredi', NULL, '15:00:00', '17:00:00', 'disponible'),
(1, 'Jeudi',    NULL, '09:00:00', '12:00:00', 'disponible'),
(1, 'Jeudi',    NULL, '15:00:00', '17:00:00', 'disponible'),
(1, 'Vendredi', NULL, '09:00:00', '12:00:00', 'disponible'),
(1, 'Vendredi', NULL, '15:00:00', '17:00:00', 'disponible');
