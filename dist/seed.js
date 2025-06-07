"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const auth_1 = require("./lib/auth");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🌱 Starting database seed...");
        // Create companies
        const company1 = yield prisma.company.create({
            data: {
                name: "Koppa Security Solutions",
                description: "Leading security company in Ethiopia",
            },
        });
        const company2 = yield prisma.company.create({
            data: {
                name: "Hibert Bank",
                description: "Comprehensive security services",
            },
        });
        // Create super admin
        const superAdmin = yield prisma.user.create({
            data: {
                email: "superadmin@koppa.com",
                name: "Super Administrator",
                password: yield (0, auth_1.hashPassword)("password123"),
                role: "SUPER_ADMIN",
            },
        });
        // Create office managers
        const officeManager1 = yield prisma.user.create({
            data: {
                email: "office@koppa.com",
                name: "Office Manager",
                password: yield (0, auth_1.hashPassword)("password123"),
                role: "OFFICE_MANAGER",
                companyId: company1.id,
            },
        });
        const officeManager2 = yield prisma.user.create({
            data: {
                email: "office2@koppa.com",
                name: "Office Manager 2",
                password: yield (0, auth_1.hashPassword)("password123"),
                role: "OFFICE_MANAGER",
                companyId: company2.id,
            },
        });
        // Create police managers
        const policeManager1 = yield prisma.user.create({
            data: {
                email: "police@koppa.com",
                name: "Police Manager",
                password: yield (0, auth_1.hashPassword)("password123"),
                role: "POLICE_MANAGER",
            },
        });
        const policeManager2 = yield prisma.user.create({
            data: {
                email: "police2@koppa.com",
                name: "Police Manager 2",
                password: yield (0, auth_1.hashPassword)("password123"),
                role: "POLICE_MANAGER",
            },
        });
        // Create branches
        const branch1 = yield prisma.branch.create({
            data: {
                name: "Main Office",
                locationType: "Office Building",
                city: "Addis Ababa",
                subCity: "Bole",
                woreda: "Woreda 03",
                country: "Ethiopia",
                managerName: "Abebe Tesfaye",
                phoneNumber: "+251911123456",
                description: "Main headquarters office",
                companyId: company1.id,
                createdById: officeManager1.id,
            },
        });
        const branch2 = yield prisma.branch.create({
            data: {
                name: "North AA Branch",
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
        });
        // Create operators
        const operator1 = yield prisma.user.create({
            data: {
                email: "operator1@koppa.com",
                name: "Ayele Tesfaye",
                password: yield (0, auth_1.hashPassword)("password123"),
                role: "OPERATOR",
                operatorType: "OFFICE",
                companyId: company1.id,
                managedById: officeManager1.id,
            },
        });
        const operator2 = yield prisma.user.create({
            data: {
                email: "operator2@koppa.com",
                name: "Kebede Tesfaye",
                password: yield (0, auth_1.hashPassword)("password123"),
                role: "OPERATOR",
                operatorType: "POLICE",
                managedById: policeManager1.id,
            },
        });
        // Assign operators to branches
        yield prisma.branchOperator.createMany({
            data: [
                { branchId: branch1.id, userId: operator1.id },
                { branchId: branch2.id, userId: operator1.id },
            ],
        });
        // Create sample alarms
        const alarm1 = yield prisma.alarm.create({
            data: {
                type: "Motion Detection",
                location: "Main Entrance",
                severity: "HIGH",
                description: "Unauthorized motion detected at main entrance after hours",
                branchId: branch1.id,
                createdById: operator1.id,
            },
        });
        const alarm2 = yield prisma.alarm.create({
            data: {
                type: "Door Breach",
                location: "Server Room",
                severity: "CRITICAL",
                description: "Server room door opened without authorization",
                status: "ACKNOWLEDGED",
                branchId: branch2.id,
                createdById: officeManager1.id,
            },
        });
        // Create alarm reports
        yield prisma.alarmReport.create({
            data: {
                alarmId: alarm1.id,
                assignedToId: policeManager1.id,
                status: "PENDING",
            },
        });
        yield prisma.alarmReport.create({
            data: {
                alarmId: alarm2.id,
                assignedToId: policeManager1.id,
                status: "ACKNOWLEDGED",
                acknowledgedAt: new Date(),
            },
        });
        console.log("✅ Database seeded successfully!");
        console.log("\n📧 Login credentials:");
        console.log("Super Admin: superadmin@koppa.com / password123");
        console.log("Office Manager: office@koppa.com / password123");
        console.log("Police Manager: police@koppa.com / password123");
        console.log("Operator: operator1@koppa.com / password123");
    });
}
main()
    .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
