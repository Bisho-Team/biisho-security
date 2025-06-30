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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const auth_1 = require("../lib/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(["OFFICE_MANAGER", "POLICE_MANAGER"]),
    companyId: zod_1.z.string().optional(),
    comapany: zod_1.z.string().optional(),
});
// Login
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = yield prisma.user.findUnique({
            where: { email },
            include: {
                company: true,
                managedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        // || !(await comparePassword(password, user.password))
        if (!user || !(yield (0, auth_1.comparePassword)(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        if (user.status !== "ACTIVE") {
            return res.status(401).json({ error: "Account is not active" });
        }
        const token = (0, auth_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
            roleType: user.operatorType ? user.operatorType : "",
            companyName: (_b = (_a = (user)) === null || _a === void 0 ? void 0 : _a.company) === null || _b === void 0 ? void 0 : _b.name,
            companyLogo: (_d = (_c = (user)) === null || _c === void 0 ? void 0 : _c.company) === null || _d === void 0 ? void 0 : _d.logo,
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({
            token,
            user: userWithoutPassword,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Login failed" });
    }
}));
// Register (for super admin to create managers)
router.post("/register", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Only super admin can register new managers
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "SUPER_ADMIN") {
            return res
                .status(403)
                .json({ error: "Only super admin can create new managers" });
        }
        const { email, name, password, role, companyId } = registerSchema.parse(req.body);
        const hashedPassword = yield (0, auth_1.hashPassword)(password);
        const user = yield prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: role,
                companyId,
            },
            include: {
                company: true,
            },
        });
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.status(201).json({
            message: "User created successfully",
            user: userWithoutPassword,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Registration failed" });
    }
}));
// Get current user
router.get("/me", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                company: true,
                managedBy: {
                    select: { id: true, name: true, email: true },
                },
                // assignedBranches: {
                // 	include: {
                // 		branch: true,
                // 	},
                // },
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json(userWithoutPassword);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
}));
exports.default = router;
