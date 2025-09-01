import { db } from "./db";
import { tenants, users } from "@shared/schema";
import { authService } from "./services/auth";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create demo tenant (mosque)
    const [existingTenant] = await db.select().from(tenants).where(eq(tenants.slug, "al-nour-brussel"));
    
    let tenantId: string;
    if (existingTenant) {
      tenantId = existingTenant.id;
      console.log("✅ Demo tenant already exists");
    } else {
      const [newTenant] = await db.insert(tenants).values({
        name: "Moskee Al-Nour Brussel",
        slug: "al-nour-brussel",
        primaryColor: "#2563EB"
      }).returning();
      tenantId = newTenant.id;
      console.log("✅ Created demo tenant");
    }

    // 2. Create demo users for each role
    const demoUsers = [
      {
        email: "superadmin@moskee.be",
        password: "demo123",
        name: "Super Administrator",
        role: "SUPERADMIN" as const,
        description: "Volledige toegang tot alle organisaties en systeem instellingen"
      },
      {
        email: "beheerder@moskee.be", 
        password: "demo123",
        name: "Ahmed El-Hassani",
        role: "BEHEERDER" as const,
        description: "Beheerder van Demo Moskee Brussel met volledige toegang tot organisatie"
      },
      {
        email: "medewerker@moskee.be",
        password: "demo123", 
        name: "Fatima Bouchouchi",
        role: "MEDEWERKER" as const,
        description: "Medewerker met beperkte toegang tot leden en basis functies"
      }
    ];

    for (const userData of demoUsers) {
      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
      
      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists`);
        continue;
      }

      // Create new user
      const hashedPassword = await authService.hashPassword(userData.password);
      
      await db.insert(users).values({
        tenantId,
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
        active: true
      });

      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Demo Accounts:");
    console.log("┌─────────────────┬─────────────────────┬─────────────┬──────────────────────────────────────────────┐");
    console.log("│ Rol             │ Email               │ Wachtwoord  │ Beschrijving                                 │");
    console.log("├─────────────────┼─────────────────────┼─────────────┼──────────────────────────────────────────────┤");
    console.log("│ SUPERADMIN      │ superadmin@moskee.be │ demo123     │ Volledige toegang tot alle organisaties      │");
    console.log("│ BEHEERDER       │ beheerder@moskee.be │ demo123     │ Beheerder van Al-Nour Brussel                │");
    console.log("│ MEDEWERKER      │ medewerker@moskee.be │ demo123     │ Medewerker met beperkte toegang              │");
    console.log("└─────────────────┴─────────────────────┴─────────────┴──────────────────────────────────────────────┘");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}

export { seedDatabase };