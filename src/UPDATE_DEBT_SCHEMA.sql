-- Add phone number column to debts table for WhatsApp reminders
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Add comment
COMMENT ON COLUMN debts.client_phone IS 'Nomor WhatsApp klien untuk pengingat otomatis';
