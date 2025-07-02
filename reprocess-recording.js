const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function reprocessRecording() {
  console.log('🔄 Iniciando reprocessamento de gravações com falha...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Buscar gravações com falha ou sem processamento AI
    const recordings = await pool.query(`
      SELECT cr.*, a.user_id as patient_id, a.doctor_id, d.user_id as doctor_user_id
      FROM consultation_recordings cr
      JOIN appointments a ON cr.appointment_id = a.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE cr.transcription_status = 'failed' 
         OR cr.ai_processing_status = 'failed'
         OR (cr.transcription IS NOT NULL AND cr.ai_processing_status IS NULL)
         OR cr.ai_processing_status = 'pending'
      ORDER BY cr.created_at DESC
      LIMIT 10
    `);

    if (recordings.rows.length === 0) {
      console.log('✅ Nenhuma gravação pendente de processamento!');
      return;
    }

    console.log(`📋 Encontradas ${recordings.rows.length} gravações para processar:\n`);

    for (const recording of recordings.rows) {
      console.log(`\n🎙️ Processando Recording ID: ${recording.id} (Appointment: ${recording.appointment_id})`);
      
      try {
        // Se tem transcrição mas não tem notas AI, processar com GPT-4
        if (recording.transcription && (!recording.ai_processing_status || recording.ai_processing_status === 'failed')) {
          console.log('📝 Gerando prontuário médico com GPT-4...');
          
          const aiPrompt = `
            Você é um médico assistente especializado em criar prontuários médicos detalhados e profissionais.
            
            Com base na transcrição da consulta abaixo, crie um prontuário médico completo seguindo o formato SOAP (Subjetivo, Objetivo, Avaliação, Plano).
            
            Transcrição da consulta:
            ${recording.transcription}
            
            Por favor, forneça:
            1. Nota SOAP completa e detalhada
            2. Prescrições (se houver)
            3. Resumo executivo da consulta
            
            Formato da resposta em JSON:
            {
              "soap_note": {
                "subjective": "...",
                "objective": "...",
                "assessment": "...",
                "plan": "..."
              },
              "prescription": {
                "medications": [],
                "instructions": "",
                "warnings": ""
              },
              "summary": "..."
            }
          `;

          const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: aiPrompt }],
            model: "gpt-4-turbo-preview",
            temperature: 0.3,
            response_format: { type: "json_object" }
          });

          const aiNotes = JSON.parse(completion.choices[0].message.content);
          
          // Atualizar a gravação com as notas AI
          await pool.query(`
            UPDATE consultation_recordings
            SET 
              soap_note = $1,
              prescription = $2,
              summary = $3,
              ai_processing_status = 'completed',
              ai_processing_error = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
          `, [
            JSON.stringify(aiNotes.soap_note),
            JSON.stringify(aiNotes.prescription),
            aiNotes.summary,
            recording.id
          ]);

          console.log('✅ Notas AI geradas com sucesso!');

          // Criar prontuário médico se não existir
          const existingRecord = await pool.query(`
            SELECT id FROM medical_records
            WHERE appointment_id = $1
          `, [recording.appointment_id]);

          if (existingRecord.rows.length === 0) {
            console.log('📋 Criando prontuário médico...');
            
            await pool.query(`
              INSERT INTO medical_records (
                patient_id,
                doctor_id,
                appointment_id,
                content,
                status,
                ai_generated,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            `, [
              recording.patient_id,
              recording.doctor_user_id || recording.doctor_id,
              recording.appointment_id,
              JSON.stringify({
                chief_complaint: aiNotes.summary || 'Consulta de emergência',
                subjective: aiNotes.soap_note.subjective || '',
                objective: aiNotes.soap_note.objective || '',
                assessment: aiNotes.soap_note.assessment || '',
                plan: aiNotes.soap_note.plan || '',
                prescriptions: aiNotes.prescription ? [aiNotes.prescription] : []
              }),
              'draft',
              true
            ]);

            console.log('✅ Prontuário médico criado com sucesso!');
          } else {
            console.log('ℹ️  Prontuário já existe para esta consulta.');
          }
        }

        // Se não tem transcrição, tentar transcrever novamente
        if (!recording.transcription && recording.file_path) {
          console.log('🎤 Tentando transcrever o áudio novamente...');
          // Aqui você poderia implementar a re-transcrição se necessário
          console.log('⚠️  Re-transcrição automática não implementada. Use a API diretamente se necessário.');
        }

      } catch (error) {
        console.error(`❌ Erro ao processar recording ${recording.id}:`, error.message);
        
        // Atualizar status de erro
        await pool.query(`
          UPDATE consultation_recordings
          SET 
            ai_processing_status = 'failed',
            ai_processing_error = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [error.message, recording.id]);
      }
    }

    console.log('\n✨ Reprocessamento concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar
reprocessRecording().catch(console.error);