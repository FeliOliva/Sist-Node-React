/*
  Warnings:

  - You are about to drop the column `estado` on the `entregas` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `notacredito` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `venta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `entregas` DROP COLUMN `estado`;

-- AlterTable
ALTER TABLE `notacredito` DROP COLUMN `estado`;

-- AlterTable
ALTER TABLE `venta` DROP COLUMN `estado`;
