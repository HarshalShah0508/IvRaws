import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { FitType, Gender, Pattern, ProductStatus, SizeType, SleeveLength } from '../src/generated/prisma/enums.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const APPAREL_SIZES = [
  { label: 'S', sortOrder: 1 },
  { label: 'M', sortOrder: 2 },
  { label: 'L', sortOrder: 3 },
  { label: 'XL', sortOrder: 4 },
];
const NUMERIC_SIZES = [
  { label: '28', sortOrder: 1 },
  { label: '30', sortOrder: 2 },
  { label: '32', sortOrder: 3 },
  { label: '34', sortOrder: 4 },
];

const COLORS = [
  { name: 'Black', hexCode: '#000000' },
  { name: 'White', hexCode: '#FFFFFF' },
  { name: 'Navy', hexCode: '#1F2A44' },
  { name: 'Olive', hexCode: '#5C5A42' },
  { name: 'Charcoal', hexCode: '#36454F' },
];

type CategoryDef = {
  slug: string;
  name: string;
  sizeLabels: string[];
  colorNames: string[];
  // `rating` is omitted for a couple of products on purpose, to represent
  // genuinely new/unreviewed listings — the UI already handles reviewCount
  // === 0 by just not showing a rating, so no placeholder value is needed.
  // `sleeveLength` is omitted for products it doesn't apply to (e.g. pants) —
  // stays null, which correctly excludes them from a sleeve-length filter.
  products: {
    name: string;
    slug: string;
    basePrice: number;
    rating?: { avg: number; count: number };
    material: string;
    fitType: FitType;
    pattern: Pattern;
    sleeveLength?: SleeveLength;
    gender: Gender;
    salesCount: number;
  }[];
};

const CATEGORIES: CategoryDef[] = [
  {
    slug: 't-shirts',
    name: 'T-Shirts',
    sizeLabels: ['S', 'M', 'L', 'XL'],
    colorNames: ['Black', 'White', 'Navy'],
    products: [
      {
        name: 'Classic Crew Tee', slug: 'classic-crew-tee', basePrice: 1999, rating: { avg: 4.6, count: 128 },
        material: 'Cotton', fitType: FitType.REGULAR, pattern: Pattern.SOLID, sleeveLength: SleeveLength.SHORT, gender: Gender.UNISEX, salesCount: 420,
      },
      {
        name: 'Oversized Graphic Tee', slug: 'oversized-graphic-tee', basePrice: 2299, rating: { avg: 4.3, count: 54 },
        material: 'Cotton', fitType: FitType.OVERSIZED, pattern: Pattern.GRAPHIC, sleeveLength: SleeveLength.SHORT, gender: Gender.MALE, salesCount: 210,
      },
      {
        name: 'Ringer Tee', slug: 'ringer-tee', basePrice: 2099, rating: { avg: 4.7, count: 89 },
        material: 'Cotton', fitType: FitType.REGULAR, pattern: Pattern.SOLID, sleeveLength: SleeveLength.SHORT, gender: Gender.FEMALE, salesCount: 305,
      },
    ],
  },
  {
    slug: 'pants',
    name: 'Pants',
    sizeLabels: ['28', '30', '32', '34'],
    colorNames: ['Black', 'Olive'],
    products: [
      {
        name: 'Relaxed Fit Cargo Pants', slug: 'relaxed-fit-cargo-pants', basePrice: 2999, rating: { avg: 4.4, count: 42 },
        material: 'Cotton Twill', fitType: FitType.RELAXED, pattern: Pattern.SOLID, gender: Gender.MALE, salesCount: 180,
      },
      {
        name: 'Straight Leg Denim', slug: 'straight-leg-denim', basePrice: 3299,
        material: 'Denim', fitType: FitType.REGULAR, pattern: Pattern.SOLID, gender: Gender.FEMALE, salesCount: 150,
      },
    ],
  },
  {
    slug: 'hoodies',
    name: 'Hoodies',
    sizeLabels: ['S', 'M', 'L', 'XL'],
    colorNames: ['Black', 'Charcoal', 'Navy'],
    products: [
      {
        name: 'Washed Pullover Hoodie', slug: 'washed-pullover-hoodie', basePrice: 3799, rating: { avg: 4.8, count: 156 },
        material: 'Fleece', fitType: FitType.OVERSIZED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.LONG, gender: Gender.UNISEX, salesCount: 390,
      },
      {
        name: 'Embroidered Zip Hoodie', slug: 'embroidered-zip-hoodie', basePrice: 4199, rating: { avg: 4.5, count: 73 },
        material: 'Fleece', fitType: FitType.RELAXED, pattern: Pattern.GRAPHIC, sleeveLength: SleeveLength.LONG, gender: Gender.MALE, salesCount: 260,
      },
      {
        name: 'Heavyweight Box Hoodie', slug: 'heavyweight-box-hoodie', basePrice: 4499,
        material: 'Fleece', fitType: FitType.OVERSIZED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.LONG, gender: Gender.FEMALE, salesCount: 95,
      },
    ],
  },
  {
    slug: 'polos',
    name: 'Polos',
    sizeLabels: ['S', 'M', 'L', 'XL'],
    colorNames: ['Black', 'White', 'Navy'],
    products: [
      {
        name: 'Pique Knit Polo', slug: 'pique-knit-polo', basePrice: 2499, rating: { avg: 4.2, count: 31 },
        material: 'Pique Cotton', fitType: FitType.REGULAR, pattern: Pattern.SOLID, sleeveLength: SleeveLength.SHORT, gender: Gender.MALE, salesCount: 140,
      },
      {
        name: 'Relaxed Fit Polo', slug: 'relaxed-fit-polo', basePrice: 2699, rating: { avg: 4.6, count: 95 },
        material: 'Pique Cotton', fitType: FitType.RELAXED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.SHORT, gender: Gender.FEMALE, salesCount: 175,
      },
    ],
  },
  {
    slug: 'shirts',
    name: 'Shirts',
    sizeLabels: ['S', 'M', 'L', 'XL'],
    colorNames: ['White', 'Black', 'Olive'],
    products: [
      {
        name: 'Boxy Flannel Shirt', slug: 'boxy-flannel-shirt', basePrice: 3199, rating: { avg: 4.4, count: 61 },
        material: 'Flannel', fitType: FitType.RELAXED, pattern: Pattern.STRIPED, sleeveLength: SleeveLength.LONG, gender: Gender.MALE, salesCount: 130,
      },
      {
        name: 'Relaxed Oxford Shirt', slug: 'relaxed-oxford-shirt', basePrice: 2899, rating: { avg: 4.1, count: 22 },
        material: 'Oxford Cotton', fitType: FitType.RELAXED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.LONG, gender: Gender.FEMALE, salesCount: 70,
      },
    ],
  },
  {
    slug: 'sweatshirts',
    name: 'Sweatshirts',
    sizeLabels: ['S', 'M', 'L', 'XL'],
    colorNames: ['Charcoal', 'Navy', 'Olive'],
    products: [
      {
        name: 'Crewneck Sweatshirt', slug: 'crewneck-sweatshirt', basePrice: 3499, rating: { avg: 4.7, count: 110 },
        material: 'Fleece', fitType: FitType.OVERSIZED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.LONG, gender: Gender.UNISEX, salesCount: 290,
      },
      {
        name: 'Washed Vintage Sweatshirt', slug: 'washed-vintage-sweatshirt', basePrice: 3699, rating: { avg: 4.3, count: 48 },
        material: 'Fleece', fitType: FitType.RELAXED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.LONG, gender: Gender.FEMALE, salesCount: 160,
      },
    ],
  },
  {
    slug: 'jackets',
    name: 'Jackets',
    sizeLabels: ['S', 'M', 'L', 'XL'],
    colorNames: ['Black', 'Charcoal', 'Olive'],
    products: [
      {
        name: 'Coach Jacket', slug: 'coach-jacket', basePrice: 5999, rating: { avg: 4.9, count: 67 },
        material: 'Cotton Twill', fitType: FitType.RELAXED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.LONG, gender: Gender.MALE, salesCount: 220,
      },
      {
        name: 'Quilted Bomber Jacket', slug: 'quilted-bomber-jacket', basePrice: 6999, rating: { avg: 4.5, count: 39 },
        material: 'Nylon', fitType: FitType.OVERSIZED, pattern: Pattern.SOLID, sleeveLength: SleeveLength.LONG, gender: Gender.FEMALE, salesCount: 190,
      },
    ],
  },
];

async function main() {
  const sizeRecords: Record<string, { id: string }> = {};
  for (const s of APPAREL_SIZES) {
    sizeRecords[s.label] = await prisma.size.upsert({
      where: { label: s.label },
      update: {},
      create: { ...s, type: SizeType.APPAREL },
    });
  }
  for (const s of NUMERIC_SIZES) {
    sizeRecords[s.label] = await prisma.size.upsert({
      where: { label: s.label },
      update: {},
      create: { ...s, type: SizeType.NUMERIC },
    });
  }

  const colorRecords: Record<string, { id: string }> = {};
  for (const c of COLORS) {
    colorRecords[c.name] = await prisma.color.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug },
    });

    for (const p of cat.products) {
      const ratingFields = p.rating ? { avgRating: p.rating.avg, reviewCount: p.rating.count } : {};
      const attributeFields = {
        material: p.material,
        fitType: p.fitType,
        pattern: p.pattern,
        sleeveLength: p.sleeveLength,
        gender: p.gender,
        salesCount: p.salesCount,
      };

      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: { basePrice: p.basePrice, ...ratingFields, ...attributeFields },
        create: {
          name: p.name,
          slug: p.slug,
          description: `${p.name} — everyday streetwear essential cut for a relaxed, youthful fit.`,
          basePrice: p.basePrice,
          status: ProductStatus.ACTIVE,
          categoryId: category.id,
          ...ratingFields,
          ...attributeFields,
        },
      });

      // Images are committed static files under frontend/public/products/ (not an external
      // image host) so the demo never shows broken-image icons from a flaky third party.
      // Re-seeding should leave exactly the two seed images in place, not pile up duplicates.
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.createMany({
        data: [
          { productId: product.id, url: `/products/${p.slug}-1.jpg`, position: 0 },
          { productId: product.id, url: `/products/${p.slug}-2.jpg`, position: 1 },
        ],
      });

      for (const sizeLabel of cat.sizeLabels) {
        for (const colorName of cat.colorNames) {
          const sku = `${p.slug}-${sizeLabel}-${colorName}`.toUpperCase();
          await prisma.productVariant.upsert({
            where: { productId_sizeId_colorId: { productId: product.id, sizeId: sizeRecords[sizeLabel].id, colorId: colorRecords[colorName].id } },
            update: { price: p.basePrice },
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
