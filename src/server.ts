import Fastify from 'fastify';
import cors from '@fastify/cors';




const app = Fastify();
app.get('/', (req, reply) => {
  reply.send({ message: 'API funcionando!' });
});

app.register(cors)

app.listen({ port: 3333 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});

/* 
import Fastify from 'fastify';
import cors from '@fastify/cors';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = Fastify();

// Registra o CORS
app.register(cors);

// Registra as rotas
app.register(Routes);

// Exporta a aplicação como uma Serverless Function
export default async ({ req, res }: any) => {
  await app.ready();
  app.server.emit('request', req, res);
}; */