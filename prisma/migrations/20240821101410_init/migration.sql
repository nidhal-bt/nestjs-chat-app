-- CreateTable
CREATE TABLE `Donation` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `stripeProductId` VARCHAR(191) NOT NULL,
    `stripePriceId` VARCHAR(191) NOT NULL,
    `givingUserId` VARCHAR(191) NOT NULL,
    `receivingUserId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NULL,

    UNIQUE INDEX `Donation_stripePriceId_key`(`stripePriceId`),
    INDEX `Donation_givingUserId_idx`(`givingUserId`),
    INDEX `Donation_receivingUserId_idx`(`receivingUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_givingUserId_fkey` FOREIGN KEY (`givingUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_receivingUserId_fkey` FOREIGN KEY (`receivingUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
