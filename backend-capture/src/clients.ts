import { PrismaClient } from "@prisma/client";
import { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(_: VercelRequest, res: VercelResponse) {
  const clients = await prisma.captureClient.findMany();
  return res.status(200).json(clients);
}
