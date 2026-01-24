# Diretrizes de Design — Página Triunfo (CN Vidas + Hospital)

Este documento descreve a linguagem visual aplicada em `triunfo.html` para replicação no restante do sistema. Ele foca em **seriedade, confiança e autoridade em healthcare**, com estética moderna e acabamento premium.

---

## 1) Princípios de Linguagem Visual

1. **Autoridade clínica**  
   Tipografia com serifas tradicionais nos títulos e sans‑serif clara no corpo. Sensação editorial/medical institucional.

2. **Calma + Tecnologia**  
   Paleta teal com gradientes suaves, contraste controlado e brilho contido.

3. **Profissionalismo sem frieza**  
   Glassmorphism sutil (vidro fosco), ruído suave e sombras profundas com baixa saturação.

4. **Hierarquia limpa**  
   Títulos compactos, subtítulos com boa respiração e CTAs claros.

---

## 2) Tipografia (base do “tom médico”)

**Fonte Display (títulos):**  
- `Merriweather` (wght 400 / 700 / 900)  
**Fonte Body (texto):**  
- `Source Sans 3` (wght 400 / 500 / 600 / 700)

**Uso e hierarquia:**  
- H1/H2/H3: `Merriweather`, `font-weight: 700`, `letter-spacing: -0.02em`  
- Corpo/descrições: `Source Sans 3`, `font-weight: 400–500`, `line-height: 1.6–1.8`

**Escalas recomendadas:**  
- H1: `clamp(1.7rem, 3.2vw, 2.5rem)`  
- H2: `clamp(1.5rem, 4vw, 2.25rem)`  
- Body: `clamp(0.95rem, 2vw, 1.05rem)`

**Regra:**  
Evitar fontes “tech” ou geométricas demais (Inter, Space Grotesk, etc.) para não perder autoridade clínica.

---

## 3) Cores e Tom

**Base institucional (teal médico):**
```
--primary: #0d9488
--primary-dark: #0f766e
--primary-light: #14b8a6
--accent: #0891b2
--gold: #f59e0b (detalhes de destaque)
```

**Texto:**
```
--text-dark: #042f2e
--text-body: #134e4a
--text-muted: #5eead4
```

**Fundos:**
```
--bg-white: #ffffff
--bg-light: #f0fdfa
--bg-soft: #ccfbf1
```

**Gradiente principal (Hero):**
```
background: linear-gradient(
  165deg,
  #18c2b3 0%,
  #0d9488 55%,
  #0b6b64 100%
);
```

**Regra:**  
Use variações de teal e branco com brilho discreto. Evitar contrastes “neon” ou saturação excessiva.

---

## 4) Layout & Espaçamento

**Grid base:**  
- Largura máxima: `1200px`  
- Padding global: `1.5rem` (desktop), `1rem` (mobile)

**Hero (composição):**  
- `min-height: 100vh; min-height: 100svh;`  
- `padding: 96px 1.5rem 2.5rem;`  
- conteúdo centralizado com “glass panel” e espaçamento compacto

**Ritmo vertical recomendado:**  
- Título → subtítulo: `0.85rem`  
- Subtítulo → CTAs: `1.6rem`  
- CTAs → “powered by”: `1.75rem`

---

## 5) Glass Panel (foco no hero)

**Painel central (hero-content):**
```
background: rgba(5, 61, 56, 0.22);
border: 1px solid rgba(255, 255, 255, 0.18);
box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
backdrop-filter: blur(10px);
border-radius: 32px;
```

**Finalidade:**  
Separar o conteúdo do fundo sem parecer “card genérico”.

---

## 6) Logos e Imagens

**Logo principal (Hero):**  
Uso com `object-fit: cover` para **remover espaço morto vertical**.
```
width: min(720px, 92vw);
height: clamp(190px, 24vw, 260px);
object-fit: cover;
object-position: center;
```

**Logo header/rodapé:**  
Dimensões menores, sempre discretas para manter autoridade.

**Regra:**  
Não usar logos com fundo colorido; preferir PNG transparente ou versão branca no hero.

---

## 7) Botões (CTAs)

**Primário (hero):**
```
background: linear-gradient(135deg, #ffffff 0%, #e6fff8 100%);
color: #0b5f55;
border-radius: 14px;
font-weight: 700;
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
```

**Secundário (hero):**
```
background: rgba(255, 255, 255, 0.05);
border: 2px solid rgba(255, 255, 255, 0.4);
color: white;
```

**Comportamento:**  
Hover com leve “lift” (`translateY(-2px/-3px)`) e aumento de sombra.

---

## 8) Texturas e Profundidade

**Brilhos radiais (hero):**
```
radial-gradient(circle at 82% 18%, rgba(255,255,255,0.18) 0%, transparent 60%)
radial-gradient(circle at 18% 82%, rgba(255,255,255,0.14) 0%, transparent 62%)
```

**Ruído leve (hero):**
```
mix-blend-mode: soft-light;
opacity: 0.14;
```

**Regra:**  
Textura deve ser sutil; objetivo é profundidade, não “efeito”.

---

## 9) Animações

**Entrada (hero):**
```
@keyframes fadeSlideUp {
  to { opacity: 1; transform: translateY(0); }
}
```

**Duração recomendada:**  
`0.8s`, easing suave (`cubic-bezier(0.4, 0, 0.2, 1)`), delays em cascata (0.2s a 0.8s).

**Regra:**  
Sem excesso de animações; foco em impacto inicial.

---

## 10) Responsividade

**Breakpoints principais:**
- `max-width: 768px`
- `max-width: 480px`
- `max-height: 820px` (para telas baixas)

**Ajustes de hero em mobile:**
```
padding: 88px 1rem 2.25rem;
hero-content padding menor;
logo height: clamp(150px, 40vw, 210px);
```

**Regra:**  
Hero deve caber “above the fold” sem scroll.

---

## 11) Tom de texto

- **Clínico e direto**  
- Evitar exageros promocionais  
- Priorizar benefícios claros, segurança e credibilidade

Exemplo:  
“Proteção completa para sua família em Triunfo”  
em vez de  
“Oferta imperdível!”

---

## 12) Checklist de aplicação rápida

- [ ] Títulos em Merriweather com peso 700  
- [ ] Body em Source Sans 3 com line-height ≥ 1.6  
- [ ] Paleta teal + branco  
- [ ] Hero com gradiente + vidro sutil  
- [ ] Logos com corte vertical (object-fit)  
- [ ] CTA primário branco com leve gradiente  
- [ ] Sombras profundas e suaves  
- [ ] Hero sem scroll no primeiro load  

---

Se quiser, posso gerar um **template CSS de tokens** ou converter isso em um **design system base** (ex.: `tokens.css` + componentes) para o resto do sistema.
