"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function handler(_, res) {
    const clients = await prisma.captureClient.findMany();
    return res.status(200).json(clients);
}
