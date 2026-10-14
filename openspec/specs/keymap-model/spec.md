# keymap-model Specification

## Purpose
TBD - created by archiving change zmk-visual-configurator. Update Purpose after archive.
## Requirements
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

### Requirement: Ler e escrever `display-name` por layer
O sistema SHALL ler o `display-name` de cada layer quando presente e SHALL escrevê-lo
(atualizando o existente ou inserindo quando ausente) ao renomear, preservando o restante do arquivo.

#### Scenario: Inserir display-name numa layer sem nome
- **WHEN** uma layer sem `display-name` é renomeada e o keymap é salvo
- **THEN** o sistema insere `display-name = "<nome>";` no nó daquela layer e o resto do arquivo permanece intacto

#### Scenario: Atualizar display-name existente
- **WHEN** uma layer que já tem `display-name` é renomeada e o keymap é salvo
- **THEN** apenas o valor do `display-name` daquela layer muda, sem afetar o resto

#### Scenario: Round-trip no-op continua válido
- **WHEN** o keymap é parseado e salvo sem renomear nem editar bindings
- **THEN** o arquivo resultante é idêntico ao original

#### Scenario: Rename coexiste com edição de binding
- **WHEN** na mesma layer um binding é alterado e a layer é renomeada, e o keymap é salvo
- **THEN** tanto o `display-name` quanto o array `bindings` daquela layer refletem as mudanças, sem corromper offsets de outras layers

### Requirement: Parse e round-trip das propriedades de configuração dos behaviors
O sistema SHALL parsear as propriedades de configuração dos behaviors no nó `behaviors { }`
(para hold-taps: `tapping-term-ms`, `quick-tap-ms`, `require-prior-idle-ms`, `flavor`) e SHALL
escrevê-las de volta — atualizando o valor existente ou inserindo a propriedade ausente —
preservando o restante do arquivo.

#### Scenario: Ler config dos hold-taps
- **WHEN** o keymap define um behavior `compatible = "zmk,behavior-hold-tap"` com `tapping-term-ms` e `flavor`
- **THEN** o modelo expõe esse behavior com os valores atuais dessas propriedades

#### Scenario: Atualizar um valor existente
- **WHEN** o `tapping-term-ms` de um behavior é alterado e o keymap é salvo
- **THEN** apenas aquele valor muda no arquivo e o restante permanece intacto

#### Scenario: Inserir uma propriedade ausente
- **WHEN** um `quick-tap-ms` inexistente é definido e o keymap é salvo
- **THEN** o sistema insere `quick-tap-ms = <...>;` no nó daquele behavior sem afetar o resto

#### Scenario: Round-trip no-op continua válido
- **WHEN** o keymap é parseado e salvo sem alterar behaviors (nem bindings/nomes)
- **THEN** o arquivo resultante é idêntico ao original

### Requirement: Parse genérico dos nós de behavior
O sistema SHALL parsear cada nó do `behaviors { }` capturando o nome, o `compatible`,
`#binding-cells`, o conteúdo de `bindings` e as propriedades escalares conhecidas do tipo (com a
região do valor quando presente), não se limitando a hold-taps.

#### Scenario: Behavior não hold-tap
- **WHEN** o keymap define um behavior com `compatible` diferente de hold-tap (ex.: macro)
- **THEN** o modelo expõe esse behavior com seu `compatible`, bindings e propriedades conhecidas

### Requirement: Inserir um novo nó de behavior com round-trip
O sistema SHALL inserir um novo nó de behavior no `behaviors { }` (nome, `compatible`,
`#binding-cells`, `bindings` e propriedades) preservando o restante do arquivo.

#### Scenario: Criar um novo behavior
- **WHEN** um novo behavior é definido e o keymap é salvo
- **THEN** um novo nó é inserido no `behaviors { }` e o restante do arquivo permanece intacto

#### Scenario: Round-trip no-op continua válido
- **WHEN** o keymap é parseado e salvo sem criar/alterar behaviors (nem bindings/nomes)
- **THEN** o arquivo resultante é idêntico ao original

