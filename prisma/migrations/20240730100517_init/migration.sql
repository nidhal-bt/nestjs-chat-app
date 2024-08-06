/*
  Warnings:

  - You are about to drop the `resetpasswordtoken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `resetpasswordtoken` DROP FOREIGN KEY `ResetPasswordToken_userId_fkey`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `isResettingPassword` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `resetpasswordtoken`;
