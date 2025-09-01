import { db } from "./db";
import { tenants, users } from "@shared/schema";
import { authService } from "./services/auth";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create demo tenant (mosque)
    const [existingTenant] = await db.select().from(tenants).where(eq(tenants.slug, "demo-moskee"));
    
    let tenantId: string;
    if (existingTenant) {
      tenantId = existingTenant.id;
      console.log("✅ Demo tenant already exists");
    } else {
      const [newTenant] = await db.insert(tenants).values({
        name: "Demo Moskee",
        slug: "demo-moskee",
        primaryColor: "#2563EB"
      }).returning();
      tenantId = newTenant.id;
      console.log("✅ Created demo tenant");
    }

    // 2. Create demo users for each role
    const demoUsers = [
      {
        email: "superadmin@demo.nl",
        password: "demo123",
        name: "Super Administrator",
        role: "SUPERADMIN" as const,
        description: "Volledige toegang tot alle organisaties en systeem instellingen"
      },
      {
        email: "beheerder@demo.nl", 
        password: "demo123",
        name: "Ahmed Al-Beheerder",
        role: "BEHEERDER" as const,
        description: "Beheerder van Demo Moskee met volledige toegang tot organisatie"
      },
      {
        email: "medewerker@demo.nl",
        password: "demo123", 
        name: "Fatima Medewerker",
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
    console.log("│ SUPERADMIN      │ superadmin@demo.nl  │ demo123     │ Volledige toegang tot alle organisaties      │");
    console.log("│ BEHEERDER       │ beheerder@demo.nl   │ demo123     │ Beheerder van Demo Moskee                    │");
    console.log("│ MEDEWERKER      │ medewerker@demo.nl  │ demo123     │ Medewerker met beperkte toegang              │");
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