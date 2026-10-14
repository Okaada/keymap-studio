## Why

Sou novo no Lily58/ZMK e quero o editor mais claro e autônomo: entender os parâmetros sem
decorar docs, poder criar meus próprios behaviors, ver o teclado centralizado, e dar contexto
do projeto/teclado para edições via agente (e para mim no futuro). Hoje os parâmetros não têm
explicação, não dá pra criar behaviors, o board fica colado à esquerda e não há um documento de
contexto para agentes.

## What Changes

- **Descrições nos parâmetros** (#1): cada parâmetro configurável (dos behaviors e da paleta)
  ganha uma explicação curta e amigável (ex.: o que é `tapping-term-ms`, `flavor`, etc.).
- **Criar/gerenciar behaviors** (#2): fluxo genérico, dirigido por *schema de tipo*, para criar
  e editar behaviors no nó `behaviors { }` (hold-tap, tap-dance, mod-morph, sticky-key, macro…),
  com os campos certos por tipo; o novo behavior aparece na paleta das teclas.
- **Layout centralizado** (#4): o teclado passa a ficar centralizado na página.
- **AGENTS.md** (#5): documento no repo com o uso do teclado, convenções de layers e regras de
  edição segura — para edições via agente entenderem o contexto.
- **Contexto no ai-memory** (#3): registrar no meu armazenamento de memória uma visão do repo
  (arquitetura e como funciona) para futuras sessões.

## Capabilities

### New Capabilities
- `agent-context`: um `AGENTS.md` no repo descrevendo o teclado, as convenções e as regras de
  edição segura do `.keymap`, para orientar edições feitas por agentes.

### Modified Capabilities
- `keymap-model`: parse/round-trip **genérico** do nó `behaviors { }` (nome, `compatible`,
  propriedades escalares e `bindings`) e **inserção de um novo nó de behavior**.
- `behavior-config`: descrições nos parâmetros (behaviors e paleta) e **criação/edição genérica**
  de behaviors por tipo (não só hold-tap), com validação por tipo.
- `visual-keymap-editor`: o board é renderizado centralizado.

## Impact

- **Código**: parser (nós de behavior genéricos + offsets + inserção), serializer (novo nó +
  props genéricas, reusando a lista de edições por offset), catálogo/schema de tipos de behavior
  (com descrições), validação por tipo, frontend (descrições, formulário de criar/editar, CSS de
  centralização), e um `AGENTS.md`.
- **ai-memory**: novo arquivo de memória `project` + ponteiro no `MEMORY.md` (fora do repo; é a
  memória do assistente).
- **Sem** novas dependências; build/sync inalterados.
- **Não-objetivos**: **combos** (ficam no nó `combos { }`, modelo diferente → próxima change);
  validação profunda de tipos exóticos (campos conhecidos têm validação; o resto é editável como
  texto); renomear o identificador de nós existentes.
