# behavior-config Specification

## Purpose
TBD - created by archiving change behavior-config-editor. Update Purpose after archive.
## Requirements
### Requirement: Painel de configuração de behaviors
O sistema SHALL oferecer um painel que lista os behaviors configuráveis do keymap (hold-taps) e
permite editar `tapping-term-ms`, `flavor`, `quick-tap-ms` e `require-prior-idle-ms`, salvando no `.keymap`.

#### Scenario: Editar o tempo do hold
- **WHEN** o usuário abre o painel de behaviors, altera o `tapping-term-ms` de um hold-tap e salva
- **THEN** o novo valor é gravado no behavior e refletido no painel

#### Scenario: Escolher o flavor
- **WHEN** o usuário seleciona um `flavor` da lista de opções válidas e salva
- **THEN** o `flavor` daquele behavior passa a ser o escolhido no `.keymap`

#### Scenario: Behaviors não configuráveis não aparecem
- **WHEN** um behavior não é um hold-tap configurável
- **THEN** ele não é listado como editável no painel

### Requirement: Validação da configuração
O sistema SHALL validar os valores antes de salvar: propriedades `*-ms` como inteiros ≥ 0 e
`flavor` dentro das opções válidas; valores inválidos são rejeitados com mensagem.

#### Scenario: Tempo inválido
- **WHEN** o usuário informa um `tapping-term-ms` negativo ou não numérico
- **THEN** o sistema rejeita e informa o erro, sem gravar

#### Scenario: Flavor inválido
- **WHEN** um `flavor` fora das opções válidas é enviado
- **THEN** o sistema rejeita e informa o erro, sem gravar

### Requirement: Config acessível a partir da tecla
O sistema SHALL, ao editar uma tecla que usa um behavior configurável, mostrar um resumo da
configuração atual desse behavior e um link para abrir o painel de configuração.

#### Scenario: Resumo e link na tecla
- **WHEN** a tecla selecionada usa um behavior configurável (ex.: `&holdtap`)
- **THEN** a paleta mostra um resumo (ex.: tempo do hold e flavor) e um link que abre o painel de behaviors

### Requirement: Config compartilhada é explícita
O sistema SHALL deixar claro que a configuração vale para todas as teclas que usam aquele behavior.

#### Scenario: Aviso de escopo compartilhado
- **WHEN** o usuário edita a config de um behavior
- **THEN** a UI indica que a mudança afeta todas as teclas que usam esse behavior

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

