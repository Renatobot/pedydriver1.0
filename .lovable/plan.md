
# Plano: Banner de Conversao - "Primeira vez aqui, motorista?"

## Resumo

Substituir o banner atual de primeiro acesso por um novo banner maior, mais impactante e com comportamento avancado que direciona o usuario para o cadastro com scroll suave e foco automatico no formulario.

---

## O que sera implementado

### 1. Novo Banner Visual

**Posicao:** Acima do logo, no topo da pagina de login

**Design:**
- Fundo com gradiente verde sutil + borda verde
- Icone de foguete/estrela a esquerda
- Card inteiro clicavel (nao so o botao)
- Botao X para fechar no canto superior direito
- 100% responsivo (otimizado para mobile)

**Textos exatos:**
- Titulo: "Primeira vez aqui, motorista?"
- Subtitulo: "Crie sua conta gratis e descubra seu lucro real hoje."
- Botao: "Criar conta gratis"
- Microtexto: "Sem cartao - Leva 1 minuto"

### 2. Comportamento do Clique

Quando o usuario clicar no banner ou no botao:

1. Trocar para a aba "Criar Conta"
2. Scroll suave ate o formulario de cadastro
3. Focar no primeiro campo (Nome)
4. Highlight temporario com borda verde por 1.5 segundos
5. Registrar evento de analytics

### 3. Logica de Exibicao com Cooldown

- Banner aparece por padrao para usuarios nao logados
- Ao fechar (X), salvar timestamp no localStorage
- Nao reexibir por 24 horas apos fechar
- Se 24h passaram, mostrar novamente

### 4. Eventos de Analytics

Novos eventos a serem registrados:

```text
auth_banner_view        - Quando o banner aparece na tela
auth_banner_click       - Quando usuario clica no banner/botao  
auth_banner_dismissed   - Quando usuario fecha o banner (X)
```

Eventos existentes que serao reutilizados:
- `auth_tab_switched_to_signup` (via trackModeSwitch)
- `signup_form_started` (via trackFormStart existente)
- `signup_submitted` (via trackFormSubmit existente)

---

## Alteracoes Tecnicas

### Arquivo: src/pages/Auth.tsx

**Adicionar:**
- Constante `BANNER_DISMISS_KEY` para localStorage
- Constante `BANNER_COOLDOWN_MS` = 24 horas
- Ref `signupFormRef` para o container do formulario
- Ref `firstInputRef` para o campo Nome
- Estado `showFormHighlight` para animacao de destaque
- Funcao `shouldShowBanner()` que verifica cooldown de 24h
- Funcao `handleBannerDismiss()` que salva timestamp e fecha
- Funcao `handleBannerClick()` com comportamento completo

**Modificar:**
- Banner existente sera substituido pelo novo design
- Adicionar `ref={signupFormRef}` no container do formulario de signup
- Adicionar `ref={firstInputRef}` no Input de Nome

### Arquivo: src/index.css

**Adicionar:**
- Keyframe `highlight-pulse` para animacao de borda verde
- Classe `.form-highlight` com borda verde animada

---

## Estrutura do Novo Banner

```text
+----------------------------------------------------------+
|  [X]                                                      |
|                                                           |
|  [ICONE]   Primeira vez aqui, motorista?                 |
|            Crie sua conta gratis e descubra seu          |
|            lucro real hoje.                               |
|                                                           |
|            [====== Criar conta gratis ======]            |
|                                                           |
|            Sem cartao - Leva 1 minuto                    |
+----------------------------------------------------------+
```

---

## Fluxo de Usuario

```text
Usuario abre /auth
       |
       v
Banner visivel? ----[Nao]----> Mostra login normal
       |
      [Sim]
       |
       v
+------------------+
| Banner aparece   |
| (auth_banner_view)|
+------------------+
       |
   Clica no X?
      /    \
    Sim     Nao
     |       |
     v       v
Fecha banner   Clica no banner
Salva 24h      (auth_banner_click)
cooldown            |
                    v
           Troca para "Criar Conta"
           Scroll suave ate formulario
           Foco no campo Nome
           Highlight verde 1.5s
                    |
                    v
           Usuario preenche cadastro
```

---

## Verificacao de Qualidade

Criterios que serao atendidos:

- Banner aparece no topo ao abrir /auth
- Card inteiro e clicavel
- Ao clicar, muda para "Criar Conta" automaticamente
- Scroll suave ate o formulario
- Campo Nome recebe foco
- Borda verde aparece brevemente
- Fechar (X) oculta por 24 horas
- Funciona perfeitamente no mobile
- Eventos aparecem no console/analytics
- Nao altera logica de login/cadastro existente
- Mantem "Esqueci minha senha" e tabs atuais
