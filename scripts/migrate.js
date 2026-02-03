#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Node.js環境では常に標準のpgパッケージを使用
  // （@neondatabase/serverlessはEdge環境向けでWebSocket設定が必要）
  const { Pool } = require("pg");

  const pool = new Pool({ connectionString });

  try {
    const migrationsDir = path.join(__dirname, "../data/migrations");
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (path.extname(file) === ".sql") {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        await pool.query(sql);
      }
    }

    console.log("All migrations completed successfully");
  } finally {
    await pool.end();
  }
}

runMigrations().catch(console.error);
