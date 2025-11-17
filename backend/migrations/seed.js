import pool from '../src/config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Sample customers
    const customers = [
      {
        id: uuidv4(),
        name: 'John Smith',
        phone: '+1-555-0100',
        email: 'john@example.com',
        company: 'Smith Industries',
        notes: 'VIP Customer',
      },
      {
        id: uuidv4(),
        name: 'Jane Doe',
        phone: '+1-555-0101',
        email: 'jane@example.com',
        company: 'Doe Logistics',
        notes: 'New Customer',
      },
    ];

    for (const customer of customers) {
      await pool.query(
        `INSERT INTO customers (id, name, phone, email, company, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (phone) DO NOTHING`,
        [customer.id, customer.name, customer.phone, customer.email, customer.company, customer.notes]
      );
    }

    console.log('✓ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
