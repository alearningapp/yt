import { defineConfig } from 'drizzle-kit';
console.log('base',process.env.DATABASE_URL);
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!||"postgresql://postgresql:password@localhost:5432/helpyt",
  },
});
