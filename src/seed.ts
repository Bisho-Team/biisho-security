import { PrismaClient } from "@prisma/client"
import { hashPassword } from "./lib/auth"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create companies
  const company1 = await prisma.company.create({
    data: {
      name: "Koppa Security Solutions",
      description: "Leading security company in Ethiopia",
    },
  })

  const company2 = await prisma.company.create({
    data: {
      name: "SafeGuard Ethiopia",
      description: "Comprehensive security services",
    },
  })

  // Create super admin
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@koppa.com",
      name: "Super Administrator",
      password: await hashPassword("password123"),
      role: "SUPER_ADMIN",
    },
  })

  // Create office managers
  const officeManager1 = await prisma.user.create({
    data: {
      email: "office@koppa.com",
      name: "Office Manager",
      password: await hashPassword("password123"),
      role: "OFFICE_MANAGER",
      companyId: company1.id,
    },
  })

  const officeManager2 = await prisma.user.create({
    data: {
      email: "office2@koppa.com",
      name: "Office Manager 2",
      password: await hashPassword("password123"),
      role: "OFFICE_MANAGER",
      companyId: company2.id,
    },
  })

  // Create police managers
  const policeManager1 = await prisma.user.create({
    data: {
      email: "police@koppa.com",
      name: "Police Manager",
      password: await hashPassword("password123"),
      role: "POLICE_MANAGER",
    },
  })

  const policeManager2 = await prisma.user.create({
    data: {
      email: "police2@koppa.com",
      name: "Police Manager 2",
      password: await hashPassword("password123"),
      role: "POLICE_MANAGER",
    },
  })

  // Create branches
  const branch1 = await prisma.branch.create({
    data: {
      name: "Main Office",
      locationType: "Office Building",
      city: "Addis Ababa",
      subCity: "Bole",
      woreda: "Woreda 03",
      country: "Ethiopia",
      managerName: "John Doe",
      phoneNumber: "+251911123456",
      description: "Main headquarters office",
      companyId: company1.id,
      createdById: officeManager1.id,
    },
  })

  const branch2 = await prisma.branch.create({
    data: {
      name: "North Branch",
      locationType: "Retail Store",
      city: "Addis Ababa",
      subCity: "Yeka",
      woreda: "Woreda 05",
      country: "Ethiopia",
      managerName: "Jane Smith",
      phoneNumber: "+251911123457",
      description: "North district branch",
      companyId: company1.id,
      createdById: officeManager1.id,
    },
  })

  // Create operators
  const operator1 = await prisma.user.create({
    data: {
      email: "operator1@koppa.com",
      name: "Security Operator 1",
      password: await hashPassword("password123"),
      role: "OPERATOR",
      operatorType: "OFFICE",
      companyId: company1.id,
      managedById: officeManager1.id,
    },
  })

  const operator2 = await prisma.user.create({
    data: {
      email: "operator2@koppa.com",
      name: "Police Operator 1",
      password: await hashPassword("password123"),
      role: "OPERATOR",
      operatorType: "POLICE",
      managedById: policeManager1.id,
    },
  })

  // Assign operators to branches
  await prisma.branchOperator.createMany({
    data: [
      { branchId: branch1.id, userId: operator1.id },
      { branchId: branch2.id, userId: operator1.id },
    ],
  })

  // Create sample alarms
  const alarm1 = await prisma.alarm.create({
    data: {
      type: "Motion Detection",
      location: "Main Entrance",
      severity: "HIGH",
      description: "Unauthorized motion detected at main entrance after hours",
      branchId: branch1.id,
      createdById: operator1.id,
    },
  })

  const alarm2 = await prisma.alarm.create({
    data: {
      type: "Door Breach",
      location: "Server Room",
      severity: "CRITICAL",
      description: "Server room door opened without authorization",
      status: "ACKNOWLEDGED",
      branchId: branch2.id,
      createdById: officeManager1.id,
    },
  })

  // Create alarm reports
  await prisma.alarmReport.create({
    data: {
      alarmId: alarm1.id,
      assignedToId: policeManager1.id,
      status: "PENDING",
    },
  })

  await prisma.alarmReport.create({
    data: {
      alarmId: alarm2.id,
      assignedToId: policeManager1.id,
      status: "ACKNOWLEDGED",
      acknowledgedAt: new Date(),
    },
  })

  console.log("✅ Database seeded successfully!")
  console.log("\n📧 Login credentials:")
  console.log("Super Admin: superadmin@koppa.com / password123")
  console.log("Office Manager: office@koppa.com / password123")
  console.log("Police Manager: police@koppa.com / password123")
  console.log("Operator: operator1@koppa.com / password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
