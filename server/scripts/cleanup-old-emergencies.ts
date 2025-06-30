import 'dotenv/config';
import { cleanupOldEmergencyAppointments } from '../utils/emergency-cleanup';

async function runCleanup() {
  console.log('🔧 Iniciando limpeza manual de emergências antigas...');
  
  try {
    const result = await cleanupOldEmergencyAppointments();
    console.log('✅ Limpeza concluída com sucesso!');
    console.log('📊 Resultados:', result);
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
  
  process.exit(0);
}

runCleanup();