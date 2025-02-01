import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Routes } from './routes';



const app = Fastify();
app.get('/', (req, reply) => {
  reply.send({ message: 'API funcionando!' });
});
app.register(Routes);
app.register(cors)

app.listen({ port: 3333 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
