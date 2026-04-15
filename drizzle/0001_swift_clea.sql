CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(512) NOT NULL,
	`rubro` varchar(256),
	`driveFolderId` varchar(128),
	`status` enum('pending','processing','processed','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`driveFileId` varchar(128) NOT NULL,
	`driveFileName` varchar(512),
	`driveWebViewLink` text,
	`s3Key` varchar(512),
	`s3Url` text,
	`fileSizeBytes` bigint,
	`status` enum('pending','downloading','processing','processed','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_driveFileId_unique` UNIQUE(`driveFileId`)
);
--> statement-breakpoint
CREATE TABLE `draft_statutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512),
	`companyName` varchar(512),
	`rubro` varchar(256),
	`description` text,
	`generatedSocialObject` text,
	`generatedFullStatute` text,
	`sourceSocialObjectIds` json,
	`prompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `draft_statutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_objects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`documentId` int NOT NULL,
	`rawText` text NOT NULL,
	`structuredText` text,
	`rubro` varchar(256),
	`keywords` json,
	`activities` json,
	`isValidated` boolean NOT NULL DEFAULT false,
	`validatedBy` int,
	`validatedAt` timestamp,
	`manualOverride` text,
	`extractionConfidence` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_objects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`totalFiles` int DEFAULT 0,
	`newFiles` int DEFAULT 0,
	`processedFiles` int DEFAULT 0,
	`errorFiles` int DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`errorMessage` text,
	`triggeredBy` int,
	CONSTRAINT `sync_jobs_id` PRIMARY KEY(`id`)
);
