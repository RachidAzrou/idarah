import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  decimal, 
  integer, 
  json,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['SUPERADMIN', 'BEHEERDER', 'MEDEWERKER']);
export const genderEnum = pgEnum('gender', ['M', 'V']);
export const memberCategoryEnum = pgEnum('member_category', ['STUDENT', 'STANDAARD', 'SENIOR']);
export const paymentTermEnum = pgEnum('payment_term', ['MONTHLY', 'YEARLY']);
export const paymentMethodEnum = pgEnum('payment_method', ['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']);
export const feeStatusEnum = pgEnum('fee_status', ['OPEN', 'PAID', 'OVERDUE']);
export const screenTypeEnum = pgEnum('screen_type', ['LEDENLIJST', 'MEDEDELINGEN', 'MULTIMEDIA']);
export const cardStatusEnum = pgEnum('card_status', ['ACTUEEL', 'MOMENTOPNAME', 'VERLOPEN']);
export const ruleScopeEnum = pgEnum('rule_scope', ['STEMRECHT', 'VERKIESBAAR']);
export const companyTypeEnum = pgEnum('company_type', ['VZW', 'BVBA', 'NV', 'VOF', 'EENMANSZAAK', 'CVBA', 'SE', 'ANDERE']);

// Tables
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  street: text("street"),
  number: text("number"),
  postalCode: text("postal_code"),
  city: text("city"),
  country: text("country").default('België'),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  companyNumber: text("company_number"),
  companyType: companyTypeEnum("company_type"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  memberNumber: text("member_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: genderEnum("gender").notNull(),
  birthDate: timestamp("birth_date"),
  category: memberCategoryEnum("category").notNull(),
  email: text("email"),
  phone: text("phone"),
  street: text("street"),
  number: text("number"),
  postalCode: text("postal_code"),
  city: text("city"),
  country: text("country"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberFinancialSettings = pgTable("member_financial_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().unique(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentTerm: paymentTermEnum("payment_term").notNull(),
  iban: text("iban"),
});

export const mandates = pgTable("mandates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  memberId: varchar("member_id").notNull(),
  mandateRef: text("mandate_ref").notNull().unique(),
  signedAt: timestamp("signed_at").notNull(),
  status: text("status").notNull(), // ACTIVE, REVOKED, PENDING
});

export const membershipFees = pgTable("membership_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  memberId: varchar("member_id").notNull(),
  memberNumber: text("member_number").notNull(),
  memberName: text("member_name").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: feeStatusEnum("status").default('OPEN').notNull(),
  method: paymentMethodEnum("method"),
  sepaEligible: boolean("sepa_eligible").default(false).notNull(),
  paidAt: timestamp("paid_at"),
  sepaBatchId: varchar("sepa_batch_id"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on tenant, member, and period
  uniquePeriod: sql`UNIQUE (${table.tenantId}, ${table.memberId}, ${table.periodStart}, ${table.periodEnd})`,
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  memberId: varchar("member_id"),
  type: text("type").notNull(), // INCOME / EXPENSE
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  method: paymentMethodEnum("method"),
  description: text("description"),
  relatedFeeId: varchar("related_fee_id"),
});

export const rules = pgTable("rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  scope: ruleScopeEnum("scope").notNull(),
  parameters: json("parameters").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ruleOutcomes = pgTable("rule_outcomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  ruleId: varchar("rule_id").notNull(),
  memberId: varchar("member_id").notNull(),
  eligible: boolean("eligible").notNull(),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
});

export const publicScreens = pgTable("public_screens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  type: screenTypeEnum("type").notNull(),
  active: boolean("active").default(true).notNull(),
  config: json("config").notNull(),
  publicToken: text("public_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  title: text("title").notNull(),
  richText: text("rich_text"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  active: boolean("active").default(true).notNull(),
  screenId: varchar("screen_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cardMeta = pgTable("card_meta", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  memberId: varchar("member_id").notNull().unique(),
  version: integer("version").default(1).notNull(),
  etag: text("etag").notNull(),
  secureToken: text("secure_token").notNull().unique(),
  qrToken: text("qr_token").notNull().unique(),
  status: cardStatusEnum("status").default('ACTUEEL').notNull(),
  validUntil: timestamp("valid_until"),
  lastRenderedAt: timestamp("last_rendered_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  type: text("type").notNull(), // finance/system/member
  title: text("title").notNull(),
  body: text("body"),
  isRead: boolean("is_read").default(false).notNull(),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sepaExports = pgTable("sepa_exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  batchRef: text("batch_ref").notNull().unique(),
  xml: text("xml").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  numTx: integer("num_tx").notNull(),
  status: text("status").notNull(), // GENERATED / SUBMITTED
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  members: many(members),
  rules: many(rules),
  screens: many(publicScreens),
  announcements: many(announcements),
  fees: many(membershipFees),
  mandates: many(mandates),
  transactions: many(transactions),
  notifications: many(notifications),
  sepaBatches: many(sepaExports),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [members.tenantId],
    references: [tenants.id],
  }),
  finSettings: one(memberFinancialSettings),
  card: one(cardMeta),
  fees: many(membershipFees),
  mandates: many(mandates),
  transactions: many(transactions),
  ruleOutcomes: many(ruleOutcomes),
}));

export const memberFinancialSettingsRelations = relations(memberFinancialSettings, ({ one }) => ({
  member: one(members, {
    fields: [memberFinancialSettings.memberId],
    references: [members.id],
  }),
}));

export const mandatesRelations = relations(mandates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mandates.tenantId],
    references: [tenants.id],
  }),
  member: one(members, {
    fields: [mandates.memberId],
    references: [members.id],
  }),
}));

export const membershipFeesRelations = relations(membershipFees, ({ one }) => ({
  tenant: one(tenants, {
    fields: [membershipFees.tenantId],
    references: [tenants.id],
  }),
  member: one(members, {
    fields: [membershipFees.memberId],
    references: [members.id],
  }),
  sepaBatch: one(sepaExports, {
    fields: [membershipFees.sepaBatchId],
    references: [sepaExports.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [transactions.tenantId],
    references: [tenants.id],
  }),
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
}));

export const rulesRelations = relations(rules, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rules.tenantId],
    references: [tenants.id],
  }),
  outcomes: many(ruleOutcomes),
}));

export const ruleOutcomesRelations = relations(ruleOutcomes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ruleOutcomes.tenantId],
    references: [tenants.id],
  }),
  rule: one(rules, {
    fields: [ruleOutcomes.ruleId],
    references: [rules.id],
  }),
  member: one(members, {
    fields: [ruleOutcomes.memberId],
    references: [members.id],
  }),
}));

export const publicScreensRelations = relations(publicScreens, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [publicScreens.tenantId],
    references: [tenants.id],
  }),
  announcements: many(announcements),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [announcements.tenantId],
    references: [tenants.id],
  }),
  screen: one(publicScreens, {
    fields: [announcements.screenId],
    references: [publicScreens.id],
  }),
}));

export const cardMetaRelations = relations(cardMeta, ({ one }) => ({
  tenant: one(tenants, {
    fields: [cardMeta.tenantId],
    references: [tenants.id],
  }),
  member: one(members, {
    fields: [cardMeta.memberId],
    references: [members.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const sepaExportsRelations = relations(sepaExports, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sepaExports.tenantId],
    references: [tenants.id],
  }),
  fees: many(membershipFees),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
});

export const insertMemberFinancialSettingsSchema = createInsertSchema(memberFinancialSettings).omit({
  id: true,
});

export const insertMandateSchema = createInsertSchema(mandates).omit({
  id: true,
});

export const insertMembershipFeeSchema = createInsertSchema(membershipFees).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export const insertRuleSchema = createInsertSchema(rules).omit({
  id: true,
  createdAt: true,
});

export const insertRuleOutcomeSchema = createInsertSchema(ruleOutcomes).omit({
  id: true,
  evaluatedAt: true,
});

export const insertPublicScreenSchema = createInsertSchema(publicScreens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertCardMetaSchema = createInsertSchema(cardMeta).omit({
  id: true,
  lastRenderedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSepaExportSchema = createInsertSchema(sepaExports).omit({
  id: true,
  createdAt: true,
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

export type MemberFinancialSettings = typeof memberFinancialSettings.$inferSelect;
export type InsertMemberFinancialSettings = z.infer<typeof insertMemberFinancialSettingsSchema>;

export type Mandate = typeof mandates.$inferSelect;
export type InsertMandate = z.infer<typeof insertMandateSchema>;

export type MembershipFee = typeof membershipFees.$inferSelect;
export type InsertMembershipFee = z.infer<typeof insertMembershipFeeSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Rule = typeof rules.$inferSelect;
export type InsertRule = z.infer<typeof insertRuleSchema>;

export type RuleOutcome = typeof ruleOutcomes.$inferSelect;
export type InsertRuleOutcome = z.infer<typeof insertRuleOutcomeSchema>;

export type PublicScreen = typeof publicScreens.$inferSelect;
export type InsertPublicScreen = z.infer<typeof insertPublicScreenSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type CardMeta = typeof cardMeta.$inferSelect;
export type InsertCardMeta = z.infer<typeof insertCardMetaSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type SepaExport = typeof sepaExports.$inferSelect;
export type InsertSepaExport = z.infer<typeof insertSepaExportSchema>;
