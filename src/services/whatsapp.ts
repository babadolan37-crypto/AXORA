export const sendWhatsApp = async (target: string, message: string) => {
  try {
    const response = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message,
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
