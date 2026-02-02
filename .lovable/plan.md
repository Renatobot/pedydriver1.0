
# Plano: Corrigir Ícone PWA do Painel Admin

## Problema Identificado
Quando você instala o PWA do painel administrativo, o ícone que aparece é o "PD" (logo dos usuários) em vez do escudo com cadeado (logo do admin). Isso acontece porque:

1. O `index.html` carrega o `manifest.json` padrão antes do React trocar para o `admin-manifest.json`
2. Navegadores (especialmente iOS) capturam o manifest e apple-touch-icon no carregamento inicial da página
3. A troca dinâmica via JavaScript não é detectada para fins de instalação PWA

## Solução Proposta
Criar um ponto de entrada HTML separado para o admin (`/admin/index.html`) que já carrega as configurações corretas desde o início.

## Etapas de Implementação

### 1. Criar HTML dedicado para Admin
Criar `public/admin/index.html` com:
- Referência direta ao `admin-manifest.json`
- Apple-touch-icon apontando para `admin-icon-512.png`
- Favicon do admin
- Meta tags específicas do admin (título, descrição)

### 2. Atualizar Configuração do Vite
Modificar `vite.config.ts` para:
- Incluir o novo HTML do admin como entrada adicional
- Garantir que `/admin/*` sirva o HTML do admin

### 3. Adicionar Redirecionamento
Configurar para que acessos a `/admin` e `/admin/*` usem o HTML dedicado do admin, permitindo que o PWA seja instalado com os ícones corretos.

---

## Detalhes Técnicos

### Arquivo: `public/admin/index.html`
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0..." />
    <meta name="theme-color" content="#0f1419" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="PEDY Admin" />
    
    <!-- Admin-specific manifest and icons -->
    <link rel="manifest" href="/admin-manifest.json" />
    <link rel="apple-touch-icon" href="/icons/admin-icon-512.png" />
    <link rel="icon" type="image/png" href="/icons/admin-icon-512.png" />
    
    <title>PEDY Admin - Painel Administrativo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Arquivo: `vite.config.ts`
Adicionar configuração de entrada múltipla:
```typescript
build: {
  rollupOptions: {
    input: {
      main: 'index.html',
      admin: 'public/admin/index.html'
    }
  }
}
```

### Arquivo: `vercel.json` ou `_redirects`
Configurar rewrite para servir o HTML correto:
```json
{
  "rewrites": [
    { "source": "/admin/:path*", "destination": "/admin/index.html" }
  ]
}
```

## Resultado Esperado
- Ao instalar o PWA de `/admin`, o ícone será o escudo verde com cadeado
- O PWA do app principal continuará usando o logo "PD"
- Cada PWA terá seu próprio nome e configuração

## Notas
- Pode ser necessário desinstalar o PWA antigo e reinstalar para ver as mudanças
- Cache do navegador pode precisar ser limpo
