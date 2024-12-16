/*
  Warnings:

  - You are about to alter the column `bid_amount` on the `bids` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.

*/
-- AlterTable
ALTER TABLE `bids` MODIFY `bid_amount` INTEGER NOT NULL;
