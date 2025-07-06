-- Create remote console logs table
CREATE TABLE IF NOT EXISTS remote_console_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    user_agent TEXT,
    platform TEXT,
    app_version TEXT,
    stack TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_remote_console_logs_user_id ON remote_console_logs(user_id);
CREATE INDEX idx_remote_console_logs_session_id ON remote_console_logs(session_id);
CREATE INDEX idx_remote_console_logs_level ON remote_console_logs(level);
CREATE INDEX idx_remote_console_logs_timestamp ON remote_console_logs(timestamp);
CREATE INDEX idx_remote_console_logs_created_at ON remote_console_logs(created_at);

-- Add comment to the table
COMMENT ON TABLE remote_console_logs IS 'Stores console logs from remote clients (web/mobile) for debugging and monitoring';
COMMENT ON COLUMN remote_console_logs.level IS 'Log level: log, info, warn, error';
COMMENT ON COLUMN remote_console_logs.metadata IS 'Additional metadata about the log entry (JSON format)';