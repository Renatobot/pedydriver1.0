
# Plano: Sistema de Analytics para Landing Page e Cadastro

## Objetivo
Criar um sistema completo de rastreamento de visitantes na página de vendas (/landing) e no fluxo de cadastro (/auth), com painel no admin para visualizar:
- Jornada completa dos visitantes
- Onde os usuários desistem do cadastro
- Taxa de conversão por etapa
- Erros que impedem o cadastro

---

## O que você vai conseguir ver

### 1. Funil de Conversão
```text
Landing Page → Clique CTA → Página Auth → Início Cadastro → Cadastro Completo
    100%          45%           42%            28%              18%
```

### 2. Pontos de Abandono
- Quantos saem da landing sem clicar
- Quantos clicam no CTA mas não começam o cadastro
- Quantos começam a preencher mas desistem em cada campo
- Quantos tentam enviar mas recebem erro

### 3. Erros Mais Comuns
- "Senha muito fraca" - 45%
- "Email já cadastrado" - 30%
- "Telefone inválido" - 25%

---

## Implementação Técnica

### Fase 1: Banco de Dados

**Nova tabela: `analytics_events`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| session_id | text | ID da sessão do visitante |
| event_type | text | Tipo: page_view, cta_click, form_start, field_focus, form_submit, error, signup_complete |
| page | text | Página onde ocorreu |
| metadata | jsonb | Dados extras (campo focado, erro, etc) |
| referrer | text | De onde veio (Google, direto, indicação) |
| device_type | text | mobile/desktop/tablet |
| created_at | timestamp | Quando aconteceu |

**Índices para performance:**
- Por session_id e created_at
- Por event_type e created_at
- Por page e created_at

### Fase 2: Frontend - Rastreamento

**Novo hook: `useAnalytics`**
- Gera session_id único por visita
- Detecta dispositivo (mobile/desktop)
- Captura referrer (Google, link direto, indicação)
- Funções: `trackPageView()`, `trackEvent()`, `trackError()`

**Atualizações em componentes:**

1. **Landing.tsx**
   - Track page_view ao carregar
   - Track scroll_depth (25%, 50%, 75%, 100%)
   - Track section_view para cada seção visível

2. **HeroSection.tsx / FinalCTA.tsx**
   - Track cta_click ao clicar nos botões "Começar agora"

3. **Auth.tsx**
   - Track page_view ao carregar
   - Track mode_switch ao trocar entre Login/Cadastro/Telefone
   - Track form_start ao focar primeiro campo
   - Track field_focus para cada campo (nome, email, telefone, senha)
   - Track form_submit ao tentar enviar
   - Track signup_error com mensagem traduzida
   - Track signup_complete quando sucesso

### Fase 3: Admin - Nova Página de Analytics

**Novo arquivo: `src/pages/admin/AdminAnalytics.tsx`**

Interface com:

1. **Cards de Métricas Principais**
   - Visitantes únicos (hoje/semana/mês)
   - Taxa de conversão (visitantes → cadastros)
   - Taxa de abandono do formulário
   - Erro mais comum

2. **Gráfico de Funil**
   - Visualização vertical mostrando cada etapa
   - Porcentagem de conversão entre etapas
   - Cores indicando pontos críticos (vermelho = alta desistência)

3. **Tabela de Erros**
   - Lista dos erros mais frequentes
   - Quantidade de ocorrências
   - Porcentagem do total

4. **Timeline de Eventos**
   - Últimas 50 sessões
   - Jornada completa de cada visitante
   - Filtro por: completou cadastro / desistiu

5. **Filtros**
   - Período (hoje, 7 dias, 30 dias, customizado)
   - Dispositivo (todos, mobile, desktop)
   - Origem (todas, Google, direto, indicação)

### Fase 4: Backend - RPC Functions

**Novas funções SQL:**

1. `get_analytics_funnel(days: int)` - Retorna dados do funil
2. `get_analytics_errors(days: int)` - Retorna erros agrupados
3. `get_analytics_sessions(limit: int)` - Retorna sessões com eventos
4. `get_analytics_summary()` - Métricas resumidas para dashboard

---

## Arquivos que serão criados/modificados

### Novos arquivos:
```
src/hooks/useAnalytics.tsx          - Hook de rastreamento
src/pages/admin/AdminAnalytics.tsx  - Página do admin
src/components/admin/analytics/
  ├── AnalyticsFunnel.tsx           - Gráfico de funil
  ├── AnalyticsErrorsTable.tsx      - Tabela de erros
  └── AnalyticsSessionList.tsx      - Lista de sessões
```

### Arquivos modificados:
```
src/pages/Landing.tsx               - Adicionar tracking
src/pages/Auth.tsx                  - Adicionar tracking detalhado
src/components/landing/HeroSection.tsx   - Track CTA
src/components/landing/FinalCTA.tsx      - Track CTA
src/components/admin/AdminLayout.tsx     - Novo item no menu
src/App.tsx                         - Nova rota /admin/analytics
```

### Migrações SQL:
```
1. Criar tabela analytics_events
2. Criar índices
3. Criar RPC functions
4. Configurar RLS (apenas admins podem ler)
```

---

## Segurança

- Tabela `analytics_events` tem RLS habilitado
- Apenas admins podem consultar dados via RPC
- Dados sensíveis (email, telefone) não são armazenados nos eventos
- Session_id é anônimo (não vinculado a usuário até cadastro completo)

---

## Exemplo de Uso

Quando um visitante chega:

1. **Landing** → Evento: `page_view` (page: /landing, referrer: google.com)
2. **Scroll 50%** → Evento: `scroll_depth` (depth: 50)
3. **Clica CTA** → Evento: `cta_click` (button: hero_cta)
4. **Auth page** → Evento: `page_view` (page: /auth)
5. **Clica "Criar Conta"** → Evento: `mode_switch` (mode: signup)
6. **Foca campo nome** → Evento: `form_start`
7. **Preenche campos** → Eventos: `field_focus` para cada
8. **Clica enviar** → Evento: `form_submit`
9. **Erro de senha** → Evento: `signup_error` (error: "Senha muito fraca")
10. **Corrige e envia** → Evento: `form_submit`
11. **Sucesso** → Evento: `signup_complete`

No admin você verá exatamente onde cada pessoa parou.
