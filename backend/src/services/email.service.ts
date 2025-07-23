import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: process.env.SMTP_FROM || 'noreply@edulyt.com'
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
        tls: {
          rejectUnauthorized: false // For development only
        }
      });

      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Send email with template or direct content
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let htmlContent = options.html;
      let textContent = options.text;

      // Load template if specified
      if (options.template) {
        const templateContent = await this.loadTemplate(options.template, options.data);
        htmlContent = templateContent.html;
        textContent = templateContent.text;
      }

      const mailOptions = {
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        html: htmlContent,
        text: textContent,
        attachments: options.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}: ${result.messageId}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Load email template and replace placeholders
   */
  private async loadTemplate(
    templateName: string, 
    data: Record<string, any> = {}
  ): Promise<{ html: string; text: string }> {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      const textTemplatePath = path.join(__dirname, '../templates/emails', `${templateName}.txt`);

      let htmlTemplate = '';
      let textTemplate = '';

      // Load HTML template
      if (fs.existsSync(templatePath)) {
        htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
      } else {
        // Fallback to default template
        htmlTemplate = this.getDefaultTemplate(templateName, data);
      }

      // Load text template
      if (fs.existsSync(textTemplatePath)) {
        textTemplate = fs.readFileSync(textTemplatePath, 'utf-8');
      } else {
        // Generate text from HTML or use simple text
        textTemplate = this.htmlToText(htmlTemplate);
      }

      // Replace placeholders
      const html = this.replacePlaceholders(htmlTemplate, data);
      const text = this.replacePlaceholders(textTemplate, data);

      return { html, text };

    } catch (error) {
      console.error('Failed to load email template:', error);
      return {
        html: this.getDefaultTemplate(templateName, data),
        text: this.getDefaultTextTemplate(templateName, data)
      };
    }
  }

  /**
   * Replace placeholders in template
   */
  private replacePlaceholders(template: string, data: Record<string, any>): string {
    let result = template;

    // Replace {{variable}} placeholders
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    // Replace environment variables
    result = result.replace(/{{APP_NAME}}/g, process.env.APP_NAME || 'Edulyt LMS');
    result = result.replace(/{{APP_URL}}/g, process.env.FRONTEND_URL || 'https://edulyt.com');
    result = result.replace(/{{SUPPORT_EMAIL}}/g, process.env.SUPPORT_EMAIL || 'support@edulyt.com');
    result = result.replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear().toString());

    return result;
  }

  /**
   * Get default HTML template for common email types
   */
  private getDefaultTemplate(templateName: string, data: Record<string, any>): string {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{APP_NAME}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #ff6b35; font-size: 24px; font-weight: bold; }
          .content { margin-bottom: 30px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">{{APP_NAME}}</div>
          </div>
          <div class="content">
            {{CONTENT}}
          </div>
          <div class="footer">
            <p>© {{CURRENT_YEAR}} {{APP_NAME}}. All rights reserved.</p>
            <p>If you have any questions, contact us at <a href="mailto:{{SUPPORT_EMAIL}}">{{SUPPORT_EMAIL}}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    let content = '';

    switch (templateName) {
      case 'email-verification':
        content = `
          <h2>Welcome to {{APP_NAME}}!</h2>
          <p>Hi {{name}},</p>
          <p>Thank you for registering with {{APP_NAME}}. To complete your registration, please verify your email address by clicking the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with {{APP_NAME}}, please ignore this email.</p>
        `;
        break;

      case 'password-reset':
        content = `
          <h2>Password Reset Request</h2>
          <p>Hi {{name}},</p>
          <p>We received a request to reset your password for your {{APP_NAME}} account.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="{{resetUrl}}">{{resetUrl}}</a></p>
          <p>This password reset link will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        `;
        break;

      case 'welcome':
        content = `
          <h2>Welcome to {{APP_NAME}}!</h2>
          <p>Hi {{name}},</p>
          <p>Your email has been verified successfully! Welcome to the {{APP_NAME}} learning community.</p>
          <p>You can now access all our features and start your learning journey.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{APP_URL}}/dashboard" class="button">Go to Dashboard</a>
          </p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>Browse our course catalog</li>
            <li>Enroll in courses that interest you</li>
            <li>Complete your profile</li>
            <li>Connect with other learners</li>
          </ul>
        `;
        break;

      case 'course-enrollment':
        content = `
          <h2>Course Enrollment Confirmation</h2>
          <p>Hi {{name}},</p>
          <p>Congratulations! You have successfully enrolled in:</p>
          <h3>{{courseTitle}}</h3>
          <p>{{courseDescription}}</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{courseUrl}}" class="button">Start Learning</a>
          </p>
          <p>Your enrollment details:</p>
          <ul>
            <li>Enrollment Date: {{enrollmentDate}}</li>
            <li>Plan: {{planType}}</li>
            <li>Access: {{accessType}}</li>
          </ul>
        `;
        break;

      default:
        content = `
          <h2>{{subject}}</h2>
          <p>Hi {{name}},</p>
          <p>{{message}}</p>
        `;
    }

    return baseTemplate.replace('{{CONTENT}}', content);
  }

  /**
   * Get default text template
   */
  private getDefaultTextTemplate(templateName: string, data: Record<string, any>): string {
    const appName = process.env.APP_NAME || 'Edulyt LMS';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@edulyt.com';

    switch (templateName) {
      case 'email-verification':
        return `
Welcome to ${appName}!

Hi ${data.name || 'there'},

Thank you for registering with ${appName}. To complete your registration, please verify your email address by visiting this link:

${data.verificationUrl || ''}

This verification link will expire in 24 hours.

If you didn't create an account with ${appName}, please ignore this email.

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
If you have any questions, contact us at ${supportEmail}
        `.trim();

      case 'password-reset':
        return `
Password Reset Request

Hi ${data.name || 'there'},

We received a request to reset your password for your ${appName} account.

To reset your password, visit this link:

${data.resetUrl || ''}

This password reset link will expire in 10 minutes.

If you didn't request a password reset, please ignore this email.

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
If you have any questions, contact us at ${supportEmail}
        `.trim();

      default:
        return `
Hi ${data.name || 'there'},

${data.message || 'Thank you for using our service.'}

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
If you have any questions, contact us at ${supportEmail}
        `.trim();
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📧 Bulk email results: ${success} successful, ${failed} failed`);
    return { success, failed };
  }
}

// Export singleton instance
const emailService = new EmailService();

export const sendEmail = (options: EmailOptions) => emailService.sendEmail(options);
export const verifyEmailConnection = () => emailService.verifyConnection();
export const sendBulkEmails = (emails: EmailOptions[]) => emailService.sendBulkEmails(emails);

export default emailService; 