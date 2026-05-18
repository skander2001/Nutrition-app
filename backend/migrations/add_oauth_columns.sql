-- Run once to update the user table for OAuth support
ALTER TABLE `user`
  MODIFY COLUMN `password` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `oauth_provider` VARCHAR(50) DEFAULT NULL,
  ADD COLUMN `oauth_id` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `user`
  ADD UNIQUE KEY `oauth_unique` (`oauth_provider`, `oauth_id`);
