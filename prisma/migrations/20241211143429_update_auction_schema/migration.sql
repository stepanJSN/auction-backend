/*
  Warnings:

  - You are about to drop the column `user_card_id` on the `auctions` table. All the data in the column will be lost.
  - You are about to alter the column `starting_bid` on the `auctions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - You are about to alter the column `min_bid_step` on the `auctions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - You are about to alter the column `max_bid` on the `auctions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - Added the required column `card_instance_id` to the `auctions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `min_length` on the `auctions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE `auctions` DROP FOREIGN KEY `auctions_user_card_id_fkey`;

-- AlterTable
ALTER TABLE `auctions` DROP COLUMN `user_card_id`,
    ADD COLUMN `card_instance_id` VARCHAR(191) NOT NULL,
    MODIFY `starting_bid` INTEGER NOT NULL,
    MODIFY `min_bid_step` INTEGER NOT NULL,
    MODIFY `max_bid` INTEGER NULL,
    DROP COLUMN `min_length`,
    ADD COLUMN `min_length` INTEGER NOT NULL,
    MODIFY `is_completed` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `auctions` ADD CONSTRAINT `auctions_card_instance_id_fkey` FOREIGN KEY (`card_instance_id`) REFERENCES `card_instances`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
