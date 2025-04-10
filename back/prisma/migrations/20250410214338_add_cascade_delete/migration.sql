-- DropForeignKey
ALTER TABLE `detalleventa` DROP FOREIGN KEY `DetalleVenta_ventaId_fkey`;

-- DropIndex
DROP INDEX `DetalleVenta_ventaId_fkey` ON `detalleventa`;

-- AddForeignKey
ALTER TABLE `DetalleVenta` ADD CONSTRAINT `DetalleVenta_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `Venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
