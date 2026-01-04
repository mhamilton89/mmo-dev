-- Add username column to accounts table for login
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
