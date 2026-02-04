
# Plano: Corrigir PWA Admin para iOS

## Problema Identificado

No iOS, a instalação de PWAs funciona de forma diferente do Android:

1. iOS usa as meta tags `apple-mobile-web-app-*` da pagina, nao o manifest.json
2. Como o app e uma SPA (Single Page Application), todas as rotas carregam o mesmo `index.html` raiz
3. O arquivo `public/admin/index.html` nao e usado pelo Vite - ele serve sempre o `index.html` principal
4. Resultado: Quando admin instala no iOS, o app usa as meta tags do usuario comum

## Solucao Proposta

Injetar dinamicamente as meta tags corretas quando a rota comeca com `/admin/`:

### 1. Criar Hook `useAdminPWAMeta`

Um hook que detecta se estamos em rotas admin e atualiza dinamicamente:
- `apple-mobile-web-app-title` -> "PEDY Admin"
- `apple-touch-icon` -> icones do admin
- `link[rel="manifest"]` -> `/admin-manifest.json`
- `meta[name="theme-color"]` -> manter consistente
- `document.title` -> titulo do admin

### 2. Aplicar no AdminAuth e AdminLayout

O hook sera chamado em:
- `AdminAuth.tsx` (pagina de login admin)
- `AdminLayout.tsx` (layout de todas as paginas admin)

### 3. Fluxo de Instalacao no iOS

```text
Usuario acessa /admin/login
        |
        v
Hook detecta rota /admin/*
        |
        v
Injeta meta tags do admin:
- apple-mobile-web-app-title: "PEDY Admin"
- apple-touch-icon: /icons/admin-icon-512.png
- manifest: /admin-manifest.json
        |
        v
Usuario instala via Safari
(Compartilhar > Adicionar a Tela Inicial)
        |
        v
App instalado com nome "PEDY Admin"
e icone correto!
```

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/hooks/useAdminPWAMeta.tsx` | Criar - Hook para injetar meta tags |
| `src/pages/admin/AdminAuth.tsx` | Modificar - Usar o novo hook |
| `src/components/admin/AdminLayout.tsx` | Modificar - Usar o novo hook |
| `public/admin/index.html` | Remover - Nao funciona com SPA |

## Detalhes Tecnicos

### Hook useAdminPWAMeta

```typescript
// Detecta rota admin e injeta meta tags corretas
useEffect(() => {
  // Salva valores originais
  const originalTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  
  // Atualiza para admin
  updateMetaTag('apple-mobile-web-app-title', 'PEDY Admin');
  updateLinkTag('apple-touch-icon', '/icons/admin-icon-512.png');
  updateLinkTag('manifest', '/admin-manifest.json');
  
  // Restaura ao sair da rota admin
  return () => { /* restaura originais */ };
}, []);
```

### Comportamento Esperado

- **Usuario comum no iOS**: Instala em `/` ou `/auth` -> Recebe "PEDY Driver" com icone verde
- **Admin no iOS**: Instala em `/admin/login` -> Recebe "PEDY Admin" com icone diferenciado
- **Android**: Continua funcionando normalmente (usa manifest.json)

## Beneficios

- iOS e Android terao comportamento consistente
- Ambos os apps podem coexistir na tela inicial do iPhone
- Codigo limpo e reutilizavel via hook
