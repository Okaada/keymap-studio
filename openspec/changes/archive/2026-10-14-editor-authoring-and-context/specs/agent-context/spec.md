## ADDED Requirements

### Requirement: AGENTS.md com contexto do teclado e regras de edição
O repositório SHALL conter um `AGENTS.md` descrevendo o teclado (Lily58, layers e nomes), as
convenções de uso e as regras de edição segura do `.keymap`, para orientar edições feitas por agentes.

#### Scenario: Contexto do teclado presente
- **WHEN** um agente abre o `AGENTS.md`
- **THEN** encontra o modelo do teclado (58 teclas, as layers e seus nomes) e as convenções do usuário

#### Scenario: Regras de edição segura presentes
- **WHEN** um agente vai editar o keymap
- **THEN** o `AGENTS.md` indica a fonte da verdade (`keymaps/lily58.keymap`), manter 58 bindings por layer,
  usar `display-name` para nomes, que a config de hold-tap é compartilhada, validar antes de salvar, e o fluxo de build/sync
