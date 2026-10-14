## ADDED Requirements

### Requirement: Licença e documentação de uso

O repositório SHALL incluir uma licença MIT e um README que documente o uso para alguém que não seja o autor.

#### Scenario: Licença presente
- **WHEN** o repositório é publicado
- **THEN** existe um arquivo `LICENSE` com a licença MIT

#### Scenario: README cobre o uso
- **WHEN** uma pessoa nova abre o repositório
- **THEN** o README explica o que é, o quick start (rodar o servidor), perfis (criar/trocar), editar teclas/behaviors, tester, cheatsheet, build/sync e o uso por agente
- **AND** aponta onde ajustar a licença (holder) e como adicionar o próprio teclado

### Requirement: Repositório público sem dados pessoais

O repositório versionado SHALL conter apenas arquivos de exemplo genéricos; os arquivos reais do usuário (perfil/keymap/paths) SHALL ser ignorados pelo git.

#### Scenario: Exemplos versionados, reais ignorados
- **WHEN** o repositório é inspecionado
- **THEN** há arquivos de exemplo versionados (`config.example.json`, `profiles/example.json`, `keymaps/*.example.keymap`)
- **AND** `.gitignore` ignora os reais (`config.json`, `profiles/*.json` reais, `keymaps/*.keymap`), preservando-os localmente

#### Scenario: Contexto de agente genérico
- **WHEN** o `AGENTS.md` é lido
- **THEN** descreve o teclado em termos do **perfil ativo** (não nomes/contas/e-mail específicos de um usuário)
- **AND** não contém identificadores pessoais (conta GitHub, e-mail, alias SSH do dono)

#### Scenario: Clone funciona a partir dos exemplos
- **WHEN** alguém clona o repositório e roda o servidor pela primeira vez
- **THEN** há um caminho documentado (copiar os exemplos para os arquivos reais) que deixa o editor funcional sem conhecimento prévio
