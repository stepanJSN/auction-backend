-- AlterTable
ALTER TABLE `cards` MODIFY `gender` ENUM('unknown', 'male', 'female', 'genderless') NOT NULL DEFAULT 'male';
