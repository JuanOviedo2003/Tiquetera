import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function seedPrismaDefaults() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.createMany({
        data: [
          {
            id: 'USR-DEMO-1',
            name: 'Restaurante Demo',
            email: 'prueba@gmail.com',
            password: '1234',
            role: 'RESTAURANTE',
            active: true,
          },
          {
            id: 'USR-DEMO-2',
            name: 'Cocina Central',
            email: 'cocina@tiquetera.com',
            password: 'cocina123',
            role: 'RESTAURANTE',
            active: true,
          },
        ],
      });
      console.log('Usuarios demo inicializados en MongoDB con Prisma');
    }
  } catch (err) {
    console.warn('Advertencia en seed Prisma:', err.message);
  }
}

export async function connectPrisma() {
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$connect();
      console.log('Conectado exitosamente a la base de datos con Prisma ORM');
      await seedPrismaDefaults();
    } catch (err) {
      console.error('Error conectando Prisma ORM:', err.message);
    }
  }
}

export default prisma;
