import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    // 1. Setup Supabase
    // Note: In Vercel Serverless, use process.env
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const fonnteToken = process.env.FONNTE_TOKEN || 'QJidkbhS7fHcmmJ24bQi';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Get Today's Date (WIB is UTC+7)
    // Vercel server time is UTC.
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibDate = new Date(now.getTime() + wibOffset);
    const dateString = wibDate.toISOString().split('T')[0];

    // 3. Fetch Data
    const { data: incomes, error: err1 } = await supabase
      .from('incomes')
      .select('amount')
      .eq('date', dateString);

    const { data: expenses, error: err2 } = await supabase
      .from('expenses')
      .select('amount')
      .eq('date', dateString);

    if (err1 || err2) throw new Error('Database error');

    // 4. Calculate
    const totalIncome = incomes?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const totalExpense = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const netFlow = totalIncome - totalExpense;

    // 5. Send WhatsApp
    const ownerPhone = '087785584654';
    const message = `*Laporan Harian Axora* 📊\n` +
      `Tanggal: ${dateString}\n\n` +
      `✅ Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}\n` +
      `❌ Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}\n` +
      `💰 Net Flow: Rp ${netFlow.toLocaleString('id-ID')}\n\n` +
      `_Laporan otomatis jam 17:00 WIB_`;

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: ownerPhone,
        message: message,
        countryCode: '62',
      }),
    });

    const result = await response.json();

    res.status(200).json({ 
      success: true, 
      date: dateString,
      summary: { totalIncome, totalExpense, netFlow },
      wa_status: result
    });
  } catch (error) {
    console.error('Cron Error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
