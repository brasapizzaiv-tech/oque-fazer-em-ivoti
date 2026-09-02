# O que fazer em Ivoti

O guia da cidade: busca de estabelecimentos e atrativos, mapa com rota,
agenda de eventos e um chat que recomenda o que fazer agora — olhando o que
está cadastrado e o que está aberto neste momento.

- **Site público**: home, explorar (busca + filtros), página de cada local,
  mapa, agenda, chat.
- **Painel do estabelecimento**: o próprio dono cria a conta, preenche o
  perfil (fotos, horários, cardápio, etiquetas, pino no mapa) e manda para
  análise.
- **Administração**: aprova os cadastros e mostra o que o pessoal anda
  perguntando pro guia.

Feito com Next.js 16, Supabase (banco, login e fotos), Google Maps e a API da
Claude.

---

## Passo a passo pra colocar no ar

São três contas. Nenhuma delas eu consigo criar por você — todas envolvem
senha, cartão ou chave secreta.

### 1. Supabase (banco de dados, login e fotos) — grátis

1. Entre em <https://supabase.com> e crie um projeto.
   Nome: `oque-fazer-em-ivoti`. Região: **South America (São Paulo)**.
   Guarde a senha do banco que ele pedir.
2. No projeto, vá em **Project Settings → Data API** e copie:
   - `Project URL` → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → vai em `SUPABASE_SERVICE_ROLE_KEY` (essa é secreta)
3. Clique em **Connect** (no topo) → aba **ORMs** → copie a string da
   **Session pooler** → vai em `DATABASE_URL` (troque `[YOUR-PASSWORD]` pela
   senha do passo 1).
4. Em **Authentication → Sign In / Providers → Email**, deixe
   "Confirm email" **desligado** no começo. Assim o dono do estabelecimento
   entra na hora, sem precisar de e-mail configurado.

### 2. Google Maps — precisa de cartão, mas tem cota grátis mensal

1. Entre em <https://console.cloud.google.com> e crie um projeto.
2. Ative o faturamento (pede cartão; o Google dá um crédito mensal que
   cobre bem mais do que um site de cidade pequena consome).
3. Em **APIs e serviços → Biblioteca**, ative: **Maps JavaScript API**.
4. Em **Credenciais → Criar credenciais → Chave de API**. Copie a chave para
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
5. Importante: clique na chave e em **Restrições de aplicativo** escolha
   "Sites" e adicione `oquefazeremivoti.com.br/*` e `localhost:3000/*`. Sem
   isso qualquer um pode usar sua chave e gastar seu crédito.

### 3. Anthropic (o chat) — pago por uso

1. Entre em <https://console.anthropic.com>, coloque um crédito inicial
   (US$ 5 já dá pra bastante conversa).
2. **API Keys → Create Key**. Copie para `ANTHROPIC_API_KEY`.
3. Se quiser gastar menos, coloque `CHAT_MODELO=claude-sonnet-5` — respostas
   um pouco menos afiadas, custo bem menor.

### 4. Rodar aqui no computador

```bash
cp .env.example .env.local   # e preencha com o que você copiou acima
npm install
npm run migrate              # cria as tabelas no Supabase
npm run dev                  # abre em http://localhost:3000
```

### 5. Virar administrador do site

Crie sua conta pelo `/cadastrar` e depois, no **SQL Editor** do Supabase,
rode (trocando pelo seu e-mail):

```sql
update public.perfis
set papel = 'admin'
where id = (select id from auth.users where email = 'seu@email.com');
```

Pronto: o link **Administração** aparece no painel.

### 6. Publicar (Vercel)

1. Suba o projeto pro GitHub.
2. Em <https://vercel.com>, importe o repositório.
3. Cole todas as variáveis do `.env.local` em **Settings → Environment
   Variables**.
4. Aponte o domínio `oquefazeremivoti.com.br` para a Vercel.

---

## Como o banco é organizado

| Tabela            | O que guarda                                        |
| ----------------- | --------------------------------------------------- |
| `perfis`          | quem faz login (dono de estabelecimento ou admin)    |
| `categorias`      | Comer e beber → Pizzaria, Hamburgueria...            |
| `tags`            | etiquetas: ao ar livre, aceita pet, com criança...   |
| `locais`          | o estabelecimento/atrativo em si                     |
| `locais_horarios` | faixas de funcionamento (aceita almoço + jantar)     |
| `locais_fotos`    | galeria                                              |
| `locais_itens`    | cardápio, serviços, diárias                          |
| `locais_tags`     | ligação local ↔ etiqueta                            |
| `eventos`         | agenda com data marcada                              |
| `roteiros`        | roteiros montados pelo visitante                     |
| `chat_conversas`  | o que perguntam pro guia (termômetro do que falta)   |

As migrações ficam em `supabase/migrations/` e são aplicadas em ordem pelo
`npm run migrate`. Para mudar o banco, **crie um arquivo novo** (`0003_...`)
em vez de editar um que já rodou.

## Detalhes que valem saber

- **Horário é sempre no fuso de Ivoti** (`America/Sao_Paulo`). A conta de
  "aberto agora" está em `src/lib/horarios.ts` e entende bar que fecha às 2h
  da manhã.
- **O chat só fala do que existe.** Ele recebe o catálogo inteiro dos locais
  publicados (`src/lib/catalogo.ts`, com 5 minutos de cache) e é instruído a
  nunca inventar lugar, preço ou horário. Quando cita um local escreve
  `[[slug]]`, e o site transforma isso num cartão clicável.
- **Segurança do banco** é por RLS: o visitante só enxerga o que está
  `publicado`; o dono enxerga e edita só o que é dele; o admin vê tudo.
- **`src/proxy.ts`** é o antigo `middleware.ts` — no Next 16 mudou de nome.
