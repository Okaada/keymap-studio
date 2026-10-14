## ADDED Requirements

### Requirement: Descrições dos parâmetros
O sistema SHALL exibir uma descrição curta e amigável para cada parâmetro configurável — tanto
os de configuração dos behaviors (ex.: `tapping-term-ms`, `flavor`) quanto os parâmetros da
paleta (ex.: keycode, layer, modificador).

#### Scenario: Ajuda no parâmetro de config
- **WHEN** o usuário vê um campo de config de behavior (ex.: `tapping-term-ms`)
- **THEN** há uma descrição explicando o que o parâmetro faz

#### Scenario: Ajuda no parâmetro da paleta
- **WHEN** o usuário escolhe um behavior na paleta que pede um parâmetro (ex.: layer)
- **THEN** há uma descrição explicando o que informar

### Requirement: Criar novos behaviors
O sistema SHALL permitir criar um novo behavior escolhendo o tipo (`compatible`) e preenchendo os
campos daquele tipo (bindings e propriedades), gravando no `.keymap`; o novo behavior fica
disponível para uso nas teclas.

#### Scenario: Criar um hold-tap
- **WHEN** o usuário cria um behavior do tipo hold-tap informando nome, os bindings base e os parâmetros, e salva
- **THEN** o behavior é gravado no `behaviors { }` e passa a aparecer na paleta das teclas

#### Scenario: Nome inválido ou duplicado
- **WHEN** o nome informado é inválido ou já existe
- **THEN** o sistema rejeita com mensagem e não grava

### Requirement: Editar behaviors de qualquer tipo conhecido
O sistema SHALL permitir editar as propriedades conhecidas de behaviors de tipos suportados (não
só hold-tap), com validação por tipo.

#### Scenario: Editar propriedade de um tipo suportado
- **WHEN** o usuário altera uma propriedade conhecida de um behavior suportado e salva
- **THEN** o valor é gravado e o restante do arquivo permanece intacto

#### Scenario: Valor inválido por tipo
- **WHEN** um valor viola a regra do tipo (ex.: `*-ms` negativo, enum fora da lista)
- **THEN** o sistema rejeita com mensagem e não grava
