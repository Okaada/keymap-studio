## ADDED Requirements

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
