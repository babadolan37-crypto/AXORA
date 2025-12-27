import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { target, message } = await req.json();
    
    // Server-side call to Fonnte (Secure)
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN || 'QJidkbhS7fHcmmJ24bQi',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message,
        countryCode: '62',
      }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send WA' }, { status: 500 });
  }
}
