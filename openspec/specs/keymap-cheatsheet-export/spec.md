# keymap-cheatsheet-export Specification

## Purpose
TBD - created by archiving change zmk-visual-configurator. Update Purpose after archive.
## Requirements
### Requirement: Gerar cheatsheet visual de todas as layers
O sistema SHALL gerar um cheatsheet visual do keymap cobrindo todas as layers, reutilizando
o `keymap-drawer` e o mesmo layout físico do editor.

#### Scenario: Gerar cheatsheet
- **WHEN** o usuário aciona a geração do cheatsheet
- **THEN** o sistema produz uma renderização visual contendo todas as layers do keymap atual

#### Scenario: Layout consistente com o editor
- **WHEN** o cheatsheet é gerado
- **THEN** as posições das teclas correspondem ao layout do Lily58 mostrado no editor

### Requirement: Export em PDF
O sistema SHALL oferecer a exportação do cheatsheet como um arquivo PDF visual adequado para
consulta/impressão.

#### Scenario: Exportar PDF
- **WHEN** o usuário solicita o export em PDF
- **THEN** o sistema gera um arquivo PDF com o cheatsheet de todas as layers

#### Scenario: Ferramenta de PDF ausente
- **WHEN** a ferramenta de conversão SVG→PDF não está disponível no ambiente
- **THEN** o sistema reporta isso e indica o caminho alternativo (ex.: imprimir para PDF via navegador)

