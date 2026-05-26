/**
 * Remove contas @demo.local (e catálogo de demonstração) e cria/atualiza o admin oficial.
 *
 * Uso (nunca commitar a senha no repositório):
 *   ADMIN_EMAIL=admin@seudominio.com.br \
 *   ADMIN_PASSWORD='…' \
 *   CONFIRM_PRODUCTION=yes \
 *   npm run bootstrap:production -w api
 *
 * Opcional: REMOVE_DEMO_CATALOG=false — só apaga contas demo, mantém produtos no banco.
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL_SUFFIX = '@demo.local';

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Defina ${name} no ambiente.`);
    process.exit(1);
  }
  return v;
}

function assertSafeToRun(): void {
  if (process.env.CONFIRM_PRODUCTION !== 'yes') {
    console.error('Defina CONFIRM_PRODUCTION=yes para executar este script.');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL ?? '';
  if (!url || url.includes('localhost') || url.includes('127.0.0.1')) {
    console.error('DATABASE_URL deve apontar para o banco de produção (não localhost).');
    process.exit(1);
  }
}

async function removeDemoCatalog(): Promise<void> {
  const removeCatalog = process.env.REMOVE_DEMO_CATALOG !== 'false';
  if (!removeCatalog) {
    const demoAccounts = await prisma.platformAccount.findMany({
      where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
      select: { id: true },
    });
    const demoIds = demoAccounts.map((a) => a.id);
    if (demoIds.length > 0) {
      await prisma.supplierFulfillmentLine.deleteMany({
        where: {
          OR: [
            { supplierAccountId: { in: demoIds } },
            { executorEmail: { endsWith: DEMO_EMAIL_SUFFIX } },
          ],
        },
      });
      await prisma.supplyItem.deleteMany({
        where: { supplierAccountId: { in: demoIds } },
      });
    }
    await prisma.executionRequest.deleteMany({
      where: { executorEmail: { endsWith: DEMO_EMAIL_SUFFIX } },
    });
    await prisma.productionAssignment.deleteMany({
      where: { executorEmail: { endsWith: DEMO_EMAIL_SUFFIX } },
    });
    return;
  }

  await prisma.supplierFulfillmentLine.deleteMany();
  await prisma.supplyItem.deleteMany();
  await prisma.executionRequest.deleteMany();
  await prisma.productionAssignment.deleteMany();
  await prisma.compositeProduct.deleteMany();
}

async function main(): Promise<void> {
  assertSafeToRun();

  const adminEmail = requireEnv('ADMIN_EMAIL').toLowerCase();
  const adminPassword = requireEnv('ADMIN_PASSWORD');
  const adminName = process.env.ADMIN_NAME?.trim() || 'Administrador';
  const fiscalDocument = process.env.ADMIN_FISCAL_DOCUMENT?.replace(/\D/g, '') || null;

  if (adminPassword.length < 8) {
    console.error('ADMIN_PASSWORD deve ter pelo menos 8 caracteres.');
    process.exit(1);
  }

  const demoBefore = await prisma.platformAccount.findMany({
    where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
    select: { email: true },
  });
  console.log(`Contas demo a remover: ${demoBefore.length}`, demoBefore.map((d) => d.email));

  await removeDemoCatalog();

  const deleted = await prisma.platformAccount.deleteMany({
    where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
  });
  console.log(`Contas demo removidas: ${deleted.count}`);

  await prisma.passwordResetToken.deleteMany({
    where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
  });

  const hash = bcrypt.hashSync(adminPassword, 10);
  const admin = await prisma.platformAccount.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: hash,
      name: adminName,
      role: 'ADMIN',
      status: 'ACTIVE',
      fiscalDocumentKind: 'CPF',
      fiscalDocument,
      termsAcceptedAt: new Date(),
      termsAcceptedVersion: 'production-bootstrap',
    },
    update: {
      passwordHash: hash,
      name: adminName,
      role: 'ADMIN',
      status: 'ACTIVE',
      ...(fiscalDocument ? { fiscalDocument } : {}),
    },
  });

  console.log(`Admin oficial: ${admin.email} (id ${admin.id})`);
  console.log('Concluído. Configure Stripe live e Melhor Envio produção nas variáveis do Render/Vercel.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
