import Fastify from 'fastify';
import cors from '@fastify/cors';
import { clientRoutes } from './routes/clientsRoutes';
import * as dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify();

// Registra o CORS
fastify.register(cors);

// Rota raiz
fastify.get('/', async (req, reply) => {
  return { message: 'API funcionando!' };
});

// Registra as rotas
fastify.register(clientRoutes);

// Exporta handler para Vercel
export default async (req: any, res: any) => {
  try {
    await fastify.ready();
    fastify.server.emit('request', req, res);
  } catch (err) {
    res.statusCode = 500;
    res.end('Internal Server Error');
    console.error(err);
  }
};

// Somente inicializa o servidor se não estiver rodando no Vercel
if (process.env.VERCEL !== '1') {
  const port = process.env.PORT || 3333;
  fastify.listen({ port, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}