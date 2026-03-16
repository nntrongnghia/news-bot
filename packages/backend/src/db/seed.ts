import { auth } from '../auth.js';
import { prisma } from './index.js';
import { config } from '../config.js';

export async function seedAdminUser() {
  const existing = await prisma.user.findFirst({
    where: { email: config.authAdminEmail },
  });

  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user via BetterAuth API
  await auth.api.signUpEmail({
    body: {
      name: 'Admin',
      email: config.authAdminEmail,
      password: config.authAdminPassword,
    },
  });

  // Set as admin and unban
  const user = await prisma.user.findFirst({
    where: { email: config.authAdminEmail },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin', banned: false, banReason: null },
    });
    console.log(`Admin user seeded: ${config.authAdminEmail}`);
  }
}
