## 1. Preview do sync com diff estruturado

- [x] 1.1 Em `src/sync/repo.js: preview()`, após ler os textos, parsear ambos (`parseKeymap`) e computar `visualDiff` (antes = destino/repo de build, depois = local); montar `visual = { layers, behaviors, renames, afterLayers }` com `afterLayers = localModel.layers.map(l => ({ name, displayName, bindings }))`
- [x] 1.2 try/catch: destino ausente ou parse falho → `visual: null`; preview continua retornando `{ changed, diff }` normalmente
- [x] 1.3 `GET /api/sync/preview` (server.js) repassa `visual` na resposta

## 2. Componente de diff visual reutilizável (frontend)

- [x] 2.1 Generalizar `renderPreviewVisual`/`drawDiffBoard`/`renderPreviewFooter` + toggle para operar sobre contêineres/estado passados por parâmetro (ex.: `mountVisualDiff({ visual, afterLayers, els })`), sem depender de `#preview-*` fixos
- [x] 2.2 Preview do editor passa a usar o componente com `afterLayers = state.data.layers` (comportamento idêntico ao atual)

## 3. Diff visual no dialog de sync

- [x] 3.1 `#sync-dialog`: adicionar toggle [Visual | Texto] + contêineres do board visual (reusando o markup/estilo de `diff-visual-no-board`), mantendo o `<pre class="diff">` como a visão Texto
- [x] 3.2 `openSync`: ao receber `visual` não-nulo, montar o componente (`afterLayers` da resposta) e abrir na visão Visual; se `visual` nulo, mostrar só o textual (como hoje)
- [x] 3.3 Garantir que o botão "Confirmar e abrir PR" segue funcionando em ambas as visões

## 4. Testes e verificação

- [x] 4.1 Teste: `visualDiff` entre dois modelos parseados de arquivos distintos (fixture "antes" × "depois") detecta as teclas/behaviors/renames certos
- [x] 4.2 Teste: destino ausente / texto não-parseável → caminho que resulta em `visual: null` sem lançar
- [x] 4.3 `npm test` verde + smoke no navegador: abrir "Enviar pro repo de build", ver board destacado, trocar layer, alternar Visual/Texto; confirmar que o preview do editor continua ok; NÃO executar o sync real (sem push/PR); restaurar `keymaps/lily58.keymap` se editado na verificação
