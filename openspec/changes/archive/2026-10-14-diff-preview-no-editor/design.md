## Context

O save do editor (`POST /api/keymap`) hoje: aplica o payload sobre `state.model`, valida (`validateKeymap` + `validateBehaviors`), serializa com `serializeKeymap(state.model, state.original, layout.rows, state.originalDN)` e **grava** com `writeFile`, depois `loadModel()` pra re-baseline. Não há etapa intermediária de inspeção.

O `/api/sync/preview` (read-only) já produz um diff entre o keymap local e o destino no repo de build via `git --no-index diff` (em `src/sync/repo.js: preview()`), e o frontend já renderiza esse diff num dialog com o estilo `.diff`. Ou seja: a **renderização** e a **computação** de diff já existem — falta um dry-run do próprio save (modelo pendente × arquivo salvo) e a ligação no editor.

Restrições: zero dependências de runtime; invariante de round-trip por offset; o dry-run precisa refletir **exatamente** o que o save gravaria (mesmo serializer, mesma validação) e **não pode** mutar `state.model` nem tocar o disco.

## Goals / Non-Goals

**Goals:**
- Dry-run do save: aplicar o payload sem gravar, validar e devolver o diff (arquivo salvo atual × serialização pendente).
- Reusar um único mecanismo de diff no app (sync e editor) via helper compartilhado.
- Mostrar o diff no editor antes de confirmar o save; mesmo endpoint serve edições via agente.

**Non-Goals:**
- Não altera o comportamento do save direto nem do `/api/sync`.
- Não é diff visual "tecla a tecla" no board (é o diff textual do `.keymap`); um diff visual pode vir depois.
- Não persiste histórico de diffs; é efêmero por request.

## Decisions

- **Dry-run sobre cópia do modelo, não sobre `state.model`.** O preview clona o modelo (estrutural: layers/bindings/behaviors/newBehaviors via cópia profunda simples por `structuredClone` ou reconstrução), aplica o payload com a **mesma** função de aplicação do save e serializa com `state.original`/`state.originalDN` como baseline. Alternativa rejeitada: aplicar em `state.model` e reverter — frágil (qualquer early-return deixa o estado sujo) e perigoso num servidor single-process.
  - Para garantir "mesma lógica", extrair a aplicação do payload (`applyIncoming(model, incoming)`) hoje inline no handler do save para uma função reutilizável, chamada pelos dois caminhos.
- **Helper de diff compartilhado `diffText(a, b)`** em `src/keymap/diff.js`, encapsulando o `git --no-index diff` em arquivos temporários (como o sync já faz). `src/sync/repo.js: preview()` e o novo preview passam a usá-lo. Alternativa rejeitada: implementar LCS unified-diff em JS agora — mais código e outro formato; `git` já é dependência de fato do fluxo de build/sync.
- **Endpoint `POST /api/keymap/preview`** (não `GET`): precisa do mesmo corpo do save. Retorna `{ ok, changed, diff, validation, behaviorValidation, newBehaviorErrors }`. Em edição inválida, retorna o diff vazio + os erros (mesma forma do 400 do save), pra UI mostrar o porquê sem gravar.
- **Editor**: botão "Pré-visualizar" ao lado de "Salvar"; abre dialog reusando o markup/estilo `.diff` do sync; o dialog tem um "Salvar" que chama o `POST /api/keymap` existente. Save direto permanece pra quem não quer o passo extra.

## Risks / Trade-offs

- [Serialização pendente diverge do que seria gravado] → o dry-run usa **exatamente** `serializeKeymap(copy, state.original, ...)`, idêntico ao save; teste garante que `preview` + `save` da mesma edição produzem o mesmo texto.
- [Cópia profunda incompleta vaza mutação pro `state.model`] → teste explícito: após o preview, `snapshotBindings(state.model)` e a config dos behaviors permanecem iguais ao baseline.
- [`git --no-index` indisponível/sandbox] → o helper degrada para `{ changed: a!==b, diff: "(diff indisponível)" }` (comportamento que o sync já tolera), sem quebrar o save.
- [Diff grande polui a tela] → dialog com `max-height`/scroll já existente no estilo `.diff`.

## Migration Plan

Aditivo; sem migração de dados. Extração de `diffText` é refactor sem mudança observável (coberto pelo teste de preview do sync continuar funcionando). Rollback = remover o endpoint/botão; nada persistido.
