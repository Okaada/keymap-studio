# agent-keymap-editing Specification

## Purpose
TBD - created by archiving change zmk-visual-configurator. Update Purpose after archive.
## Requirements
### Requirement: Validação do keymap
O sistema SHALL validar um keymap contra o catálogo de behaviors (aridade e tipo dos
parâmetros) e contra a contagem de posições de tecla do Lily58 por layer, reportando erros
de forma clara.

#### Scenario: Aridade de behavior incorreta
- **WHEN** um binding usa um behavior com número de parâmetros diferente do que o catálogo define
- **THEN** a validação falha e aponta o behavior, a layer e a posição

#### Scenario: Tamanho de layer incorreto
- **WHEN** uma layer tem mais ou menos bindings do que as posições físicas do Lily58
- **THEN** a validação falha indicando a layer e a diferença de contagem

#### Scenario: Keymap válido
- **WHEN** todos os bindings respeitam o catálogo e todas as layers têm a contagem correta
- **THEN** a validação passa sem erros

### Requirement: Edição por agente sobre o mesmo arquivo
O sistema SHALL permitir que o keymap seja editado diretamente no `.keymap` por um agente e,
ao ser recarregado, o modelo reflita as alterações desde que válidas.

#### Scenario: Agente edita e UI recarrega
- **WHEN** o agente altera bindings no `.keymap` e o usuário recarrega na UI
- **THEN** a UI mostra os bindings atualizados após passar na validação

#### Scenario: Edição inválida do agente é sinalizada
- **WHEN** o arquivo editado pelo agente não passa na validação
- **THEN** o sistema sinaliza o erro em vez de exibir um estado quebrado silenciosamente

