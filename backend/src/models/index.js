import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Message = {
  async create(data) {
    const id = uuidv4();
    const query = `
      INSERT INTO messages (
        id, conversation_id, sender_id, sender_type, recipient_phone, 
        body, media_urls, message_type, twilio_sid, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *;
    `;
    const values = [
      id, data.conversation_id, data.sender_id, data.sender_type,
      data.recipient_phone, data.body, data.media_urls || [],
      data.message_type || 'sms', data.twilio_sid, data.status || 'sent'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByConversation(conversationId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );
    return result.rows;
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE messages SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async findBySid(sid) {
    const result = await pool.query('SELECT * FROM messages WHERE twilio_sid = $1', [sid]);
    return result.rows[0];
  },
};

export const Conversation = {
  async create(data) {
    const id = uuidv4();
    const query = `
      INSERT INTO conversations (
        id, customer_id, customer_phone, customer_name, subject, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const values = [id, data.customer_id, data.customer_phone, data.customer_name, data.subject, data.status || 'open'];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByPhone(customerPhone) {
    const result = await pool.query(
      'SELECT * FROM conversations WHERE customer_phone = $1 ORDER BY updated_at DESC LIMIT 1',
      [customerPhone]
    );
    return result.rows[0];
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM conversations WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount++}`;
      values.push(filters.status);
    }

    query += ' ORDER BY updated_at DESC;';
    const result = await pool.query(query, values);
    return result.rows;
  },

  async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 2;

    Object.keys(data).forEach((key) => {
      updates.push(`${key} = $${paramCount++}`);
      values.push(data[key]);
    });

    values.unshift(id);
    const query = `
      UPDATE conversations
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getWithMessages(id) {
    const conversation = await this.findById(id);
    if (!conversation) return null;

    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    return {
      ...conversation,
      messages: messagesResult.rows,
    };
  },
};

export const Customer = {
  async create(data) {
    const id = uuidv4();
    const query = `
      INSERT INTO customers (
        id, name, phone, email, company, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const values = [id, data.name, data.phone, data.email, data.company, data.notes];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByPhone(phone) {
    const result = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    return result.rows;
  },

  async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 2;

    Object.keys(data).forEach((key) => {
      updates.push(`${key} = $${paramCount++}`);
      values.push(data[key]);
    });

    values.unshift(id);
    const query = `
      UPDATE customers
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

export const Agent = {
  async create(data) {
    const id = uuidv4();
    const query = `
      INSERT INTO agents (
        id, name, email, phone, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [id, data.name, data.email, data.phone, data.status || 'online'];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM agents WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query('SELECT * FROM agents ORDER BY name ASC');
    return result.rows;
  },

  async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 2;

    Object.keys(data).forEach((key) => {
      updates.push(`${key} = $${paramCount++}`);
      values.push(data[key]);
    });

    values.unshift(id);
    const query = `
      UPDATE agents
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },
};
