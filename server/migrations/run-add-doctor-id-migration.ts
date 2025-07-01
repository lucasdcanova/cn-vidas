import 'dotenv/config';
import { pool } from '../db';
import fs from 'fs/promises';
import path from 'path';

async function runMigration() {
  console.log('🚀 Iniciando migration para adicionar doctor_id em consultation_recordings...');
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), 'db/migrations/0010_add_doctor_id_to_consultation_recordings.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    console.log('📄 SQL a ser executado:');
    console.log(sql);
    
    // Executar a migration
    await pool.query(sql);
    
    console.log('✅ Migration executada com sucesso!');
    
    // Verificar se a coluna foi adicionada
    const checkResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'consultation_recordings' 
      AND column_name = 'doctor_id'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna doctor_id adicionada com sucesso:', checkResult.rows[0]);
    } else {
      console.log('⚠️  Coluna doctor_id não foi encontrada após a migration');
    }
    
    // Verificar quantos registros foram atualizados
    const countResult = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(doctor_id) as com_doctor_id
      FROM consultation_recordings
    `);
    
    console.log('📊 Estatísticas após migration:');
    console.log(`   Total de registros: ${countResult.rows[0].total}`);
    console.log(`   Registros com doctor_id: ${countResult.rows[0].com_doctor_id}`);
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar a migration
runMigration().catch(console.error);