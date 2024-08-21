/*
  Warnings:

  - A unique constraint covering the columns `[avatarFileKye]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeProductId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `avatarFileKye` VARCHAR(191) NULL,
    ADD COLUMN `stripeAccountId` VARCHAR(191) NULL,
    ADD COLUMN `stripeProductId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_avatarFileKye_key` ON `User`(`avatarFileKye`);

-- CreateIndex
CREATE UNIQUE INDEX `User_stripeAccountId_key` ON `User`(`stripeAccountId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_stripeProductId_key` ON `User`(`stripeProductId`);
