
# Plano: Alternância entre Tema Claro e Escuro

## Resumo
Permitir que o usuário alterne entre modo claro e escuro diretamente nas configurações do app, utilizando a biblioteca `next-themes` que já está instalada no projeto.

---

## O que será implementado

### 1. Nova seção "Aparência" na página de Configurações
- Toggle visual com ícones de Sol/Lua para alternar entre temas
- Três opções: Claro, Escuro e Automático (segue o sistema)
- Botões estilizados seguindo o padrão visual existente (como o seletor de veículo)

### 2. Tema Claro
O app atualmente só tem cores configuradas para o modo escuro. Será criado um conjunto completo de cores para o modo claro:
- Fundo claro profissional (branco/cinza suave)
- Cards com sombras sutis
- Textos escuros para boa legibilidade
- Mantém a identidade visual (verde primário para lucros, vermelho para despesas)

### 3. Persistência automática
O `next-themes` automaticamente salva a preferência do usuário no `localStorage`, então a escolha será lembrada entre sessões.

---

## Arquivos que serão modificados/criados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/theme-provider.tsx` | **NOVO** - Wrapper do ThemeProvider |
| `src/App.tsx` | Adicionar ThemeProvider envolvendo todo o app |
| `src/index.css` | Adicionar variáveis CSS para tema claro (`:root` sem `.dark`) |
| `src/pages/Settings.tsx` | Adicionar seção "Aparência" com toggle de tema |
| `index.html` | Remover `class="dark"` fixo do `<html>` (será gerenciado dinamicamente) |

---

## Detalhes Técnicos

### Componente ThemeProvider (novo)
```text
src/components/theme-provider.tsx
```
- Cria um wrapper reutilizável do next-themes
- Configurado com `attribute="class"` para funcionar com Tailwind
- `defaultTheme="dark"` mantém o comportamento atual como padrão
- `enableSystem` permite opção automática

### Variáveis CSS para tema claro
Cores profissionais que mantêm a identidade:
- Background: `#fafafa` (cinza muito claro)
- Cards: `#ffffff` (branco puro)
- Textos: tons de cinza escuro
- Primary (verde): mantido igual
- Destructive (vermelho): mantido igual

### UI na página de Configurações
Nova seção "Aparência" com 3 botões:
- **Sol** = Modo Claro
- **Lua** = Modo Escuro  
- **Monitor** = Automático (segue sistema)

Estilo similar aos botões de "Tipo de Veículo" já existentes.

---

## Fluxo de Implementação

1. Criar arquivo `theme-provider.tsx`
2. Envolver app com ThemeProvider
3. Adicionar variáveis CSS do tema claro
4. Atualizar `index.html` removendo classe fixa
5. Adicionar controle de tema em Settings
6. Testar transições e persistência
