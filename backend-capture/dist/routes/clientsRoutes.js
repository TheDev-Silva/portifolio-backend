"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientRoutes = void 0;
const clientsControllers_1 = require("../controllers/clientsControllers");
const clientRoutes = async (fastify) => {
    fastify.post('/create-client', clientsControllers_1.createClient);
    fastify.get('/clients', clientsControllers_1.getClients);
    fastify.get('/cadastrados', clientsControllers_1.getRegisteredStats);
};
exports.clientRoutes = clientRoutes;
