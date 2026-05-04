import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo#2026';

async function main() {
  await prisma.supplyItem.deleteMany();
  await prisma.executionRequest.deleteMany();
  await prisma.productionAssignment.deleteMany();
  await prisma.compositeProduct.deleteMany();
  await prisma.supplierProfile.deleteMany();
  await prisma.executorProfile.deleteMany();
  await prisma.platformAccount.deleteMany();

  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  const admin = await prisma.platformAccount.create({
    data: {
      id: 'acc-admin-demo',
      email: 'admin@demo.local',
      passwordHash: hash,
      name: 'Ana Runway',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const fornecedor = await prisma.platformAccount.create({
    data: {
      id: 'acc-fornecedor-demo',
      email: 'fornecedor@demo.local',
      passwordHash: hash,
      name: 'Bruno Tecidos',
      role: 'SUPPLIER',
      status: 'ACTIVE',
      supplierProfile: {
        create: {
          businessName: 'Bruno Tecidos Ltda',
          cep: '01310-100',
          phone: '+55 11 98888-0001',
          addressLine1: 'Rua dos Alfaiates, 120',
          addressComplement: 'Galpão 2',
          city: 'São Paulo',
          stateUf: 'SP',
        },
      },
    },
  });

  const executor = await prisma.platformAccount.create({
    data: {
      id: 'acc-executor-demo',
      email: 'executor@demo.local',
      passwordHash: hash,
      name: 'Carla Mendes',
      role: 'EXECUTOR',
      status: 'ACTIVE',
      executorProfile: {
        create: {
          displayName: 'Carla Mendes — Atelier',
          cep: '01310-100',
          phone: '+55 11 97777-0002',
          addressLine1: 'Av. Paulista, 800',
          city: 'São Paulo',
          stateUf: 'SP',
        },
      },
    },
  });

  await prisma.platformAccount.create({
    data: {
      id: 'acc-cliente-demo',
      email: 'cliente@demo.local',
      passwordHash: hash,
      name: 'Dana Oliveira',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  void admin;
  void fornecedor;
  void executor;

  await prisma.compositeProduct.create({
    data: {
      id: 'cp-vestido-linho-classico',
      slug: 'vestido-linho-classico',
      nome: 'Vestido midi em linho — silhueta clássica',
      sku: 'LOOK-2026-VEST-LINHO',
      descricaoCurta:
        'Linhas limpas, caimento fluido e acabamento discreto. Peça de vitrine em linho, pensada para um guarda-roupa atemporal.',
      linhas: [
        {
          supplyItemId: 'supply-linho-offwhite',
          quantidade: 2.2,
          snapshot_custo_unitario: 89.9,
        },
        {
          supplyItemId: 'supply-ziper-invisivel-40',
          quantidade: 1,
          snapshot_custo_unitario: 4.5,
        },
      ],
      executorFeePlanejada: 85,
      platformFeePlanejada: 45,
      precoVendaPublico: 459.9,
      ativo: true,
      adminPausado: false,
      imagemUrl:
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=88',
    },
  });

  await prisma.compositeProduct.create({
    data: {
      id: 'cp-cachecol',
      slug: 'cachecol-trico-serra',
      nome: 'Cachecol em tricô — ponto textura serra',
      sku: 'LOOK-2026-CACHECOL-TRIC',
      descricaoCurta:
        'Camadas macias, acabamento à mão e fio encorpado. Modelo pensado para inverno urbano — ainda sem oferta publicada até a produção ser aprovada e liberada.',
      linhas: [
        {
          supplyItemId: 'supply-linho-offwhite',
          quantidade: 0.35,
          snapshot_custo_unitario: 89.9,
        },
        {
          supplyItemId: 'supply-ziper-invisivel-40',
          quantidade: 1,
          snapshot_custo_unitario: 4.5,
        },
      ],
      executorFeePlanejada: 35,
      platformFeePlanejada: 22,
      precoVendaPublico: 189.9,
      ativo: true,
      adminPausado: false,
      imagemUrl:
        'https://images.unsplash.com/photo-1520903920243-bd6f951d1a37?auto=format&fit=crop&w=1200&q=88',
    },
  });

  await prisma.productionAssignment.create({
    data: {
      id: 'asg-vestido-carla',
      compositeProductId: 'cp-vestido-linho-classico',
      executorEmail: 'executor@demo.local',
      executorNome: 'Carla Mendes — Atelier',
      cidadeOrigem: 'São Paulo — SP',
      cepOrigem: '01310-100',
      availableQuantity: 3,
      unitsProduced: 3,
      status: 'PUBLISHED',
      assignmentSource: 'ADMIN_DIRECT',
      executionRequestId: null,
    },
  });

  await prisma.executionRequest.create({
    data: {
      id: 'req-cachecol-carla',
      compositeProductId: 'cp-cachecol',
      executorEmail: 'executor@demo.local',
      executorNome: 'Carla Mendes',
      status: 'PENDING',
    },
  });

  await prisma.supplyItem.createMany({
    data: [
      {
        id: 'supply-linho-offwhite',
        supplierAccountId: fornecedor.id,
        nome: 'Linho premium off-white',
        skuInterno: 'TEC-LIN-OW-240',
        unidade: 'm',
        custoFornecedor: 89.9,
        freteAteExecutor: 12.0,
        ativo: true,
      },
      {
        id: 'supply-ziper-invisivel-40',
        supplierAccountId: fornecedor.id,
        nome: 'Zíper invisível 40 cm — preto',
        skuInterno: 'AVI-ZIP-INV-040-BLK',
        unidade: 'un',
        custoFornecedor: 4.5,
        freteAteExecutor: 3.0,
        ativo: true,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
