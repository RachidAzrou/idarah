import { db } from "../db";
import { 
  emailTemplates, 
  emailSegments, 
  emailCampaigns, 
  emailMessages, 
  emailSuppresses,
  members,
  tenants,
  membershipFees,
  type InsertEmailTemplate,
  type InsertEmailSegment,
  type InsertEmailCampaign,
  type InsertEmailMessage,
  type InsertEmailSuppress
} from "@shared/schema";
import { eq, and, inArray, gte, lte, sql, desc } from "drizzle-orm";
import Handlebars from "handlebars";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

export class EmailService {
  private transporter: any;

  constructor() {
    this.setupTransporter();
    this.registerHandlebarsHelpers();
  }

  private setupTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private registerHandlebarsHelpers() {
    // Register currency helper
    Handlebars.registerHelper('currency', function(amount: number) {
      return new Intl.NumberFormat('nl-BE', { 
        style: 'currency', 
        currency: 'EUR' 
      }).format(amount);
    });

    // Register date helper
    Handlebars.registerHelper('date', function(date: Date | string) {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('nl-BE');
    });
  }

  // Templates
  async listTemplates(tenantId: string) {
    const templates = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.tenantId, tenantId))
      .orderBy(desc(emailTemplates.createdAt));
    
    // Ensure uniqueness by ID to prevent duplicates
    const seen = new Set<string>();
    return templates.filter(template => {
      if (seen.has(template.id)) {
        return false;
      }
      seen.add(template.id);
      return true;
    });
  }

  async getTemplate(tenantId: string, id: string) {
    const [template] = await db.select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.tenantId, tenantId),
        eq(emailTemplates.id, id)
      ));
    return template;
  }

  async createTemplate(tenantId: string, data: Omit<InsertEmailTemplate, 'tenantId'>) {
    const [template] = await db.insert(emailTemplates)
      .values({ ...data, tenantId })
      .returning();
    return template;
  }

  async updateTemplate(tenantId: string, id: string, data: Partial<InsertEmailTemplate>) {
    const [template] = await db.update(emailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(emailTemplates.tenantId, tenantId),
        eq(emailTemplates.id, id)
      ))
      .returning();
    return template;
  }

  async deleteTemplate(tenantId: string, id: string) {
    await db.delete(emailTemplates)
      .where(and(
        eq(emailTemplates.tenantId, tenantId),
        eq(emailTemplates.id, id)
      ));
  }

  // Convert plain text to professional HTML
  private convertToHTML(plainText: string): string {
    if (!plainText?.trim()) return "";
    
    const baseStyle = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .email-container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .content p { margin: 0 0 15px 0; }
        .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; border-radius: 0 4px 4px 0; }
        .expired-amount { background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 0 4px 4px 0; }
        .expired-amount p { color: #991b1b; font-weight: 500; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; margin-top: 25px; color: #666; font-size: 14px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="content">
    `;
    
    // Convert plain text to HTML paragraphs
    const htmlContent = plainText
      .split('\n\n') // Split into paragraphs
      .filter(p => p.trim()) // Remove empty paragraphs
      .map(paragraph => {
        const trimmed = paragraph.trim();
        // Handle Handlebars variables and links
        if (trimmed.includes('{{') || trimmed.includes('http')) {
          // Special formatting for links or variables
          if (trimmed.includes('http') || trimmed.includes('{{card.url}}')) {
            return `        <div class="highlight">
            <p>${trimmed}</p>
          </div>`;
          }
        }
        // Red highlighting for expired fee amounts and totals
        if (trimmed.includes('€') && (trimmed.includes('{{#each member.fees.expired}}') || trimmed.includes('{{member.fees.totalExpiredAmount}}') || trimmed.includes('Totaal vervallen bedrag'))) {
          return `        <div class="expired-amount">
          <p>${trimmed}</p>
        </div>`;
        }
        return `        <p>${trimmed}</p>`;
      })
      .join('\n');
    
    const footer = `
        </div>
      </div>
    </body>
    </html>`;
    
    return baseStyle + htmlContent + footer;
  }

  private convertToPlainText(content: string): string {
    if (!content?.trim()) return "";
    
    // Add professional plain text formatting
    const lines = content
      .split('\n\n')
      .filter(p => p.trim())
      .join('\n\n');
      
    return lines;
  }

  // Render template with context
  async renderTemplate(templateId: string, context: any) {
    const template = await db.select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!template[0]) throw new Error('Template not found');

    const subjectTemplate = Handlebars.compile(template[0].subject);
    
    // Use content field if available (new format), otherwise fall back to old fields
    let htmlContent: string;
    let textContent: string;
    
    if (template[0].content) {
      // Generate HTML and text from content field
      htmlContent = this.convertToHTML(template[0].content);
      textContent = this.convertToPlainText(template[0].content);
    } else {
      // Fall back to old bodyHtml and bodyText fields
      htmlContent = template[0].bodyHtml || '';
      textContent = template[0].bodyText || '';
    }
    
    const htmlTemplate = Handlebars.compile(htmlContent);
    const textTemplate = textContent ? Handlebars.compile(textContent) : null;

    // Add tracking if needed
    const enrichedContext = {
      ...context,
      openUrl: context.openUrl || '',
      clickUrl: (original: string) => context.clickUrl ? context.clickUrl(original) : original,
      unsubUrl: context.unsubUrl || '',
      now: new Date().toISOString(),
    };

    return {
      subject: subjectTemplate(enrichedContext),
      html: htmlTemplate(enrichedContext),
      text: textTemplate ? textTemplate(enrichedContext) : undefined,
    };
  }

  // Segments
  async listSegments(tenantId: string) {
    return await db.select()
      .from(emailSegments)
      .where(eq(emailSegments.tenantId, tenantId))
      .orderBy(desc(emailSegments.createdAt));
  }

  async createSegment(tenantId: string, data: Omit<InsertEmailSegment, 'tenantId'>) {
    const [segment] = await db.insert(emailSegments)
      .values({ ...data, tenantId })
      .returning();
    return segment;
  }

  async deleteSegment(tenantId: string, id: string) {
    await db.delete(emailSegments)
      .where(and(
        eq(emailSegments.tenantId, tenantId),
        eq(emailSegments.id, id)
      ));
  }

  async resolveSegment(tenantId: string, rules: any): Promise<Array<{memberId: string, email: string}>> {
    // Apply filters based on rules
    const conditions: any[] = [eq(members.tenantId, tenantId)];

    if (rules.memberActive !== undefined) {
      conditions.push(eq(members.active, rules.memberActive));
    }

    if (rules.category && Array.isArray(rules.category) && rules.category.length > 0) {
      conditions.push(inArray(members.category, rules.category));
    }

    if (rules.gender && Array.isArray(rules.gender) && rules.gender.length > 0) {
      conditions.push(inArray(members.gender, rules.gender));
    }

    if (rules.city) {
      conditions.push(eq(members.city, rules.city));
    }

    if (rules.createdFrom) {
      conditions.push(gte(members.createdAt, new Date(rules.createdFrom)));
    }

    if (rules.createdTo) {
      conditions.push(lte(members.createdAt, new Date(rules.createdTo)));
    }

    const results = await db.select({
      id: members.id,
      email: members.email,
      firstName: members.firstName,
      lastName: members.lastName,
      category: members.category,
      active: members.active,
      city: members.city,
      postalCode: members.postalCode,
      createdAt: members.createdAt,
    })
    .from(members)
    .where(and(...conditions));

    return results
      .filter((member: any) => member.email) // Only members with email
      .map((member: any) => ({
        memberId: member.id,
        email: member.email!,
      }));
  }

  async previewSegment(tenantId: string, rules: any) {
    const members = await this.resolveSegment(tenantId, rules);
    return {
      count: members.length,
      sample: members.slice(0, 10), // First 10 members as preview
    };
  }

  // Build member context for template rendering
  async buildMemberContext(tenantId: string, memberId: string) {
    // Get member
    const [member] = await db.select()
      .from(members)
      .where(and(
        eq(members.tenantId, tenantId),
        eq(members.id, memberId)
      ));

    if (!member) throw new Error('Member not found');

    // Get tenant
    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    // Get recent fees
    const memberFees = await db.select()
      .from(membershipFees)
      .where(and(
        eq(membershipFees.tenantId, tenantId),
        eq(membershipFees.memberId, memberId)
      ))
      .orderBy(desc(membershipFees.periodStart))
      .limit(5);

    return {
      member: {
        ...member,
        city: member.city || 'Onbekend',
      },
      tenant: tenant || { name: 'Organisatie', logoUrl: '', primaryColor: '#000' },
      card: {
        url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/card/${memberId}?standalone=1`
      },
      fees: memberFees.map(fee => ({
        amount: fee.amount,
        periodStart: fee.periodStart,
        periodEnd: fee.periodEnd,
        status: fee.status,
      })),
    };
  }

  // Check if email is suppressed
  async isEmailSuppressed(tenantId: string, email: string) {
    const [suppression] = await db.select()
      .from(emailSuppresses)
      .where(and(
        eq(emailSuppresses.tenantId, tenantId),
        eq(emailSuppresses.email, email)
      ))
      .limit(1);
    return !!suppression;
  }

  // Generate tracking tokens
  generateTokens() {
    return {
      openToken: randomBytes(16).toString('hex'),
      clickToken: randomBytes(16).toString('hex'),
      unsubToken: randomBytes(16).toString('hex'),
    };
  }

  // Send single transactional email
  async sendTransactional(tenantId: string, templateCode: string, options: {
    memberId?: string;
    email?: string;
    context?: any;
  }) {
    const [template] = await db.select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.tenantId, tenantId),
        eq(emailTemplates.code, templateCode)
      ));

    if (!template) throw new Error('Template not found');

    let context = options.context || {};
    
    if (options.memberId) {
      context = await this.buildMemberContext(tenantId, options.memberId);
    }

    const email = options.email || context.member?.email;
    if (!email) throw new Error('No email address provided');

    // Generate tokens
    const tokens = this.generateTokens();
    
    // Render template
    const rendered = await this.renderTemplate(template.id, {
      ...context,
      openUrl: `${process.env.APP_BASE_URL}/api/messages/track/open/{{messageId}}/${tokens.openToken}.png`,
      clickUrl: (original: string) => `${process.env.APP_BASE_URL}/api/messages/track/click/{{messageId}}/${tokens.clickToken}?u=${encodeURIComponent(original)}`,
    });

    // Create message record
    const [message] = await db.insert(emailMessages)
      .values({
        tenantId,
        templateId: template.id,
        memberId: options.memberId,
        email,
        subject: rendered.subject,
        bodyHtml: rendered.html,
        bodyText: rendered.text,
        tokens,
        status: 'QUEUED',
      })
      .returning();

    // Replace placeholder in rendered content
    const finalHtml = rendered.html.replace(/{{messageId}}/g, message.id);
    
    // Update message with final content
    await db.update(emailMessages)
      .set({
        bodyHtml: finalHtml,
      })
      .where(eq(emailMessages.id, message.id));

    // Send immediately for transactional
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: rendered.subject,
        html: finalHtml,
        text: rendered.text,
      });

      await db.update(emailMessages)
        .set({
          status: 'SENT',
          sentAt: new Date(),
        })
        .where(eq(emailMessages.id, message.id));

      return message;
    } catch (error: any) {
      await db.update(emailMessages)
        .set({
          status: 'FAILED',
          lastError: error.message,
        })
        .where(eq(emailMessages.id, message.id));
      
      throw error;
    }
  }

  // Campaigns
  async listCampaigns(tenantId: string) {
    return await db.select({
      campaign: emailCampaigns,
      template: emailTemplates,
      segment: emailSegments,
    })
    .from(emailCampaigns)
    .leftJoin(emailTemplates, eq(emailCampaigns.templateId, emailTemplates.id))
    .leftJoin(emailSegments, eq(emailCampaigns.segmentId, emailSegments.id))
    .where(eq(emailCampaigns.tenantId, tenantId))
    .orderBy(desc(emailCampaigns.createdAt));
  }

  async createCampaign(tenantId: string, data: Omit<InsertEmailCampaign, 'tenantId'>) {
    const [campaign] = await db.insert(emailCampaigns)
      .values({ ...data, tenantId })
      .returning();
    return campaign;
  }

  // Queue campaign for sending
  async queueCampaign(tenantId: string, campaignId: string) {
    const [campaign] = await db.select({
      campaign: emailCampaigns,
      template: emailTemplates,
      segment: emailSegments,
    })
    .from(emailCampaigns)
    .leftJoin(emailTemplates, eq(emailCampaigns.templateId, emailTemplates.id))
    .leftJoin(emailSegments, eq(emailCampaigns.segmentId, emailSegments.id))
    .where(and(
      eq(emailCampaigns.tenantId, tenantId),
      eq(emailCampaigns.id, campaignId)
    ));

    if (!campaign) throw new Error('Campaign not found');

    // Resolve recipients
    let recipients: Array<{memberId: string, email: string}> = [];
    
    if (campaign.segment) {
      recipients = await this.resolveSegment(tenantId, campaign.segment.rules);
    }

    // Create message records for each recipient
    const messages = [];
    for (const recipient of recipients) {
      // Skip if suppressed for marketing
      if (campaign.campaign.kind === 'MARKETING') {
        const suppressed = await this.isEmailSuppressed(tenantId, recipient.email);
        if (suppressed) continue;
      }

      const context = await this.buildMemberContext(tenantId, recipient.memberId);
      const tokens = this.generateTokens();
      
      if (!campaign.template) {
        throw new Error('Campaign template not found');
      }

      const rendered = await this.renderTemplate(campaign.template.id, {
        ...context,
        openUrl: `${process.env.APP_BASE_URL}/api/messages/track/open/{{messageId}}/${tokens.openToken}.png`,
        clickUrl: (original: string) => `${process.env.APP_BASE_URL}/api/messages/track/click/{{messageId}}/${tokens.clickToken}?u=${encodeURIComponent(original)}`,
        unsubUrl: campaign.campaign.kind === 'MARKETING' ? 
          `${process.env.APP_BASE_URL}/email/unsubscribe?token=${tokens.unsubToken}` : undefined,
      });

      messages.push({
        tenantId,
        campaignId,
        templateId: campaign.template.id,
        memberId: recipient.memberId,
        email: recipient.email,
        subject: rendered.subject,
        bodyHtml: rendered.html,
        bodyText: rendered.text,
        tokens,
        status: 'QUEUED' as const,
      });
    }

    // Batch insert messages
    if (messages.length > 0) {
      await db.insert(emailMessages).values(messages);
    }

    // Update campaign status
    await db.update(emailCampaigns)
      .set({
        status: 'QUEUED',
        startedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, campaignId));

    return { messagesQueued: messages.length };
  }

  // Worker function to process queued messages
  async processQueuedMessages(limit: number = 50) {
    const queuedMessages = await db.select()
      .from(emailMessages)
      .where(eq(emailMessages.status, 'QUEUED'))
      .limit(limit);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
    };

    for (const message of queuedMessages) {
      try {
        // Replace placeholders with actual message ID
        const finalHtml = message.bodyHtml.replace(/{{messageId}}/g, message.id);
        
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: message.email,
          subject: message.subject,
          html: finalHtml,
          text: message.bodyText,
        });

        await db.update(emailMessages)
          .set({
            status: 'SENT',
            sentAt: new Date(),
            bodyHtml: finalHtml, // Save final version
          })
          .where(eq(emailMessages.id, message.id));

        results.sent++;
      } catch (error: any) {
        const retryCount = message.retryCount + 1;
        const status = retryCount >= 3 ? 'FAILED' : 'QUEUED';

        await db.update(emailMessages)
          .set({
            status,
            lastError: error.message,
            retryCount,
          })
          .where(eq(emailMessages.id, message.id));

        if (status === 'FAILED') {
          results.failed++;
        }
      }

      results.processed++;

      // Rate limiting - wait between sends
      const ratePerMinute = parseInt(process.env.EMAIL_RATE_PER_MIN || '50');
      const delayMs = (60 * 1000) / ratePerMinute;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return results;
  }

  // Tracking
  async trackOpen(messageId: string, openToken: string) {
    const [message] = await db.select()
      .from(emailMessages)
      .where(eq(emailMessages.id, messageId));

    if (!message || (message.tokens as any)?.openToken !== openToken) {
      return false;
    }

    // Only set once
    if (!message.openedAt) {
      await db.update(emailMessages)
        .set({ 
          openedAt: new Date(),
          status: 'OPENED'
        })
        .where(eq(emailMessages.id, messageId));
    }

    return true;
  }

  async trackClick(messageId: string, clickToken: string, originalUrl: string) {
    const [message] = await db.select()
      .from(emailMessages)
      .where(eq(emailMessages.id, messageId));

    if (!message || (message.tokens as any)?.clickToken !== clickToken) {
      return null;
    }

    // Only set once
    if (!message.clickedAt) {
      await db.update(emailMessages)
        .set({ 
          clickedAt: new Date(),
          status: 'CLICKED'
        })
        .where(eq(emailMessages.id, messageId));
    }

    return originalUrl;
  }

  // Suppress email
  async suppressEmail(tenantId: string, email: string, memberId?: string, reason: string = 'UNSUB_REQUEST') {
    await db.insert(emailSuppresses)
      .values({
        tenantId,
        email,
        memberId,
        reason: reason as any,
      })
      .onConflictDoNothing();
  }

  // Test email
  async sendTestEmail(tenantId: string, templateId: string, toEmail: string, sampleContext?: any) {
    const context = sampleContext || await this.buildSampleContext(tenantId);
    
    const rendered = await this.renderTemplate(templateId, context);
    
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: toEmail,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
    });
  }

  private async buildSampleContext(tenantId: string) {
    // Get first active member as sample
    const [sampleMember] = await db.select()
      .from(members)
      .where(and(
        eq(members.tenantId, tenantId),
        eq(members.active, true)
      ))
      .limit(1);

    if (sampleMember) {
      return await this.buildMemberContext(tenantId, sampleMember.id);
    }

    // Fallback sample data
    return {
      member: {
        firstName: 'Jan',
        lastName: 'Voorbeeld',
        email: 'jan@voorbeeld.be',
        memberNumber: '12345',
        category: 'STANDAARD',
        city: 'Antwerpen',
      },
      tenant: { name: 'Moskee Voorbeeld', logoUrl: '', primaryColor: '#000' },
      card: { url: '#' },
      fees: [],
    };
  }
}