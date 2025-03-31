/*
  Warnings:

  - You are about to drop the column `negocioId` on the `cliente` table. All the data in the column will be lost.
  - Added the required column `medicion` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cliente` DROP FOREIGN KEY `Cliente_negocioId_fkey`;

-- DropIndex
DROP INDEX `Cliente_negocioId_fkey` ON `cliente`;

-- AlterTable
ALTER TABLE `cliente` DROP COLUMN `negocioId`;

-- AlterTable
ALTER TABLE `negocio` ADD COLUMN `clienteId` INTEGER NULL;

-- AlterTable
ALTER TABLE `producto` ADD COLUMN `medicion` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Negocio` ADD CONSTRAINT `Negocio_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
