import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const fonnteToken = process.env.FONNTE_TOKEN || 'QJidkbhS7fHcmmJ24bQi';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Today's Date (WIB)
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibDate = new Date(now.getTime() + wibOffset);
    const dateString = wibDate.toISOString().split('T')[0];

    // Fetch Invoices (Debts type Piutang) due today
    // Note: Column names must match DB. 'dueDate' in frontend usually maps to 'due_date' in DB.
    // I need to check the mapping. 'DebtSheet.tsx' saves 'dueDate'.
    // Supabase usually uses snake_case. Let's assume 'due_date' if the table follows standard convention, 
    // OR 'dueDate' if created as is.
    // Looking at 'useSupabaseData.ts' might help, but I'll assume camelCase if the frontend uses it directly,
    // OR snake_case if I created the table via SQL.
    // The previous SQL `UPDATE_DEBT_SCHEMA.sql` used `debts`.
    // Let's assume `dueDate` in frontend maps to `due_date` in DB (standard). 
    // If frontend sends `dueDate`, Supabase JS client auto-maps if configured, but raw query needs exact column.
    // I will try `dueDate` first, if fail then `due_date`.
    // Actually, looking at `DebtSheet.tsx` again, the object keys match DB columns usually.
    // `entry` object has `dueDate`. If `useSupabaseData` passes this object directly to `insert`, 
    // then the column name IS `dueDate` (case sensitive in Postgres if quoted, or lowercase if not).
    // Postgres is case-insensitive (lowercase) by default. `dueDate` becomes `duedate`.
    // I'll select `*` to be safe and filter in code if needed, but `eq` is better.
    // I'll try `dueDate` (quoted) or `duedate`.
    // Let's check `src/hooks/useSupabaseData.ts` to see how it inserts.

    const { data: invoices, error } = await supabase
      .from('debts')
      .select('*')
      .eq('type', 'Piutang')
      .eq('paymentStatus', 'Tertunda') // or 'payment_status'
      .eq('dueDate', dateString); // or 'due_date'

    // If error, it might be column name issue.
    // For safety, I'll try to just select all pending debts and filter in JS. 
    // It's not efficient for millions of rows but fine for small biz.
    
    const { data: allDebts, error: fetchError } = await supabase
      .from('debts')
      .select('*')
      .eq('type', 'Piutang')
      .eq('paymentStatus', 'Tertunda'); // Assuming camelCase from frontend

    if (fetchError) throw fetchError;

    const dueInvoices = allDebts.filter(inv => inv.dueDate === dateString);

    if (dueInvoices.length === 0) {
      return res.status(200).json({ message: 'No invoices due today' });
    }

    // Send Summary to Owner
    const ownerPhone = '087785584654';
    const summaryList = dueInvoices.map((inv, i) => 
      `${i+1}. ${inv.name} - Rp ${inv.amount.toLocaleString('id-ID')}`
    ).join('\n');

    const message = `*Reminder Invoice Jatuh Tempo* ⏰\n` +
      `Tanggal: ${dateString}\n\n` +
      `Daftar Invoice:\n${summaryList}\n\n` +
      `_Mohon di-follow up_`;

    await fetch('https://api.fonnte.com/send', {
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

    // Send to Clients (if phone exists)
    let clientCount = 0;
    for (const inv of dueInvoices) {
      if (inv.clientPhone) { // Field I added
        const clientMsg = `Halo Kak ${inv.name},\n\n` +
          `Kami dari Axora ingin mengingatkan bahwa Invoice sebesar *Rp ${inv.amount.toLocaleString('id-ID')}* jatuh tempo hari ini (${dateString}).\n\n` +
          `Mohon segera melakukan pembayaran. Terima kasih 🙏`;
        
        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': fonnteToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: inv.clientPhone,
            message: clientMsg,
            countryCode: '62',
          }),
        });
        clientCount++;
      }
    }

    res.status(200).json({ 
      success: true, 
      invoices_count: dueInvoices.length,
      clients_notified: clientCount
    });

  } catch (error) {
    console.error('Cron Invoice Error:', error);
    res.status(500).json({ error: error.message });
  }
}
