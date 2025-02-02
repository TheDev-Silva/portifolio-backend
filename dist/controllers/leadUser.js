"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadUserController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const leadUserController = async (request, reply) => {
    const { id, name, email, message, phone, } = request.body;
    try {
        const lead = await prisma.captureClient.create({
            data: {
                id,
                name,
                email,
                phone,
                message,
            }
        });
        reply.status(201).send({ message: 'Lead criado com sucesso!', lead });
    }
    catch (error) {
        reply.status(500).send({ error: 'Erro ao criar lead' });
    }
};
exports.leadUserController = leadUserController;
