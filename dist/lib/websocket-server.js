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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastAlarmToPolice = broadcastAlarmToPolice;
exports.broadcastAlarmUpdate = broadcastAlarmUpdate;
exports.broadcastSystemNotification = broadcastSystemNotification;
exports.getConnectedClientsStats = getConnectedClientsStats;
exports.getConnectedPolicePersonnel = getConnectedPolicePersonnel;
exports.broadcastConnectionStatusUpdate = broadcastConnectionStatusUpdate;
const ws_1 = __importStar(require("ws"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const url_1 = require("url");
const prisma = new client_1.PrismaClient();
const wss = new ws_1.WebSocketServer({
    port: Number(process.env.WS_PORT) || 3004,
    verifyClient: (info, done) => __awaiter(void 0, void 0, void 0, function* () {
        const req = info.req;
        const parsedUrl = (0, url_1.parse)(req.url || "", true);
        const token = parsedUrl.query.token;
        if (!token) {
            return done(false, 401, "Unauthorized");
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "");
            // Fetch user details including operatorType from database
            const user = yield prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    role: true,
                    operatorType: true,
                    name: true,
                    email: true,
                },
            });
            if (!user) {
                return done(false, 403, "User not found");
            }
            req.user = Object.assign(Object.assign({}, decoded), { operatorType: user.operatorType || undefined });
            done(true);
        }
        catch (error) {
            console.error("WebSocket authentication error:", error);
            done(false, 403, "Forbidden");
        }
    }),
});
const clients = new Map();
wss.on("connection", (ws, req) => {
    const user = req.user;
    if (!user)
        return;
    console.log(`User ${user.id} (${user.role}${user.operatorType ? ` - ${user.operatorType}` : ""}) connected to WebSocket`);
    clients.set(user.id, { ws, user });
    ws.send(JSON.stringify({
        type: "connection_established",
        message: "Connected to real-time notifications",
        userInfo: {
            id: user.id,
            role: user.role,
            operatorType: user.operatorType,
        },
    }));
    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.ping();
        }
        else {
            clearInterval(heartbeat);
        }
    }, 30000);
    ws.on("pong", () => {
        console.log(`Heartbeat received from user ${user.id}`);
    });
    ws.on("close", () => {
        console.log(`User ${user.id} disconnected from WebSocket`);
        clients.delete(user.id);
        clearInterval(heartbeat);
        // Broadcast connection status update when someone disconnects
        setTimeout(() => {
            broadcastConnectionStatusUpdate();
        }, 500);
    });
    ws.on("error", (error) => {
        console.error(`WebSocket error for user ${user.id}:`, error);
        clients.delete(user.id);
        clearInterval(heartbeat);
    });
    // Broadcast connection status update when someone connects
    setTimeout(() => {
        broadcastConnectionStatusUpdate();
    }, 1000);
});
/**
 * Broadcasts alarm to Police Managers and Police Operators
 */
function broadcastAlarmToPolice(alarm) {
    console.log("Broadcasting alarm to police personnel:", alarm);
    const message = JSON.stringify({
        type: "alarm_created",
        alarm: Object.assign(Object.assign({}, alarm), { timestamp: new Date().toISOString(), priority: getAlarmPriority(alarm.severity) }),
    });
    let broadcastCount = 0;
    const targetRoles = [];
    clients.forEach(({ ws, user }) => {
        const shouldReceiveAlarm = isPolicePersonnel(user);
        if (shouldReceiveAlarm) {
            targetRoles.push(`${user.role}${user.operatorType ? ` (${user.operatorType})` : ""}`);
            if (ws.readyState === ws_1.default.OPEN) {
                try {
                    ws.send(message);
                    broadcastCount++;
                    console.log(`✅ Alarm sent to ${user.role} user ${user.id}${user.operatorType ? ` (${user.operatorType})` : ""}`);
                }
                catch (error) {
                    console.error(`❌ Failed to send alarm to user ${user.id}:`, error);
                }
            }
            else {
                console.warn(`⚠️ WebSocket not open for user ${user.id}, removing from clients`);
                clients.delete(user.id);
            }
        }
    });
    console.log(`📡 Alarm broadcast complete: ${broadcastCount} recipients`);
    console.log(`🎯 Target roles: ${[...new Set(targetRoles)].join(", ")}`);
}
/**
 * Broadcasts alarm updates to Police Managers and Police Operators
 */
function broadcastAlarmUpdate(alarm) {
    console.log("Broadcasting alarm update to police personnel:", alarm);
    const message = JSON.stringify({
        type: "alarm_updated",
        alarm: Object.assign(Object.assign({}, alarm), { timestamp: new Date().toISOString(), priority: getAlarmPriority(alarm.severity) }),
    });
    let broadcastCount = 0;
    clients.forEach(({ ws, user }) => {
        const shouldReceiveUpdate = isPolicePersonnel(user);
        if (shouldReceiveUpdate && ws.readyState === ws_1.default.OPEN) {
            try {
                ws.send(message);
                broadcastCount++;
                console.log(`✅ Alarm update sent to ${user.role} user ${user.id}${user.operatorType ? ` (${user.operatorType})` : ""}`);
            }
            catch (error) {
                console.error(`❌ Failed to send alarm update to user ${user.id}:`, error);
            }
        }
    });
    console.log(`📡 Alarm update broadcast complete: ${broadcastCount} recipients`);
}
/**
 * Broadcasts system notifications to specific user roles
 */
function broadcastSystemNotification(notification) {
    const message = JSON.stringify({
        type: "system_notification",
        notification: Object.assign(Object.assign({}, notification), { timestamp: new Date().toISOString() }),
    });
    clients.forEach(({ ws, user }) => {
        const shouldReceive = !notification.targetRoles ||
            notification.targetRoles.includes(user.role) ||
            (user.role === "OPERATOR" &&
                user.operatorType &&
                notification.targetRoles.includes(`OPERATOR_${user.operatorType}`));
        if (shouldReceive && ws.readyState === ws_1.default.OPEN) {
            ws.send(message);
        }
    });
}
/**
 * Gets current connected clients statistics
 */
function getConnectedClientsStats() {
    const stats = {
        total: clients.size,
        policeManagers: 0,
        policeOperators: 0,
        officeOperators: 0,
        others: 0,
    };
    clients.forEach(({ user }) => {
        if (user.role === "POLICE_MANAGER") {
            stats.policeManagers++;
        }
        else if (user.role === "OPERATOR" && user.operatorType === "POLICE") {
            stats.policeOperators++;
        }
        else if (user.role === "OPERATOR" && user.operatorType === "OFFICE") {
            stats.officeOperators++;
        }
        else {
            stats.others++;
        }
    });
    return stats;
}
/**
 * Gets detailed information about connected police personnel
 */
function getConnectedPolicePersonnel() {
    const connectedPolice = [];
    clients.forEach(({ user }) => {
        if (isPolicePersonnel(user)) {
            connectedPolice.push({
                userId: user.id,
                role: user.role,
                operatorType: user.operatorType,
                connectedAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
            });
        }
    });
    return connectedPolice;
}
/**
 * Broadcasts connection status updates to all connected clients
 */
function broadcastConnectionStatusUpdate() {
    const connectedPolice = getConnectedPolicePersonnel();
    const stats = getConnectedClientsStats();
    const message = JSON.stringify({
        type: "connection_status_update",
        data: {
            connectedPolice,
            stats,
            timestamp: new Date().toISOString(),
        },
    });
    clients.forEach(({ ws, user }) => {
        if (ws.readyState === ws_1.default.OPEN) {
            try {
                ws.send(message);
            }
            catch (error) {
                console.error(`Failed to send connection status to user ${user.id}:`, error);
            }
        }
    });
}
/**
 * Helper function to determine if user should receive police alarms
 */
function isPolicePersonnel(user) {
    return user.role === "POLICE_MANAGER" || (user.role === "OPERATOR" && user.operatorType === "POLICE");
}
/**
 * Helper function to get alarm priority based on severity
 */
function getAlarmPriority(severity) {
    switch (severity) {
        case "CRITICAL":
            return 1;
        case "HIGH":
            return 2;
        case "MEDIUM":
            return 3;
        case "LOW":
            return 4;
        default:
            return 5;
    }
}
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("Shutting down WebSocket server...");
    clients.forEach(({ ws }) => {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.close(1000, "Server shutting down");
        }
    });
    wss.close();
});
console.log(`🚀 WebSocket server running on port ${process.env.WS_PORT || 3004}`);
console.log(`📡 Broadcasting to: POLICE_MANAGER and OPERATOR (POLICE type)`);
// import WebSocket, { WebSocketServer } from "ws"
// import jwt, { type JwtPayload } from "jsonwebtoken"
// import { PrismaClient } from "@prisma/client"
// import type { IncomingMessage } from "http"
// import { parse } from "url"
// const prisma = new PrismaClient()
// interface AuthenticatedRequest extends IncomingMessage {
//   user?: JwtPayload & { id: string; role: string; operatorType?: string }
// }
// const wss = new WebSocketServer({
//   port: Number(process.env.WS_PORT) || 3004,
//   verifyClient: async (info, done) => {
//     const req = info.req as AuthenticatedRequest
//     const parsedUrl = parse(req.url || "", true)
//     const token = parsedUrl.query.token as string
//     if (!token) {
//       return done(false, 401, "Unauthorized")
//     }
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as JwtPayload & { id: string; role: string }
//       // Fetch user details including operatorType from database
//       const user = await prisma.user.findUnique({
//         where: { id: decoded.id },
//         select: {
//           id: true,
//           role: true,
//           operatorType: true,
//           name: true,
//           email: true,
//         },
//       })
//       if (!user) {
//         return done(false, 403, "User not found")
//       }
//       req.user = {
//         ...decoded,
//         operatorType: user.operatorType || undefined,
//       }
//       done(true)
//     } catch (error) {
//       console.error("WebSocket authentication error:", error)
//       done(false, 403, "Forbidden")
//     }
//   },
// })
// type Client = {
//   ws: WebSocket
//   user: JwtPayload & { id: string; role: string; operatorType?: string }
// }
// const clients = new Map<string, Client>()
// wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
//   const user = (req as AuthenticatedRequest).user
//   if (!user) return
//   console.log(
//     `User ${user.id} (${user.role}${user.operatorType ? ` - ${user.operatorType}` : ""}) connected to WebSocket`,
//   )
//   clients.set(user.id, { ws, user })
//   ws.send(
//     JSON.stringify({
//       type: "connection_established",
//       message: "Connected to real-time notifications",
//       userInfo: {
//         id: user.id,
//         role: user.role,
//         operatorType: user.operatorType,
//       },
//     }),
//   )
//   // Send heartbeat every 30 seconds to keep connection alive
//   const heartbeat = setInterval(() => {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.ping()
//     } else {
//       clearInterval(heartbeat)
//     }
//   }, 30000)
//   ws.on("pong", () => {
//     console.log(`Heartbeat received from user ${user.id}`)
//   })
//   ws.on("close", () => {
//     console.log(`User ${user.id} disconnected from WebSocket`)
//     clients.delete(user.id)
//     clearInterval(heartbeat)
//   })
//   ws.on("error", (error: Error) => {
//     console.error(`WebSocket error for user ${user.id}:`, error)
//     clients.delete(user.id)
//     clearInterval(heartbeat)
//   })
// })
// /**
//  * Broadcasts alarm to Police Managers and Police Operators
//  */
// export function broadcastAlarmToPolice(alarm: any) {
//   console.log("Broadcasting alarm to police personnel:", alarm)
//   const message = JSON.stringify({
//     type: "alarm_created",
//     alarm: {
//       ...alarm,
//       timestamp: new Date().toISOString(),
//       priority: getAlarmPriority(alarm.severity),
//     },
//   })
//   let broadcastCount = 0
//   const targetRoles: string[] = []
//   clients.forEach(({ ws, user }) => {
//     console.log("Checking user for alarm eligibility:", user)
//     const shouldReceiveAlarm = isPolicePersonnel(user)
//     console.log({
//       shouldReceiveAlarm
//     })
//     if (shouldReceiveAlarm) {
//       targetRoles.push(`${user.role}${user.operatorType ? ` (${user.operatorType})` : ""}`)
//       if (ws.readyState === WebSocket.OPEN) {
//         try {
//           ws.send(message)
//           broadcastCount++
//           console.log(
//             `✅ Alarm sent to ${user.role} user ${user.id}${user.operatorType ? ` (${user.operatorType})` : ""}`,
//           )
//         } catch (error) {
//           console.error(`❌ Failed to send alarm to user ${user.id}:`, error)
//         }
//       } else {
//         console.warn(`⚠️ WebSocket not open for user ${user.id}, removing from clients`)
//         clients.delete(user.id)
//       }
//     }
//   })
//   console.log(`📡 Alarm broadcast complete: ${broadcastCount} recipients`)
//   console.log(`🎯 Target roles: ${[...new Set(targetRoles)].join(", ")}`)
// }
// /**
//  * Broadcasts alarm updates to Police Managers and Police Operators
//  */
// export function broadcastAlarmUpdate(alarm: any) {
//   console.log("Broadcasting alarm update to police personnel:", alarm)
//   const message = JSON.stringify({
//     type: "alarm_updated",
//     alarm: {
//       ...alarm,
//       timestamp: new Date().toISOString(),
//       priority: getAlarmPriority(alarm.severity),
//     },
//   })
//   let broadcastCount = 0
//   clients.forEach(({ ws, user }) => {
//     const shouldReceiveUpdate = isPolicePersonnel(user)
//     if (shouldReceiveUpdate && ws.readyState === WebSocket.OPEN) {
//       try {
//         ws.send(message)
//         broadcastCount++
//         console.log(
//           `✅ Alarm update sent to ${user.role} user ${user.id}${user.operatorType ? ` (${user.operatorType})` : ""}`,
//         )
//       } catch (error) {
//         console.error(`❌ Failed to send alarm update to user ${user.id}:`, error)
//       }
//     }
//   })
//   console.log(`📡 Alarm update broadcast complete: ${broadcastCount} recipients`)
// }
// /**
//  * Broadcasts system notifications to specific user roles
//  */
// export function broadcastSystemNotification(notification: {
//   type: string
//   message: string
//   severity?: "info" | "warning" | "error"
//   targetRoles?: string[]
// }) {
//   const message = JSON.stringify({
//     type: "system_notification",
//     notification: {
//       ...notification,
//       timestamp: new Date().toISOString(),
//     },
//   })
//   clients.forEach(({ ws, user }) => {
//     const shouldReceive =
//       !notification.targetRoles ||
//       notification.targetRoles.includes(user.role) ||
//       (user.role === "OPERATOR" &&
//         user.operatorType &&
//         notification.targetRoles.includes(`OPERATOR_${user.operatorType}`))
//     if (shouldReceive && ws.readyState === WebSocket.OPEN) {
//       ws.send(message)
//     }
//   })
// }
// /**
//  * Gets current connected clients statistics
//  */
// export function getConnectedClientsStats() {
//   const stats = {
//     total: clients.size,
//     policeManagers: 0,
//     policeOperators: 0,
//     officeOperators: 0,
//     others: 0,
//   }
//   clients.forEach(({ user }) => {
//     if (user.role === "POLICE_MANAGER") {
//       stats.policeManagers++
//     } else if (user.role === "OPERATOR" && user.operatorType === "POLICE") {
//       stats.policeOperators++
//     } else {
//       stats.others++
//     }
//   })
//   return stats
// }
// /**
//  * Helper function to determine if user should receive police alarms
//  */
// function isPolicePersonnel(user: { role: string; operatorType?: string }): boolean {
//   return user.role === "POLICE_MANAGER" || (user.role === "OPERATOR" && user.operatorType === "POLICE")
// }
// /**
//  * Helper function to get alarm priority based on severity
//  */
// function getAlarmPriority(severity: string): number {
//   switch (severity) {
//     case "CRITICAL":
//       return 1
//     case "HIGH":
//       return 2
//     case "MEDIUM":
//       return 3
//     case "LOW":
//       return 4
//     default:
//       return 5
//   }
// }
// // Graceful shutdown
// process.on("SIGTERM", () => {
//   console.log("Shutting down WebSocket server...")
//   clients.forEach(({ ws }) => {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.close(1000, "Server shutting down")
//     }
//   })
//   wss.close()
// })
// console.log(`🚀 WebSocket server running on port ${process.env.WS_PORT || 3004}`)
// console.log(`📡 Broadcasting to: POLICE_MANAGER and OPERATOR (POLICE type)`)
//-------------------------------------------------
//legacy code
// import { parse } from "url";
// const prisma = new PrismaClient();
// interface AuthenticatedRequest extends IncomingMessage {
// 	user?: JwtPayload & { id: string; role: string };
// }
// const wss = new WebSocketServer({
// 	port: Number(process.env.WS_PORT) || 3004,
// 	verifyClient: (info, done) => {
// 		const req = info.req as AuthenticatedRequest;
// 		const parsedUrl = parse(req.url || "", true);
// 		const token = parsedUrl.query.token as string;
// 		if (!token) {
// 			return done(false, 401, "Unauthorized");
// 		}
// 		try {
// 			const decoded = jwt.verify(
// 				token,
// 				process.env.JWT_SECRET || ""
// 			) as JwtPayload & { id: string; role: string };
// 			req.user = decoded;
// 			done(true);
// 		} catch (error) {
// 			done(false, 403, "Forbidden");
// 		}
// 	},
// });
// type Client = {
// 	ws: WebSocket;
// 	user: JwtPayload & { id: string; role: string };
// };
// const clients = new Map<string, Client>();
// wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
// 	const user = (req as AuthenticatedRequest).user;
// 	if (!user) return;
// 	console.log(`User ${user.id} connected to WebSocket`);
// 	clients.set(user.id, { ws, user });
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
// 	ws.on("error", (error: Error) => {
// 		console.error(`WebSocket error for user ${user.id}:`, error);
// 		clients.delete(user.id);
// 	});
// });
// export function broadcastAlarmToPolice(alarm: any) {
// 	console.log("Broadcasting alarm to police managers:", alarm);
// 	const message = JSON.stringify({
// 		type: "alarm_created",
// 		alarm,
// 	});
// 	clients.forEach(({ ws, user }) => {
// 		console.log(`Sending alarm to user ${user.id} with role ${user.role}`);
// 		if (user.role === "POLICE_MANAGER" && ws.readyState === WebSocket.OPEN) {
// 			ws.send(message);
// 		}
// 	});
// }
// export function broadcastAlarmUpdate(alarm: unknown) {
// 	const message = JSON.stringify({
// 		type: "alarm_updated",
// 		alarm,
// 	});
// 	clients.forEach(({ ws, user }) => {
// 		if (user.role === "POLICE_MANAGER" && ws.readyState === WebSocket.OPEN) {
// 			ws.send(message);
// 		}
// 	});
// }
// console.log(`WebSocket server running on port ${process.env.WS_PORT || 3004}`);
