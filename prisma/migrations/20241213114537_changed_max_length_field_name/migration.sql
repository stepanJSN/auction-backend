/*
  Warnings:

  - You are about to drop the column `max_length` on the `auctions` table. All the data in the column will be lost.
  - Added the required column `end_time` to the `auctions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `auctions` DROP COLUMN `max_length`,
    ADD COLUMN `end_time` DATETIME(3) NOT NULL;
