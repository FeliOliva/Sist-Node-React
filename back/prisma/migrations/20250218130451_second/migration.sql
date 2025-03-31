-- AlterTable
ALTER TABLE `caja` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `cliente` MODIFY `editable` INTEGER NOT NULL DEFAULT 1,
    MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `detalleventa` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `entregas` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `metodopago` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `negocio` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `notacredito` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `preciolog` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `producto` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `rubro` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `subrubro` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `tipounidad` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `usuario` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `venta` MODIFY `estado` INTEGER NOT NULL DEFAULT 1;
