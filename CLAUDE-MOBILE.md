# CNVidas Mobile - Guia de Desenvolvimento

Este documento contém todas as informações necessárias para o desenvolvimento do aplicativo mobile CNVidas. Deve ser usado como referência ao trabalhar no repositório `cnvidas-mobile`.

## 📱 Contexto do Projeto

### Visão Geral
O CNVidas Mobile é a versão para iOS e Android do sistema de telemedicina CNVidas. O aplicativo permitirá que pacientes e médicos acessem as funcionalidades principais da plataforma através de seus dispositivos móveis.

### Relação com Sistema Web
- **Web API**: https://api.cnvidas.com.br (produção)
- **Web App**: Sistema React/TypeScript com Vite
- **Backend**: Node.js/Express com PostgreSQL
- **Autenticação**: JWT tokens
- **Pagamentos**: Stripe

### Decisões de Arquitetura
1. **Repositório Separado**: Desenvolvimento independente do web para zero risco
2. **React Native + Expo**: Máxima reutilização de conhecimento React
3. **TypeScript**: Consistência com projeto web
4. **Compartilhamento**: Copiar código necessário (não compartilhar ainda)

## 🏗️ Estrutura do Projeto

```
cnvidas-mobile/
├── src/
│   ├── screens/              # Telas do aplicativo
│   │   ├── auth/            # Login, Registro, etc
│   │   ├── patient/         # Telas do paciente
│   │   ├── doctor/          # Telas do médico
│   │   └── common/          # Telas compartilhadas
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes de UI base
│   │   └── shared/         # Componentes de negócio
│   ├── navigation/          # React Navigation
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── PatientNavigator.tsx
│   │   └── DoctorNavigator.tsx
│   ├── services/            # Serviços e API
│   │   ├── api/            # Clients API
│   │   ├── storage/        # AsyncStorage helpers
│   │   └── auth/           # Autenticação
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Funções utilitárias
│   ├── types/               # TypeScript types
│   ├── constants/           # Constantes
│   └── assets/              # Imagens, fontes
├── ios/                     # Código nativo iOS
├── android/                 # Código nativo Android
├── __tests__/               # Testes
└── app.json                # Configuração Expo
```

## 🛠️ Setup Inicial

### 1. Criar Repositório
```bash
# Criar pasta do projeto
mkdir ~/Documents/CNVidas/cnvidas-mobile
cd ~/Documents/CNVidas/cnvidas-mobile

# Inicializar com Expo
npx create-expo-app . --template expo-template-blank-typescript

# Inicializar Git
git init
git remote add origin https://github.com/[usuario]/cnvidas-mobile.git
```

### 2. Dependências Essenciais
```bash
# Navegação
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# Estado e API
npm install @tanstack/react-query axios
npm install zustand

# Storage Seguro
npm install @react-native-async-storage/async-storage
npm install expo-secure-store

# UI e Componentes
npm install react-native-elements react-native-vector-icons
npm install react-native-gesture-handler react-native-reanimated

# Formulários
npm install react-hook-form zod @hookform/resolvers

# Utilitários
npm install date-fns react-native-dotenv
```

### 3. Configuração TypeScript
```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

## 🔌 Integração com API

### Configuração Base
```typescript
// src/services/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URLS = {
  development: 'http://localhost:5000',
  staging: 'https://staging-api.cnvidas.com.br',
  production: 'https://api.cnvidas.com.br'
};

export const apiClient = axios.create({
  baseURL: API_URLS[process.env.NODE_ENV || 'development'],
  timeout: 30000,
});

// Interceptor para adicionar token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/check` - Verificar autenticação

#### Paciente
- `GET /api/appointments` - Listar consultas
- `POST /api/appointments` - Agendar consulta
- `GET /api/doctors` - Listar médicos
- `POST /api/emergency/request` - Solicitar emergência

#### Médico
- `GET /api/doctors/appointments` - Consultas do médico
- `GET /api/doctors/profile` - Perfil do médico
- `POST /api/doctors/availability` - Atualizar disponibilidade
- `GET /api/emergency/notifications` - Notificações de emergência

## 📊 Tipos e Interfaces

### Copiar do Projeto Web
```bash
# Tipos principais para copiar
- User (client/src/types/user.ts)
- Doctor (client/src/types/doctor.ts)
- Patient (client/src/types/patient.ts)
- Appointment (client/src/types/appointment.ts)
- Emergency (client/src/types/emergency.ts)
```

### Adaptações Necessárias
```typescript
// Remover imports web-específicos
// De: import { useLocation } from 'wouter'
// Para: import { useNavigation } from '@react-navigation/native'

// Adaptar tipos de eventos
// De: onClick: (e: MouseEvent) => void
// Para: onPress: () => void
```

## 🎯 Fluxo de Desenvolvimento

### Fase 1: Autenticação (Semana 1)
1. [ ] Tela de Splash
2. [ ] Tela de Login
3. [ ] Tela de Registro (com seleção de role)
4. [ ] Recuperação de senha
5. [ ] Persistência de sessão

### Fase 2: Dashboard Básico (Semana 2)
1. [ ] Dashboard Paciente
2. [ ] Dashboard Médico
3. [ ] Navegação bottom tabs
4. [ ] Lista de consultas
5. [ ] Perfil do usuário

### Fase 3: Agendamento (Semana 3-4)
1. [ ] Lista de médicos
2. [ ] Detalhes do médico
3. [ ] Calendário de disponibilidade
4. [ ] Confirmação de agendamento
5. [ ] Pagamento (Stripe)

### Fase 4: Emergência (Semana 5)
1. [ ] Botão de emergência
2. [ ] Sala de espera virtual
3. [ ] Notificações push para médicos
4. [ ] Interface de atendimento

### Fase 5: Telemedicina (Semana 6-8)
1. [ ] Integração WebRTC
2. [ ] Controles de chamada
3. [ ] Chat durante consulta
4. [ ] Compartilhamento de arquivos
5. [ ] Prescrições digitais

### Fase 6: Features Avançadas
1. [ ] Histórico médico
2. [ ] Dependentes
3. [ ] Notificações push
4. [ ] Modo offline
5. [ ] Biometria

## 🎨 Design System

### Cores (Mesmas do Web)
```typescript
const colors = {
  primary: '#3B82F6',      // Blue 500
  secondary: '#10B981',    // Emerald 500
  danger: '#EF4444',       // Red 500
  warning: '#F59E0B',      // Amber 500
  success: '#10B981',      // Green 500
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F9FAFB',
  
  // Text
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    inverse: '#FFFFFF'
  }
};
```

### Componentes Base
```typescript
// Mapear componentes web para mobile
- Button (shadcn/ui) → Button (react-native-elements)
- Card → View com elevation/shadow
- Input → TextInput customizado
- Select → Picker ou ActionSheet
```

## 🚀 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar Metro Bundler
npm start

# Rodar no iOS
npm run ios

# Rodar no Android
npm run android

# Limpar cache
npx expo start -c
```

### Build
```bash
# Build preview
eas build --profile preview

# Build produção iOS
eas build --platform ios

# Build produção Android
eas build --platform android
```

## 🔐 Variáveis de Ambiente

```bash
# .env.development
API_URL=http://localhost:5000
STRIPE_PUBLISHABLE_KEY=pk_test_...

# .env.production
API_URL=https://api.cnvidas.com.br
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 📝 Checklist Pré-Desenvolvimento

### Antes de Começar
- [ ] Repositório criado no GitHub
- [ ] Expo CLI instalado globalmente
- [ ] Ambiente iOS (Xcode) configurado
- [ ] Ambiente Android (Android Studio) configurado
- [ ] Conta Expo criada
- [ ] EAS CLI instalado

### Configurações Iniciais
- [ ] TypeScript configurado
- [ ] ESLint + Prettier configurados
- [ ] Estrutura de pastas criada
- [ ] Navegação básica implementada
- [ ] Cliente API configurado

## 🤝 Integração com Web

### Código para Copiar/Adaptar
1. **Validações Zod**
   - Schemas de formulários
   - Validações de CPF/CNPJ

2. **Funções Utilitárias**
   - Formatadores de data
   - Formatadores de moeda
   - Máscaras de input

3. **Hooks Customizados**
   - useAuth (adaptar para mobile)
   - useApi (adaptar para React Query mobile)

### Manter Sincronizado
- Tipos TypeScript
- Endpoints da API
- Regras de negócio
- Validações

## 📱 Considerações Mobile Específicas

### Performance
- Implementar virtualização para listas grandes
- Otimizar imagens com cache
- Lazy loading de telas
- Minimizar re-renders

### UX Mobile
- Gestos nativos (swipe, pull-to-refresh)
- Feedback háptico
- Animações suaves (60 FPS)
- Estados de loading claros

### Segurança
- Armazenar tokens em SecureStore
- Implementar certificate pinning
- Detectar jailbreak/root
- Criptografar dados sensíveis

## 🚨 Problemas Comuns e Soluções

### Metro Bundler
```bash
# Cache corrompido
npx react-native start --reset-cache

# Erro de dependências
cd ios && pod install
```

### Build Issues
```bash
# Android: limpar build
cd android && ./gradlew clean

# iOS: limpar DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData
```

## 📚 Recursos Úteis

### Documentação
- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Elements](https://reactnativeelements.com/docs)

### Ferramentas
- [Reactotron](https://github.com/infinitered/reactotron) - Debug
- [Flipper](https://fbflipper.com/) - Debug avançado
- [React DevTools](https://reactnative.dev/docs/debugging#react-developer-tools)

---

**Última atualização**: ${new Date().toLocaleDateString('pt-BR')}

**Nota**: Este documento deve ser mantido atualizado conforme o desenvolvimento avança. Sempre consulte a versão mais recente antes de implementar novas features.