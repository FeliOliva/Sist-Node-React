-- AlterTable
ALTER TABLE `entregas` ADD COLUMN `cajaId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Entregas` ADD CONSTRAINT `Entregas_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `Caja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
