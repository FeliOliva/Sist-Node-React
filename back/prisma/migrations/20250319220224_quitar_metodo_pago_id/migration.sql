/*
  Warnings:

  - You are about to drop the column `metodoPagoId` on the `venta` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `venta` DROP FOREIGN KEY `Venta_metodoPagoId_fkey`;

-- DropIndex
DROP INDEX `Venta_metodoPagoId_fkey` ON `venta`;

-- AlterTable
ALTER TABLE `venta` DROP COLUMN `metodoPagoId`;
