/*
  Warnings:

  - You are about to drop the column `message` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_id` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the column `sender_id` on the `chats` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `chats` DROP FOREIGN KEY `chats_receiver_id_fkey`;

-- DropForeignKey
ALTER TABLE `chats` DROP FOREIGN KEY `chats_sender_id_fkey`;

-- AlterTable
ALTER TABLE `chats` DROP COLUMN `message`,
    DROP COLUMN `receiver_id`,
    DROP COLUMN `sender_id`;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NOT NULL,
    `chat_id` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_chatsTousers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_chatsTousers_AB_unique`(`A`, `B`),
    INDEX `_chatsTousers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_chatsTousers` ADD CONSTRAINT `_chatsTousers_A_fkey` FOREIGN KEY (`A`) REFERENCES `chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_chatsTousers` ADD CONSTRAINT `_chatsTousers_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
