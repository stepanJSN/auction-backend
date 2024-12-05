-- DropForeignKey
ALTER TABLE `cards` DROP FOREIGN KEY `cards_location_id_fkey`;

-- AlterTable
ALTER TABLE `cards` MODIFY `location_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `cards` ADD CONSTRAINT `cards_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
