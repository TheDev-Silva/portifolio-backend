import Fastify from 'fastify';
import cors from '@fastify/cors';
import { clientRoutes } from './routes/clientsRoutes';
import * as dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify();


// Registra o CORS
fastify.register(cors);

// Registra as rotas
fastify.get('/', async (req, reply) => {
    return { message: 'API funcionando!' };
});

fastify.register(clientRoutes);


// Exporta como uma função para Vercel
/* export default async (req: any, res: any) => {
    await fastify.ready();
    fastify.server.emit('request', req, res);
}; */

export default async (req: any, res: any) => {
  try {
    // Certifica-se de que o Fastify está pronto para processar as requisições
    await fastify.ready();
    // Encaminha a requisição para o servidor Fastify
    fastify.server.emit('request', req, res);
  } catch (err) {
    // Em caso de erro, envia uma resposta diretamente
    res.statusCode = 500;
    res.end('Internal Server Error');
    console.error(err);
  }
};


// Inicia o servidor
/* fastify.listen({port: 3333, host: '0.0.0.0'}, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
}); */

