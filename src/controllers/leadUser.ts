import { FastifyRequest, FastifyReply } from 'fastify';
import { CaptureClient, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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