import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn('No DATABASE_URL, skipping migrations');
  process.exit(0);
}

try {
  const conn = await createConnection(dbUrl);
  const statements = [
    `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`openId\` varchar(64) NOT NULL UNIQUE,
      \`name\` text,
      \`email\` varchar(320),
      \`loginMethod\` varchar(64),
      \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
      PRIMARY KEY(\`id\`)
    )`,
    `CREATE TABLE IF NOT EXISTS \`companies\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`name\` varchar(512) NOT NULL,
      \`rubro\` varchar(256),
      \`driveFolderId\` varchar(128),
      \`status\` enum('pending','processing','processed','error') NOT NULL DEFAULT 'pending',
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(\`id\`)
    )`,
    `CREATE TABLE IF NOT EXISTS \`documents\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`companyId\` int NOT NULL,
      \`driveFileId\` varchar(128) NOT NULL UNIQUE,
      \`driveFileName\` varchar(512),
      \`driveWebViewLink\` text,
      \`s3Key\` varchar(512),
      \`s3Url\` text,
      \`fileSizeBytes\` bigint,
      \`status\` enum('pending','downloading','processing','processed','error') NOT NULL DEFAULT 'pending',
      \`errorMessage\` text,
      \`processedAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(\`id\`)
    )`,
    `CREATE TABLE IF NOT EXISTS \`social_objects\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`companyId\` int NOT NULL,
      \`documentId\` int NOT NULL,
      \`rawText\` text NOT NULL,
      \`structuredText\` text,
      \`rubro\` varchar(256),
      \`keywords\` json,
      \`activities\` json,
      \`isValidated\` boolean NOT NULL DEFAULT false,
      \`validatedBy\` int,
      \`validatedAt\` timestamp,
      \`manualOverride\` text,
      \`extractionConfidence\` varchar(16),
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(\`id\`)
    )`,
    `CREATE TABLE IF NOT EXISTS \`sync_jobs\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`status\` enum('running','completed','failed') NOT NULL DEFAULT 'running',
      \`totalFiles\` int DEFAULT 0,
      \`newFiles\` int DEFAULT 0,
      \`processedFiles\` int DEFAULT 0,
      \`errorFiles\` int DEFAULT 0,
      \`startedAt\` timestamp NOT NULL DEFAULT (now()),
      \`completedAt\` timestamp,
      \`errorMessage\` text,
      \`triggeredBy\` int,
      PRIMARY KEY(\`id\`)
    )`,
    `CREATE TABLE IF NOT EXISTS \`draft_statutes\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`title\` varchar(512),
      \`companyName\` varchar(512),
      \`rubro\` varchar(256),
      \`description\` text,
      \`generatedSocialObject\` text,
      \`generatedFullStatute\` text,
      \`sourceSocialObjectIds\` json,
      \`prompt\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(\`id\`)
    )`,
  ];

  for (const sql of statements) {
    try {
      await conn.execute(sql);
      console.log('✓', sql.slice(0, 60).replace(/\n/g,' ').trim());
    } catch (e) {
      console.log('⚠', e.message.slice(0, 80));
    }
  }
  const [rows] = await conn.execute('SHOW TABLES');
  console.log('\nTables:', rows.map(r => Object.values(r)[0]).join(', '));
  await conn.end();
} catch (e) {
  console.warn('Migration skipped:', e.message);
  process.exit(0);
}