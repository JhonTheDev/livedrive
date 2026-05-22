## Front-End

No front-end da aplicação, você consegue:

- iniciar a aplicação sem sessão ativa;
- acessar login e signup pelo ícone de usuário na sidebar;
- abrir uma tela de autenticação com a mesma estética glass/dark do dashboard;
- persistir a sessão localmente no navegador;
- ocultar completamente itens privados até ocorrer login;
- liberar o modo de vault privado apenas para sessões autenticadas;
- manter a navegação, busca e cards dentro do mesmo fluxo visual já existente.

---
## Back-End

No back-end da aplicação, você consegue:

- criar, listar, editar e excluir links salvos;
- buscar links por texto, tag e status de privacidade;
- marcar links como privados;
- abrir e inicializar o banco SQLite local;
- consultar o status da API pela rota de saúde;
- manter os dados persistidos no banco, mesmo após reiniciar a aplicação;
- trabalhar com a estrutura de tags associadas aos links.

Ainda não há autenticação completa e persistida no servidor para conteúdo privado; o bloqueio de acesso atual está aplicado na camada de interface com sessão local.

---
## Autenticação

Estado atual do fluxo de acesso:

- a aplicação abre deslogada;
- o login é feito pela sidebar;
- existe suporte visual para login e signup;
- a sessão fica salva no navegador;
- itens privados ficam ocultos até autenticação;
- o vault privado só é exibido quando a sessão está ativa.

---
## Base de Dados
A seguir estão as capacidades e características da camada de banco de dados da aplicação (escopo apenas "Base de Dados"):

- Banco: SQLite (arquivo local em `data/onelive.sqlite`).
- Schema principal: tabelas `users`, `categories`, `tags`, `files` e tabela de associação `files_tags`.
- Relacionamentos: um `user` pode ter muitos `files`; `files` podem pertencer a uma `category` (opcional) e relacionar-se a múltiplas `tags` (N:N).
- Campos e capacidades dos `files`: `file_type` (link/pdf/env/md/file/other), `source_url` (caminho ou URL), `description`, `keywords` (JSON), `rating` (1-5), `is_private`, `created_at`, `updated_at`.
- Integridade e performance: chaves estrangeiras ativadas, restrições (`CHECK`/unicidade) e índices em `user_id`, `category_id`, `file_type`, `is_private` e `created_at` para consultas eficientes.
- Operações disponíveis (scripts):
	- Inicializar schema: `npm run db:init`
	- Popular (seed): `npm run db:seed` (idempotente, re-runnable)
	- Remover duplicatas: `node server/db/dedupe.js`
	- Verificação rápida: `node server/db/check.js`
- Design decision: o banco armazena apenas metadados e caminhos/URLs dos arquivos, não os conteúdos binários (sem BLOBs embutidos) — isso mantém a base leve e portátil.
- Extensibilidade: tags e categories são normalizadas e podem ser usadas para categorizar majoritariamente links (filmes, séries, jogos, etc.) sem misturar com o tipo técnico do arquivo.

---
## Endpoints de Usuários (Back-end)

Adicionei endpoints HTTP para gerenciar usuários diretamente pela API. Eles permitem criar, listar, atualizar e excluir contas de usuário administrativamente.

- `GET /users` — lista usuários (campos públicos: `id`, `email`, `display_name`, `role`, `is_active`, `created_at`, `updated_at`).
- `GET /users/:id` — obtém um usuário específico (mesmos campos públicos).
- `POST /users` — cria um usuário. Payload esperado (JSON):
	- `email` (string, required)
	- `password` (string, required)
	- `display_name` (string, optional)
	- `role` (string, optional, default `user`)

- `PUT /users/:id` — atualiza um usuário existente. Pode incluir `password` para trocar a senha (armazenada como hash scrypt), `display_name`, `role` e `is_active`.
- `DELETE /users/:id` — remove um usuário.

Notas:
- Senhas são armazenadas como hash scrypt com salt (formato `scrypt$<salt>$<hex>`). Não há exposição de hash completo nas respostas da API.
- É recomendado habilitar autenticação e controles de acesso antes de expor esses endpoints em produção.
