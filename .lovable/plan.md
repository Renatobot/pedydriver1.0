
# Plano: Animacoes de Fade-in no Scroll

## Visao Geral

Adicionar animacoes suaves de fade-in nas secoes da landing page quando elas aparecem na tela durante o scroll. Isso cria uma experiencia mais dinamica e profissional.

---

## Abordagem Tecnica

### Hook useScrollReveal

Criar um hook React customizado que usa a **Intersection Observer API** para detectar quando elementos entram na viewport e aplicar classes de animacao.

**Vantagens desta abordagem:**
- Performance nativa (sem bibliotecas externas)
- Funciona bem em mobile
- Animacao acontece apenas uma vez (nao repete ao voltar)
- Configuravel (threshold, delay)

---

## Arquivos a Criar

### 1. src/hooks/useScrollReveal.tsx

Hook que retorna uma ref para anexar ao elemento e controla a visibilidade.

```text
Funcionalidade:
- Usa IntersectionObserver para detectar entrada na viewport
- Threshold de 15% (elemento 15% visivel dispara animacao)
- Retorna { ref, isVisible } para controle do componente
```

---

## Arquivos a Modificar

### 2. src/index.css

Adicionar classes CSS para animacoes de scroll.

```text
Novas classes:
- .scroll-reveal: Estado inicial (invisivel, deslocado)
- .scroll-reveal.visible: Estado final (visivel, posicionado)
- Variacoes: scroll-reveal-left, scroll-reveal-right, scroll-reveal-scale
```

### 3. src/pages/Landing.tsx

Envolver cada secao com o hook de animacao.

```text
Estrutura:
- Importar useScrollReveal
- Criar refs para cada secao
- Aplicar classes condicionais baseadas em isVisible
```

### 4-11. Componentes de secao (opcional - abordagem alternativa)

Se preferir, posso modificar cada componente individualmente para ter sua propria animacao interna. Isso da mais controle sobre delays e estilos especificos.

Componentes afetados:
- ProblemSection.tsx
- SolutionSection.tsx
- HowItWorksSection.tsx
- AppShowcaseSection.tsx
- SocialProofSection.tsx
- TargetAudienceSection.tsx
- PricingPreview.tsx
- FinalCTA.tsx

---

## Implementacao Detalhada

### CSS das Animacoes

```css
/* Estado inicial - invisivel */
.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

/* Estado final - visivel */
.scroll-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Delay escalonado para elementos filhos */
.scroll-reveal-delay-1 { transition-delay: 0.1s; }
.scroll-reveal-delay-2 { transition-delay: 0.2s; }
.scroll-reveal-delay-3 { transition-delay: 0.3s; }
```

### Hook useScrollReveal

```typescript
export function useScrollReveal(options?: { threshold?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Anima apenas uma vez
        }
      },
      { threshold: options?.threshold ?? 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
```

### Landing.tsx Atualizado

```typescript
export default function Landing() {
  const section1 = useScrollReveal();
  const section2 = useScrollReveal();
  // ... etc

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <HeroSection /> {/* Hero nao anima - ja visivel */}
        <div ref={section1.ref} className={cn("scroll-reveal", section1.isVisible && "visible")}>
          <ProblemSection />
        </div>
        {/* ... outras secoes */}
      </main>
      <TrustFooter />
    </div>
  );
}
```

---

## Comportamento Esperado

| Secao | Efeito | Delay |
|-------|--------|-------|
| HeroSection | Sem animacao (ja visivel no carregamento) | - |
| ProblemSection | Fade-in de baixo para cima | 0ms |
| SolutionSection | Fade-in de baixo para cima | 0ms |
| HowItWorksSection | Fade-in + cards com delay escalonado | 100-300ms |
| AppShowcaseSection | Fade-in suave | 0ms |
| SocialProofSection | Fade-in + contador anima separado | 0ms |
| TargetAudienceSection | Fade-in de baixo para cima | 0ms |
| PricingPreview | Fade-in + cards lado a lado | 0-200ms |
| FinalCTA | Fade-in com escala sutil | 0ms |

---

## Resumo de Alteracoes

```text
CRIAR:
  src/hooks/useScrollReveal.tsx     # Hook de Intersection Observer

MODIFICAR:
  src/index.css                     # Classes CSS de animacao
  src/pages/Landing.tsx             # Aplicar hook nas secoes
```

---

## Alternativa Considerada

**Framer Motion** - Biblioteca poderosa mas adiciona ~30kb ao bundle. Como as animacoes sao simples (fade-in), CSS + Intersection Observer e mais leve e performatico.
