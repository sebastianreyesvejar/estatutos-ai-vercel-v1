import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL);

const statements = [
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
    CONSTRAINT \`social_objects_id\` PRIMARY KEY(\`id\`)
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
    CONSTRAINT \`sync_jobs_id\` PRIMARY KEY(\`id\`)
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
    CONSTRAINT \`draft_statutes_id\` PRIMARY KEY(\`id\`)
  )`,
  `ALTER TABLE \`documents\` ADD COLUMN IF NOT EXISTS \`driveWebViewLink\` text`,
  `ALTER TABLE \`documents\` ADD COLUMN IF NOT EXISTS \`s3Key\` varchar(512)`,
  `ALTER TABLE \`documents\` ADD COLUMN IF NOT EXISTS \`s3Url\` text`,
  `ALTER TABLE \`documents\` ADD COLUMN IF NOT EXISTS \`fileSizeBytes\` bigint`,
  `ALTER TABLE \`documents\` ADD COLUMN IF NOT EXISTS \`errorMessage\` text`,
  `ALTER TABLE \`documents\` ADD COLUMN IF NOT EXISTS \`processedAt\` timestamp`,
  `ALTER TABLE \`companies\` ADD COLUMN IF NOT EXISTS \`driveFolderId\` varchar(128)`,
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
