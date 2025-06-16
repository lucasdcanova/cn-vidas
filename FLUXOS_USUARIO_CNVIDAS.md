# Documentação de Fluxos de Usuário - Sistema CNVidas

## Índice
1. [Visão Geral](#visão-geral)
2. [Fluxo do Paciente](#fluxo-do-paciente)
3. [Fluxo do Médico](#fluxo-do-médico)
4. [Fluxo de Consultas de Emergência](#fluxo-de-consultas-de-emergência)
5. [Fluxo de Consultas Agendadas](#fluxo-de-consultas-agendadas)
6. [Fluxo do Parceiro/Empresa](#fluxo-do-parceiroempresa)
7. [Fluxo do Administrador](#fluxo-do-administrador)
8. [Fluxos de Pagamento](#fluxos-de-pagamento)
9. [Fluxos de Comunicação](#fluxos-de-comunicação)

---

## Visão Geral

O sistema CNVidas é uma plataforma completa de telemedicina que conecta pacientes, médicos, empresas parceiras e administradores. A plataforma oferece consultas agendadas, atendimentos de emergência, gestão de planos de saúde e benefícios corporativos.

### Tipos de Usuários
- **Pacientes**: Usuários finais que buscam atendimento médico
- **Médicos**: Profissionais de saúde que realizam os atendimentos
- **Parceiros/Empresas**: Organizações que oferecem serviços com desconto
- **Administradores**: Gestores da plataforma

---

## Fluxo do Paciente

### 1. Jornada Completa do Paciente

#### 1.1 Cadastro e Primeiro Acesso
1. **Acesso inicial** (`/auth`)
   - Paciente acessa a página de autenticação
   - Seleciona a aba "Cadastro"
   - Escolhe o tipo de perfil "Paciente"

2. **Preenchimento de dados**
   - Email
   - CPF (obrigatório e validado)
   - Senha (mínimo 6 caracteres)
   - Nome completo
   - Aceite dos termos:
     - Termos de Uso
     - Política de Privacidade
     - Contrato de Adesão dos Planos
     - Política de Gravação de Teleconsultas

3. **Verificação de email**
   - Sistema envia email de verificação
   - Paciente é redirecionado para `/verificar-email`
   - Clica no link recebido por email
   - Conta é ativada

#### 1.2 Seleção Obrigatória de Plano
1. **Redirecionamento automático** (`/first-subscription`)
   - Após login inicial, paciente é direcionado para seleção de plano
   - Não pode acessar outras áreas sem selecionar um plano

2. **Opções de planos**
   - **Toggle Individual/Familiar**: Escolha entre planos para uma pessoa ou família
   - **Planos disponíveis**:
     - **Gratuito**: Sem custo, funcionalidades básicas
     - **Basic**: 2 consultas de emergência/mês, 30% desconto em agendadas
     - **Premium**: Consultas emergência ilimitadas, 50% desconto
     - **Ultra**: Consultas emergência ilimitadas, 70% desconto

3. **Processo de seleção**
   - **Plano Gratuito**: 
     - Clica em "Escolher Este Plano"
     - Plano é ativado automaticamente
     - Redirecionado para dashboard
   
   - **Planos Pagos**:
     - Clica em "Escolher Este Plano"
     - Modal de checkout é aberto
     - Preenche dados de pagamento (cartão de crédito)
     - Confirma pagamento
     - Animação de ativação é exibida
     - Redirecionado para dashboard após confirmação

#### 1.3 Dashboard Principal
1. **Elementos do dashboard** (`/dashboard`)
   - **Card de boas-vindas**: Personalizado com nome do usuário
   - **Status da assinatura**: Mostra plano atual e status
   - **Status de telemedicina**: Consultas disponíveis/restantes
   - **Atividades recentes**: Histórico de ações na plataforma
   - **Consultas agendadas**: Lista de próximas consultas
   - **Serviços em destaque**: Ofertas de parceiros

2. **Navegação principal**
   - **Telemedicina**: Acesso a consultas
   - **Serviços**: Catálogo de parceiros
   - **Reembolsos**: Solicitação de reembolsos
   - **Dependentes**: Gestão de familiares
   - **Pagamentos**: Histórico financeiro
   - **Configurações**: Perfil e preferências

### 2. Fluxo de Consulta para Paciente

#### 2.1 Acessar Telemedicina
1. **Navegação** (`/telemedicine`)
   - Clica em "Telemedicina" no menu
   - Visualiza duas abas:
     - "Atendimento de Emergência"
     - "Agendar Consulta"

#### 2.2 Consulta de Emergência
1. **Verificação de elegibilidade**
   - Sistema verifica plano do usuário
   - Planos Ultra/Premium: Acesso ilimitado
   - Plano Basic: Verifica consultas restantes (máx 2/mês)
   - Sem plano: Pagamento integral necessário

2. **Seleção de médico**
   - Lista de médicos online disponíveis
   - Exibe especialidade e status "Online Agora"
   - Mostra valor ou se está incluso no plano

3. **Iniciar consulta**
   - Clica em "Iniciar Consulta de Emergência"
   - Sistema cria consulta e sala de vídeo
   - Redirecionado para `/unified-emergency-room?id=[ID]`

4. **Na sala de emergência**
   - Interface de vídeo minimalista
   - Controles: áudio, vídeo, encerrar
   - Chat integrado
   - Aguarda médico entrar na sala

#### 2.3 Consulta Agendada
1. **Busca e filtros**
   - Campo de busca por nome/especialidade
   - Filtro por especialidade
   - Lista de médicos disponíveis

2. **Visualização de médicos**
   - Foto/avatar do profissional
   - Nome completo com prefixo Dr./Dra.
   - Especialidade
   - Valor da consulta com desconto do plano

3. **Agendamento**
   - Clica em "Agendar Consulta"
   - Modal com calendário
   - Seleciona data disponível
   - Escolhe horário livre
   - Confirma agendamento

4. **Pagamento (pré-autorização)**
   - Modal de pagamento é aberto
   - Informa valor com desconto aplicado
   - Preenche dados do cartão
   - Sistema faz pré-autorização
   - Consulta é agendada

5. **Gestão de consultas agendadas**
   - Visualiza no dashboard ou em `/telemedicine`
   - Informações exibidas:
     - Data e horário
     - Médico responsável
     - Tempo restante
     - Status de cancelamento
   - **Cancelamento**:
     - Permitido até 12h antes (sem cobrança)
     - Após 12h: Cobrança integral

### 3. Fluxo de Outros Recursos

#### 3.1 Serviços de Parceiros
1. **Acesso** (`/services`)
   - Lista completa de parceiros
   - Filtros por categoria/localização
   - Exibe desconto exclusivo CNVidas

2. **Contato com parceiro**
   - Clica em "Entrar em Contato"
   - Abre WhatsApp com mensagem padrão
   - Menciona ser cliente CNVidas

#### 3.2 Solicitação de Reembolso
1. **Criar solicitação** (`/claims/new`)
   - Preenche formulário:
     - Tipo de despesa
     - Valor
     - Data
     - Descrição
   - Anexa comprovantes (imagens/PDF)
   - Envia para análise

2. **Acompanhamento** (`/claims`)
   - Lista de solicitações
   - Status: Em análise/Aprovado/Rejeitado
   - Histórico de pagamentos

#### 3.3 Gestão de Dependentes
1. **Adicionar dependente** (`/dependents`)
   - Somente em planos familiares
   - Preenche dados:
     - Nome completo
     - CPF
     - Data de nascimento
     - Parentesco
   - Dependente tem acesso próprio

2. **Gerenciar dependentes**
   - Lista de familiares cadastrados
   - Pode remover/editar
   - Visualiza uso de benefícios

---

## Fluxo do Médico

### 1. Cadastro e Onboarding

#### 1.1 Registro Inicial
1. **Cadastro** (`/auth`)
   - Seleciona perfil "Médico"
   - Preenche:
     - Email profissional
     - CRM (estado + número)
     - Senha
     - Nome completo
   - Aceita termos específicos

2. **Verificação**
   - Confirma email
   - Aguarda validação do CRM (admin)

#### 1.2 Onboarding Obrigatório
1. **Primeira etapa** (`/doctor-onboarding`)
   - Upload de foto profissional
   - Dados pessoais completos
   - Especialização médica

2. **Segunda etapa**
   - Biografia profissional
   - Formação acadêmica
   - Anos de experiência
   - Áreas de atuação

3. **Terceira etapa**
   - Configuração de pagamento:
     - Conta bancária (PIX)
     - Valor da consulta
   - Disponibilidade para emergências
   - Preferências de atendimento

### 2. Dashboard do Médico

#### 2.1 Tela Principal (`/doctor-telemedicine`)
1. **Elementos principais**
   - Status de emergência (ativo/inativo)
   - Lista de consultas do dia
   - Notificações de emergência
   - Estatísticas de atendimento

2. **Gestão de disponibilidade**
   - Toggle para emergências
   - Agenda de horários
   - Bloqueio de datas

### 3. Fluxo de Atendimento

#### 3.1 Consultas Agendadas
1. **Visualização**
   - Lista ordenada por horário
   - Informações do paciente:
     - Nome e idade
     - Email e telefone
     - Tipo de consulta

2. **Início da consulta**
   - Botão "Iniciar Consulta" (ativo no horário)
   - Redirecionado para sala de vídeo
   - Interface profissional com:
     - Vídeo HD
     - Compartilhamento de tela
     - Chat
     - Anotações

3. **Durante a consulta**
   - Gravação automática (se autorizado)
   - Pode gerar prontuário
   - Prescrições digitais
   - Encaminhamentos

4. **Finalização**
   - Resumo do atendimento
   - Prontuário salvo
   - Pagamento processado automaticamente

#### 3.2 Atendimentos de Emergência
1. **Notificação**
   - Pop-up/som quando paciente solicita
   - Mostra dados básicos do paciente
   - Tempo para aceitar (2 minutos)

2. **Aceitação**
   - Clica em "Atender Emergência"
   - Entra direto na sala
   - Paciente é notificado

3. **Recusa/Timeout**
   - Sistema busca próximo médico
   - Não afeta estatísticas

### 4. Gestão Financeira

#### 4.1 Painel Financeiro (`/doctor/financeiro`)
1. **Visão geral**
   - Saldo disponível
   - Próximo pagamento
   - Histórico de transações

2. **Detalhamento**
   - Lista de consultas realizadas
   - Valores por tipo (emergência/agendada)
   - Status de pagamento

3. **Saques**
   - Pagamentos semanais automáticos
   - Via PIX para conta cadastrada
   - Comprovantes disponíveis

---

## Fluxo de Consultas de Emergência

### 1. Iniciação pelo Paciente

1. **Acesso rápido**
   - Dashboard → "Consulta de Emergência"
   - Ou Telemedicina → Aba "Emergência"

2. **Verificação de elegibilidade**
   ```
   IF plano == "Ultra" OR plano == "Premium" THEN
      Acesso liberado (ilimitado)
   ELSE IF plano == "Basic" AND emergencyConsultationsLeft > 0 THEN
      Acesso liberado (debita uma consulta)
   ELSE
      Solicita pagamento integral
   END IF
   ```

3. **Seleção de médico disponível**
   - Lista apenas médicos com `availableForEmergency = true`
   - Status "Online Agora" em tempo real
   - Ordenados por disponibilidade

### 2. Criação da Sala

1. **Sistema cria consulta**
   - Gera ID único
   - Cria sala no Daily.co
   - Nome da sala: `emergency-[appointmentId]`
   - Modo público (sem necessidade de tokens)

2. **Notificação ao médico**
   - WebSocket envia alerta
   - Médico tem 2 minutos para aceitar
   - Som e notificação visual

### 3. Conexão e Atendimento

1. **Paciente aguarda**
   - Redirecionado para sala
   - Mensagem: "Médico está sendo notificado"
   - Pode testar áudio/vídeo

2. **Médico entra**
   - Aceita atendimento
   - Entra na mesma sala
   - Conexão P2P estabelecida

3. **Durante a consulta**
   - Vídeo em tela cheia
   - Controles minimalistas
   - Chat lateral
   - Duração flexível

4. **Finalização**
   - Qualquer parte pode encerrar
   - Consulta marcada como "completed"
   - Prontuário pode ser gerado

---

## Fluxo de Consultas Agendadas

### 1. Agendamento

1. **Seleção de médico**
   - Paciente escolhe profissional
   - Visualiza valor com desconto

2. **Escolha de data/hora**
   - Calendário mostra disponibilidade
   - Horários em slots de 30 minutos
   - Mínimo 24h de antecedência

3. **Confirmação e pagamento**
   - Pré-autorização no cartão
   - Email de confirmação
   - Adicionado ao calendário

### 2. Pré-consulta

1. **Lembretes**
   - Email 24h antes
   - Notificação 1h antes
   - SMS 30min antes (opcional)

2. **Preparação**
   - Teste de conexão disponível
   - Checklist de documentos
   - Formulário pré-consulta (opcional)

### 3. Dia da Consulta

1. **Acesso**
   - Botão "Entrar na Consulta" ativo 10min antes
   - Sala de espera virtual
   - Médico é notificado quando paciente entra

2. **Atendimento**
   - Médico inicia pontualmente
   - Ferramentas profissionais disponíveis
   - Gravação mediante autorização

3. **Pós-consulta**
   - Prontuário disponível em 24h
   - Prescrições via email
   - Avaliação do atendimento

### 4. Políticas de Cancelamento

1. **Pelo paciente**
   - Até 12h antes: Sem cobrança
   - Menos de 12h: Cobrança integral
   - No-show: Cobrança integral

2. **Pelo médico**
   - Requer justificativa
   - Paciente não é cobrado
   - Reagendamento prioritário

---

## Fluxo do Parceiro/Empresa

### 1. Cadastro e Verificação

1. **Registro** (`/auth`)
   - Seleciona perfil "Empresa"
   - Dados obrigatórios:
     - CNPJ (validado)
     - Razão social
     - Email corporativo
     - Telefone comercial

2. **Verificação** (`/partner-verification`)
   - Upload de documentos:
     - Contrato social
     - Comprovante de CNPJ
     - Alvará (se aplicável)
   - Aguarda aprovação do admin

### 2. Onboarding

1. **Configuração inicial** (`/partner-onboarding`)
   - Logo da empresa
   - Descrição dos serviços
   - Categorias de atuação
   - Área de cobertura

2. **Configuração de benefícios**
   - Percentual de desconto CNVidas
   - Condições especiais
   - Validade das ofertas

### 3. Dashboard do Parceiro

1. **Visão geral** (`/partner/dashboard`)
   - Clientes atendidos
   - Conversões via CNVidas
   - Feedback recebido

2. **Gestão de serviços** (`/partner/services`)
   - Adicionar/editar serviços
   - Upload de imagens
   - Atualizar preços
   - Ativar/desativar ofertas

3. **Relatórios**
   - Origem dos clientes
   - Serviços mais procurados
   - ROI da parceria

---

## Fluxo do Administrador

### 1. Acesso e Dashboard

1. **Login especial**
   - Autenticação dois fatores
   - IP whitelist (opcional)
   - Logs de acesso

2. **Dashboard admin** (`/admin/dashboard`)
   - Métricas em tempo real:
     - Usuários ativos
     - Consultas do dia
     - Faturamento
     - Taxa de conversão
   - Alertas do sistema
   - Atividades suspeitas

### 2. Gestão de Usuários

1. **Pacientes** (`/admin/users`)
   - Lista completa com filtros
   - Detalhes de assinatura
   - Histórico de uso
   - Ações: suspender/ativar

2. **Médicos**
   - Aprovação de cadastros
   - Verificação de CRM
   - Gestão de reclamações
   - Estatísticas de atendimento

3. **Parceiros** (`/admin/partners`)
   - Aprovação de empresas
   - Auditoria de serviços
   - Gestão de contratos

### 3. Gestão Financeira

1. **Assinaturas** (`/admin/subscription-plans`)
   - Criar/editar planos
   - Definir preços
   - Configurar benefícios
   - Promoções

2. **Pagamentos**
   - Conciliação bancária
   - Reembolsos manuais
   - Relatórios fiscais
   - Comissões médicas

### 4. Operações

1. **Reembolsos** (`/admin/claims`)
   - Fila de aprovação
   - Análise de documentos
   - Aprovação/rejeição
   - Comunicação com paciente

2. **Suporte**
   - Tickets de atendimento
   - Chat com usuários
   - Base de conhecimento
   - Escalonamento

---

## Fluxos de Pagamento

### 1. Assinatura de Planos

1. **Seleção e checkout**
   - Escolha do plano
   - Cálculo automático (mensal/anual)
   - Aplicação de cupons

2. **Processamento**
   - Validação de cartão
   - Criação no Stripe
   - Ativação imediata
   - Fatura por email

3. **Renovação**
   - Cobrança automática mensal
   - Notificação 3 dias antes
   - Retry em caso de falha
   - Suspensão após 3 tentativas

### 2. Consultas Pagas

1. **Pré-autorização**
   - Valor calculado com desconto
   - Hold no cartão
   - Liberação se cancelado

2. **Captura**
   - Após consulta realizada
   - Médico recebe em 7 dias
   - Comprovante para paciente

### 3. Reembolsos

1. **Solicitação aprovada**
   - Admin define valor
   - Crédito na assinatura ou
   - Depósito em conta

2. **Prazo**
   - Análise: até 5 dias úteis
   - Pagamento: até 10 dias úteis

---

## Fluxos de Comunicação

### 1. Notificações In-App

1. **Pacientes recebem**
   - Confirmações de agendamento
   - Lembretes de consulta
   - Status de reembolso
   - Novas funcionalidades

2. **Médicos recebem**
   - Solicitações de emergência
   - Consultas agendadas
   - Pagamentos recebidos
   - Avaliações de pacientes

### 2. Comunicação por Email

1. **Transacionais**
   - Confirmações de cadastro
   - Resetar senha
   - Comprovantes de pagamento
   - Prontuários médicos

2. **Marketing (com opt-in)**
   - Newsletter mensal
   - Dicas de saúde
   - Novos parceiros
   - Promoções

### 3. SMS (Opcional)

1. **Críticos apenas**
   - Código de verificação
   - Lembrete de consulta hoje
   - Emergência aceita

### 4. WhatsApp

1. **Integração com parceiros**
   - Link direto para contato
   - Mensagem pré-formatada
   - Menção ao desconto CNVidas

---

## Considerações de Segurança

### 1. Dados Sensíveis

- **Criptografia**: Todos os dados médicos em AES-256
- **LGPD**: Consentimento explícito para uso
- **Acesso**: Logs de quem acessou o quê
- **Retenção**: Prontuários por 20 anos (lei)

### 2. Pagamentos

- **PCI Compliance**: Via Stripe
- **Tokenização**: Cartões nunca armazenados
- **3D Secure**: Para valores altos
- **Antifraude**: Monitoramento automático

### 3. Videochamadas

- **P2P**: Conexão direta quando possível
- **HIPAA**: Compliance para dados de saúde
- **Gravação**: Somente com duplo consentimento
- **Acesso**: Links únicos por sessão

---

## Conclusão

O sistema CNVidas oferece uma experiência completa e integrada para todos os tipos de usuários. Os fluxos foram desenhados para serem intuitivos, seguros e eficientes, sempre priorizando a qualidade do atendimento médico e a satisfação do usuário.

Para qualquer dúvida sobre os fluxos ou necessidade de maior detalhamento em algum processo específico, consulte a equipe de desenvolvimento.

---

*Documento atualizado em: Dezembro de 2024*
*Versão: 1.0*