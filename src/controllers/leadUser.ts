import { FastifyRequest, FastifyReply } from 'fastify';
import { CaptureClient, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* export async function leadUserController(req: FastifyRequest, reply: FastifyReply) {
    const { name, email, message } = req.body as { name: string; email: string; message: string };

    try {
        const lead = await prisma.lead.create({
            data: {
                name,
                email,
                message,
            },
        });

        reply.status(201).send({ message: 'Lead criado com sucesso!', lead });
    } catch (error) {
        reply.status(500).send({ error: 'Erro ao criar lead' });
    }
} */

export const leadUserController = async (
    request: FastifyRequest<{ Body: CaptureClient }>,
    reply: FastifyReply
) => {
    const { id, name, email, message, phone,  } = request.body
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

    } catch (error) {
        reply.status(500).send({ error: 'Erro ao criar lead' });
    }
}