-- AlterTable
ALTER TABLE `users` ADD COLUMN `provider` ENUM('Credentials', 'Google') NOT NULL DEFAULT 'Credentials',
    MODIFY `password` VARCHAR(191) NULL;
