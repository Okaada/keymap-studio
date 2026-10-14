## Context

O editor já parseia o nó `behaviors { }` de forma específica para hold-tap (config
`tapping-term-ms`/`flavor`/…), edita via lista de edições por offset e expõe behaviors custom na
paleta. Agora o usuário (novo no ZMK) quer: parâmetros explicados, criar/gerenciar behaviors de
vários tipos, board centralizado, e documentação de contexto (AGENTS.md + ai-memory).

Restrições: manter o `.keymap` compilável; round-trip seguro; não quebrar o que já existe.

## Goals / Non-Goals

**Goals:**
- Descrições curtas e amigáveis para os parâmetros (config dos behaviors e params da paleta).
- Criar e editar behaviors no nó `behaviors { }` de forma genérica, dirigida por um schema por
  tipo (`compatible`), com os campos certos; o novo behavior fica usável nas teclas.
- Centralizar o board na página.
- `AGENTS.md` com uso do teclado + convenções + regras de edição segura.
- Registrar a arquitetura do repo no ai-memory.

**Non-Goals:**
- **Combos** (`combos { }` é outro nó, outro modelo) — próxima change.
- Validação profunda de todos os tipos exóticos; renomear identificador de nó existente;
  macros com sequências longas editadas campo-a-campo (usaremos um campo de bindings).

## Decisions

### D1 — Schema de tipos de behavior como fonte única (descrições + formulário)
Um registro `BEHAVIOR_TYPES`: `compatible` → `{ label, bindingCells, hasBindings, props:[{dt,
key, type, desc, options?}] }`, mais descrições dos params da paleta no catálogo. Essa mesma
estrutura alimenta (a) as descrições exibidas (#1) e (b) os campos do formulário de criar/editar
(#2). _Por quê:_ uma definição evita texto de ajuda e formulário divergirem; estende o que já
existe (hoje o hold-tap é um caso particular). _Alternativa rejeitada:_ hardcode de ajuda na UI
separado do form — duplicação que desatualiza.

### D2 — Parser genérico do nó `behaviors` + inserção de novo nó
O parser passa a capturar, por nó: `ref`, `compatible`, `#binding-cells`, o texto de `bindings`
(região) e as propriedades escalares conhecidas do tipo (com região do valor ou ponto de
inserção). Para criar, o serializer insere um novo nó antes do `}` do `behaviors`, a partir de um
template do tipo escolhido. _Por quê:_ generaliza o parsing atual (hoje só hold-tap) e reusa a
lista de edições por offset; round-trip no-op preservado. _Alternativa rejeitada:_ reescrever o
nó `behaviors` inteiro — perderia formatação e quebraria o no-op.

### D3 — Bindings por tipo: campos guiados + fallback texto
Tipos da família hold-tap (hold-tap, mod-morph, tap-dance de 2) recebem N campos de binding
(conforme `bindingCells`/tipo); tipos com sequência (macro) usam um campo de `bindings` em texto
livre (validado como lista de `&...`). _Por quê:_ bom UX onde é simples, sem travar os casos
complexos. _Alternativa rejeitada:_ formulário rico para macros — custo alto, pouco uso inicial.

### D4 — Validação por tipo
Nome único e válido (identificador), `compatible` conhecido, `#binding-cells` coerente, props
numéricas `*-ms` ≥ 0, enums (ex.: `flavor`) válidos, bindings não vazios quando o tipo exige.
Rejeita com mensagem antes de gravar. Smoke adicional: o arquivo salvo continua parseável.

### D5 — Board centralizado (CSS)
A área do board passa a centralizar horizontalmente (container centralizado; o painel
lateral/paleta permanece à direita). Sem mudar coordenadas físicas nem escala. _Por quê:_ #4 é
puramente visual.

### D6 — AGENTS.md no repo (contexto para agentes)
`AGENTS.md` na raiz: modelo do teclado (Lily58, 58 teclas, layers e nomes), convenções do
usuário, e **regras de edição segura** (fonte da verdade = `keymaps/lily58.keymap`; só reescrever
o que muda; manter 58 bindings/layer; nomes via `display-name`; config de hold-tap é
compartilhada; validar antes de salvar; fluxo de build/sync). Aponta para os specs do OpenSpec
para detalhes. _Por quê:_ convenção cross-tool; dá contexto a qualquer agente que edite o keymap.

### D7 — Contexto no ai-memory (memória do assistente)
Um arquivo de memória `project` com arquitetura (parser/serializer/catálogo/servidor/web),
fluxos (editar→salvar round-trip, agente→recarregar, cheatsheet, sync branch+PR) e convenções,
+ ponteiro no `MEMORY.md`. É a memória do assistente (fora do repo), não um arquivo do projeto.

## Risks / Trade-offs

- **"Gerenciador geral" é amplo** → escopo ao nó `behaviors { }`, dirigido por schema; combos e
  tipos exóticos ficam fora/por-texto; adicionar tipos depois é só dado no registro.
- **Inserir nó/props novas** → pontos de inserção determinísticos (antes do `}` do nó/`behaviors`)
  com indentação; reusa o edit-list; teste de no-op garante o arquivo intacto sem mudanças.
- **Behavior inválido quebrar a compilação** → validação por tipo + smoke de parse antes de
  considerar salvo; nome único evita colisão.
- **AGENTS.md/ai-memory desatualizarem** → manter conciso e apontar para os specs (detalhe vive lá).

## Open Questions

- Conjunto inicial de tipos no `BEHAVIOR_TYPES` (começar com hold-tap, mod-morph, sticky-key,
  tap-dance, macro, caps-word; expandir conforme uso).
- Combos: confirmar como próxima change (nó `combos { }`, com key-positions/timeout/layers).
