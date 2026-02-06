
# Plano: Melhorar Visibilidade do Cadastro

## Diagnóstico

Com base nos dados de analytics, identifiquei que:

1. **93% dos visitantes ficam no modo "Login"** - Não percebem que precisam clicar em "Criar Conta"
2. **O botão do header é pequeno** - Não há tracking, mas provavelmente pouco clicado
3. **A landing page tem poucos acessos** - Maioria vai direto para /auth

---

## Melhorias Propostas

### 1. Página de Auth - Destaque para Novos Usuários

**Antes:** Toggle neutro com "Entrar" selecionado por padrão

**Depois:**
- Adicionar um card destacado acima do toggle para novos visitantes
- Texto: "Primeiro acesso? Crie sua conta grátis em 30 segundos"
- Botão visual direcionando para o modo "Criar Conta"
- Detecção de novo visitante via localStorage

### 2. Header do Landing - CTA Mais Visível

**Antes:** Botão pequeno "Começar grátis" no canto

**Depois:**
- Adicionar tracking de clique no botão do header
- Botão com animação sutil de pulso quando scrollado
- Aumentar levemente o tamanho em mobile

### 3. Detecção Inteligente de Modo

**Lógica:**
- Se URL tem `?ref=` (indicação) → Abre em "Criar Conta"
- Se URL tem `?signup` → Abre em "Criar Conta"
- Se URL tem `?login` → Abre em "Entrar"
- Se é primeiro acesso (sem histórico) → Mostra card de destaque

### 4. Banner de Primeiro Acesso na Auth

```text
┌─────────────────────────────────────────────┐
│  🎉 Primeira vez aqui?                      │
│  Crie sua conta grátis em segundos          │
│  [Criar Conta Agora]                        │
└─────────────────────────────────────────────┘
```

- Aparece apenas para visitantes sem sessão anterior
- Dismiss permanente após clicar ou fechar
- Direciona para o toggle de "Criar Conta"

### 5. Analytics Adicionais

- Track clique no CTA do header
- Track impressões do banner de primeiro acesso
- Track se usuário veio com parâmetro ?signup

---

## Arquivos que serão modificados

```
src/pages/Auth.tsx                    - Banner de primeiro acesso + lógica de modo
src/components/landing/LandingHeader.tsx - Track CTA + animação
```

---

## Implementação Técnica

### Auth.tsx - Novo Banner

```tsx
// Detectar primeiro acesso
const [isFirstVisit, setIsFirstVisit] = useState(false);

useEffect(() => {
  const hasVisited = localStorage.getItem('pedy_has_visited');
  if (!hasVisited) {
    setIsFirstVisit(true);
    localStorage.setItem('pedy_has_visited', 'true');
  }
}, []);

// Detectar parâmetro ?signup na URL
useEffect(() => {
  if (searchParams.get('signup') !== null) {
    setMode('signup');
  }
}, [searchParams]);

// Banner de primeiro acesso
{isFirstVisit && mode === 'login' && (
  <div className="card-destaque">
    <p>🎉 Primeira vez aqui?</p>
    <Button onClick={() => setMode('signup')}>
      Criar Conta Agora
    </Button>
  </div>
)}
```

### LandingHeader.tsx - CTA Melhorado

```tsx
// Adicionar analytics
const { trackCTAClick } = useAnalytics();

// Classe com animação quando scrollado
className={cn(
  "transition-all duration-300",
  scrolled && "animate-pulse-subtle shadow-lg"
)}

onClick={() => trackCTAClick('header_cta', '/landing')}
```

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Cliques em "Criar Conta" | 7.7% | ~40% |
| Início de cadastro | 7.7% | ~35% |
| Conclusão de cadastro | 0% | ~15-20% |

---

## Resumo

1. Banner de destaque para novos visitantes
2. Parâmetro ?signup para links de marketing
3. CTA do header com tracking + animação
4. Detecção inteligente de primeiro acesso
