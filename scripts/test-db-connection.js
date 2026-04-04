/* global process */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function uniqueConnectionCandidates() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const database = process.env.DB_DATABASE || process.env.DB_NAME || 'soucul';
  const envPort = String(process.env.DB_PORT || '3306');
  const envUser = process.env.DB_USERNAME || process.env.DB_USER || 'root';
  const envPassword = process.env.DB_PASSWORD || process.env.DB_PASS || '';
  const ports = Array.from(new Set([envPort, '3307', '3306']));

  const candidates = [];
  ports.forEach(port => {
    candidates.push({ host, port, user: envUser, password: envPassword, database });
    candidates.push({ host, port, user: 'root', password: '', database });
    candidates.push({ host, port, user: 'root', password: 'root', database });
  });

  const seen = new Set();
  return candidates.filter(candidate => {
    const key = `${candidate.host}|${candidate.port}|${candidate.user}|${candidate.database}|${candidate.password}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Using configured .env values with common local fallbacks.');

  const candidates = uniqueConnectionCandidates();
  let connection = null;
  let successful = null;
  const failures = [];

  for (const candidate of candidates) {
    console.log(`Trying ${candidate.user}@${candidate.host}:${candidate.port}/${candidate.database} ...`);
    try {
      connection = await mysql.createConnection({
        host: candidate.host,
        port: Number(candidate.port),
        user: candidate.user,
        password: candidate.password,
        database: candidate.database,
      });
      successful = candidate;
      break;
    } catch (error) {
      failures.push({ candidate, message: error.message });
    }
  }

  try {
    if (!connection || !successful) {
      throw new Error('All connection attempts failed');
    }

    console.log(`✓ Connection successful via ${successful.user}@${successful.host}:${successful.port}/${successful.database}`);
    
    // Test query to list tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\n✓ Found ${tables.length} table(s) in database "${successful.database}":`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    console.log('\n✓ Connection test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed!');
    console.error('Error:', error.message);
    if (failures.length) {
      console.error('\nAttempt summary:');
      failures.forEach(({ candidate, message }) => {
        console.error(`  - ${candidate.user}@${candidate.host}:${candidate.port}/${candidate.database}: ${message}`);
      });
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();
