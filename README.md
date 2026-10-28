<div align="center">

# 🛒 AliExpress Finder Bot

**Monitora o AliExpress com a sua própria sessão e manda as promoções que combinam com você direto num canal do Discord.**

Preço original, preço promo, desconto e valor final estimado com impostos brasileiros, tudo em um card só.

[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2022.13-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chrome%20%7C%20Edge-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![Discord](https://img.shields.io/badge/Discord-webhook-5865F2?logo=discord&logoColor=white)](https://discord.com)
[![Windows](https://img.shields.io/badge/Windows-setup%20em%201%20clique-0078D4?logo=windows&logoColor=white)](#-início-rápido-windows)

</div>

---

## ✨ O que ele faz

- 🔎 Varre o feed **"Para você"**, a **lista de desejos**, **buscas por palavra-chave** e qualquer **URL de listagem** que você indicar.
- 🎯 Filtra por preço, desconto mínimo, avaliação, quantidade vendida, palavras proibidas e presença da palavra-chave no título.
- 💸 Calcula o **valor final estimado em reais**, com imposto de importação e ICMS, usando o câmbio do dia.
- 📉 Lembra o que já enviou e só avisa de novo quando o **preço cai de verdade**.
- 🧑‍💻 Usa o Chrome ou Edge que já está instalado, com perfil persistente: você resolve login e captcha uma vez só.
- ⏱️ Roda sozinho no intervalo configurado, com pausas aleatórias entre páginas para não chamar atenção.
- 🚨 Avisa no Discord quando a sessão expira ou um captcha aparece.

## 👀 Como chega no Discord

Cada produto vira um embed com imagem, link e estes campos:

| Preço original | Preço promo | Desconto |
|:--:|:--:|:--:|
| ~~R$ 329,90~~ | **R$ 189,90** | 42% |

| Valor final estimado |
|:--|
| **R$ 189,90** (impostos já inclusos no preço) |

| Vendidos | Avaliação | Loja |
|:--:|:--:|:--:|
| 1.000+ vendidos | 4.8 ★ | Nome da loja |

Rodapé: `Busca: teclado mecânico · Novo · Choice · Enviado do Brasil`

> 🟢 **Verde** = produto novo · 🔴 **Vermelho** = desconto de 50% ou mais · 🟡 **Amarelo** = caiu o preço de algo já enviado

Quer ver um exemplo real no seu canal? Rode `npm run discord:ping`.

## 📋 Requisitos

- **Windows 10/11** com Chrome ou Edge. O `iniciar.bat` instala o que faltar.
- Ou qualquer sistema com **Node.js 22.13+** e Chrome, Edge ou Chromium.
- Uma conta no AliExpress.
- Um webhook de um canal do Discord.

## 🚀 Início rápido (Windows)

1. Baixe o projeto (ZIP ou `git clone`) e abra a pasta.
2. Dê dois cliques em **`iniciar.bat`**. Ele instala Node.js, dependências e navegador se precisar, cria `config.json` e `.env` e pede a URL do webhook.
3. Na primeira vez, uma janela do Chrome abre na tela de login do AliExpress. Faça login normalmente, com captcha e SMS se pedir. A sessão fica salva em `data/profile` e é reaproveitada.
4. Edite **`config.json`** com seus interesses e filtros. As mudanças valem na próxima rodada, sem reiniciar.

| Comando | O que faz |
|---|---|
| `iniciar.bat` | Setup e roda para sempre no intervalo configurado |
| `iniciar.bat once` | Setup e roda uma única vez |
| `iniciar.bat login` | Setup e abre o navegador só para logar de novo |
| `iniciar.bat discord:ping` | Setup e envia um card de teste para o Discord |

## 🛠️ Instalação manual (qualquer sistema)

```bash
git clone https://github.com/eubrunodev/aliexpress-finder.git
cd aliexpress-finder
npm install

cp config.example.json config.json   # ajuste seus interesses e filtros
cp .env.example .env                 # cole a URL do webhook

npm run login          # abre o navegador para fazer login uma vez
npm run discord:ping   # confirma que o webhook está funcionando
npm run once           # uma rodada
npm start              # roda para sempre
```

Sem Chrome nem Edge? Rode `npx playwright install chromium` e use `"channel": "chromium"` no `config.json`.

| Script | Descrição |
|---|---|
| `npm start` | Loop infinito: roda, espera o intervalo (com jitter), roda de novo |
| `npm run once` | Uma rodada e sai. Bom para agendar no Agendador de Tarefas ou cron |
| `npm run login` | Só abre o navegador para você logar e salvar a sessão |
| `npm run discord:ping` | Envia um card de exemplo para validar o webhook |
| `npm run typecheck` | Checagem de tipos com `tsc --noEmit` |

## 🔗 Webhook do Discord

No Discord: **canal → Editar canal → Integrações → Webhooks → Novo webhook → Copiar URL**.

Cole quando o `iniciar.bat` pedir, ou direto no `.env`:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

> O webhook dá permissão de postar no canal. Trate como senha e nunca commite o `.env`. Ele já está no `.gitignore`.

## ⚙️ Configuração

Tudo fica em `config.json`, validado com [Zod](https://zod.dev) na inicialização. Chave errada ou valor fora da faixa gera uma mensagem clara em vez de comportamento estranho.

### `browser`

| Chave | Padrão | Significado |
|---|---|---|
| `headless` | `false` | Mantenha `false`. Login e captcha precisam de janela visível. |
| `offscreen` | `false` | `true` joga a janela para fora da tela para não atrapalhar. |
| `channel` | `"chrome"` | `chrome`, `msedge` ou `chromium`. Cai para o próximo se não achar. |
| `profileDir` | `"data/profile"` | Onde a sessão do navegador fica salva. |

### `schedule` e `delays`

| Chave | Padrão | Significado |
|---|---|---|
| `schedule.intervalMinutes` | `90` | Minutos entre rodadas (mínimo 5). |
| `schedule.jitterMinutes` | `15` | Espera aleatória extra somada ao intervalo. |
| `schedule.maxPagesPerRun` | `12` | Teto de páginas carregadas por rodada. Mantenha baixo. |
| `schedule.loginWaitMinutes` | `30` | Quanto tempo espera você logar ou resolver um captcha. |
| `delays.betweenPagesMs` | `[4000, 9000]` | Pausa aleatória entre páginas, em ms. |
| `delays.scrollPauseMs` | `[700, 1500]` | Pausa aleatória entre rolagens, em ms. |

### `filters`

Filtros globais. Cada fonte pode ter os seus, que são mesclados por cima dos globais.

| Chave | Significado |
|---|---|
| `minPrice` / `maxPrice` | Faixa de preço promo, em R$. |
| `minDiscountPercent` | Desconto mínimo em relação ao preço original. |
| `minRating` | Nota mínima (0 a 5). |
| `minSold` | Mínimo de unidades vendidas. |
| `excludeWords` | Lista de palavras que descartam o produto se aparecerem no título. |
| `requireKeywordInTitle` | Em buscas, exige que todas as palavras da keyword estejam no título. |

### `notifications`

| Chave | Padrão | Significado |
|---|---|---|
| `priceDrops` | `true` | Reenvia um produto já postado quando o preço cai. |
| `minDropPercent` | `10` | Queda mínima, em %, sobre o último preço notificado. |
| `maxItemsPerRun` | `20` | Teto de cards por rodada, melhores descontos primeiro (máx. 50). |

### `sources`

Lista do que varrer, em ordem. Todas aceitam `name` (título que aparece no card) e `filters` próprios.

```json
{ "type": "feed", "scrolls": 6 }
{ "type": "wishlist", "scrolls": 3 }
{ "type": "search", "keyword": "teclado mecânico", "pages": 1, "sort": "orders", "filters": { "maxPrice": 400 } }
{ "type": "url", "name": "Super Deals", "url": "https://pt.aliexpress.com/ssr/...", "scrolls": 4 }
```

| Tipo | Campos |
|---|---|
| `feed` | `scrolls` (0 a 40, padrão 6). Página inicial "Para você". |
| `wishlist` | `scrolls` (0 a 40, padrão 3). Sua lista de desejos. |
| `search` | `keyword`, `pages` (1 a 5), `sort`: `default`, `orders`, `price_asc`, `newest`. |
| `url` | `url` de qualquer listagem, `scrolls` (0 a 40, padrão 3). |

### `tax`

O site já mostra a maioria dos preços com impostos inclusos, então `pricesIncludeTax` vem `true` e o valor final é o próprio preço promo. Mude para `false` para aplicar a estimativa:

| Chave | Padrão | Significado |
|---|---|---|
| `pricesIncludeTax` | `true` | Se `true`, não estima nada. |
| `fetchUsdRate` | `true` | Busca o câmbio USD/BRL na AwesomeAPI. Se falhar, usa `usdBrl`. |
| `usdBrl` | `5.5` | Câmbio fixo de fallback. |
| `thresholdUsd` | `50` | Limite em dólares que separa as duas alíquotas. |
| `importRateUpToThreshold` | `0` | Alíquota de importação até o limite. |
| `importRateAboveThreshold` | `0.6` | Alíquota acima do limite. |
| `deductionUsd` | `30` | Desconto fixo em dólares aplicado acima do limite. |
| `icmsRate` | `0.2` | ICMS, calculado "por dentro" sobre o valor já com importação. |

Produtos enviados de armazém no Brasil pulam a estimativa de importação. As regras mudam com frequência, então confira antes de confiar nos números.

## 🧠 Como funciona

```
config.json ──► abre Chrome com perfil persistente ──► confere login
                                                           │
            ┌──────────────────────────────────────────────┘
            ▼
   para cada fonte: carrega, rola, lê o JSON embutido da página
   (fallback: parse dos cards visíveis) ──► aplica filtros
            │
            ▼
   SQLite: já vi? já notifiquei? caiu o preço? ──► decide "novo" ou "queda"
            │
            ▼
   ordena por desconto, respeita o teto ──► embeds no Discord (até 10 por mensagem)
```

```
src/
├── cli/        start · once · login · ping-discord
├── browser/    sessão persistente, cookie de locale BR, detecção de login e captcha, scroll
├── scraper/    fontes, dados estruturados da página, fallback por DOM, preço, imagem
├── filters/    regras de filtro e mesclagem global + por fonte
├── pipeline/   orquestra a rodada e decide novo × queda de preço
├── pricing/    câmbio e estimativa de impostos
├── discord/    embeds e webhook com retry em rate limit
├── storage/    SQLite nativo do Node (node:sqlite), produtos + histórico de preços
└── util/       log, dinheiro, texto, aleatoriedade
scripts/setup.ps1   instalador usado pelo iniciar.bat
```

Stack: **TypeScript** rodando direto com `tsx`, **Playwright** controlando o Chrome ou Edge já instalado, **Zod** validando a configuração e o **SQLite nativo do Node 22** para o histórico. Sem banco externo, sem servidor, sem conta em serviço nenhum além do Discord.

## 🔒 Privacidade e dados locais

Tudo fica na sua máquina. O bot só fala com dois lugares: o webhook do Discord (os cards) e a AwesomeAPI (consulta de câmbio, sem dado pessoal).

| Arquivo | Conteúdo | Vai para o Git? |
|---|---|:--:|
| `.env` | URL do webhook | ❌ ignorado |
| `config.json` | seus interesses e filtros | ❌ ignorado |
| `data/profile/` | sessão do navegador, com cookies de login | ❌ ignorado |
| `data/promo.sqlite` | histórico de produtos e preços | ❌ ignorado |
| `.env.example` e `config.example.json` | modelos sem dados pessoais | ✅ |

## 💡 Dicas

- **Uma instância só.** Duas cópias rodando compartilham o mesmo perfil do navegador e brigam.
- **Captcha ou sessão expirada?** O bot posta um aviso no Discord e espera `loginWaitMinutes` por você. Resolva na janela do navegador e ele continua.
- **Comece conservador.** Poucas fontes, `maxPagesPerRun` baixo e intervalo longo. Aumente aos poucos.
- **Buscas genéricas trazem lixo.** Combine `requireKeywordInTitle`, `excludeWords` e `minSold` para limpar.
- **Rodar sem a janela aparecendo:** use `"offscreen": true`. Não use `headless`, porque aí ninguém consegue logar.

## ⚠️ Aviso

Automatizar uma conta logada vai contra os termos de uso do AliExpress, e o site pode bloquear ou exigir captcha a qualquer momento. Use por sua conta e risco, com orçamento de páginas e intervalos conservadores. A estimativa de impostos é só uma referência, não um cálculo oficial.
