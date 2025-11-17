import pool from '../src/config/database.js';

const migrations = [
  {
    id: 1,
    name: 'create_customers_table',
    up: `
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        company VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_customers_phone ON customers(phone);
    `,
    down: 'DROP TABLE IF EXISTS customers;',
  },
  {
    id: 2,
    name: 'create_conversations_table',
    up: `
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_name VARCHAR(255),
        subject VARCHAR(255),
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_conversations_status ON conversations(status);
      CREATE INDEX idx_conversations_phone ON conversations(customer_phone);
    `,
    down: 'DROP TABLE IF EXISTS conversations;',
  },
  {
    id: 3,
    name: 'create_messages_table',
    up: `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        sender_id VARCHAR(255),
        sender_type VARCHAR(50),
        recipient_phone VARCHAR(20),
        body TEXT NOT NULL,
        media_urls TEXT[],
        message_type VARCHAR(50) DEFAULT 'sms',
        twilio_sid VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX idx_messages_status ON messages(status);
    `,
    down: 'DROP TABLE IF EXISTS messages;',
  },
  {
    id: 4,
    name: 'create_agents_table',
    up: `
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        status VARCHAR(50) DEFAULT 'online',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_agents_status ON agents(status);
    `,
    down: 'DROP TABLE IF EXISTS agents;',
  },
];

async function runMigrations() {
  try {
    for (const migration of migrations) {
      const result = await pool.query(
        'SELECT * FROM information_schema.tables WHERE table_name = $1',
        [migration.name]
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${migration.name}`);
        await pool.query(migration.up);
        console.log(`✓ Migration completed: ${migration.name}`);
      } else {
        console.log(`⊗ Migration already ran: ${migration.name}`);
      }
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
