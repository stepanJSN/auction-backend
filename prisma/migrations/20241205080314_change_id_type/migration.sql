/*
  Warnings:

  - You are about to alter the column `location_id` on the `cards` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `episodes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `episodes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `episode_id` on the `episodes_cards` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `locations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `locations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `cards` DROP FOREIGN KEY `cards_location_id_fkey`;

-- DropForeignKey
ALTER TABLE `episodes_cards` DROP FOREIGN KEY `episodes_cards_episode_id_fkey`;

-- AlterTable
ALTER TABLE `cards` MODIFY `location_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `episodes` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `episodes_cards` MODIFY `episode_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `locations` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `cards` ADD CONSTRAINT `cards_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `episodes_cards` ADD CONSTRAINT `episodes_cards_episode_id_fkey` FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
