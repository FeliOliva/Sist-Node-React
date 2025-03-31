/*
  Warnings:

  - You are about to drop the column `rubroId` on the `producto` table. All the data in the column will be lost.
  - You are about to drop the column `subRubroId` on the `producto` table. All the data in the column will be lost.
  - You are about to drop the `rubro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subrubro` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `producto` DROP FOREIGN KEY `Producto_rubroId_fkey`;

-- DropForeignKey
ALTER TABLE `producto` DROP FOREIGN KEY `Producto_subRubroId_fkey`;

-- DropForeignKey
ALTER TABLE `subrubro` DROP FOREIGN KEY `SubRubro_rubroId_fkey`;

-- DropIndex
DROP INDEX `Producto_rubroId_fkey` ON `producto`;

-- DropIndex
DROP INDEX `Producto_subRubroId_fkey` ON `producto`;

-- AlterTable
ALTER TABLE `producto` DROP COLUMN `rubroId`,
    DROP COLUMN `subRubroId`;

-- DropTable
DROP TABLE `rubro`;

-- DropTable
DROP TABLE `subrubro`;
