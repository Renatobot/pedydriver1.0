
# Plano: Botao de Instalacao PWA

## Visao Geral

Adicionar um sistema de instalacao PWA que exibe um banner elegante no Dashboard logo apos o login, com opcao de dispensar e reinstalar pelas Configuracoes.

---

## Estrategia Escolhida

**Mostrar desde o inicio** - O botao aparece assim que o usuario loga, com as seguintes caracteristicas:

- Banner discreto no topo do Dashboard
- Botao "Instalar App" com icone de download
- Opcao de fechar/dispensar (salva no localStorage)
- Opcao nas Configuracoes para quem dispensou

---

## Arquitetura

```text
+-----------------------------------+
|  [X]  Instale o PEDY Driver      |
|       para acesso rapido!        |
|       [Instalar App]             |
+-----------------------------------+
|                                  |
|  Dashboard Content...             |
|                                  |
+-----------------------------------+
```

---

## Implementacao

### 1. Criar Hook usePWAInstall

Arquivo: `src/hooks/usePWAInstall.tsx`

Responsabilidades:
- Detectar se o app ja esta instalado
- Capturar o evento `beforeinstallprompt`
- Gerenciar estado de "dispensado" no localStorage
- Expor funcao `installApp()` para disparar a instalacao

```typescript
// Estrutura do hook
interface UsePWAInstall {
  canInstall: boolean;        // Navegador suporta e nao esta instalado
  isInstalled: boolean;       // Ja esta instalado como PWA
  isDismissed: boolean;       // Usuario dispensou o banner
  installApp: () => void;     // Dispara o prompt de instalacao
  dismissBanner: () => void;  // Esconde o banner
  resetDismiss: () => void;   // Reseta para mostrar novamente
}
```

### 2. Criar Componente PWAInstallBanner

Arquivo: `src/components/pwa/PWAInstallBanner.tsx`

Design do banner:
- Fundo com gradiente verde sutil (mesma cor do app)
- Icone de smartphone/download
- Texto: "Instale o PEDY Driver para acesso rapido!"
- Botao primario: "Instalar"
- Botao de fechar (X)
- Animacao de entrada suave

### 3. Adicionar ao Dashboard

No arquivo `src/pages/Dashboard.tsx`:
- Importar o componente PWAInstallBanner
- Posicionar logo abaixo do header, antes do EntryLimitBanner
- Banner so aparece se:
  - `canInstall` for true
  - `isDismissed` for false

### 4. Adicionar as Configuracoes

No arquivo `src/pages/Settings.tsx`:
- Nova secao "Instalar App" (apenas se nao instalado)
- Se dispensou, mostrar botao para reinstalar o prompt
- Se ja instalado, mostrar mensagem "App instalado"

---

## Detalhes Tecnicos

### Deteccao de Instalacao PWA

```typescript
// Detectar se ja esta instalado
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as any).standalone === true;

// Capturar evento de instalacao
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  setCanInstall(true);
});
```

### LocalStorage Keys

```typescript
const PWA_DISMISSED_KEY = 'pedy_pwa_dismissed';
const PWA_DISMISSED_AT_KEY = 'pedy_pwa_dismissed_at';
```

---

## Fluxo do Usuario

```text
1. Usuario faz login
   |
2. Dashboard carrega
   |
3. Banner aparece no topo (se nao instalado e nao dispensado)
   |
   +-- Usuario clica "Instalar"
   |   |
   |   +-- Prompt nativo do navegador aparece
   |       |
   |       +-- Aceita: App instalado, banner desaparece
   |       +-- Recusa: Banner continua visivel
   |
   +-- Usuario clica "X" para fechar
       |
       +-- Banner desaparece
       +-- Salva no localStorage
       +-- Opcao disponivel em Configuracoes
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/usePWAInstall.tsx` | Criar | Hook para logica de instalacao PWA |
| `src/components/pwa/PWAInstallBanner.tsx` | Criar | Componente do banner |
| `src/pages/Dashboard.tsx` | Modificar | Adicionar banner |
| `src/pages/Settings.tsx` | Modificar | Adicionar opcao de instalacao |

---

## Design do Banner

```text
+--------------------------------------------------+
| [Smartphone] Instale o PEDY Driver          [X]  |
|              para acesso rapido!                 |
|              [Instalar App]                      |
+--------------------------------------------------+

Cores:
- Fundo: bg-primary/10 com borda bg-primary/30
- Icone: text-primary
- Botao: bg-primary (verde esmeralda)
- Texto: text-foreground
```

---

## Consideracoes

1. **iOS Safari**: O evento `beforeinstallprompt` nao e suportado. Mostrar instrucoes manuais (Compartilhar > Adicionar a Tela Inicial)

2. **Ja Instalado**: Nao mostrar o banner se detectar que esta rodando como PWA

3. **Dispensar Temporario**: Considerar mostrar novamente apos 7 dias (opcional)

4. **Analytics**: Podemos rastrear quantos usuarios instalam vs dispensam (implementacao futura)
