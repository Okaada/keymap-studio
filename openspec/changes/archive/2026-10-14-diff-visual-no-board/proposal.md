## Why

O preview de pré-salvar hoje só mostra o diff **textual** do git (`diff-preview-no-editor`). Pra um teclado, ver *quais teclas* mudaram **no próprio desenho do board** é muito mais legível do que ler linhas de devicetree — mostra posição, layer e antes→depois de um jeito que casa com a tela de edição.

## What Changes

- `POST /api/keymap/preview` passa a retornar, além do `diff` textual, um **diff estruturado** `visual`: por layer, as posições que mudaram com `{ pos, before, after, kind }` (kind ∈ added | removed | modified); mais mudanças de **config de behaviors** (ex.: `flavor`, `tapping-term-ms`) e **renomeações de layer**. Computado no modelo (baseline salvo × draft pendente) — **não depende de git**.
- **Dialog de pré-visualizar** ganha um **toggle [Visual | Texto]**: a visão **Visual** (padrão) desenha o board no estilo do editor, destacando as teclas mudadas (verde = adicionada, amarelo = alterada, vermelho = removida), com seletor de layer (badge com a contagem de mudanças por layer) e antes→depois ao focar/hover numa tecla. A visão **Texto** mantém o diff atual do git.
- **Rodapé** da visão Visual lista as mudanças de behaviors e renomeações (o que não aparece como tecla no board).
- Reuso: a geometria do board e a legenda das teclas do editor são reaproveitadas pra desenhar o board do diff.

## Capabilities

### New Capabilities
- `visual-keymap-diff`: representar as mudanças pendentes como um diff **visual** sobre o board (por layer, teclas destacadas por tipo de mudança + antes→depois), além de behaviors/renomeações, usando o dry-run existente; com alternância para o diff textual.

### Modified Capabilities
<!-- Nenhum requisito existente muda de comportamento: o diff textual e o dry-run permanecem. O campo `visual` é aditivo na resposta do preview. -->

## Impact

- `src/keymap/` : novo helper puro `visualDiff(beforeModel/baseline, draftModel)` (ou `src/keymap/visualDiff.js`) que produz o diff estruturado por layer + behaviors + renomeações a partir dos modelos — testável isoladamente.
- `src/server.js`: o handler `POST /api/keymap/preview` inclui `visual` na resposta (reusa `state.original`/`state.model` como baseline e o `draft` já clonado).
- `web/` (`app.js`, `index.html`, `style.css`): toggle Visual/Texto no `#preview-dialog`; render do board de diff reaproveitando a geometria/legenda do board do editor; estilos de destaque (add/mod/rem) e badges por layer.
- Sem novas dependências de runtime. O diff visual não usa git (o textual continua via o helper `diffText`).
- Testes (`node --test`): `visualDiff` detecta add/mod/rem por posição, mudança de flavor/tapping-term e rename; no-op retorna conjunto vazio.
