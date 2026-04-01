import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'qr_home',
    entities: [],
    synchronize: false,
  });

  await dataSource.initialize();

  // Seed admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  await dataSource.query(
    `INSERT INTO admins (id, username, password_hash, created_at)
     VALUES (gen_random_uuid(), $1, $2, NOW())
     ON CONFLICT (username) DO NOTHING`,
    ['admin', passwordHash],
  );

  // Seed default categories
  const categories = [
    { name: 'Skincare', slug: 'skincare', sort_order: 1 },
    { name: 'Massage', slug: 'massage', sort_order: 2 },
    { name: 'Therapy', slug: 'therapy', sort_order: 3 },
    { name: 'Combo', slug: 'combo', sort_order: 4 },
  ];

  for (const cat of categories) {
    await dataSource.query(
      `INSERT INTO categories (id, name, slug, sort_order, is_active, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
       ON CONFLICT (slug) DO NOTHING`,
      [cat.name, cat.slug, cat.sort_order],
    );
  }

  console.log(
    '✅ Seed completed: admin user (admin/admin123) and categories created',
  );
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
