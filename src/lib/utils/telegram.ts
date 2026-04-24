/**
 * P5 Yasajang Telegram Notification Utility
 * Sends real-time alerts for business registrations and audit results.
 */

export async function sendTelegramMessage(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram credentials missing. Skipping notification.');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  // Adding Platform Identifier
  const platformMessage = `[야사장 P5] ${message}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: platformMessage,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Telegram API Error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

// sendTelegramAlert는 sendTelegramMessage의 alias (하위호환)
export const sendTelegramAlert = sendTelegramMessage;
