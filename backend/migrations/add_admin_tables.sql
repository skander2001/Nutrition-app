-- ============================================================
--  Migration : tables utilisées par le back-office nutritionniste
--    - notification (notifications utilisateur)
--    - meal_plan_template (modèles de plans alimentaires)
--    - patient_meal_plan (plan assigné à un patient)
--
--  Exécution :
--    mysql -u root -pspanzo -h 127.0.0.1 nutrition_db < backend/migrations/add_admin_tables.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS `notification` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `id_user`    INT NOT NULL,
  `titre`      VARCHAR(150) NOT NULL,
  `message`    TEXT,
  `type`       VARCHAR(20) DEFAULT 'info',
  `lien`       VARCHAR(255) DEFAULT NULL,
  `lu`         TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_user_idx` (`id_user`),
  CONSTRAINT `notification_user_fk` FOREIGN KEY (`id_user`)
    REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `meal_plan_template` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `nom`         VARCHAR(150) NOT NULL,
  `objectif`    VARCHAR(50) DEFAULT NULL,
  `description` TEXT,
  `kcal_total`  INT DEFAULT NULL,
  `contenu`     TEXT,
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `patient_meal_plan` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `id_patient`  INT NOT NULL,
  `id_template` INT DEFAULT NULL,
  `nom`         VARCHAR(150) DEFAULT NULL,
  `date_debut`  DATE DEFAULT NULL,
  `date_fin`    DATE DEFAULT NULL,
  `contenu`     TEXT,
  `notes`       TEXT,
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pmp_patient_idx` (`id_patient`),
  KEY `pmp_template_idx` (`id_template`),
  CONSTRAINT `pmp_patient_fk` FOREIGN KEY (`id_patient`)
    REFERENCES `patient` (`id_patient`) ON DELETE CASCADE,
  CONSTRAINT `pmp_template_fk` FOREIGN KEY (`id_template`)
    REFERENCES `meal_plan_template` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
