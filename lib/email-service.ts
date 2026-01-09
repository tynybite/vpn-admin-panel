
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/internal/firebase';

interface EmailTemplateParams {
    username: string;
    scenario: 'admin_granted' | 'admin_revoked' | 'account_banned' | 'account_reactivated' | 'premium_granted' | 'premium_revoked' | 'account_deleted';
}
interface SmtpConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    encryption: 'none' | 'ssl' | 'tls';
    fromEmail: string;
    fromName?: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
    try {
        const doc = await adminDb.collection('settings').doc('smtp').get();
        if (!doc.exists) return null;
        return doc.data() as SmtpConfig;
    } catch (error) {
        console.error('Error fetching SMTP config:', error);
        return null;
    }
}
function getTemplateContext(scenario: EmailTemplateParams['scenario']) {
    switch (scenario) {
        case 'admin_granted':
            return {
                statusColor: '#10B981', // Green
                icon: '🎉',
                headline: 'You now have Admin Access',
                bodyMessage: 'We are pleased to inform you that your Velocity VPN account has been upgraded. You now have full administrative privileges to manage users and server configurations.'
            };
        case 'admin_revoked':
            return {
                statusColor: '#F59E0B', // Amber/Orange
                icon: '🔒',
                headline: 'Administrative Privileges Updated',
                bodyMessage: 'Your administrative access for Velocity VPN has been revoked. Your account remains active with standard user permissions. If you need to request access again, please contact the IT department.'
            };
        case 'account_banned':
            return {
                statusColor: '#EF4444', // Red
                icon: '🚫',
                headline: 'Account Suspended',
                bodyMessage: 'Your Velocity VPN account has been suspended due to a violation of our Terms of Service. Access to the network is currently blocked.'
            };
        case 'account_reactivated':
            return {
                statusColor: '#3B82F6', // Brand Blue
                icon: '✨',
                headline: 'Welcome Back!',
                bodyMessage: 'Great news! Your Velocity VPN account has been successfully reactivated. You may now log in and connect to our secure servers immediately.'
            };
        case 'premium_granted':
            return {
                statusColor: '#8B5CF6', // Purple
                icon: '👑',
                headline: 'Premium Unlocked!',
                bodyMessage: 'Congratulations! Your account has been upgraded to Premium status. Enjoy exclusive access to high-speed servers and ad-free browsing.'
            };
        case 'premium_revoked':
            return {
                statusColor: '#6B7280', // Gray
                icon: '📉',
                headline: 'Premium Access Ended',
                bodyMessage: 'Your Premium subscription has been cancelled or expired. Your account has been reverted to the Free plan.'
            };
        case 'account_deleted':
            return {
                statusColor: '#EF4444', // Red
                icon: '🗑️',
                headline: 'Account Deleted',
                bodyMessage: 'Your account has been successfully deleted upon your request. We are sorry to see you go. If this was a mistake, please contact support immediately.'
            };
    }
}

function generateHtml(username: string, context: ReturnType<typeof getTemplateContext>): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Status Update</title>
    <style>
        /* Reset and Clients Overrides */
        body { margin: 0; padding: 0; min-width: 100%; width: 100% !important; height: 100% !important; background-color: #f4f6f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        table { border-spacing: 0; border-collapse: collapse; }
        td { padding: 0; }
        img { border: 0; }
        
        /* Responsive */
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
        }
    </style>
</head>
<body style="background-color: #f4f6f9; margin: 0; padding: 40px 0;">

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center">
                
                <table class="container" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;">
                    
                    <tr>
                        <td height="8" style="background-color: ${context.statusColor}; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 40px 0 20px 0;">
                            <h2 style="margin: 0; color: #333333; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                                <span style="color: #2563EB;">FreeShield</span> VPN
                            </h2>
                        </td>
                    </tr>

                    <tr>
                        <td class="content" style="padding: 0 48px 48px 48px; text-align: center;">
                            
                            <div style="font-size: 48px; margin-bottom: 20px;">
                                ${context.icon}
                            </div>

                            <h1 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; line-height: 1.3;">
                                ${context.headline}
                            </h1>

                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                Hello <strong>${username}</strong>,<br><br>
                                ${context.bodyMessage}
                            </p>

                            <table border="0" cellspacing="0" cellpadding="0" role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #2563EB;">
                                        <a href="https://smvpn.vercel.app/login" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                                            Open Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin-top: 32px; color: #9ca3af; font-size: 14px;">
                                If you believe this is a mistake, please <a href="#" style="color: #2563EB; text-decoration: none;">contact support</a>.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                &copy; 2026 Velocity VPN. All rights reserved.<br>
                                123 Secure Street, Privacy City, Web 3.0
                            </p>
                        </td>
                    </tr>

                </table>
                
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr><td height="40">&nbsp;</td></tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`;
}

export async function sendUserStatusEmail(toEmail: string, params: EmailTemplateParams) {
    if (!toEmail || !toEmail.includes('@')) {
        console.warn(`Skipping email: Invalid address '${toEmail}'`);
        return;
    }

    const config = await getSmtpConfig();
    if (!config) {
        console.warn('Skipping email: SMTP settings not configured or not found in DB.');
        return;
    }

    console.log(`Preparing to send email to ${toEmail} with scenario: ${params.scenario}`);
    console.log(`SMTP Config: Host=${config.host}, Port=${config.port}, User=${config.username}, From=${config.fromEmail}`);

    const context = getTemplateContext(params.scenario);
    const htmlContent = generateHtml(params.username, context);

    const port = Number(config.port);
    const isSSLPort = port === 465;
    const isSTARTTLSPort = port === 587;

    // Logic: 
    // - Port 465 is implicit SSL -> secure: true
    // - Port 587 is STARTTLS -> secure: false
    // - Other ports: trust 'config.encryption' setting, but default to false if not 'ssl'
    let useSecure = isSSLPort;
    if (!isSSLPort && !isSTARTTLSPort && config.encryption === 'ssl') {
        useSecure = true;
    }

    console.log(`SMTP Debug: Port=${port} (type=${typeof config.port}), Encryption=${config.encryption}, Decided Secure=${useSecure}`);

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: port,
        secure: useSecure,
        auth: {
            user: config.username,
            pass: config.password,
        },
        tls: {
            // Do not fail on invalid certs
            rejectUnauthorized: false
        }
    });


    try {
        await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: toEmail,
            subject: `${context.icon} ${context.headline} - Velocity VPN`,
            html: htmlContent,
        });
        console.log(`Email sent successfully to ${toEmail}`);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}

export async function sendCustomEmail(toEmail: string, subject: string, message: string) {
    if (!toEmail || !toEmail.includes('@')) {
        console.warn(`Skipping email: Invalid address '${toEmail}'`);
        return;
    }

    const config = await getSmtpConfig();
    if (!config) {
        console.warn('Skipping email: SMTP settings not configured or not found in DB.');
        return;
    }

    // Basic HTML wrapper for custom emails
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<body style="background-color: #f4f6f9; margin: 0; padding: 40px 0; font-family: sans-serif;">
    <table align="center" width="600" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;">
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #333333; margin-top: 0;">Velocity VPN</h2>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    &copy; ${new Date().getFullYear()} Velocity VPN. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const port = Number(config.port);
    const isSSLPort = port === 465;
    const isSTARTTLSPort = port === 587;

    let useSecure = isSSLPort;
    if (!isSSLPort && !isSTARTTLSPort && config.encryption === 'ssl') {
        useSecure = true;
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: port,
        secure: useSecure,
        auth: {
            user: config.username,
            pass: config.password,
        },
        tls: { rejectUnauthorized: false }
    });

    try {
        await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent,
        });
        console.log(`Custom email sent successfully to ${toEmail}`);
    } catch (error) {
        console.error('Failed to send custom email:', error);
        throw error; // Re-throw to let API know it failed
    }
}
