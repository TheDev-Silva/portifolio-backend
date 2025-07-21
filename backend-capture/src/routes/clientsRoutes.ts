import { FastifyInstance } from 'fastify'
import { createClient, getClients, getRegisteredStats } from '../controllers/clientsControllers'

export const clientRoutes = async (fastify: FastifyInstance) => {

    fastify.post('/create-client', createClient)
    fastify.get('/clients', getClients)
    fastify.get('/cadastrados', getRegisteredStats)
}