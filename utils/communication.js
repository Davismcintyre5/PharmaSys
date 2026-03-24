// Simple placeholder - replace with real providers (Twilio, SendGrid, etc.)
const sendSMS = async (phone, message) => {
  console.log(`SMS to ${phone}: ${message}`);
  // TODO: integrate SMS service
  return true;
};

const sendEmail = async (email, subject, message) => {
  console.log(`Email to ${email}: ${subject} - ${message}`);
  // TODO: integrate email service
  return true;
};

module.exports = { sendSMS, sendEmail };