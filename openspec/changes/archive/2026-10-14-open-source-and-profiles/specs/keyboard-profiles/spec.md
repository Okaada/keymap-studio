## ADDED Requirements

### Requirement: Perfil de teclado como unidade de configuração

O sistema SHALL representar teclado + layout + keymap + build repo como um **perfil** (`profiles/<name>.json`), com exatamente um perfil ativo por vez; o editor opera sempre sobre o perfil ativo.

#### Scenario: Perfil ativo dirige o editor
- **WHEN** um perfil está ativo
- **THEN** `GET /api/keymap` retorna o layout, o keymap e os behaviors **desse** perfil
- **AND** cheatsheet e sync usam o `buildRepo` e os paths do perfil ativo

#### Scenario: Perfis independentes por teclado
- **WHEN** existe mais de um perfil (ex.: Lily58 e Corne)
- **THEN** cada um tem seu próprio layout/keymap/buildRepo
- **AND** a validação usa a contagem de teclas do layout do perfil ativo

### Requirement: Listar, selecionar e criar perfis

O sistema SHALL expor API para listar os perfis, selecionar o ativo e criar um novo, e a UI SHALL permitir trocar e criar perfil sem editar arquivos à mão.

#### Scenario: Trocar de perfil recarrega o teclado
- **WHEN** o usuário seleciona outro perfil no seletor do header
- **THEN** `POST /api/profiles/select` marca-o ativo e o editor recarrega layout/keymap/behaviors/build daquele perfil
- **AND** a troca não exige editar nenhum arquivo manualmente

#### Scenario: Criar um novo perfil
- **WHEN** o usuário cria um perfil informando nome, keyboard, layout, keymapPath e buildRepo
- **THEN** o sistema valida (nome único/slug, layout existente) e grava `profiles/<name>.json`
- **AND** rejeita com mensagem clara se o nome colidir ou o layout não existir

#### Scenario: Keymap inicial de um perfil novo
- **WHEN** o perfil novo aponta para um keymap que ainda não existe e há um keymap de exemplo para aquele teclado
- **THEN** o sistema usa o exemplo como ponto de partida, em vez de falhar

### Requirement: Migração do config legado sem quebra

O sistema SHALL migrar automaticamente a configuração single-config legada para um perfil, sem perder a configuração existente.

#### Scenario: Primeira execução com config legado
- **WHEN** não existe diretório de perfis mas existe um `config.json` legado com `keymapPath`
- **THEN** o sistema cria um perfil a partir dele e o marca como ativo
- **AND** o editor continua funcionando exatamente como antes

#### Scenario: Migração é idempotente
- **WHEN** já existem perfis
- **THEN** a migração não roda de novo nem duplica/sobrescreve perfis
