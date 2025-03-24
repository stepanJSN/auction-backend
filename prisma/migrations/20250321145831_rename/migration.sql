/*
  Warnings:

  - You are about to drop the column `sub` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `sub`,
    ADD COLUMN `googleSub` VARCHAR(191) NULL;
