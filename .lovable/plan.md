

# Plano: Ocultar o Badge do Lovable

## Objetivo
Adicionar uma regra CSS global para esconder qualquer elemento com o ID `lovable-badge`.

## Alteração

### Arquivo: `src/index.css`

Adicionar a seguinte regra CSS no final do arquivo (após a media query do scrollbar customizado):

```css
/* Hide Lovable badge */
#lovable-badge {
  display: none !important;
}
```

## Detalhes Técnicos

- **Seletor**: `#lovable-badge` - seleciona elementos pelo ID
- **Propriedade**: `display: none !important` - garante que o elemento seja ocultado mesmo que outras regras tentem sobrescrevê-lo
- **Localização**: Fora de qualquer `@layer` para garantir maior especificidade

## Impacto
- Nenhum impacto na funcionalidade ou design existente
- O badge do Lovable será ocultado em todas as páginas do aplicativo

