-- Add updated_at column to reconciliation_excel_data table
-- This will track when records are last modified

ALTER TABLE reconciliation_excel_data
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Update existing records to have current timestamp
UPDATE reconciliation_excel_data
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN reconciliation_excel_data.updated_at IS
'Timestamp when the record was last updated';