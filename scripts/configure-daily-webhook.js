const fetch = require('node-fetch');
require('dotenv').config();

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;
const WEBHOOK_URL = process.env.DAILY_WEBHOOK_URL || 'https://cnvidas.onrender.com/api/webhooks/daily-recording';

async function configureDailyWebhook() {
  console.log('🔧 Configurando webhook do Daily.co...');
  console.log('📍 URL do webhook:', WEBHOOK_URL);
  
  try {
    // Configurar webhook para eventos de gravação
    const response = await fetch(`https://api.daily.co/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        hmac: process.env.DAILY_WEBHOOK_SECRET || 'cnvidas-webhook-secret-2024',
        eventTypes: [
          'recording.started',
          'recording.stopped',
          'recording.ready-to-download',
          'recording.error'
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao configurar webhook: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('✅ Webhook configurado com sucesso!');
    console.log('📋 Detalhes:', result);
    
    // Listar webhooks existentes
    console.log('\n📋 Listando webhooks configurados...');
    const listResponse = await fetch(`https://api.daily.co/v1/webhooks`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });
    
    if (listResponse.ok) {
      const webhooks = await listResponse.json();
      console.log('📋 Webhooks ativos:');
      webhooks.data.forEach(webhook => {
        console.log(`  - ID: ${webhook.id}`);
        console.log(`    URL: ${webhook.url}`);
        console.log(`    Eventos: ${webhook.eventTypes.join(', ')}`);
        console.log(`    Criado em: ${webhook.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar configuração
configureDailyWebhook();