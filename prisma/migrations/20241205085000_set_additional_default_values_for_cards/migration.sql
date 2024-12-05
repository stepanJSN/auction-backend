-- AlterTable
ALTER TABLE `cards` MODIFY `is_active` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `is_created_by_admin` BOOLEAN NOT NULL DEFAULT false;
