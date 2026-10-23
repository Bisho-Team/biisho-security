import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Every account below shares this password. Override with SEED_PASSWORD.
const SEED_PASSWORD = process.env.SEED_PASSWORD || "Test@1234";

// Safe to run on every startup: records are matched by email / name and
// existing ones are left untouched.
async function findOrCreateCompany(data: Prisma.CompanyCreateInput) {
	const existing = await prisma.company.findFirst({
		where: { name: data.name },
	});
	return existing ?? prisma.company.create({ data });
}

async function upsertUser(data: Prisma.UserUncheckedCreateInput) {
	return prisma.user.upsert({
		where: { email: data.email },
		update: {},
		create: data,
	});
}

async function main() {
	console.log("🌱 Seeding database...");
	const password = await bcrypt.hash(SEED_PASSWORD, 12);

	// Companies
	const officeCompany = await findOrCreateCompany({
		name: "Biisho Smart Security",
		description: "Smart security and alarm monitoring",
		type: "Other",
		industry: "Security",
		city: "Addis Ababa",
		email: "info@biishoplc.com",
	});

	const policeCompany = await findOrCreateCompany({
		name: "AAPC",
		description: "Addis Ababa Police Commission",
		type: "Government",
		industry: "Law Enforcement",
		city: "Addis Ababa",
	});

	// Users, one per role
	await upsertUser({
		email: "superadmin.test@biisho.local",
		name: "Test Super Admin",
		password,
		role: "SUPER_ADMIN",
	});

	const officeManager = await upsertUser({
		email: "office.test@biisho.local",
		name: "Test Office Manager",
		password,
		role: "OFFICE_MANAGER",
		companyId: officeCompany.id,
	});

	const policeManager = await upsertUser({
		email: "police.test@biisho.local",
		name: "Test Police Manager",
		password,
		role: "POLICE_MANAGER",
		companyId: policeCompany.id,
	});

	const officeOperator = await upsertUser({
		email: "office.operator.test@biisho.local",
		name: "Test Office Operator",
		password,
		role: "OPERATOR",
		operatorType: "OFFICE",
		companyId: officeCompany.id,
		managedById: officeManager.id,
	});

	const policeOperator = await upsertUser({
		email: "police.operator.test@biisho.local",
		name: "Test Police Operator",
		password,
		role: "OPERATOR",
		operatorType: "POLICE",
		companyId: policeCompany.id,
		managedById: policeManager.id,
	});

	// Operators are linked to their company through CompanyOperator
	for (const operator of [officeOperator, policeOperator]) {
		if (!operator.companyId) continue;
		await prisma.companyOperator.upsert({
			where: {
				companyId_operatorId: {
					companyId: operator.companyId,
					operatorId: operator.id,
				},
			},
			update: {},
			create: { companyId: operator.companyId, operatorId: operator.id },
		});
	}

	// A sample branch for the office company
	const branchName = "Seed Main Office";
	const branch = await prisma.branch.findFirst({
		where: { name: branchName, companyId: officeCompany.id },
	});
	if (!branch) {
		await prisma.branch.create({
			data: {
				name: branchName,
				locationType: "Office Building",
				city: "Addis Ababa",
				subCity: "Bole",
				woreda: "03",
				managerName: "Seed Branch Manager",
				phoneNumber: "+251911000000",
				latitude: "8.9806",
				longitude: "38.7578",
				companyName: officeCompany.name,
				logo: officeCompany.logo,
				companyId: officeCompany.id,
				createdById: officeManager.id,
			},
		});
	}

	console.log(
		"✅ Seed complete. Accounts (password: SEED_PASSWORD, default Test@1234):",
	);
	console.log(
		"   superadmin.test@biisho.local, office.test@biisho.local, police.test@biisho.local,",
	);
	console.log(
		"   office.operator.test@biisho.local, police.operator.test@biisho.local",
	);
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
