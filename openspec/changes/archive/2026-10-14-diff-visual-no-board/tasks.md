## 1. Helper de diff estruturado

- [x] 1.1 Criar `src/keymap/visualDiff.js` com `visualDiff({ layersBefore, layersAfter, dnBefore, dnAfter, behaviorsBefore, behaviorsAfter })` → `{ layers:[{index,name,changes:[{pos,before,after,kind}]}], behaviors:[{ref,prop,before,after}], renames:[{index,before,after}] }`
- [x] 1.2 Classificar `kind` (added/removed/modified) tratando `&trans`/`&none` como "vazio"; comparar bindings por `bindingToString`

## 2. Resposta do preview

- [x] 2.1 No handler `POST /api/keymap/preview`, montar os argumentos (baseline = `state.original`/`state.originalDN`/`state.model.behaviors`; pendente = `draft`) e incluir `visual` na resposta JSON
- [x] 2.2 Garantir que continua sem gravar/mutar `state.model` e que o `diff` textual permanece

## 3. Geometria reutilizável do board

- [x] 3.1 Extrair de `renderBoard` o posicionamento por `layout` para um helper compartilhado (coords/tamanho por posição), sem mudar o board do editor
- [x] 3.2 Desenhar um board read-only a partir desse helper (reusando `legend`/`prettyKey`), aceitando um mapa de destaque por posição

## 4. UI do dialog (toggle + visual)

- [x] 4.1 `#preview-dialog`: adicionar toggle [Visual | Texto] e contêineres `#preview-visual` / `#preview-text` (o `<pre class="diff">` atual vira o "Texto")
- [x] 4.2 Visão Visual: seletor de layer com badge de contagem (esmaecer layers sem mudança; abrir na 1ª com mudança) + board de diff com destaques add/mod/rem e antes→depois no hover/foco
- [x] 4.3 Rodapé da visão Visual: listar mudanças de behaviors (`ref.prop: before→after`) e renomeações (`layer: before→after`)
- [x] 4.4 CSS: classes de destaque (`.diff-added/.diff-modified/.diff-removed`), badges e layout do toggle (reusando tokens existentes)

## 5. Testes e verificação

- [x] 5.1 Teste `visualDiff`: detecta modified (troca de binding), added (trans→real), removed (real→trans) na posição/layer certas
- [x] 5.2 Teste `visualDiff`: mudança de `flavor`/`tapping-term-ms` entra em `behaviors`; rename entra em `renames`; no-op retorna tudo vazio
- [x] 5.3 Teste: `POST /api/keymap/preview` inclui `visual` coerente para uma edição (sem gravar)
- [x] 5.4 `npm test` verde + smoke no navegador: abrir preview com mudanças → ver board destacado, trocar de layer, alternar Visual/Texto, conferir rodapé; restaurar `keymaps/lily58.keymap` após edições de verificação
