-- ============================================================
--  Migration : ajoute `taille` et `poids_initial` à la table patient
--  (utilisés par le back-office nutritionniste)
--
--  Exécution :
--    mysql -u root -pspanzo -h 127.0.0.1 nutrition_db < backend/migrations/add_patient_taille_poids.sql
--
--  Sûr à rejouer : utilise `ADD COLUMN IF NOT EXISTS` (MariaDB / MySQL 8+).
-- ============================================================

ALTER TABLE `patient`
  ADD COLUMN `taille` DECIMAL(4,2) DEFAULT NULL AFTER `adresse`,
  ADD COLUMN `poids_initial` DECIMAL(5,2) DEFAULT NULL AFTER `taille`;
