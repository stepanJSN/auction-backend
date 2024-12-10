/*
  Warnings:

  - You are about to drop the `cards_sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `episodes_cards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users_cards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `auctions` DROP FOREIGN KEY `auctions_user_card_id_fkey`;

-- DropForeignKey
ALTER TABLE `cards_sets` DROP FOREIGN KEY `cards_sets_card_id_fkey`;

-- DropForeignKey
ALTER TABLE `cards_sets` DROP FOREIGN KEY `cards_sets_set_id_fkey`;

-- DropForeignKey
ALTER TABLE `episodes_cards` DROP FOREIGN KEY `episodes_cards_card_id_fkey`;

-- DropForeignKey
ALTER TABLE `episodes_cards` DROP FOREIGN KEY `episodes_cards_episode_id_fkey`;

-- DropForeignKey
ALTER TABLE `users_cards` DROP FOREIGN KEY `users_cards_card_id_fkey`;

-- DropForeignKey
ALTER TABLE `users_cards` DROP FOREIGN KEY `users_cards_user_id_fkey`;

-- DropTable
DROP TABLE `cards_sets`;

-- DropTable
DROP TABLE `episodes_cards`;

-- DropTable
DROP TABLE `users_cards`;

-- CreateTable
CREATE TABLE `card_instances` (
    `id` VARCHAR(191) NOT NULL,
    `card_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_cardsToepisodes` (
    `A` VARCHAR(191) NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_cardsToepisodes_AB_unique`(`A`, `B`),
    INDEX `_cardsToepisodes_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_cardsTosets` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_cardsTosets_AB_unique`(`A`, `B`),
    INDEX `_cardsTosets_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auctions` ADD CONSTRAINT `auctions_user_card_id_fkey` FOREIGN KEY (`user_card_id`) REFERENCES `card_instances`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_instances` ADD CONSTRAINT `card_instances_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_instances` ADD CONSTRAINT `card_instances_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_cardsToepisodes` ADD CONSTRAINT `_cardsToepisodes_A_fkey` FOREIGN KEY (`A`) REFERENCES `cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_cardsToepisodes` ADD CONSTRAINT `_cardsToepisodes_B_fkey` FOREIGN KEY (`B`) REFERENCES `episodes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_cardsTosets` ADD CONSTRAINT `_cardsTosets_A_fkey` FOREIGN KEY (`A`) REFERENCES `cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_cardsTosets` ADD CONSTRAINT `_cardsTosets_B_fkey` FOREIGN KEY (`B`) REFERENCES `sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
