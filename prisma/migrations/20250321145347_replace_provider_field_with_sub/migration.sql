/*
  Warnings:

  - You are about to drop the column `provider` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `provider`,
    ADD COLUMN `sub` VARCHAR(191) NULL;
