import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function runQuery() {
  const query = process.argv[2];
  
  if (!query) {
    console.error('Please provide a SQL query as an argument');
    process.exit(1);
  }
  
  const sql = postgres(databaseUrl);
  
  try {
    console.log('Running query:', query);
    const result = await sql.unsafe(query);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    await sql.end();
  }
}

runQuery();