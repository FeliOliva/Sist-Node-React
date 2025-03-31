/*
  Warnings:

  - Added the required column `monto` to the `Cheque` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `cheque` ADD COLUMN `monto` INTEGER NOT NULL;
