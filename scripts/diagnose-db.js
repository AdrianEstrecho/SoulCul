/* global process */

import mysql from 'mysql2/promise';

const DEFAULT_PORTS = ['3307', '3306'];

function getPortCandidates() {
  const envPort = String(process.env.DB_PORT || '').trim();
  const list = [envPort, ...DEFAULT_PORTS].filter(Boolean);
  return Array.from(new Set(list));
}

async function connectAsRoot() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const rootPasswords = ['', 'root'];
  const attempts = [];

  for (const port of getPortCandidates()) {
    for (const password of rootPasswords) {
      try {
        const connection = await mysql.createConnection({
          host,
          port: Number(port),
          user: 'root',
          password,
        });

        return { connection, host, port, password };
      } catch (error) {
        attempts.push({ host, port, password, message: error.message });
      }
    }
  }

  return { connection: null, attempts, host };
}

async function testRootConnection() {
  console.log('Testing connection with XAMPP default root user...');
  const host = process.env.DB_HOST || '127.0.0.1';
  console.log(`Host: ${host}`);
  console.log(`Ports: ${getPortCandidates().join(', ')}`);
  console.log('User: root');
  console.log('Passwords: empty, root');
  console.log('');

  let connection = null;
  let connectResult = null;

  try {
    connectResult = await connectAsRoot();
    connection = connectResult.connection;

    if (!connection) {
      throw new Error('Unable to connect as root on tested ports/passwords');
    }

    console.log('✓ Connection with root successful!');
    
    // List all databases
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('\n✓ Available databases:');
    databases.forEach(db => {
      console.log(`  - ${db.Database}`);
    });

    // Check if soucul database exists
    const dbExists = databases.some(db => db.Database === 'soucul');
    
    if (dbExists) {
      console.log('\n✓ Database "soucul" exists!');
      
      // Switch to soucul database and show tables
      await connection.query('USE soucul');
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`\n✓ Found ${tables.length} table(s) in "soucul":`);
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });
    } else {
      console.log('\n✗ Database "soucul" does NOT exist yet!');
      console.log('  You need to create it in phpMyAdmin first.');
    }

    // Check if user soucul_dev exists
    console.log('\nChecking if user "soucul_dev" exists...');
    const [users] = await connection.execute(
      "SELECT User, Host FROM mysql.user WHERE User = 'soucul_dev'"
    );
    
    if (users.length > 0) {
      console.log('✓ User "soucul_dev" exists for hosts:');
      users.forEach(user => {
        console.log(`  - ${user.User}@${user.Host}`);
      });
    } else {
      console.log('✗ User "soucul_dev" does NOT exist!');
      console.log('\nYou need to create this user. Here\'s the SQL to run in phpMyAdmin:');
      console.log('\n--- Copy and run these SQL commands in phpMyAdmin ---');
      console.log("CREATE USER 'soucul_dev'@'localhost' IDENTIFIED BY 'SouCul@Dev2026';");
      console.log("GRANT ALL PRIVILEGES ON soucul.* TO 'soucul_dev'@'localhost';");
      console.log("FLUSH PRIVILEGES;");
      console.log('--- End of SQL commands ---\n');
    }

    console.log('✓ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed!');
    console.error('Error:', error.message);
    if (connectResult?.attempts && connectResult.attempts.length) {
      console.error('\nAttempt summary:');
      connectResult.attempts.forEach(attempt => {
        const passLabel = attempt.password === '' ? '(empty)' : attempt.password;
        console.error(`  - root@${attempt.host}:${attempt.port} password=${passLabel}: ${attempt.message}`);
      });
    }
    console.error('\nMake sure XAMPP MySQL is running!');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testRootConnection();
