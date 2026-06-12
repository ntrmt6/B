import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to?: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
        console.warn('[EmailService] SMTP configuration incomplete. Email functionality will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      this.initialized = true;
      console.log('[EmailService] SMTP transporter initialized successfully');
    } catch (error) {
      console.error('[EmailService] Failed to initialize SMTP transporter:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      console.warn('[EmailService] Email service not initialized. Skipping email send.');
      return false;
    }

    try {
      const emailFrom = options.from || process.env.EMAIL_FROM || `info@${process.env.PRIMARY_DOMAIN || 'localhost'}`;
      const emailTo = options.to || process.env.EMAIL_TO || 'ntrmt6@gmail.com';

      const mailOptions = {
        from: emailFrom,
        to: emailTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[EmailService] Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      return false;
    }
  }

  async sendSupportTicketNotification(ticketData: {
    ticketId: string;
    type: string;
    title: string;
    description: string;
    priority: string;
    submittedBy: {
      name: string;
      email: string;
    };
    tenantId?: string;
  }): Promise<boolean> {
    const subject = `[Support Ticket] ${ticketData.title} - Priority: ${ticketData.priority}`;
    
    const html = `
      <h2>New Support Ticket Received</h2>
      <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
      <p><strong>Type:</strong> ${ticketData.type}</p>
      <p><strong>Title:</strong> ${ticketData.title}</p>
      <p><strong>Priority:</strong> ${ticketData.priority}</p>
      <p><strong>Tenant ID:</strong> ${ticketData.tenantId || 'N/A'}</p>
      <hr>
      <h3>Submitted By:</h3>
      <p><strong>Name:</strong> ${ticketData.submittedBy.name}</p>
      <p><strong>Email:</strong> ${ticketData.submittedBy.email}</p>
      <hr>
      <h3>Description:</h3>
      <p>${ticketData.description}</p>
    `;

    const text = `
New Support Ticket Received

Ticket ID: ${ticketData.ticketId}
Type: ${ticketData.type}
Title: ${ticketData.title}
Priority: ${ticketData.priority}
Tenant ID: ${ticketData.tenantId || 'N/A'}

Submitted By:
Name: ${ticketData.submittedBy.name}
Email: ${ticketData.submittedBy.email}

Description:
${ticketData.description}
    `;

    return this.sendEmail({ subject, html, text });
  }

  async sendContactFormNotification(formData: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<boolean> {
    const subject = formData.subject || `[Contact Form] Message from ${formData.name}`;
    
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <hr>
      <h3>Message:</h3>
      <p>${formData.message}</p>
    `;

    const text = `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}

Message:
${formData.message}
    `;

    return this.sendEmail({ subject, html, text });
  }
}

// Export singleton instance
export const emailService = new EmailService();
