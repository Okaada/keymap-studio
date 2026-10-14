## Why

Hoje salvar no editor (`POST /api/keymap`) valida e **grava direto** no `.keymap` — não há como ver o que vai mudar antes. Para um usuário novo em ZMK, e principalmente para edições feitas **via agente** sobre o mesmo arquivo, um diff pré-save é a checagem de sanidade que falta: mostra exatamente quais linhas do firmware mudam antes de confirmar.

## What Changes

- Novo endpoint **dry-run** `POST /api/keymap/preview`: aplica o mesmo payload do save (`layers`, `behaviors`, `newBehaviors`) sobre uma **cópia** do modelo, valida e retorna o **diff unificado** (keymap salvo atual × serialização pendente) + o resultado de validação. **Não grava em disco e não muta `state.model`.**
- **Editor**: fluxo "Pré-visualizar mudanças" que abre o diff num dialog (reusando o componente/estilo de diff que já existe no dialog de sync) e permite **Salvar** a partir dali. Fica como passo opcional — o save direto continua existindo.
- **Reuso de infra**: extrair a computação de diff hoje embutida no `/api/sync/preview` (`git --no-index diff`) para um helper compartilhado `diffText(a, b)`, usado tanto pelo sync quanto pelo novo preview — um só formato de diff no app.
- Edições **via agente** podem chamar o dry-run para inspecionar o efeito antes de aplicar.

## Capabilities

### New Capabilities
- `keymap-diff-preview`: computar, **sem gravar**, o diff entre o keymap salvo e uma edição pendente (modelo → serializado), validando a edição; exposto via API (dry-run) e exibido no editor antes de salvar; disponível também para edições via agente.

### Modified Capabilities
<!-- Nenhum requisito de capability existente muda: o preview é puramente aditivo (o save atual permanece idêntico). O toque no editor é um passo opcional novo, coberto pela capability nova acima. -->

## Impact

- `src/server.js`: novo handler `POST /api/keymap/preview` que reaproveita a lógica de aplicação do payload do save, mas sobre uma cópia do modelo e **sem** `writeFile`/`loadModel`.
- `src/sync/repo.js`: `preview()` passa a usar o helper compartilhado `diffText(a, b)` (extraído para `src/keymap/diff.js`), sem mudança de comportamento observável.
- `web/` (`app.js`, `index.html`, `style.css`): dialog de diff pré-save reusando o estilo `.diff` já existente no dialog de sync.
- Sem novas dependências de runtime (diff via `git --no-index` em arquivos temporários, como o sync já faz, encapsulado no helper).
- Invariantes preservados: round-trip por offset inalterado; 58 bindings/layer; o dry-run usa o mesmo `serializeKeymap`/validação do save, então o diff reflete exatamente o que seria gravado.
- Testes (`node --test`): dry-run não muta o modelo nem grava; diff vazio para no-op; diff não-vazio e correto para uma edição de binding.
