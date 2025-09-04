import { 
  tenants, 
  users, 
  members, 
  memberFinancialSettings,
  memberPermissions,
  mandates,
  membershipFees,
  transactions,
  rules,
  ruleOutcomes,
  publicScreens,
  announcements,
  cardMeta,
  notifications,
  sepaExports,
  emailTemplates,
  emailSegments,
  emailCampaigns,
  emailMessages,
  emailSuppresses,
  type Tenant,
  type User,
  type Member,
  type MemberFinancialSettings,
  type MembershipFee,
  type Transaction,
  type Rule,
  type RuleOutcome,
  type PublicScreen,
  type Announcement,
  type CardMeta,
  type Notification,
  type SepaExport,
  type EmailTemplate,
  type EmailSegment,
  type EmailCampaign,
  type EmailMessage,
  type EmailSuppress,
  type InsertTenant,
  type InsertUser,
  type InsertMember,
  type InsertMemberFinancialSettings,
  type InsertMemberPermissions,
  type InsertMembershipFee,
  type InsertTransaction,
  type InsertRule,
  type InsertRuleOutcome,
  type InsertPublicScreen,
  type InsertAnnouncement,
  type InsertCardMeta,
  type InsertNotification,
  type InsertSepaExport,
  type InsertEmailTemplate,
  type InsertEmailSegment,
  type InsertEmailCampaign,
  type InsertEmailMessage,
  type InsertEmailSuppress,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { cache } from "./cache";

export interface IStorage {
  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Members
  getMember(id: string): Promise<Member | undefined>;
  getMembersByTenant(tenantId: string): Promise<Member[]>;
  getMemberByNumber(tenantId: string, memberNumber: string): Promise<Member | undefined>;
  getMemberByNameAndAddress(tenantId: string, firstName: string, lastName: string, street: string, number: string): Promise<Member | undefined>;
  getNextAvailableMemberNumber(tenantId: string, startFrom?: string): Promise<string>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: string): Promise<void>;
  
  // Member Financial Settings
  getMemberFinancialSettings(memberId: string): Promise<MemberFinancialSettings | undefined>;
  createMemberFinancialSettings(settings: InsertMemberFinancialSettings): Promise<MemberFinancialSettings>;
  updateMemberFinancialSettings(memberId: string, settings: Partial<InsertMemberFinancialSettings>): Promise<MemberFinancialSettings>;
  
  // Member Permissions
  getMemberPermissions(memberId: string): Promise<MemberPermissions | undefined>;
  createMemberPermissions(permissions: InsertMemberPermissions): Promise<MemberPermissions>;
  updateMemberPermissions(memberId: string, permissions: Partial<InsertMemberPermissions>): Promise<MemberPermissions>;

  // Membership Fees
  getMembershipFee(id: string): Promise<MembershipFee | undefined>;
  getMembershipFeesByTenant(tenantId: string): Promise<MembershipFee[]>;
  getMembershipFeesByMember(memberId: string): Promise<MembershipFee[]>;
  createMembershipFee(fee: InsertMembershipFee): Promise<MembershipFee>;
  updateMembershipFee(id: string, fee: Partial<InsertMembershipFee>): Promise<MembershipFee>;
  deleteMembershipFee(id: string, tenantId: string): Promise<void>;

  // Transactions
  getTransactionsByTenant(tenantId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  
  // Dashboard
  getDashboardStats(tenantId: string): Promise<any>;

  // Rules
  getRulesByTenant(tenantId: string): Promise<Rule[]>;
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: string, rule: Partial<InsertRule>): Promise<Rule>;
  deleteRule(id: string): Promise<void>;

  // Rule Outcomes
  getRuleOutcomesByMember(memberId: string): Promise<RuleOutcome[]>;
  createRuleOutcome(outcome: InsertRuleOutcome): Promise<RuleOutcome>;

  // Public Screens
  getPublicScreensByTenant(tenantId: string): Promise<PublicScreen[]>;
  getPublicScreenByToken(token: string): Promise<PublicScreen | undefined>;
  createPublicScreen(screen: InsertPublicScreen): Promise<PublicScreen>;

  // Announcements
  getAnnouncementsByTenant(tenantId: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;

  // Card Meta
  getCardMetaByMember(memberId: string): Promise<CardMeta | undefined>;
  getCardMetaByQrToken(qrToken: string): Promise<CardMeta | undefined>;
  createCardMeta(cardMeta: InsertCardMeta): Promise<CardMeta>;
  updateCardMeta(id: string, cardMeta: Partial<InsertCardMeta>): Promise<CardMeta>;
  getMemberWithCardAndTenant(memberId: string): Promise<{ member: Member; cardMeta: CardMeta; tenant: Tenant } | undefined>;
  getAllCardsWithMembers(tenantId: string): Promise<{ member: Member; cardMeta: CardMeta | null }[]>;
  getCardStats(tenantId: string): Promise<{ totalActive: number; validPercentage: number; lastUpdated: Date | null }>;

  // Notifications
  getNotificationsByTenant(tenantId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;

  // SEPA Exports
  getSepaExportsByTenant(tenantId: string): Promise<SepaExport[]>;
  createSepaExport(sepaExport: InsertSepaExport): Promise<SepaExport>;

  // Dashboard stats
  getDashboardStats(tenantId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    totalRevenue: number;
    outstanding: number;
  }>;

  // Email Templates
  getEmailTemplatesByTenant(tenantId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(tenantId: string, id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(tenantId: string, id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(tenantId: string, id: string): Promise<void>;

  // Email Segments
  getEmailSegmentsByTenant(tenantId: string): Promise<EmailSegment[]>;
  getEmailSegment(tenantId: string, id: string): Promise<EmailSegment | undefined>;
  createEmailSegment(segment: InsertEmailSegment): Promise<EmailSegment>;
  updateEmailSegment(tenantId: string, id: string, segment: Partial<InsertEmailSegment>): Promise<EmailSegment>;
  deleteEmailSegment(tenantId: string, id: string): Promise<void>;

  // Email Campaigns
  getEmailCampaignsByTenant(tenantId: string): Promise<EmailCampaign[]>;
  getEmailCampaign(tenantId: string, id: string): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(tenantId: string, id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  deleteEmailCampaign(tenantId: string, id: string): Promise<void>;

  // Email Messages
  getEmailMessagesByTenant(tenantId: string): Promise<EmailMessage[]>;
  getEmailMessagesByCampaign(tenantId: string, campaignId: string): Promise<EmailMessage[]>;
  createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage>;
  updateEmailMessage(id: string, message: Partial<InsertEmailMessage>): Promise<EmailMessage>;

  // Email Suppresses
  getEmailSuppressesByTenant(tenantId: string): Promise<EmailSuppress[]>;
  createEmailSuppress(suppress: InsertEmailSuppress): Promise<EmailSuppress>;
  deleteEmailSuppress(tenantId: string, id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const cacheKey = `tenant:${id}`;
    const cached = cache.get<Tenant>(cacheKey);
    if (cached) return cached;
    
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (tenant) {
      cache.set(cacheKey, tenant, 60000); // Cache for 1 minute
    }
    return tenant || undefined;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant || undefined;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant> {
    const [updatedTenant] = await db.update(tenants).set(tenant).where(eq(tenants.id, id)).returning();
    return updatedTenant;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Members
  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMembersByTenant(tenantId: string): Promise<Member[]> {
    const cacheKey = `members:tenant:${tenantId}`;
    const cached = cache.get<Member[]>(cacheKey);
    if (cached) return cached;
    
    const membersData = await db.select().from(members)
      .where(eq(members.tenantId, tenantId))
      .orderBy(desc(members.createdAt))
      .limit(1000); // Limit to prevent large data loads
    
    cache.set(cacheKey, membersData, 15000); // Cache for 15 seconds
    return membersData;
  }

  async getMemberByNumber(tenantId: string, memberNumber: string): Promise<Member | undefined> {
    // Normaliseer lidnummer naar 4-cijferige format (0007)
    const normalizedNumber = memberNumber.padStart(4, '0');
    
    // Probeer eerst de genormaliseerde versie
    let [member] = await db.select().from(members).where(
      and(eq(members.tenantId, tenantId), eq(members.memberNumber, normalizedNumber))
    );
    
    // Als niet gevonden, probeer ook de originele versie (voor achterwaartse compatibiliteit)
    if (!member && memberNumber !== normalizedNumber) {
      [member] = await db.select().from(members).where(
        and(eq(members.tenantId, tenantId), eq(members.memberNumber, memberNumber))
      );
    }
    
    // Probeer ook alle varianten (met en zonder leading zeros)
    if (!member) {
      const memberAsNumber = parseInt(memberNumber);
      if (!isNaN(memberAsNumber)) {
        // Probeer "7", "07", "007", "0007"
        const variants = [
          memberAsNumber.toString(),
          memberAsNumber.toString().padStart(2, '0'),
          memberAsNumber.toString().padStart(3, '0'),
          memberAsNumber.toString().padStart(4, '0')
        ];
        
        for (const variant of variants) {
          if (variant !== normalizedNumber && variant !== memberNumber) {
            [member] = await db.select().from(members).where(
              and(eq(members.tenantId, tenantId), eq(members.memberNumber, variant))
            );
            if (member) break;
          }
        }
      }
    }
    
    return member || undefined;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    // Invalidate cache
    cache.deletePattern(`members:tenant:${member.tenantId}`);
    cache.deletePattern(`dashboard:stats:${member.tenantId}`);
    return newMember;
  }

  async updateMember(id: string, member: Partial<InsertMember>): Promise<Member> {
    const [updatedMember] = await db.update(members).set(member).where(eq(members.id, id)).returning();
    // Invalidate cache
    cache.deletePattern(`members:tenant:${updatedMember.tenantId}`);
    cache.deletePattern(`dashboard:stats:${updatedMember.tenantId}`);
    return updatedMember;
  }

  async deleteMember(id: string): Promise<void> {
    // Get member first to know tenant for cache invalidation
    const [member] = await db.select().from(members).where(eq(members.id, id));
    await db.delete(members).where(eq(members.id, id));
    if (member) {
      cache.deletePattern(`members:tenant:${member.tenantId}`);
      cache.deletePattern(`dashboard:stats:${member.tenantId}`);
    }
  }

  // Member Financial Settings
  async getMemberFinancialSettings(memberId: string): Promise<MemberFinancialSettings | undefined> {
    const [settings] = await db.select().from(memberFinancialSettings).where(eq(memberFinancialSettings.memberId, memberId));
    return settings || undefined;
  }

  async createMemberFinancialSettings(settings: InsertMemberFinancialSettings): Promise<MemberFinancialSettings> {
    const [newSettings] = await db.insert(memberFinancialSettings).values(settings).returning();
    return newSettings;
  }

  async updateMemberFinancialSettings(memberId: string, settings: Partial<InsertMemberFinancialSettings>): Promise<MemberFinancialSettings> {
    const [updatedSettings] = await db.update(memberFinancialSettings).set(settings).where(eq(memberFinancialSettings.memberId, memberId)).returning();
    return updatedSettings;
  }

  // Member Permissions
  async getMemberPermissions(memberId: string): Promise<MemberPermissions | undefined> {
    const [permissions] = await db.select().from(memberPermissions).where(eq(memberPermissions.memberId, memberId));
    return permissions || undefined;
  }

  // Duplicate detection methods

  async getMemberByNameAndAddress(tenantId: string, firstName: string, lastName: string, street: string, number: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(
      and(
        eq(members.tenantId, tenantId),
        eq(members.firstName, firstName),
        eq(members.lastName, lastName),
        eq(members.street, street),
        eq(members.number, number)
      )
    );
    return member || undefined;
  }

  async getNextAvailableMemberNumber(tenantId: string, startFrom?: string): Promise<string> {
    const existingNumbers = await db.select({ memberNumber: members.memberNumber })
      .from(members)
      .where(eq(members.tenantId, tenantId));
    
    const numberSet = new Set(existingNumbers.map(m => m.memberNumber));
    
    // Start from the suggested number or 1
    let baseNumber = startFrom ? parseInt(startFrom) : 1;
    
    // Find next available number
    while (numberSet.has(baseNumber.toString().padStart(4, '0'))) {
      baseNumber++;
    }
    
    return baseNumber.toString().padStart(4, '0');
  }

  async createMemberPermissions(permissions: InsertMemberPermissions): Promise<MemberPermissions> {
    const [newPermissions] = await db.insert(memberPermissions).values(permissions).returning();
    return newPermissions;
  }

  async updateMemberPermissions(memberId: string, permissions: Partial<InsertMemberPermissions>): Promise<MemberPermissions> {
    const [updatedPermissions] = await db.update(memberPermissions).set(permissions).where(eq(memberPermissions.memberId, memberId)).returning();
    return updatedPermissions;
  }

  // Membership Fees
  async getMembershipFee(id: string): Promise<MembershipFee | undefined> {
    const [fee] = await db.select().from(membershipFees).where(eq(membershipFees.id, id));
    return fee || undefined;
  }

  async getMembershipFeesByTenant(tenantId: string): Promise<any[]> {
    return await db.select({
      ...membershipFees,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
    }).from(membershipFees)
      .innerJoin(members, eq(membershipFees.memberId, members.id))
      .where(eq(membershipFees.tenantId, tenantId))
      .orderBy(desc(membershipFees.createdAt))
      .limit(2000); // Limit to prevent large data loads
  }

  async getMembershipFeesByMember(memberId: string): Promise<MembershipFee[]> {
    return await db.select().from(membershipFees)
      .where(eq(membershipFees.memberId, memberId))
      .orderBy(desc(membershipFees.periodStart));
  }

  async createMembershipFee(fee: InsertMembershipFee): Promise<MembershipFee> {
    const [newFee] = await db.insert(membershipFees).values(fee).returning();
    // Invalidate cache
    cache.deletePattern(`dashboard:stats:${fee.tenantId}`);
    return newFee;
  }

  async updateMembershipFee(id: string, fee: Partial<InsertMembershipFee>): Promise<MembershipFee> {
    const [updatedFee] = await db.update(membershipFees).set(fee).where(eq(membershipFees.id, id)).returning();
    // Invalidate cache
    if (updatedFee.tenantId) {
      cache.deletePattern(`dashboard:stats:${updatedFee.tenantId}`);
    }
    return updatedFee;
  }

  async deleteMembershipFee(id: string, tenantId: string): Promise<void> {
    await db.delete(membershipFees).where(and(eq(membershipFees.id, id), eq(membershipFees.tenantId, tenantId)));
    // Invalidate cache
    cache.deletePattern(`dashboard:stats:${tenantId}`);
  }

  // Transactions
  async getTransactionsByTenant(tenantId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.tenantId, tenantId))
      .orderBy(desc(transactions.date))
      .limit(1000); // Limit to prevent large data loads
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Rules
  async getRulesByTenant(tenantId: string): Promise<Rule[]> {
    return await db.select().from(rules)
      .where(eq(rules.tenantId, tenantId))
      .orderBy(desc(rules.createdAt));
  }

  async createRule(rule: InsertRule): Promise<Rule> {
    const [newRule] = await db.insert(rules).values(rule).returning();
    return newRule;
  }

  async updateRule(id: string, rule: Partial<InsertRule>): Promise<Rule> {
    const [updatedRule] = await db.update(rules).set(rule).where(eq(rules.id, id)).returning();
    return updatedRule;
  }

  async deleteRule(id: string): Promise<void> {
    await db.delete(rules).where(eq(rules.id, id));
  }


  // Rule Outcomes
  async getRuleOutcomesByMember(memberId: string): Promise<RuleOutcome[]> {
    return await db.select().from(ruleOutcomes)
      .where(eq(ruleOutcomes.memberId, memberId))
      .orderBy(desc(ruleOutcomes.evaluatedAt));
  }

  async createRuleOutcome(outcome: InsertRuleOutcome): Promise<RuleOutcome> {
    const [newOutcome] = await db.insert(ruleOutcomes).values(outcome).returning();
    return newOutcome;
  }

  // Public Screens
  async getPublicScreensByTenant(tenantId: string): Promise<PublicScreen[]> {
    return await db.select().from(publicScreens)
      .where(eq(publicScreens.tenantId, tenantId))
      .orderBy(desc(publicScreens.createdAt));
  }

  async getPublicScreenByToken(token: string): Promise<PublicScreen | undefined> {
    const [screen] = await db.select().from(publicScreens).where(eq(publicScreens.publicToken, token));
    return screen || undefined;
  }

  async createPublicScreen(screen: InsertPublicScreen): Promise<PublicScreen> {
    const [newScreen] = await db.insert(publicScreens).values(screen).returning();
    return newScreen;
  }

  async updatePublicScreen(id: string, screen: Partial<InsertPublicScreen>): Promise<PublicScreen> {
    const [updatedScreen] = await db.update(publicScreens).set(screen).where(eq(publicScreens.id, id)).returning();
    return updatedScreen;
  }

  async deletePublicScreen(id: string): Promise<void> {
    await db.delete(publicScreens).where(eq(publicScreens.id, id));
  }

  // Announcements
  async getAnnouncementsByTenant(tenantId: string): Promise<Announcement[]> {
    return await db.select().from(announcements)
      .where(eq(announcements.tenantId, tenantId))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  // Card Meta
  async getCardMetaByMember(memberId: string): Promise<CardMeta | undefined> {
    const [card] = await db.select().from(cardMeta).where(eq(cardMeta.memberId, memberId));
    return card || undefined;
  }

  async getCardMetaByQrToken(qrToken: string): Promise<CardMeta | undefined> {
    const [card] = await db.select().from(cardMeta).where(eq(cardMeta.qrToken, qrToken));
    return card || undefined;
  }

  async createCardMeta(cardMetaData: InsertCardMeta): Promise<CardMeta> {
    const [newCard] = await db.insert(cardMeta).values(cardMetaData).returning();
    return newCard;
  }

  async updateCardMeta(id: string, cardMetaData: Partial<InsertCardMeta>): Promise<CardMeta> {
    const [updatedCard] = await db.update(cardMeta).set(cardMetaData).where(eq(cardMeta.id, id)).returning();
    return updatedCard;
  }

  async getMemberWithCardAndTenant(memberId: string): Promise<{ member: Member; cardMeta: CardMeta; tenant: Tenant } | undefined> {
    const result = await db
      .select({
        member: members,
        cardMeta: cardMeta,
        tenant: tenants,
      })
      .from(members)
      .innerJoin(cardMeta, eq(members.id, cardMeta.memberId))
      .innerJoin(tenants, eq(members.tenantId, tenants.id))
      .where(eq(members.id, memberId));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      member: row.member,
      cardMeta: row.cardMeta,
      tenant: row.tenant,
    };
  }

  async getAllCardsWithMembers(tenantId: string): Promise<{ member: Member; cardMeta: CardMeta | null }[]> {
    const result = await db
      .select({
        member: members,
        cardMeta: cardMeta,
      })
      .from(members)
      .leftJoin(cardMeta, eq(members.id, cardMeta.memberId))
      .where(eq(members.tenantId, tenantId))
      .orderBy(desc(members.createdAt));

    return result.map(row => ({
      member: row.member,
      cardMeta: row.cardMeta || null,
    }));
  }

  async getCardStats(tenantId: string): Promise<{ totalActive: number; validPercentage: number; lastUpdated: Date | null }> {
    const cacheKey = `card:stats:${tenantId}`;
    const cached = cache.get<{ totalActive: number; validPercentage: number; lastUpdated: Date | null }>(cacheKey);
    if (cached) return cached;

    const result = await db.execute(sql`
      WITH card_stats AS (
        SELECT 
          COUNT(CASE WHEN cm.status = 'ACTUEEL' THEN 1 END) as active_cards,
          COUNT(cm.id) as total_cards,
          COUNT(m.id) as total_members,
          MAX(cm.last_rendered_at) as last_updated
        FROM ${members} m
        LEFT JOIN ${cardMeta} cm ON m.id = cm.member_id
        WHERE m.tenant_id = ${tenantId}
      )
      SELECT 
        active_cards::int,
        total_cards::int,
        total_members::int,
        last_updated
      FROM card_stats
    `);

    const stats = result.rows[0] as any;
    const cardStats = {
      totalActive: parseInt(stats.active_cards) || 0,
      validPercentage: stats.total_members > 0 ? Math.round((parseInt(stats.total_cards) / parseInt(stats.total_members)) * 100) : 0,
      lastUpdated: stats.last_updated ? new Date(stats.last_updated) : null,
    };

    cache.set(cacheKey, cardStats, 10000); // Cache for 10 seconds
    return cardStats;
  }

  // Notifications
  async getNotificationsByTenant(tenantId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  // SEPA Exports
  async getSepaExportsByTenant(tenantId: string): Promise<SepaExport[]> {
    return await db.select().from(sepaExports)
      .where(eq(sepaExports.tenantId, tenantId))
      .orderBy(desc(sepaExports.createdAt));
  }

  async createSepaExport(sepaExport: InsertSepaExport): Promise<SepaExport> {
    const [newExport] = await db.insert(sepaExports).values(sepaExport).returning();
    return newExport;
  }

  // Dashboard stats - Optimized single query with caching
  async getDashboardStats(tenantId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    totalRevenue: number;
    outstanding: number;
  }> {
    const cacheKey = `dashboard:stats:${tenantId}`;
    const cached = cache.get<{
      totalMembers: number;
      activeMembers: number;
      totalRevenue: number;
      outstanding: number;
    }>(cacheKey);
    if (cached) return cached;

    // Single optimized query using CTEs for better performance
    const result = await db.execute(sql`
      WITH member_stats AS (
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN active = true THEN 1 END) as active_members
        FROM ${members} 
        WHERE tenant_id = ${tenantId}
      ),
      fee_stats AS (
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'OPEN' THEN amount ELSE 0 END), 0) as outstanding
        FROM ${membershipFees} 
        WHERE tenant_id = ${tenantId}
      )
      SELECT 
        m.total_members::int,
        m.active_members::int,
        f.total_revenue::numeric,
        f.outstanding::numeric
      FROM member_stats m, fee_stats f
    `);

    const stats = result.rows[0] as any;
    const dashboardStats = {
      totalMembers: parseInt(stats.total_members) || 0,
      activeMembers: parseInt(stats.active_members) || 0,
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      outstanding: parseFloat(stats.outstanding) || 0,
    };

    cache.set(cacheKey, dashboardStats, 10000); // Cache for 10 seconds
    return dashboardStats;
  }

  // Email Templates
  async getEmailTemplatesByTenant(tenantId: string): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates)
      .where(eq(emailTemplates.tenantId, tenantId))
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(tenantId: string, id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates)
      .where(and(eq(emailTemplates.tenantId, tenantId), eq(emailTemplates.id, id)));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(tenantId: string, id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updatedTemplate] = await db.update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(and(eq(emailTemplates.tenantId, tenantId), eq(emailTemplates.id, id)))
      .returning();
    return updatedTemplate;
  }

  async deleteEmailTemplate(tenantId: string, id: string): Promise<void> {
    await db.delete(emailTemplates)
      .where(and(eq(emailTemplates.tenantId, tenantId), eq(emailTemplates.id, id)));
  }

  // Email Segments
  async getEmailSegmentsByTenant(tenantId: string): Promise<EmailSegment[]> {
    return await db.select().from(emailSegments)
      .where(eq(emailSegments.tenantId, tenantId))
      .orderBy(desc(emailSegments.createdAt));
  }

  async getEmailSegment(tenantId: string, id: string): Promise<EmailSegment | undefined> {
    const [segment] = await db.select().from(emailSegments)
      .where(and(eq(emailSegments.tenantId, tenantId), eq(emailSegments.id, id)));
    return segment || undefined;
  }

  async createEmailSegment(segment: InsertEmailSegment): Promise<EmailSegment> {
    const [newSegment] = await db.insert(emailSegments).values(segment).returning();
    return newSegment;
  }

  async updateEmailSegment(tenantId: string, id: string, segment: Partial<InsertEmailSegment>): Promise<EmailSegment> {
    const [updatedSegment] = await db.update(emailSegments)
      .set(segment)
      .where(and(eq(emailSegments.tenantId, tenantId), eq(emailSegments.id, id)))
      .returning();
    return updatedSegment;
  }

  async deleteEmailSegment(tenantId: string, id: string): Promise<void> {
    await db.delete(emailSegments)
      .where(and(eq(emailSegments.tenantId, tenantId), eq(emailSegments.id, id)));
  }

  // Email Campaigns
  async getEmailCampaignsByTenant(tenantId: string): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.tenantId, tenantId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(tenantId: string, id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns)
      .where(and(eq(emailCampaigns.tenantId, tenantId), eq(emailCampaigns.id, id)));
    return campaign || undefined;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db.insert(emailCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateEmailCampaign(tenantId: string, id: string, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    const [updatedCampaign] = await db.update(emailCampaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(and(eq(emailCampaigns.tenantId, tenantId), eq(emailCampaigns.id, id)))
      .returning();
    return updatedCampaign;
  }

  async deleteEmailCampaign(tenantId: string, id: string): Promise<void> {
    await db.delete(emailCampaigns)
      .where(and(eq(emailCampaigns.tenantId, tenantId), eq(emailCampaigns.id, id)));
  }

  // Email Messages
  async getEmailMessagesByTenant(tenantId: string): Promise<EmailMessage[]> {
    return await db.select().from(emailMessages)
      .where(eq(emailMessages.tenantId, tenantId))
      .orderBy(desc(emailMessages.createdAt));
  }

  async getEmailMessagesByCampaign(tenantId: string, campaignId: string): Promise<EmailMessage[]> {
    return await db.select().from(emailMessages)
      .where(and(eq(emailMessages.tenantId, tenantId), eq(emailMessages.campaignId, campaignId)))
      .orderBy(desc(emailMessages.createdAt));
  }

  async createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage> {
    const [newMessage] = await db.insert(emailMessages).values(message).returning();
    return newMessage;
  }

  async updateEmailMessage(id: string, message: Partial<InsertEmailMessage>): Promise<EmailMessage> {
    const [updatedMessage] = await db.update(emailMessages)
      .set(message)
      .where(eq(emailMessages.id, id))
      .returning();
    return updatedMessage;
  }

  // Email Suppresses
  async getEmailSuppressesByTenant(tenantId: string): Promise<EmailSuppress[]> {
    return await db.select().from(emailSuppresses)
      .where(eq(emailSuppresses.tenantId, tenantId))
      .orderBy(desc(emailSuppresses.createdAt));
  }

  async createEmailSuppress(suppress: InsertEmailSuppress): Promise<EmailSuppress> {
    const [newSuppress] = await db.insert(emailSuppresses).values(suppress).returning();
    return newSuppress;
  }

  async deleteEmailSuppress(tenantId: string, id: string): Promise<void> {
    await db.delete(emailSuppresses)
      .where(and(eq(emailSuppresses.tenantId, tenantId), eq(emailSuppresses.id, id)));
  }
}

export const storage = new DatabaseStorage();
