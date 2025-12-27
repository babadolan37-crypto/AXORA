export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { target, message } = req.body;
    
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
    return res.status(200).json(result);
  } catch (error) {
    console.error('WA Send Error:', error);
    return res.status(500).json({ error: 'Failed to send WA' });
  }
}
