/*
  Warnings:

  - Added the required column `negocioId` to the `NotaCredito` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notacredito` ADD COLUMN `negocioId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `NotaCredito` ADD CONSTRAINT `NotaCredito_negocioId_fkey` FOREIGN KEY (`negocioId`) REFERENCES `Negocio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
