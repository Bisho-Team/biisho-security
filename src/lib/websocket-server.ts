import WebSocket, { WebSocketServer, RawData } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";
import { IncomingMessage } from "http";
import { parse } from "url";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends IncomingMessage {
	user?: JwtPayload & { id: string; role: string };
}

const wss = new WebSocketServer({
	port: Number(process.env.WS_PORT) || 3002,
	verifyClient: (info, done) => {
		const req = info.req as AuthenticatedRequest;
		const parsedUrl = parse(req.url || "", true);
		const token = parsedUrl.query.token as string;

		if (!token) {
			return done(false, 401, "Unauthorized");
		}

		try {
			const decoded = jwt.verify(
				token,
				process.env.JWT_SECRET || ""
			) as JwtPayload & { id: string; role: string };
			req.user = decoded;
			done(true);
		} catch (error) {
			done(false, 403, "Forbidden");
		}
	},
});

type Client = {
	ws: WebSocket;
	user: JwtPayload & { id: string; role: string };
};

const clients = new Map<string, Client>();

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
	const user = (req as AuthenticatedRequest).user;
	if (!user) return;

	console.log(`User ${user.id} connected to WebSocket`);
	clients.set(user.id, { ws, user });

	ws.send(
		JSON.stringify({
			type: "connection_established",
			message: "Connected to real-time notifications",
		})
	);

	ws.on("close", () => {
		console.log(`User ${user.id} disconnected from WebSocket`);
		clients.delete(user.id);
	});

	ws.on("error", (error: Error) => {
		console.error(`WebSocket error for user ${user.id}:`, error);
		clients.delete(user.id);
	});
});

export function broadcastAlarmToPolice(alarm: any) {
	console.log("Broadcasting alarm to police managers:", alarm);
	const message = JSON.stringify({
		type: "alarm_created",
		alarm,
	});

	clients.forEach(({ ws, user }) => {
		console.log(`Sending alarm to user ${user.id} with role ${user.role}`);

		if (user.role === "POLICE_MANAGER" && ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
}

export function broadcastAlarmUpdate(alarm: unknown) {
	const message = JSON.stringify({
		type: "alarm_updated",
		alarm,
	});

	clients.forEach(({ ws, user }) => {
		if (user.role === "police_manager" && ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
}

console.log(`WebSocket server running on port ${process.env.WS_PORT || 3002}`);

// const WebSocket = require("ws");
// const jwt = require("jsonwebtoken");
// const { PrismaClient } = require("@prisma/client");

// const prisma = new PrismaClient();
// const wss = new WebSocket.Server({
// 	port: process.env.WS_PORT || 3002,
// 	verifyClient: (info) => {
// 		const token = new URL(info.req.url, "http://localhost").searchParams.get(
// 			"token"
// 		);

// 		if (!token) {
// 			return false;
// 		}

// 		try {
// 			const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 			info.req.user = decoded;
// 			return true;
// 		} catch (error) {
// 			return false;
// 		}
// 	},
// });

// const clients = new Map();

// wss.on("connection", (ws, req) => {
// 	const user = req.user;
// 	console.log(`User ${user.id} connected to WebSocket`);

// 	clients.set(user.id, { ws, user });

// 	// Send connection confirmation
// 	ws.send(
// 		JSON.stringify({
// 			type: "connection_established",
// 			message: "Connected to real-time notifications",
// 		})
// 	);

// 	ws.on("close", () => {
// 		console.log(`User ${user.id} disconnected from WebSocket`);
// 		clients.delete(user.id);
// 	});

// 	ws.on("error", (error) => {
// 		console.error(`WebSocket error for user ${user.id}:`, error);
// 		clients.delete(user.id);
// 	});
// });

// // Function to broadcast alarm to police managers
// function broadcastAlarmToPolice(alarm) {
// 	const message = JSON.stringify({
// 		type: "alarm_created",
// 		alarm: alarm,
// 	});

// 	clients.forEach(({ ws, user }) => {
// 		if (user.role === "police_manager" && ws.readyState === WebSocket.OPEN) {
// 			ws.send(message);
// 		}
// 	});
// }

// // Function to broadcast alarm updates
// function broadcastAlarmUpdate(alarm) {
// 	const message = JSON.stringify({
// 		type: "alarm_updated",
// 		alarm: alarm,
// 	});

// 	clients.forEach(({ ws, user }) => {
// 		if (user.role === "police_manager" && ws.readyState === WebSocket.OPEN) {
// 			ws.send(message);
// 		}
// 	});
// }

// module.exports = {
// 	broadcastAlarmToPolice,
// 	broadcastAlarmUpdate,
// };

// console.log(`WebSocket server running on port ${process.env.WS_PORT || 3002}`);
// s;
