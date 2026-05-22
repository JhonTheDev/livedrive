
## Funcionalidades da Aplicação

### Objetivo
Aplicação para salvar, organizar e consultar links que o usuário acessa com frequência, evitando a necessidade de procurar o mesmo conteúdo repetidas vezes.

### Funcionalidades principais
1. Cadastro de links com os campos básicos necessários para identificação e consulta.
2. Listagem de links salvos com ordenação e navegação pelos registros cadastrados.
3. Edição de registros existentes para atualizar título, URL, descrição, avaliação e marcações.
4. Exclusão de links quando o conteúdo não for mais útil.
5. Busca por texto livre em título, descrição, URL e palavras-chave associadas.
6. Filtragem por palavra-chave, categoria ou marcação personalizada.
7. Avaliação do link com nota para indicar qualidade ou utilidade.

### Organização do conteúdo
1. Cada link pode receber uma ou mais palavras-chave para facilitar recuperação posterior.
2. As palavras-chave devem servir como mecanismo de organização e busca.
3. O mesmo link pode ser associado a mais de um contexto, como estudo, trabalho, lazer ou referência pessoal.

### Privacidade
1. A aplicação deve permitir marcar itens como privados.
2. Itens privados não devem aparecer de forma visível por padrão.
3. O acesso a itens privados deve exigir uma ação de desbloqueio ou autenticação adicional.
4. O campo de privacidade deve cobrir conteúdo pessoal ou restrito.

### Autenticação e acesso
1. A aplicação deve ter controle de acesso para impedir uso não autorizado.
2. O acesso geral aos dados deve exigir login.
3. O acesso a conteúdo privado pode exigir uma segunda camada de proteção.
4. O sistema deve ser preparado para uso em ambiente local ou servidor próprio.

### Estrutura mínima de dados
1. id
2. title
3. url
4. description
5. rating
6. is_private
7. keywords ou tags
8. created_at
9. updated_at

### Requisitos de uso futuro
1. O projeto deve ser simples de manter em servidor local.
2. A estrutura deve permitir migração para virtualização posteriormente.
3. O modelo de dados deve continuar pequeno e direto para facilitar evolução futura.

### STACK
Front: React + Typescript
Back: Python/Node
Banco de Dados: SQLite