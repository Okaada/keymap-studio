## ADDED Requirements

### Requirement: Dry-run de edição sem gravar

O sistema SHALL expor `POST /api/keymap/preview` que aceita o mesmo corpo do save (`layers`, `behaviors`, `newBehaviors`), aplica-o sobre uma cópia do modelo, valida, e retorna o resultado SEM gravar o `.keymap` e SEM mutar o estado do servidor.

#### Scenario: Edição válida retorna diff e validação
- **WHEN** o cliente envia a `POST /api/keymap/preview` um payload que muda ≥ 1 binding em relação ao arquivo salvo
- **THEN** a resposta é `200` com `ok: true`, `changed: true`, `validation.valid: true` e `diff` contendo o diff unificado entre o arquivo salvo atual e a serialização pendente

#### Scenario: Preview não grava nem muta o estado
- **WHEN** um preview é executado (válido ou inválido)
- **THEN** o arquivo `.keymap` em disco permanece inalterado
- **AND** o modelo em memória do servidor (bindings, display-names e config de behaviors) permanece idêntico ao baseline anterior ao preview

#### Scenario: Edição inválida reporta erros sem diff aplicado
- **WHEN** o payload enviado ao preview é inválido (ex.: aridade errada, flavor inválido, novo behavior com nome duplicado)
- **THEN** a resposta traz `ok: false` com `validation`/`behaviorValidation`/`newBehaviorErrors` descrevendo os erros
- **AND** nenhuma gravação ocorre

### Requirement: Fidelidade do preview ao save

O diff do preview SHALL refletir exatamente o que o save gravaria para a mesma edição, usando o mesmo serializer e a mesma baseline.

#### Scenario: Preview e save produzem o mesmo texto
- **WHEN** a mesma edição é submetida a `POST /api/keymap/preview` e depois a `POST /api/keymap`
- **THEN** o texto serializado refletido no diff do preview é igual ao conteúdo efetivamente gravado pelo save

#### Scenario: No-op não apresenta mudanças
- **WHEN** o preview recebe um payload que reproduz o estado salvo (sem alterações)
- **THEN** a resposta traz `changed: false` e `diff` vazio

### Requirement: Diff compartilhado entre preview e sync

O sistema SHALL computar diffs textuais por um único helper compartilhado, usado tanto pelo preview do editor quanto pelo `/api/sync/preview`.

#### Scenario: Sync preview mantém o comportamento
- **WHEN** `/api/sync/preview` é chamado após a extração do helper de diff
- **THEN** ele retorna `changed`/`diff` com o mesmo significado de antes (diff entre o keymap local e o destino no repo de build)

#### Scenario: Diff indisponível degrada sem quebrar
- **WHEN** o mecanismo de diff textual não está disponível no ambiente
- **THEN** o helper retorna `changed` corretamente (comparando os textos) e um `diff` com marcador de indisponibilidade, sem lançar erro

### Requirement: Pré-visualização no editor antes de salvar

O editor SHALL permitir pré-visualizar as mudanças pendentes num diff antes de confirmar o save, reusando a apresentação de diff já existente no fluxo de sync.

#### Scenario: Usuário revê e confirma
- **WHEN** o usuário aciona "Pré-visualizar mudanças" com edições pendentes
- **THEN** um dialog exibe o diff unificado das mudanças
- **AND** o usuário pode confirmar o save a partir do dialog, que persiste via o fluxo de save existente

#### Scenario: Pré-visualização de edição inválida
- **WHEN** o usuário aciona a pré-visualização com uma edição inválida
- **THEN** o dialog mostra os erros de validação em vez de um diff aplicável
- **AND** nenhuma gravação ocorre
