import Fastify from 'fastify';
import cors from '@fastify/cors';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

dotenv.config();

const prisma = new PrismaClient();
export const fastify = Fastify();

// Registra o CORS
fastify.register(cors);

interface ClientInput {
  name: string;
  email: string;
  phone: string;
  message: string;
  status?: 'CONTACT' | 'CONTRACT_SIGNED' | 'DROPPED_OUT';
  projectValue?: number;
}
fastify.setErrorHandler((error, request, reply) => {
  console.error('Erro inesperado:', error);
  reply.code(500).send({ error: 'Erro interno no servidor.' });
});

// Rota para obter clientes cadastrados
fastify.get('/cadastrados', async (request, reply) => {
  const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

  try {
    // Validação das datas
    if (startDate && isNaN(Date.parse(startDate))) {
      return reply.code(400).send({ error: "Data de início inválida." });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return reply.code(400).send({ error: "Data de término inválida." });
    }

    // Configurando filtros de data
    const where: any = startDate || endDate ? { createdAt: {} } : undefined;

    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);

    // Consultando os dados no banco
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
      where, // Aplicando filtros
    });

    // Organizando dados por mês
    const monthlyStats: Record<string, any> = {};
    let totalSales = 0;
    let totalClients = 0;

    status.forEach((item) => {
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

    // Resposta consolidada
    return reply.code(200).send({
      stats: monthlyStats,
      totalSales,
      totalClients,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return reply.code(500).send({ error: 'Erro interno no servidor.' });
  }
});

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  message: z.string().min(1),
});
// Rota para cadastrar clientes
fastify.post('/clients', async (request, reply) => {
  const result = clientSchema.safeParse(request.body);
  if (!result.success) {
    return reply.code(400).send({ error: 'Dados inválidos', details: result.error });
  };

  const { name, email, phone, message } = request.body as ClientInput;

  if (!name || !email || !message) {
    return reply.code(400).send({ error: 'Name, email, and message are required.' });
  }

  try {
    const newClient = await prisma.captureClient.create({
      data: { name, email, phone, message },
    });

    // Configuração do Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.USERMAIL,
        pass: process.env.PASSMAIL,
      },
      secure: false,
      tls: {
        rejectUnauthorized: false, // Ignorar problemas com certificados
      },
    });

    const mailOptions = {
      from: process.env.USERMAIL,
      to: email,
      subject: 'Confirmação de contato - Silva Dev',
      text: `Prezado(a) ${name},
              \n\nAgradecemos por entrar em contato com a equipe The Silva Dev.\nRecebemos sua mensagem:\n"${message}"\n\n.Nossa equipe irá analisar sua solicitação e retornaremos em breve com mais informações pelo contato ${phone}. \n\nAtenciosamente,\nEquipe TheSilvaDev\nE-mail:silvadeveloper2024@gmail.com\n\nsite: www.thesilvadev.com.br`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.log('Erro ao enviar e-mail:', error);
      return reply.code(500).send({ error: 'Erro ao enviar e-mail' });
    }

    return reply.code(201).send({ success: true, client: newClient });
  } catch (error: any) {
    if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') {
      return reply.code(409).send({ error: 'E-mail já cadastrado.' });
    }

    console.error('Erro ao salvar cliente ou enviar e-mail:', error);
    return reply.code(500).send({ error: 'Erro interno no servidor.' });
  }
});

// Rota para listar clientes
fastify.get('/clients', async (request, reply) => {
  try {
    const clients = await prisma.captureClient.findMany({
      orderBy: { createdAt: 'desc' }, // Ordena pelos mais recentes
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
      },
    });

    return reply.send(clients);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return reply.code(500).send({ error: 'Erro ao buscar contatos.' });
  }
});

// Exporta o Fastify como uma Serverless Function
export default async (req: any, res: any) => {
  await fastify.ready(); // Garante que o Fastify esteja pronto
  fastify.server.emit('request', req, res); // Emite a requisição para o Fastify
};