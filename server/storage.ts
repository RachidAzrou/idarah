import { 
  tenants, 
  users, 
  members, 
  memberFinancialSettings,
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
  type Tenant,
  type User,
  type Member,
  type MembershipFee,
  type Transaction,
  type Rule,
  type RuleOutcome,
  type PublicScreen,
  type Announcement,
  type CardMeta,
  type Notification,
  type SepaExport,
  type InsertTenant,
  type InsertUser,
  type InsertMember,
  type InsertMembershipFee,
  type InsertTransaction,
  type InsertRule,
  type InsertRuleOutcome,
  type InsertPublicScreen,
  type InsertAnnouncement,
  type InsertCardMeta,
  type InsertNotification,
  type InsertSepaExport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Members
  getMember(id: string): Promise<Member | undefined>;
  getMembersByTenant(tenantId: string): Promise<Member[]>;
  getMemberByNumber(memberNumber: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member>;

  // Membership Fees
  getMembershipFee(id: string): Promise<MembershipFee | undefined>;
  getMembershipFeesByTenant(tenantId: string): Promise<MembershipFee[]>;
  getMembershipFeesByMember(memberId: string): Promise<MembershipFee[]>;
  createMembershipFee(fee: InsertMembershipFee): Promise<MembershipFee>;
  updateMembershipFee(id: string, fee: Partial<InsertMembershipFee>): Promise<MembershipFee>;

  // Transactions
  getTransactionsByTenant(tenantId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Dashboard
  getDashboardStats(tenantId: string): Promise<any>;

  // Rules
  getRulesByTenant(tenantId: string): Promise<Rule[]>;
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: string, rule: Partial<InsertRule>): Promise<Rule>;

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
  createCardMeta(cardMeta: InsertCardMeta): Promise<CardMeta>;
  updateCardMeta(id: string, cardMeta: Partial<InsertCardMeta>): Promise<CardMeta>;

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
}

export class DatabaseStorage implements IStorage {
  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
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

  // Members
  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMembersByTenant(tenantId: string): Promise<Member[]> {
    return await db.select().from(members)
      .where(eq(members.tenantId, tenantId))
      .orderBy(desc(members.createdAt));
  }

  async getMemberByNumber(memberNumber: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.memberNumber, memberNumber));
    return member || undefined;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async updateMember(id: string, member: Partial<InsertMember>): Promise<Member> {
    const [updatedMember] = await db.update(members).set(member).where(eq(members.id, id)).returning();
    return updatedMember;
  }

  // Membership Fees
  async getMembershipFee(id: string): Promise<MembershipFee | undefined> {
    const [fee] = await db.select().from(membershipFees).where(eq(membershipFees.id, id));
    return fee || undefined;
  }

  async getMembershipFeesByTenant(tenantId: string): Promise<MembershipFee[]> {
    return await db.select().from(membershipFees)
      .where(eq(membershipFees.tenantId, tenantId))
      .orderBy(desc(membershipFees.createdAt));
  }

  async getMembershipFeesByMember(memberId: string): Promise<MembershipFee[]> {
    return await db.select().from(membershipFees)
      .where(eq(membershipFees.memberId, memberId))
      .orderBy(desc(membershipFees.periodStart));
  }

  async createMembershipFee(fee: InsertMembershipFee): Promise<MembershipFee> {
    const [newFee] = await db.insert(membershipFees).values(fee).returning();
    return newFee;
  }

  async updateMembershipFee(id: string, fee: Partial<InsertMembershipFee>): Promise<MembershipFee> {
    const [updatedFee] = await db.update(membershipFees).set(fee).where(eq(membershipFees.id, id)).returning();
    return updatedFee;
  }

  // Transactions
  async getTransactionsByTenant(tenantId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.tenantId, tenantId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
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

  // Dashboard Stats
  async getDashboardStats(tenantId: string) {
    const totalMembers = await db.select({ count: sql<number>`count(*)` }).from(members).where(eq(members.tenantId, tenantId));
    const activeMembers = await db.select({ count: sql<number>`count(*)` }).from(members).where(and(eq(members.tenantId, tenantId), eq(members.status, 'ACTIVE')));
    const openFees = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(membershipFees).where(and(eq(membershipFees.tenantId, tenantId), eq(membershipFees.status, 'OPEN')));
    const thisMonthIncome = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(transactions).where(and(eq(transactions.tenantId, tenantId), eq(transactions.type, 'INCOME'), sql`date >= date_trunc('month', current_date)`));
    
    return {
      totalMembers: totalMembers[0]?.count || 0,
      activeMembers: activeMembers[0]?.count || 0,
      openPayments: openFees[0]?.total || 0,
      monthlyIncome: thisMonthIncome[0]?.total || 0
    };
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

  async createCardMeta(cardMetaData: InsertCardMeta): Promise<CardMeta> {
    const [newCard] = await db.insert(cardMeta).values(cardMetaData).returning();
    return newCard;
  }

  async updateCardMeta(id: string, cardMetaData: Partial<InsertCardMeta>): Promise<CardMeta> {
    const [updatedCard] = await db.update(cardMeta).set(cardMetaData).where(eq(cardMeta.id, id)).returning();
    return updatedCard;
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

  // Dashboard stats
  async getDashboardStats(tenantId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    totalRevenue: number;
    outstanding: number;
  }> {
    const [totalMembersResult] = await db.select({ count: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.tenantId, tenantId));

    const [activeMembersResult] = await db.select({ count: sql<number>`count(*)` })
      .from(members)
      .where(and(eq(members.tenantId, tenantId), eq(members.isActive, true)));

    const [totalRevenueResult] = await db.select({ sum: sql<number>`coalesce(sum(amount), 0)` })
      .from(membershipFees)
      .where(and(eq(membershipFees.tenantId, tenantId), eq(membershipFees.status, 'PAID')));

    const [outstandingResult] = await db.select({ sum: sql<number>`coalesce(sum(amount), 0)` })
      .from(membershipFees)
      .where(and(eq(membershipFees.tenantId, tenantId), eq(membershipFees.status, 'OPEN')));

    return {
      totalMembers: totalMembersResult.count,
      activeMembers: activeMembersResult.count,
      totalRevenue: totalRevenueResult.sum,
      outstanding: outstandingResult.sum,
    };
  }
}

export const storage = new DatabaseStorage();
