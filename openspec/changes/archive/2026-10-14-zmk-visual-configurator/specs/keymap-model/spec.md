## ADDED Requirements

### Requirement: Parse de layers e bindings do `.keymap`
O sistema SHALL ler um arquivo ZMK `.keymap` e produzir um modelo estruturado contendo, por
layer, o nome da layer e a sequência ordenada de bindings (behavior + parâmetros).

#### Scenario: Keymap com múltiplas layers
- **WHEN** o arquivo contém um nó `keymap` com várias layers e seus `bindings = <...>`
- **THEN** o modelo expõe cada layer na ordem do arquivo com sua lista de bindings na ordem correta

#### Scenario: Nome de layer via display-name
- **WHEN** uma layer define `display-name`
- **THEN** o modelo usa esse valor como nome da layer; na ausência dele, usa o nome do nó

### Requirement: Round-trip preservando conteúdo não editado
O sistema SHALL reescrever o `.keymap` alterando apenas os arrays `bindings` que a edição
mudou, preservando byte a byte o restante do arquivo (comentários, defines, `behaviors`, macros).

#### Scenario: Salvar sem nenhuma alteração
- **WHEN** o keymap é parseado e serializado de volta sem editar nenhum binding
- **THEN** o arquivo resultante é idêntico ao original

#### Scenario: Salvar uma única tecla alterada
- **WHEN** apenas um binding de uma layer é alterado e o keymap é salvo
- **THEN** somente o array `bindings` daquela layer muda e o resto do arquivo permanece intacto

### Requirement: Binding desconhecido tratado como opaco
O sistema SHALL preservar bindings cujo behavior não está no catálogo conhecido, sem falhar
o parse, representando-os como texto opaco editável.

#### Scenario: Behavior customizado não catalogado
- **WHEN** uma layer referencia um behavior/macro não presente no catálogo
- **THEN** o parse conclui com sucesso e o binding é mantido como está ao salvar
