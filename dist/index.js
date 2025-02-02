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
exports.fastify = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv = __importStar(require("dotenv"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
dotenv.config();
const prisma = new client_1.PrismaClient();
exports.fastify = (0, fastify_1.default)();
// Registra o CORS
exports.fastify.register(cors_1.default);
exports.fastify.setErrorHandler((error, request, reply) => {
    console.error('Erro inesperado:', error);
    reply.code(500).send({ error: 'Erro interno no servidor.' });
});
exports.fastify.get('/', (req, reply) => {
    reply.send({ message: 'API funcionando!' });
});
// Rota para obter clientes cadastrados
exports.fastify.get('/cadastrados', async (request, reply) => {
    const { startDate, endDate } = request.query;
    try {
        // Validação das datas
        if (startDate && isNaN(Date.parse(startDate))) {
            return reply.code(400).send({ error: "Data de início inválida." });
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            return reply.code(400).send({ error: "Data de término inválida." });
        }
        // Configurando filtros de data
        const where = startDate || endDate ? { createdAt: {} } : undefined;
        if (startDate)
            where.createdAt.gte = new Date(startDate);
        if (endDate)
            where.createdAt.lte = new Date(endDate);
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
        const monthlyStats = {};
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
    }
    catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        return reply.code(500).send({ error: 'Erro interno no servidor.' });
    }
});
const clientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10),
    message: zod_1.z.string().min(1),
});
// Rota para cadastrar clientes
exports.fastify.post('/clients', async (request, reply) => {
    const result = clientSchema.safeParse(request.body);
    if (!result.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: result.error });
    }
    ;
    const { name, email, phone, message } = request.body;
    if (!name || !email || !message) {
        return reply.code(400).send({ error: 'Name, email, and message are required.' });
    }
    try {
        const newClient = await prisma.captureClient.create({
            data: { name, email, phone, message },
        });
        // Configuração do Nodemailer
        const transporter = nodemailer_1.default.createTransport({
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
        }
        catch (error) {
            console.log('Erro ao enviar e-mail:', error);
            return reply.code(500).send({ error: 'Erro ao enviar e-mail' });
        }
        return reply.code(201).send({ success: true, client: newClient });
    }
    catch (error) {
        if (error.name === 'PrismaClientKnownRequestError' && error.code === 'P2002') {
            return reply.code(409).send({ error: 'E-mail já cadastrado.' });
        }
        console.error('Erro ao salvar cliente ou enviar e-mail:', error);
        return reply.code(500).send({ error: 'Erro interno no servidor.' });
    }
});
// Rota para listar clientes
exports.fastify.get('/clients', async (request, reply) => {
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
    }
    catch (error) {
        console.error('Erro ao buscar contatos:', error);
        return reply.code(500).send({ error: 'Erro ao buscar contatos.' });
    }
});
// Exporta o Fastify como uma Serverless Function
exports.default = async (req, res) => {
    await exports.fastify.ready(); // Garante que o Fastify esteja pronto
    exports.fastify.server.emit('request', req, res); // Emite a requisição para o Fastify
};
