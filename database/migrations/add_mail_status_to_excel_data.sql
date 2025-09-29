-- Add mail_status column to reconciliation_excel_data table
-- This will track the email status for each Excel record

ALTER TABLE reconciliation_excel_data
ADD COLUMN mail_status VARCHAR(20) DEFAULT 'gonderilmedi';

-- Add index for better performance
CREATE INDEX idx_reconciliation_excel_data_mail_status
ON reconciliation_excel_data(mail_status);

-- Update existing records to have default status
UPDATE reconciliation_excel_data
SET mail_status = 'gonderilmedi'
WHERE mail_status IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN reconciliation_excel_data.mail_status IS
'Email status: gonderilmedi, gonderildi, hata, beklemede';