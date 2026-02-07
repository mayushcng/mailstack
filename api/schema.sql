-- =============================================================================
-- MAILSTACK DATABASE SCHEMA
-- MySQL Database for mailstack.shop
-- =============================================================================

-- Drop tables if they exist (for clean install)
DROP TABLE IF EXISTS payout_requests;
DROP TABLE IF EXISTS payout_settings;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS email_submissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    profile_picture TEXT,
    role ENUM('supplier', 'admin') DEFAULT 'supplier',
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    gmail_quota INT DEFAULT 500,
    gmail_submitted INT DEFAULT 0,
    outlook_quota INT DEFAULT -1,  -- -1 means unlimited
    outlook_submitted INT DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    pending_earnings DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================================================
-- EMAIL SUBMISSIONS TABLE
-- =============================================================================
CREATE TABLE email_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    email_type ENUM('gmail', 'outlook') NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    recovery_email VARCHAR(255),
    recovery_phone VARCHAR(50),
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- PAYMENTS TABLE
-- =============================================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    submission_id INT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NPR',
    type ENUM('earning', 'bonus', 'payout', 'adjustment') NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- PAYOUT SETTINGS TABLE
-- =============================================================================
CREATE TABLE payout_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT UNIQUE NOT NULL,
    payment_method ENUM('esewa', 'khalti', 'bank_transfer') DEFAULT 'esewa',
    esewa_id VARCHAR(100),
    esewa_name VARCHAR(255),
    esewa_qr TEXT,
    khalti_id VARCHAR(100),
    khalti_name VARCHAR(255),
    khalti_qr TEXT,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_account_name VARCHAR(255),
    bank_branch VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- PAYOUT REQUESTS TABLE
-- =============================================================================
CREATE TABLE payout_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('esewa', 'khalti', 'bank_transfer') NOT NULL,
    payment_details TEXT,
    status ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    processed_by INT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- GLOBAL SETTINGS TABLE
-- =============================================================================
CREATE TABLE settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('gmail_rate', '5'),
('outlook_rate', '7'),
('bonus_threshold', '500'),
('bonus_amount', '500'),
('min_payout', '300'),
('gmail_quota_default', '500'),
('outlook_quota_default', '-1');

-- Insert admin user (password: admin123)
INSERT INTO users (email, password, name, role, status) VALUES
('admin@mailstack.com', '$2y$10$8K1p/Hm4YAdC.A0H3HZH5eYe0rVXkCc.dvJd3uX0aFqq.9HvJWBKy', 'Admin', 'admin', 'approved');

-- Insert test supplier (password: password123)
INSERT INTO users (email, password, name, phone, role, status, gmail_submitted, total_earnings, available_balance) VALUES
('john.supplier@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Smith', '+9779812345678', 'supplier', 'approved', 285, 510.00, 475.00);

-- Insert sample payout settings for test supplier
INSERT INTO payout_settings (supplier_id, payment_method, esewa_id, esewa_name) VALUES
(2, 'esewa', '9876543210', 'John Smith');
