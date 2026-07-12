import { env } from './env.js';
import { prisma } from '../prisma/client.js';

export async function connectDB() {
  await prisma.$connect();
  console.log('[db] connected to PostgreSQL');
}
