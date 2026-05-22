# Onelive

Onelive e uma aplicacao para salvar, organizar e consultar links que voce acessa com frequencia. O projeto foi pensado para uso local, com banco SQLite, front-end em React + TypeScript e back-end em Node.js + Express.

## Visao geral

A aplicacao permite criar, listar, editar e excluir links salvos, aplicar tags/palavras-chave, marcar itens como privados e filtrar o conteudo por texto, tag ou status de privacidade.

O fluxo atual inclui:

- front-end Vite em `http://localhost:3000`
- back-end Express em `http://localhost:4000`
- banco SQLite local em `data/onelive.sqlite`
- cache local no navegador para bookmarks e sessao

## Stack

- Front-end: React 19, TypeScript, Vite
- Back-end: Node.js 22+, Express, TypeScript
- Banco de dados: SQLite com `better-sqlite3`
- Ferramentas: `tsx`, `vite`, `tailwindcss`, `lucide-react`, `motion`

## Estrutura principal

- `src/` - aplicacao front-end
- `server/` - API, acesso ao banco e scripts de manutencao
- `server/db/schema.sql` - schema SQLite
- `server/db/init.ts` - inicializacao do schema
- `server/db/seed.ts` - dados iniciais
- `server/db/check.js` - checagem rapida do banco
- `server/db/dedupe.js` - remocao de duplicados
- `data/` - arquivo SQLite gerado em runtime
- `ACTUALIZATION.MD` - status atual da implementacao
- `FUNCIONALIDADES.MD` - requisitos funcionais do produto

## Requisitos

- Node.js 22 ou superior recomendado
- npm
- Ambiente local com permissao para criar arquivos em `data/`

## Instalacao

```bash
npm install
```

## Como rodar

### Opcao recomendada: tudo em um comando

Esse comando inicializa o banco, popula dados iniciais e sobe back-end + front-end:

```bash
npm run dev:all
```

O que ele faz:

1. executa `npm run db:init`
2. executa `npm run db:seed`
3. sobe a API em `http://localhost:4000`
4. sobe o front-end em `http://localhost:3000`

### Fluxo manual

Se quiser rodar por etapas:

```bash
npm run db:init
npm run db:seed
npm run server:dev
```

Em outro terminal:

```bash
npm run dev
```

## Scripts disponiveis

- `npm run dev` - inicia o front-end com Vite na porta 3000
- `npm run dev:all` - inicializa banco, seed e sobe front-end + back-end juntos
- `npm run server:dev` - inicia a API com watch
- `npm run db:init` - aplica o schema SQLite
- `npm run db:seed` - popula os dados iniciais
- `npm run build` - gera o build de producao do front-end
- `npm run preview` - previsualiza o build do front-end
- `npm run lint` - roda checagem de tipos com TypeScript
- `npm run clean` - remove artefatos gerados (`dist`, `server.js`, `data`)

Observacao: o script `clean` usa `rm -rf`, entao e mais adequado para shells Unix-like ou Git Bash/WSL no Windows.

## Banco de dados

O banco e SQLite e fica em `data/onelive.sqlite`.

### Tabelas principais

- `users`
- `categories`
- `tags`
- `files`
- `files_tags`

### Campos importantes de `files`

- `title`
- `file_type`
- `icon_type`
- `source_url`
- `description`
- `keywords`
- `rating`
- `is_private`
- `created_at`
- `updated_at`

### Utilitarios do banco

```bash
node server/db/check.js
node server/db/dedupe.js
```

### Observacoes sobre o banco

- foreign keys estao habilitadas
- o schema aplica restricoes e indices para consulta
- o banco armazena metadados e URLs/caminhos, nao blobs binarios
- tags e categories sao normalizadas para facilitar organizacao

## API

### Saude

```http
GET /health
```

Retorna o status da API e o caminho do banco.

### Bookmarks

```http
GET /api/bookmarks
GET /api/bookmarks/:id
POST /api/bookmarks
PUT /api/bookmarks/:id
DELETE /api/bookmarks/:id
```

Filtros suportados em `GET /api/bookmarks`:

- `search`
- `tag`
- `isPrivate`

### Usuarios

```http
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id
```

Os endpoints de usuario existem para administracao basica da base local.

## Estado atual da implementacao

Conforme documentado em [ACTUALIZATION.MD](ACTUALIZATION.MD), o projeto ja possui:

- CRUD de links salvo no back-end
- busca por texto, tag e privacidade
- banco SQLite local com seed e utilitarios de manutencao
- front-end com sessao local no navegador
- ocultacao de itens privados na interface enquanto a sessao nao esta ativa
- suporte visual para login e signup

### Limite conhecido

Ainda nao existe autenticacao/autorizaçao completa aplicada no servidor para proteger conteudo privado. Hoje o bloqueio de acesso e feito principalmente na camada de interface com sessao local. O plano do projeto e evoluir isso depois com cookie sessions.

## Documentacao relacionada

- [FUNCIONALIDADES.MD](FUNCIONALIDADES.MD) - escopo funcional do produto
- [ACTUALIZATION.MD](ACTUALIZATION.MD) - estado atual da implementacao
- [style.md](style.md) - notas de estilo e direcao visual

## Desenvolvimento futuro

Pontos previstos para evolucao:

- autenticaçao persistida no servidor
- protecao real para itens privados
- refinamento de permissões por usuario
- possivel empacotamento para uso em servidor local/virtualizado

## Licenca

Este repositório ainda nao possui arquivo de licenca definido.
