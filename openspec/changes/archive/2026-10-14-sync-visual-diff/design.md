## Context

`diff-visual-no-board` entregou: `src/keymap/visualDiff.js` (helper puro antes/depois) e, no frontend, o render do board de diff (seletor de layer com badge, destaques add/mod/rem, rodapé, toggle Visual/Texto) dentro do `#preview-dialog`. Esse render desenha o board "depois" a partir de `state.data.layers`.

O dialog de sync (`#sync-dialog`, `openSync`) chama `GET /api/sync/preview`, que em `src/sync/repo.js: preview()` lê o arquivo de destino (repo de build) e o local, e devolve `{ changed, diff }` (textual, via `diffText`). Os dois lados são arquivos `.keymap` — logo, parseáveis em modelo e comparáveis com `visualDiff`.

Diferença-chave em relação ao preview do editor: no sync, o "depois" é o **arquivo local em disco** (o que será copiado pro repo), **não** o estado editado em memória. Então o board do sync não pode se basear em `state.data.layers`.

## Goals / Non-Goals

**Goals:**
- `GET /api/sync/preview` retorna `visual` (mesmo formato do preview) + as `afterLayers` (layers do arquivo local) pra desenhar o board.
- Dialog de sync com toggle Visual/Texto e board de diff, reusando o componente do preview.
- Correto mesmo com edições não salvas abertas (board = arquivo local, não memória).
- Degradação: destino ausente ou parse falho → `visual: null`, dialog usa o textual.

**Non-Goals:**
- Não muda o fluxo de sync em si (branch/commit/push/PR) nem o `diffText`.
- Não tenta diff visual quando os arquivos não parseiam (cai no textual).
- Não adiciona preview visual ao resultado pós-sync (só ao preview antes de confirmar).

## Decisions

- **Reutilizar `visualDiff` nos dois lados parseados**: no preview do sync, `parseKeymap(destText)` = antes, `parseKeymap(localText)` = depois; montar args (`layersBefore/After`, `dnBefore/After`, `behaviorsBefore/After`) e chamar `visualDiff`. Alternativa rejeitada: diffar binding-a-binding no textual — reinventa o que `visualDiff` já faz.
- **Onde computar**: em `src/sync/repo.js: preview()`, que já lê os dois textos; passa a devolver `{ changed, diff, visual }`. `visual` inclui `afterLayers` = `localModel.layers.map(l => ({ name, displayName, bindings }))`. Se `dest` ausente ou `parseKeymap` lançar, `visual = null` (try/catch) e mantém o textual. Mantém o git fora do helper visual.
- **Componente de diff visual reutilizável (frontend)**: extrair o render atual (`renderPreviewVisual`/`drawDiffBoard`/`renderPreviewFooter` + toggle) para uma função que recebe `{ visual, afterLayers, els }` e opera sobre contêineres passados por parâmetro, em vez de fixos `#preview-*`. O preview do editor passa `afterLayers = state.data.layers`; o sync passa `afterLayers = resposta.visual.afterLayers`. Alternativa rejeitada: duplicar o render no sync — divergência garantida.
- **Board "depois" sempre do arquivo**: no sync, desenhar a partir de `afterLayers` do servidor. Assim, edições não salvas no editor não contaminam o que o sync mostra (coerente com o que o sync realmente envia: o arquivo salvo).

## Risks / Trade-offs

- [Arquivos com estrutura divergente (nº de layers)] → `visualDiff` já itera por índice com guarda de tamanho; layers sem par são ignoradas no board e a diferença aparece no textual.
- [Parse de um `.keymap` "estranho" do repo de build falhar] → try/catch → `visual: null` → textual. Nunca quebra o preview do sync.
- [Refactor do componente quebrar o preview do editor] → cobertura: smoke no navegador dos **dois** dialogs após o refactor.
- [`afterLayers` inflar a resposta] → é O(teclas) (4×58), irrelevante.

## Migration Plan

Aditivo; sem migração. Rollback = esconder o toggle/board no sync e parar de enviar `visual` (o textual e o fluxo de sync seguem). Nada persistido.
