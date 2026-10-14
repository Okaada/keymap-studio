## Context

`diff-preview-no-editor` já entrega o dry-run: `POST /api/keymap/preview` clona o modelo, aplica o payload, valida e devolve o `diff` textual (via `diffText`). O modelo em memória tem tudo que precisamos pra um diff estruturado **sem git**:
- `state.original` = snapshot dos bindings do arquivo salvo (baseline), `state.originalDN` = display-names salvos.
- `state.model` = modelo salvo (behaviors com `config`).
- `draft` = clone do modelo após `applyIncoming(payload)` (o pendente).

O frontend já desenha o board a partir de `layout` (coords exatas por posição) e formata cada tecla com `bindingToString`/`legend`/`prettyKey`. Ou seja, geometria e legenda são reaproveitáveis.

## Goals / Non-Goals

**Goals:**
- Diff **estruturado** por layer: posições mudadas com `before`/`after`/`kind`.
- Incluir mudanças de **config de behaviors** e **renomeações de layer** (o save grava isso, mas não aparece como tecla).
- Dialog com **toggle Visual/Texto**; Visual é padrão e desenha o board destacando mudanças, com seletor de layer e badge de contagem.
- Reusar a geometria/legenda do board do editor (uma fonte só de verdade pro desenho).

**Non-Goals:**
- Não substitui o diff textual (fica atrás do toggle).
- Não anima transições nem faz "morph" de tecla; destaque estático + antes→depois no hover/foco.
- Não cobre mudança de `sensor-bindings` nem edição de `bindings` de um behavior custom como "tecla" (entram, se mudarem, no rodapé/texto).

## Decisions

- **`visualDiff` como helper puro** em `src/keymap/visualDiff.js`, assinatura `visualDiff({ layersBefore, layersAfter, dnBefore, dnAfter, behaviorsBefore, behaviorsAfter })` → `{ layers: [{ index, name, changes: [{ pos, before, after, kind }] }], behaviors: [{ ref, prop, before, after }], renames: [{ index, before, after }] }`. Puro e testável; o server monta os argumentos a partir de `state`/`draft`. Alternativa rejeitada: computar dentro do handler — não testável sem subir o servidor.
  - `kind`: `added` quando `before` ∈ {`&trans`,`&none`} e `after` não; `removed` no inverso; `modified` quando ambos "reais" e diferentes. Heurística só pra cor — `before`/`after` textuais sempre acompanham.
  - Comparação de binding por string canônica (`bindingToString`), já usada nos testes.
- **Resposta aditiva**: `POST /api/keymap/preview` inclui `visual` ao lado de `diff`. Clientes antigos ignoram; o custo é O(teclas) em memória, desprezível.
- **Render do board de diff reusando geometria**: extrair de `renderBoard` o posicionamento por `layout` para um helper `keyGeometry(pos)`/laço compartilhado, e desenhar o board de diff com as mesmas coords + classes de destaque. Alternativa rejeitada: duplicar o laço de coords — divergiria do editor. O board de diff é read-only (sem clique de edição).
- **Toggle no dialog**: dois contêineres (`#preview-visual`, `#preview-text`) e um botão que alterna classes `.hidden`. Visual é o default; "Texto" mostra o `<pre class="diff">` atual. O botão **Salvar** permanece para os dois.
- **Seletor de layer** mostra todas as layers, com badge de contagem; layers sem mudança ficam esmaecidas. Ao abrir, seleciona a primeira layer com mudança.

## Risks / Trade-offs

- [Geometria duplicada divergir do editor] → extrair o posicionamento pra um helper único usado pelos dois boards; teste visual no navegador confirma alinhamento.
- [Classificação add/mod/rem confundir] → é só cor; `before→after` textual sempre visível no hover/foco e no rodapé, então nunca ambíguo.
- [Behaviors/renames "invisíveis" no board] → rodapé dedicado lista essas mudanças; contagem total no cabeçalho inclui-as.
- [Resposta maior do preview] → `visual` é O(nº de mudanças), não do arquivo; irrelevante para 4 layers × 58 teclas.

## Migration Plan

Aditivo; sem migração. Rollback = esconder o toggle e o board de diff (o textual e o dry-run seguem intactos). Nada persistido.
