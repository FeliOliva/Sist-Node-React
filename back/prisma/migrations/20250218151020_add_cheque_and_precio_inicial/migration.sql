-- AlterTable
ALTER TABLE `producto` ADD COLUMN `precioInicial` INTEGER NULL;

-- CreateTable
CREATE TABLE `Cheque` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `banco` VARCHAR(191) NOT NULL,
    `nroCheque` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaEmision` DATETIME(3) NOT NULL,
    `fechaCobro` DATETIME(3) NOT NULL,
    `estado` INTEGER NOT NULL DEFAULT 1,
    `negocioId` INTEGER NULL,

    UNIQUE INDEX `Cheque_nroCheque_key`(`nroCheque`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cheque` ADD CONSTRAINT `Cheque_negocioId_fkey` FOREIGN KEY (`negocioId`) REFERENCES `Negocio`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
