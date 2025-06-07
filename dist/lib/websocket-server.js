"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastAlarmToPolice = broadcastAlarmToPolice;
exports.broadcastAlarmUpdate = broadcastAlarmUpdate;
const ws_1 = __importStar(require("ws"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const url_1 = require("url");
const prisma = new client_1.PrismaClient();
const wss = new ws_1.WebSocketServer({
    port: Number(process.env.WS_PORT) || 3004,
    verifyClient: (info, done) => {
        const req = info.req;
        const parsedUrl = (0, url_1.parse)(req.url || "", true);
        const token = parsedUrl.query.token;
        if (!token) {
            return done(false, 401, "Unauthorized");
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "");
            req.user = decoded;
            done(true);
        }
        catch (error) {
            done(false, 403, "Forbidden");
        }
    },
});
const clients = new Map();
wss.on("connection", (ws, req) => {
    const user = req.user;
    if (!user)
        return;
    console.log(`User ${user.id} connected to WebSocket`);
    clients.set(user.id, { ws, user });
    ws.send(JSON.stringify({
        type: "connection_established",
        message: "Connected to real-time notifications",
    }));
    ws.on("close", () => {
        console.log(`User ${user.id} disconnected from WebSocket`);
        clients.delete(user.id);
    });
    ws.on("error", (error) => {
        console.error(`WebSocket error for user ${user.id}:`, error);
        clients.delete(user.id);
    });
});
function broadcastAlarmToPolice(alarm) {
    console.log("Broadcasting alarm to police managers:", alarm);
    const message = JSON.stringify({
        type: "alarm_created",
        alarm,
    });
    clients.forEach(({ ws, user }) => {
        console.log(`Sending alarm to user ${user.id} with role ${user.role}`);
        if (user.role === "POLICE_MANAGER" && ws.readyState === ws_1.default.OPEN) {
            ws.send(message);
        }
    });
}
function broadcastAlarmUpdate(alarm) {
    const message = JSON.stringify({
        type: "alarm_updated",
        alarm,
    });
    clients.forEach(({ ws, user }) => {
        if (user.role === "police_manager" && ws.readyState === ws_1.default.OPEN) {
            ws.send(message);
        }
    });
}
console.log(`WebSocket server running on port ${process.env.WS_PORT || 3004}`);
// const WebSocket = require("ws");
// const jwt = require("jsonwebtoken");
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
// const wss = new WebSocket.Server({
// 	port: process.env.WS_PORT || 3004,
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
// console.log(`WebSocket server running on port ${process.env.WS_PORT || 3004}`);
// s;
