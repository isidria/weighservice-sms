# WeighService SMS/MMS Platform - Backend

Express.js backend for SMS/MMS communication platform for WeighService LLC.

## Features

- **SMS/MMS Messaging** - Send and receive via Twilio
- **Conversation Threading** - Organize messages by customer
- **Customer Management** - Store customer info and history
- **Real-time Updates** - WebSocket support for live message updates
- **Message History** - Complete message logs with status tracking
- **Agent Management** - Support staff profiles and status

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Twilio credentials and database info

npm run migrate
npm start
```

## API Endpoints

### Messages
- `POST /api/messages/send` - Send message to customer
- `GET /api/messages/conversations` - List all conversations
- `GET /api/messages/conversations/:id` - Get conversation with messages
- `PUT /api/messages/conversations/:id` - Update conversation status

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Webhooks
- `POST /api/webhooks/twilio/incoming` - Twilio incoming message webhook

## Environment Variables

- `TWILIO_ACCOUNT_SID` - Twilio account
- `TWILIO_AUTH_TOKEN` - Twilio token
- `TWILIO_PHONE_NUMBER` - Your Twilio number
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL
- `JWT_SECRET` - JWT signing key
