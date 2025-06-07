import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import companyRoutes from "./routes/companies";
import branchRoutes from "./routes/branches";
import alarmRoutes from "./routes/alarms";
import reportRoutes from "./routes/reports";
import analyticsRoutes from "./routes/analytics";

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://167.235.24.44:3002",
		credentials: true,
	})
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/alarms", alarmRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error handling middleware
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error("Error:", err);

		if (err.name === "ValidationError") {
			return res.status(400).json({
				error: "Validation Error",
				details: err.errors,
			});
		}

		if (err.code === "P2002") {
			return res.status(409).json({
				error: "Conflict",
				message: "A record with this data already exists",
			});
		}

		res.status(500).json({
			error: "Internal Server Error",
			message:
				process.env.NODE_ENV === "development"
					? err.message
					: "Something went wrong",
		});
	}
);

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({ error: "Route not found" });
});

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("Shutting down gracefully...");
	await prisma.$disconnect();
	process.exit(0);
});

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
