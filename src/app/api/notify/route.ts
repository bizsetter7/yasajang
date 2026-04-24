import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/utils/telegram';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    await sendTelegramMessage(message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
