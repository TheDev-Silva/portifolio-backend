import { PrismaClient } from "@prisma/client";
import { FastifyRequest, FastifyReply } from 'fastify'
import nodemailer from "nodemailer";
import { z } from "zod";
import * as dotenv from 'dotenv';
import { captureClient } from "../types/types";

dotenv.config();

const prisma = new PrismaClient();

interface ClientInput {
    name: string;
    email: string;
    phone: string;
    message: string;
    status?: 'CONTACT' | 'CONTRACT_SIGNED' | 'DROPPED_OUT';
    projectValue?: number;
}

const clientSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    message: z.string().min(1),
});

export const createClient = async (
    request: FastifyRequest<{ Body: captureClient }>,
    reply: FastifyReply
) => {
    const result = clientSchema.safeParse(request.body);
    if (!result.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: result.error });
    }

    const { name, email, phone, message } = request.body as ClientInput;

    try {
        const newClient = await prisma.captureClient.create({
            data: { name, email, phone, message },
        });

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: process.env.USERMAIL,
                pass: process.env.PASSMAIL,
            },
            secure: false,
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
            from: process.env.USERMAIL,
            to: email,
            subject: 'Confirmação de contato - Silva Dev',
            text: `Prezado(a) ${name},\n\nAgradecemos por entrar em contato com a equipe The Silva Dev...`,
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.log('Erro ao enviar e-mail:', error);
            return reply.code(500).send({ error: 'Erro ao enviar e-mail' });
        }

        return reply.code(201).send({ success: true, client: newClient });
    } catch (error: any) {
        console.error('Erro ao salvar cliente ou enviar e-mail:', error);
        return reply.code(500).send({ error: 'Erro interno no servidor.' });
    }
};

export const getClients = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        const clients = await prisma.captureClient.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return reply.send(clients);
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        return reply.code(500).send({ error: 'Erro ao buscar contatos.' });
    }
};

export const getRegisteredStats = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    try {
        if (startDate && isNaN(Date.parse(startDate))) {
            return reply.code(400).send({ error: "Data de início inválida." });
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            return reply.code(400).send({ error: "Data de término inválida." });
        }

        const where: any = startDate || endDate ? { createdAt: {} } : undefined;

        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);

        const status = await prisma.captureClient.groupBy({
            by: ['status', 'createdAt'],
            _count: {
                id: true,
            },
            _sum: {
                projectValue: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
            where,
        });

        const monthlyStats: Record<string, any> = {};
        let totalSales = 0;
        let totalClients = 0;

        status.forEach((item: any) => {
            const month = new Date(item.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });

            if (!monthlyStats[month]) {
                monthlyStats[month] = {
                    CONTACTED: 0,
                    CONTRACT_SIGNED: 0,
                    DROPPED_OUT: 0,
                    totalProjectValue: 0,
                };
            }

            monthlyStats[month][item.status] += item._count.id;
            totalClients += item._count.id;

            if (item._sum.projectValue) {
                monthlyStats[month].totalProjectValue += item._sum.projectValue;
                totalSales += item._sum.projectValue;
            }
        });

        return reply.code(200).send({
            stats: monthlyStats,
            totalSales,
            totalClients,
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        return reply.code(500).send({ error: 'Erro interno no servidor.' });
    }
};
