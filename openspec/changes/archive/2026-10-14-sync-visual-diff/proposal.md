## Why

O dialog "Enviar pro repo de build" ainda mostra só o diff **textual** do git (keymap local × repo de build). Acabamos de ter o diff **visual** no preview de pré-salvar (`diff-visual-no-board`) e faz sentido oferecer a mesma leitura no envio pro build — ver no board quais teclas vão mudar no firmware é muito mais claro do que ler devicetree.

## What Changes

- `GET /api/sync/preview` passa a retornar, além do `diff` textual, um `visual` (mesmo formato de `diff-visual-no-board`): parseia os **dois** arquivos `.keymap` (repo de build = antes, local = depois) em modelo e roda `visualDiff`. Inclui também as **layers do arquivo local** (`afterLayers`: nome + bindings) para desenhar o board.
- O "depois" vem do **arquivo local em disco** (não do estado editado em memória do editor) — o diff do sync é sobre o arquivo salvo, então o board reflete o que realmente será enviado, mesmo com edições não salvas abertas no editor.
- O dialog de sync ganha o mesmo **toggle [Visual | Texto]** e o board de diff (seletor de layer com badge, destaques add/mod/rem, rodapé de behaviors/renomeações), reusando o componente criado em `diff-visual-no-board`.
- Se o arquivo de destino não existir (primeiro sync) ou os arquivos não parsearem, o `visual` vem nulo e o dialog cai no diff textual.

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova: é a mesma capacidade de diff visual aplicada a outra origem de comparação. -->

### Modified Capabilities
- `visual-keymap-diff`: a visualização do diff passa a cobrir também a comparação **local × repo de build** (origem do sync), não só a edição pendente do editor; o componente de board de diff é reutilizado nos dois dialogs.

## Impact

- `src/sync/repo.js` (ou um helper em `src/keymap/`): o preview do sync parseia os dois `.keymap` e computa `visualDiff`; retorna `{ changed, diff, visual }` com `visual = { layers, behaviors, renames, afterLayers }` (ou `visual: null` se destino ausente/parse falhar).
- `src/server.js`: `GET /api/sync/preview` repassa o `visual`.
- `web/` (`app.js`, `index.html`, `style.css`): generalizar o renderer de diff visual do preview (board + seletor + rodapé + toggle) para um componente reutilizável que aceita as "after layers"; usar no `#sync-dialog`. O board do sync desenha a partir das `afterLayers` vindas do servidor.
- Reuso puro de `parseKeymap` + `visualDiff`; sem novas dependências. O textual continua via `diffText`.
- Testes (`node --test`): `visualDiff` entre dois modelos parseados de arquivos distintos (antes/depois) produz o diff esperado; destino ausente → sem crash.
