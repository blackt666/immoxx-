import { log } from '../lib/logger.js';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * SendGrid Email Service
 * Provides email functionality using SendGrid SMTP or nodemailer fallback
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class SendGridService {
  private static transporter: Transporter | null = null;
  private static initialized = false;

  /**
   * Initialize SendGrid/SMTP transporter
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    // Check if SendGrid API key is available (can use SendGrid SMTP)
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    try {
      if (sendgridApiKey) {
        // Use SendGrid SMTP with API key
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: sendgridApiKey,
          },
        });
        log.info('✅ SendGrid Email Service initialized (SendGrid SMTP)');
      } else if (smtpHost && smtpUser && smtpPassword) {
        // Use generic SMTP
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        });
        log.info('✅ Email Service initialized (Generic SMTP)');
      } else {
        log.warn('⚠️ Email Service not configured. Set SENDGRID_API_KEY or SMTP credentials in .env');
      }

      this.initialized = true;
    } catch (error) {
      log.error('❌ Failed to initialize Email Service:', error);
    }
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      log.warn('⚠️ Email not sent: Service not configured');
      return false;
    }

    try {
      const from = options.from || process.env.SMTP_FROM || 'Bodensee Immobilien <noreply@bimm-fn.de>';

      const mailOptions = {
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      log.info(`✅ Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      log.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send lead notification email
   */
  static async sendLeadNotification(
    to: string,
    leadName: string,
    leadEmail: string,
    leadPhone?: string
  ): Promise<boolean> {
    const subject = `Neuer Lead: ${leadName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #566B73; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #566B73; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Neuer Lead eingegangen</h1>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">Name:</span> ${leadName}
            </div>
            <div class="info-row">
              <span class="label">E-Mail:</span> <a href="mailto:${leadEmail}">${leadEmail}</a>
            </div>
            ${leadPhone ? `<div class="info-row"><span class="label">Telefon:</span> <a href="tel:${leadPhone}">${leadPhone}</a></div>` : ''}
          </div>
          <div class="footer">
            <p>Bodensee Immobilien - CRM System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Neuer Lead eingegangen

Name: ${leadName}
E-Mail: ${leadEmail}
${leadPhone ? `Telefon: ${leadPhone}` : ''}

--
Bodensee Immobilien - CRM System
    `.trim();

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send lead assignment notification
   */
  static async sendLeadAssignmentNotification(
    to: string,
    agentName: string,
    leadName: string,
    leadEmail: string
  ): Promise<boolean> {
    const subject = `Lead zugewiesen: ${leadName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #566B73; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #566B73; }
          .cta-button { display: inline-block; background-color: #6585BC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Neuer Lead zugewiesen</h1>
          </div>
          <div class="content">
            <p>Hallo ${agentName},</p>
            <p>Dir wurde ein neuer Lead zugewiesen:</p>
            <div class="info-row">
              <span class="label">Name:</span> ${leadName}
            </div>
            <div class="info-row">
              <span class="label">E-Mail:</span> <a href="mailto:${leadEmail}">${leadEmail}</a>
            </div>
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/crm" class="cta-button">Lead im CRM öffnen</a>
          </div>
          <div class="footer">
            <p>Bodensee Immobilien - CRM System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hallo ${agentName},

Dir wurde ein neuer Lead zugewiesen:

Name: ${leadName}
E-Mail: ${leadEmail}

Öffne das CRM: ${process.env.APP_URL || 'http://localhost:5000'}/crm

--
Bodensee Immobilien - CRM System
    `.trim();

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send viewing confirmation email to lead
   */
  static async sendViewingConfirmation(
    to: string,
    leadName: string,
    propertyAddress: string,
    viewingDate: Date
  ): Promise<boolean> {
    const formattedDate = new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(viewingDate);

    const subject = `Besichtigungsbestätigung: ${propertyAddress}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #566B73; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; }
          .highlight { background-color: #D9CDBF; padding: 15px; border-left: 4px solid #566B73; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Besichtigungsbestätigung</h1>
          </div>
          <div class="content">
            <p>Hallo ${leadName},</p>
            <p>Ihre Besichtigung wurde bestätigt!</p>
            <div class="highlight">
              <strong>Immobilie:</strong> ${propertyAddress}<br>
              <strong>Termin:</strong> ${formattedDate}
            </div>
            <p>Wir freuen uns auf Ihren Besuch!</p>
            <p>Bei Fragen erreichen Sie uns unter: <a href="tel:+491608066630">+49 160 806 66 30</a></p>
          </div>
          <div class="footer">
            <p>Bodensee Immobilien - Ihr Immobilienmakler am Bodensee</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hallo ${leadName},

Ihre Besichtigung wurde bestätigt!

Immobilie: ${propertyAddress}
Termin: ${formattedDate}

Wir freuen uns auf Ihren Besuch!

Bei Fragen erreichen Sie uns unter: +49 160 806 66 30

--
Bodensee Immobilien - Ihr Immobilienmakler am Bodensee
    `.trim();

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Test email configuration
   */
  static async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      log.warn('⚠️ Email Service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      log.info('✅ Email Service connection verified');
      return true;
    } catch (error) {
      log.error('❌ Email Service connection failed:', error);
      return false;
    }
  }
}

// Initialize service on import
SendGridService.initialize();
