import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { prisma } from './db/index.js';
import { config } from './config.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  basePath: '/api/auth',
  secret: config.betterAuthSecret,
  emailAndPassword: { enabled: true },
  plugins: [admin()],
  trustedOrigins: config.trustedOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh after 1 day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-ban new sign-ups pending admin approval
          await prisma.user.update({
            where: { id: user.id },
            data: { banned: true, banReason: 'Pending admin approval' },
          });
        },
      },
    },
  },
});
