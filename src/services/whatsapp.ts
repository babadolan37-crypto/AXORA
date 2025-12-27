export const sendWhatsApp = async (target: string, message: string) => {
  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN || 'QJidkbhS7fHcmmJ24bQi', // Fallback for dev
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message,
        countryCode: '62', // Default to Indonesia
      }),
    });

    const data = await response.json();
    console.log('WA Sent:', data);
    return data;
  } catch (error) {
    console.error('WA Failed:', error);
    return null;
  }
};
