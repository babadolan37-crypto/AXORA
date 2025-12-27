import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { summary, prompt } = req.body;

    // Use Vercel AI Gateway configuration
    const openai = new OpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY || '',
      baseURL: 'https://ai-gateway.vercel.sh/v1',
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // or gpt-3.5-turbo if 4o is not available
      messages: [
        {
          role: 'system',
          content: `Anda adalah Analis Keuangan Senior untuk PT (Perseroan Terbatas). 
          Tugas Anda adalah memberikan analisis strategis singkat berdasarkan data keuangan yang diberikan.
          
          Gunakan gaya bahasa: Profesional, Tegas, dan Solutif.
          Format jawaban dalam Markdown:
          - **Kesimpulan Utama**: 1 kalimat ringkasan kondisi.
          - **Analisis**: Penjelasan singkat tren (max 2 paragraf).
          - **Rekomendasi**: 3 poin actionable steps.
          
          Jangan gunakan kata-kata basa-basi. Langsung ke inti.`
        },
        {
          role: 'user',
          content: `Data Keuangan Bulan Ini:
          ${JSON.stringify(summary, null, 2)}
          
          Pertanyaan User (jika ada): ${prompt || 'Berikan analisis umum.'}`
        }
      ],
    });

    const analysis = completion.choices[0].message.content;
    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return res.status(500).json({ error: 'Failed to analyze data', details: error.message });
  }
}
