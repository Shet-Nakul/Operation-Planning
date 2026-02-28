-- CreateTable
CREATE TABLE `organizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `contact_number` VARCHAR(20) NULL,
    `contact_email` VARCHAR(255) NULL,
    `status` VARCHAR(50) NULL DEFAULT 'ACTIVE',
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,
    `license` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planning_global_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `operating_start_time` TIME(0) NOT NULL,
    `operating_end_time` TIME(0) NOT NULL,
    `interval_minutes` INTEGER NOT NULL,
    `planning_horizon_days` INTEGER NOT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,

    INDEX `planning_global_config_is_active_idx`(`is_active`),
    UNIQUE INDEX `planning_global_config_organization_id_key`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `resource_type` VARCHAR(30) NOT NULL,
    `default_capacity` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `resources_organization_id_code_key`(`organization_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource_daily_capacity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `resource_id` INTEGER NOT NULL,
    `day_number` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 0,

    INDEX `resource_daily_capacity_organization_id_idx`(`organization_id`),
    INDEX `resource_daily_capacity_organization_id_day_number_idx`(`organization_id`, `day_number`),
    INDEX `resource_daily_capacity_resource_id_idx`(`resource_id`),
    UNIQUE INDEX `resource_daily_capacity_organization_id_resource_id_key`(`organization_id`, `resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource_availability_windows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `daily_capacity_id` INTEGER NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `is_extended` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `resource_availability_windows_daily_capacity_id_idx`(`daily_capacity_id`),
    INDEX `resource_availability_windows_start_time_end_time_idx`(`start_time`, `end_time`),
    INDEX `resource_availability_windows_is_extended_idx`(`is_extended`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phase_requirements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(191) NULL,
    `phase_type` VARCHAR(50) NOT NULL,
    `resource_type` VARCHAR(30) NOT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `operation_code` VARCHAR(50) NOT NULL,
    `operation_type` INTEGER NOT NULL,
    `infection_type` INTEGER NOT NULL,
    `earliest_day` INTEGER NOT NULL,
    `latest_day` INTEGER NOT NULL,
    `status` VARCHAR(30) NULL DEFAULT 'DRAFT',
    `priority_score` DECIMAL(6, 2) NULL DEFAULT 0,
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operations_organization_id_idx`(`organization_id`),
    INDEX `operations_earliest_day_latest_day_idx`(`earliest_day`, `latest_day`),
    INDEX `operations_status_idx`(`status`),
    UNIQUE INDEX `operations_organization_id_operation_code_key`(`organization_id`, `operation_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operation_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(191) NULL,
    `priority` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `operation_types_organization_id_name_key`(`organization_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `infection_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(191) NULL,
    `severity_level` INTEGER NULL DEFAULT 0,
    `requires_isolation` BOOLEAN NULL DEFAULT false,
    `requires_terminal_clean` BOOLEAN NULL DEFAULT false,
    `extra_cleaning_minutes` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NOT NULL,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `infection_types_organization_id_name_key`(`organization_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surgery_phase_requirements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `operation_id` INTEGER NOT NULL,
    `phase_id` INTEGER NOT NULL,
    `required_count` INTEGER NOT NULL DEFAULT 1,
    `start_offset_min` INTEGER NOT NULL,
    `end_offset_min` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surgery_phase_assigned_resources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phase_requirement_id` INTEGER NOT NULL,
    `resource_id` INTEGER NOT NULL,

    UNIQUE INDEX `surgery_phase_assigned_resources_phase_requirement_id_key`(`phase_requirement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surgery_phase_candidate_resources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phase_requirement_id` INTEGER NOT NULL,
    `resource_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NULL,
    `role_id` INTEGER NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(191) NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `is_email_verified` BOOLEAN NULL DEFAULT false,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_activity_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `organization_id` INTEGER NULL,
    `action_type` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` VARCHAR(100) NULL,
    `description` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planning_global_config` ADD CONSTRAINT `planning_global_config_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planning_global_config` ADD CONSTRAINT `planning_global_config_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planning_global_config` ADD CONSTRAINT `planning_global_config_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource_daily_capacity` ADD CONSTRAINT `resource_daily_capacity_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource_daily_capacity` ADD CONSTRAINT `resource_daily_capacity_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource_availability_windows` ADD CONSTRAINT `resource_availability_windows_daily_capacity_id_fkey` FOREIGN KEY (`daily_capacity_id`) REFERENCES `resource_daily_capacity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phase_requirements` ADD CONSTRAINT `phase_requirements_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phase_requirements` ADD CONSTRAINT `phase_requirements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phase_requirements` ADD CONSTRAINT `phase_requirements_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_operation_type_fkey` FOREIGN KEY (`operation_type`) REFERENCES `operation_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_infection_type_fkey` FOREIGN KEY (`infection_type`) REFERENCES `infection_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_types` ADD CONSTRAINT `operation_types_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_types` ADD CONSTRAINT `operation_types_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_types` ADD CONSTRAINT `operation_types_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infection_types` ADD CONSTRAINT `infection_types_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infection_types` ADD CONSTRAINT `infection_types_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infection_types` ADD CONSTRAINT `infection_types_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surgery_phase_requirements` ADD CONSTRAINT `surgery_phase_requirements_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surgery_phase_requirements` ADD CONSTRAINT `surgery_phase_requirements_operation_id_fkey` FOREIGN KEY (`operation_id`) REFERENCES `operations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surgery_phase_requirements` ADD CONSTRAINT `surgery_phase_requirements_phase_id_fkey` FOREIGN KEY (`phase_id`) REFERENCES `phase_requirements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surgery_phase_assigned_resources` ADD CONSTRAINT `surgery_phase_assigned_resources_phase_requirement_id_fkey` FOREIGN KEY (`phase_requirement_id`) REFERENCES `surgery_phase_requirements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surgery_phase_assigned_resources` ADD CONSTRAINT `surgery_phase_assigned_resources_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surgery_phase_candidate_resources` ADD CONSTRAINT `surgery_phase_candidate_resources_phase_requirement_id_fkey` FOREIGN KEY (`phase_requirement_id`) REFERENCES `surgery_phase_requirements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `surgery_phase_candidate_resources` ADD CONSTRAINT `surgery_phase_candidate_resources_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_activity_logs` ADD CONSTRAINT `user_activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_activity_logs` ADD CONSTRAINT `user_activity_logs_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
