-- Add scan_data and last_scanned_at columns to scans table
ALTER TABLE scans
ADD COLUMN IF NOT EXISTS scan_data JSONB,
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP WITH TIME ZONE;
