# Guia de Otimização de Onboarding para iOS

## Mudanças Implementadas

### 1. Componentes de Scroll Otimizados

#### IOSScrollView
- Componente wrapper que adiciona scroll suave no iOS
- Suporta safe areas automaticamente
- Propriedades de scroll nativo do iOS (`-webkit-overflow-scrolling: touch`)

#### IOSKeyboardAvoidingView
- Ajusta automaticamente o conteúdo quando o teclado aparece
- Usa a API do Capacitor Keyboard para detectar altura do teclado
- Animação suave de transição

#### OnboardingLayout
- Wrapper genérico para todas as telas de onboarding
- Detecta automaticamente se está no iOS e aplica otimizações
- Fallback para web mantém comportamento padrão

### 2. Classes CSS de Safe Area

Adicionadas ao `index.css`:
- `.safe-top`: Padding-top com safe area
- `.safe-bottom`: Padding-bottom com safe area
- `.safe-left/.safe-right`: Padding lateral com safe area
- `.pt-safe/.pb-safe`: Padding com mínimo de 1rem
- `.h-screen-safe`: Altura total considerando safe areas
- `.min-h-screen-safe`: Altura mínima considerando safe areas

### 3. Componentes Atualizados

- ✅ **Doctor Onboarding** (`/pages/doctor-onboarding.tsx`)
- ✅ **Partner Onboarding** (`/pages/partner-onboarding.tsx`)
- ✅ **Doctor Welcome** (`/pages/doctor/welcome.tsx`)
- ✅ **Doctor Onboarding Flow** (`/pages/onboarding/doctor/index.tsx`)

### 4. Melhorias Implementadas

1. **Scroll Responsivo**
   - Todos os formulários agora têm scroll vertical
   - Conteúdo não é mais cortado em telas pequenas
   - Bounce effect nativo do iOS

2. **Keyboard Avoidance**
   - Formulários se ajustam quando o teclado aparece
   - Campos não ficam escondidos atrás do teclado
   - Transição suave sem saltos

3. **Safe Areas**
   - Progress bars não cobrem conteúdo no notch
   - Botões respeitam área inferior (home indicator)
   - Padding automático em dispositivos com notch

4. **Performance**
   - Animações simplificadas para iOS
   - Scroll com aceleração de hardware
   - Menos re-renders durante interações

## Como Usar

### Para novos componentes de onboarding:

```tsx
import { OnboardingLayout } from '@/components/shared/OnboardingLayout';

export function MyOnboarding() {
  return (
    <OnboardingLayout 
      className="bg-gradient-to-b from-blue-50 to-white"
      contentClassName="py-8"
    >
      {/* Seu conteúdo aqui */}
    </OnboardingLayout>
  );
}
```

### Para componentes com formulários:

```tsx
import { IOSKeyboardAvoidingView } from '@/components/shared/IOSKeyboardAvoidingView';
import { IOSScrollView } from '@/components/shared/IOSScrollView';

export function MyForm() {
  return (
    <IOSKeyboardAvoidingView>
      <IOSScrollView>
        {/* Seus campos de formulário */}
      </IOSScrollView>
    </IOSKeyboardAvoidingView>
  );
}
```

## Testando no iOS

1. **No Simulador/Device**:
   - Teste em diferentes tamanhos (iPhone SE, 14, 14 Pro Max)
   - Verifique scroll em todos os steps
   - Teste com teclado aberto/fechado
   - Verifique se safe areas estão respeitadas

2. **Problemas Comuns**:
   - Se o scroll não funcionar: Verifique altura do container pai
   - Se o teclado cobrir campos: Confirme uso do IOSKeyboardAvoidingView
   - Se houver espaços brancos: Ajuste classes de safe area

## Próximos Passos

Para aplicar essas melhorias em outros componentes:

1. Identificar componentes com formulários ou muito conteúdo
2. Substituir divs principais por OnboardingLayout
3. Testar em diferentes dispositivos iOS
4. Ajustar padding/margins conforme necessário

## Notas Técnicas

- As melhorias só são aplicadas quando `isIOS()` retorna true
- Web mantém comportamento padrão sem overhead
- Safe areas são calculadas automaticamente pelo CSS
- Keyboard height é detectada via Capacitor