import Twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

export const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
