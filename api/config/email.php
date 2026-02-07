<?php
// =============================================================================
// EMAIL CONFIGURATION AND HELPER
// Uses authenticated SMTP for better deliverability (avoids spam)
// =============================================================================

// SMTP Configuration - Authenticated for mailstack.shop
define('SMTP_HOST', 'mail.mailstack.shop');  // cPanel mail server
define('SMTP_PORT', 465);                     // SSL port
define('SMTP_USER', 'notifications@mailstack.shop');
define('SMTP_PASS', 'bikash@9852');
define('SMTP_FROM', 'notifications@mailstack.shop');
define('SMTP_FROM_NAME', 'Mailstack');

// =============================================================================
// Send Email Function (uses PHP mail or SMTP)
// =============================================================================
function sendEmail($to, $subject, $htmlBody, $textBody = null)
{
    // Use PHPMailer if available, otherwise fall back to mail()
    $phpmailerPath = __DIR__ . '/../vendor/PHPMailer/PHPMailer.php';

    if (file_exists($phpmailerPath)) {
        return sendWithPHPMailer($to, $subject, $htmlBody, $textBody);
    }

    // Fallback: Use PHP's built-in mail function
    return sendWithMail($to, $subject, $htmlBody);
}

// =============================================================================
// Send with PHP mail() - Basic fallback
// =============================================================================
function sendWithMail($to, $subject, $htmlBody)
{
    $from = SMTP_FROM;
    $fromName = SMTP_FROM_NAME;

    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: ' . $fromName . ' <' . $from . '>',
        'Reply-To: ' . $from,
        'X-Mailer: Mailstack/1.0'
    ];

    // Use -f flag to set envelope sender (helps with spam)
    return mail($to, $subject, $htmlBody, implode("\r\n", $headers), "-f" . $from);
}

// =============================================================================
// Send with PHPMailer (if installed)
// =============================================================================
function sendWithPHPMailer($to, $subject, $htmlBody, $textBody)
{
    // This requires PHPMailer to be installed
    // For now, fall back to mail()
    return sendWithMail($to, $subject, $htmlBody);
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

function getEmailTemplate($content, $title = 'Mailstack Notification')
{
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>{$title}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .content h2 { color: #1f2937; margin-top: 0; }
            .content p { color: #4b5563; line-height: 1.6; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 14px; }
            .status-approved { color: #10b981; font-weight: 600; }
            .status-rejected { color: #ef4444; font-weight: 600; }
            .status-pending { color: #f59e0b; font-weight: 600; }
            .amount { font-size: 28px; font-weight: 700; color: #10b981; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>📧 Mailstack</h1>
            </div>
            <div class='content'>
                {$content}
            </div>
            <div class='footer'>
                <p>© " . date('Y') . " Mailstack. All rights reserved.</p>
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    ";
}

// =============================================================================
// SPECIFIC EMAIL FUNCTIONS
// =============================================================================

// Registration Welcome Email
function sendRegistrationEmail($email, $name)
{
    $content = "
        <h2>Welcome to Mailstack, {$name}! 🎉</h2>
        <p>Thank you for registering as a supplier. Your account is currently <span class='status-pending'>pending approval</span>.</p>
        <p>Our admin team will review your application and you'll receive another email once your account is approved.</p>
        <p>In the meantime, if you have any questions, feel free to reach out to our support team.</p>
    ";

    return sendEmail($email, 'Welcome to Mailstack - Registration Received', getEmailTemplate($content, 'Registration Confirmation'));
}

// Account Approved Email
function sendApprovalEmail($email, $name)
{
    $content = "
        <h2>Congratulations, {$name}! 🎊</h2>
        <p>Great news! Your Mailstack supplier account has been <span class='status-approved'>APPROVED</span>.</p>
        <p>You can now log in and start submitting emails to earn money.</p>
        <a href='https://mailstack.shop/login' class='button'>Log In Now →</a>
        <p>Start earning today by submitting quality emails!</p>
    ";

    return sendEmail($email, 'Your Mailstack Account is Approved! ✅', getEmailTemplate($content, 'Account Approved'));
}

// Account Rejected Email
function sendRejectionEmail($email, $name, $reason = null)
{
    $reasonText = $reason ? "<p><strong>Reason:</strong> {$reason}</p>" : "";
    $content = "
        <h2>Account Update</h2>
        <p>Hi {$name},</p>
        <p>Unfortunately, your Mailstack supplier account application has been <span class='status-rejected'>rejected</span>.</p>
        {$reasonText}
        <p>If you believe this was a mistake or would like more information, please contact our support team.</p>
    ";

    return sendEmail($email, 'Mailstack Account Application Update', getEmailTemplate($content, 'Account Status'));
}

// Account Disabled Email
function sendDisabledEmail($email, $name, $reason = null)
{
    $reasonText = $reason ? "<p><strong>Reason:</strong> {$reason}</p>" : "";
    $content = "
        <h2>Account Disabled</h2>
        <p>Hi {$name},</p>
        <p>Your Mailstack supplier account has been <span class='status-rejected'>disabled</span>.</p>
        {$reasonText}
        <p>If you believe this was a mistake, please contact our support team.</p>
    ";

    return sendEmail($email, 'Mailstack Account Disabled', getEmailTemplate($content, 'Account Disabled'));
}

// Payout Request Submitted
function sendPayoutRequestEmail($email, $name, $amount)
{
    $content = "
        <h2>Payout Request Received 💰</h2>
        <p>Hi {$name},</p>
        <p>We've received your payout request for:</p>
        <p class='amount'>\${$amount}</p>
        <p>Your request is now <span class='status-pending'>pending</span> and will be processed by our admin team within 24-48 hours.</p>
        <p>You'll receive another email once the payment is sent.</p>
    ";

    return sendEmail($email, 'Payout Request Received - $' . $amount, getEmailTemplate($content, 'Payout Request'));
}

// Payout Processed
function sendPayoutProcessedEmail($email, $name, $amount, $method = 'Bank Transfer')
{
    $content = "
        <h2>Payout Sent! 🎉</h2>
        <p>Hi {$name},</p>
        <p>Great news! Your payout has been processed:</p>
        <p class='amount'>\${$amount}</p>
        <p><strong>Payment Method:</strong> {$method}</p>
        <p>The funds should arrive in your account within 1-3 business days depending on your payment method.</p>
        <p>Thank you for being a valued Mailstack supplier!</p>
    ";

    return sendEmail($email, 'Payout Sent - $' . $amount . ' 💸', getEmailTemplate($content, 'Payout Processed'));
}

// Email Submission Flagged/Rejected
function sendSubmissionFlaggedEmail($email, $name, $status, $reason = null)
{
    $statusClass = $status === 'rejected' ? 'status-rejected' : 'status-pending';
    $statusText = ucfirst($status);
    $reasonText = $reason ? "<p><strong>Reason:</strong> {$reason}</p>" : "";

    $content = "
        <h2>Email Submission Update</h2>
        <p>Hi {$name},</p>
        <p>One of your email submissions has been marked as <span class='{$statusClass}'>{$statusText}</span>.</p>
        {$reasonText}
        <p>Please ensure all submissions follow our guidelines to avoid future issues.</p>
        <a href='https://mailstack.shop/supplier/dashboard' class='button'>View Dashboard →</a>
    ";

    return sendEmail($email, 'Email Submission ' . $statusText, getEmailTemplate($content, 'Submission Update'));
}
