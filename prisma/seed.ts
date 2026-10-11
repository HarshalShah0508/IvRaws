import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { Gender, ProductStatus, SizeType } from '../src/generated/prisma/enums.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [tshirts, pants] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 't-shirts' },
      update: {},
      create: { name: 'T-Shirts', slug: 't-shirts' },
    }),
    prisma.category.upsert({
      where: { slug: 'pants' },
      update: {},
      create: { name: 'Pants', slug: 'pants' },
    }),
  ]);

  const apparelSizes = [
    { label: 'S', sortOrder: 1 },
    { label: 'M', sortOrder: 2 },
    { label: 'L', sortOrder: 3 },
    { label: 'XL', sortOrder: 4 },
  ];
  const numericSizes = [
    { label: '28', sortOrder: 1 },
    { label: '30', sortOrder: 2 },
    { label: '32', sortOrder: 3 },
    { label: '34', sortOrder: 4 },
  ];

  const sizeRecords: Record<string, { id: string }> = {};
  for (const s of apparelSizes) {
    sizeRecords[s.label] = await prisma.size.upsert({
      where: { label: s.label },
      update: {},
      create: { ...s, type: SizeType.APPAREL },
    });
  }
  for (const s of numericSizes) {
    sizeRecords[s.label] = await prisma.size.upsert({
      where: { label: s.label },
      update: {},
      create: { ...s, type: SizeType.NUMERIC },
    });
  }

  const colors = [
    { name: 'Black', hexCode: '#000000' },
    { name: 'White', hexCode: '#FFFFFF' },
    { name: 'Navy', hexCode: '#1F2A44' },
    { name: 'Olive', hexCode: '#5C5A42' },
  ];
  const colorRecords: Record<string, { id: string }> = {};
  for (const c of colors) {
    colorRecords[c.name] = await prisma.color.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  const tshirtProducts = [
    { name: 'Classic Crew Tee', slug: 'classic-crew-tee', basePrice: 24.99 },
    { name: 'Oversized Graphic Tee', slug: 'oversized-graphic-tee', basePrice: 29.99 },
    { name: 'Ringer Tee', slug: 'ringer-tee', basePrice: 27.99 },
  ];
  const pantsProducts = [
    { name: 'Relaxed Fit Cargo Pants', slug: 'relaxed-fit-cargo-pants', basePrice: 54.99 },
    { name: 'Straight Leg Denim', slug: 'straight-leg-denim', basePrice: 59.99 },
  ];

  for (const p of tshirtProducts) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: `${p.name} — everyday streetwear essential cut for a relaxed, youthful fit.`,
        basePrice: p.basePrice,
        gender: Gender.UNISEX,
        status: ProductStatus.ACTIVE,
        categoryId: tshirts.id,
        images: {
          create: [{ url: `https://picsum.photos/seed/${p.slug}/800/900`, position: 0 }],
        },
      },
    });

    for (const sizeLabel of ['S', 'M', 'L', 'XL']) {
      for (const colorName of ['Black', 'White', 'Navy']) {
        const sku = `${p.slug}-${sizeLabel}-${colorName}`.toUpperCase();
        await prisma.productVariant.upsert({
          where: { productId_sizeId_colorId: { productId: product.id, sizeId: sizeRecords[sizeLabel].id, colorId: colorRecords[colorName].id } },
          update: {},
          create: {
            productId: product.id,
            sizeId: sizeRecords[sizeLabel].id,
            colorId: colorRecords[colorName].id,
            sku,
            price: p.basePrice,
            stockQuantity: 50,
          },
        });
      }
    }
  }

  for (const p of pantsProducts) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: `${p.name} — built for movement with a modern youth-driven silhouette.`,
        basePrice: p.basePrice,
        gender: Gender.UNISEX,
        status: ProductStatus.ACTIVE,
        categoryId: pants.id,
        images: {
          create: [{ url: `https://picsum.photos/seed/${p.slug}/800/900`, position: 0 }],
        },
      },
    });

    for (const sizeLabel of ['28', '30', '32', '34']) {
      for (const colorName of ['Black', 'Olive']) {
        const sku = `${p.slug}-${sizeLabel}-${colorName}`.toUpperCase();
        await prisma.productVariant.upsert({
          where: { productId_sizeId_colorId: { productId: product.id, sizeId: sizeRecords[sizeLabel].id, colorId: colorRecords[colorName].id } },
          update: {},
          create: {
            productId: product.id,
            sizeId: sizeRecords[sizeLabel].id,
            colorId: colorRecords[colorName].id,
            sku,
            price: p.basePrice,
            stockQuantity: 40,
          },
        });
      }
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
