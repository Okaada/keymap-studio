# visual-keymap-diff Specification

## Purpose
TBD - created by archiving change diff-visual-no-board. Update Purpose after archive.
## Requirements
### Requirement: Diff estruturado por posição e layer

O dry-run SHALL retornar, além do diff textual, um diff estruturado `visual` com as posições alteradas por layer, cada uma com o binding anterior, o novo e a classificação da mudança.

#### Scenario: Binding alterado é reportado com antes/depois
- **WHEN** a edição troca o binding de uma posição (ex.: `&kp N1` → `&kp EXCL`) na layer 0
- **THEN** `visual.layers` inclui a layer 0 com uma mudança `{ pos, before: "&kp N1", after: "&kp EXCL", kind: "modified" }`

#### Scenario: Classificação added/removed/modified
- **WHEN** uma posição passa de `&trans`/`&none` para um binding real
- **THEN** a mudança tem `kind: "added"`
- **AND WHEN** passa de um binding real para `&trans`/`&none`, tem `kind: "removed"`
- **AND WHEN** troca entre dois bindings reais diferentes, tem `kind: "modified"`

#### Scenario: No-op não gera mudanças
- **WHEN** o payload reproduz o estado salvo
- **THEN** `visual.layers` não contém nenhuma posição alterada
- **AND** `visual.behaviors` e `visual.renames` estão vazios

### Requirement: Cobertura de behaviors e renomeações

O diff estruturado SHALL incluir mudanças de configuração de behaviors e renomeações de layer, que não aparecem como teclas no board.

#### Scenario: Mudança de config de behavior
- **WHEN** a edição altera `flavor` ou `tapping-term-ms` de um behavior
- **THEN** `visual.behaviors` inclui `{ ref, prop, before, after }` para cada propriedade alterada

#### Scenario: Renomeação de layer
- **WHEN** a edição muda o `display-name` de uma layer
- **THEN** `visual.renames` inclui `{ index, before, after }` para essa layer

### Requirement: Visualização do diff no board com alternância

O editor SHALL exibir o diff pendente como um board (estilo da tela de edição) com as teclas alteradas destacadas por tipo de mudança, permitindo alternar entre a visão visual e o diff textual.

#### Scenario: Teclas alteradas destacadas por tipo
- **WHEN** o usuário abre a pré-visualização com mudanças pendentes
- **THEN** a visão Visual desenha o board da layer selecionada destacando as teclas `added`, `modified` e `removed` com cores distintas
- **AND** cada tecla alterada expõe o valor anterior e o novo (antes→depois)

#### Scenario: Seleção de layer com contagem
- **WHEN** há mudanças em mais de uma layer
- **THEN** o usuário pode escolher a layer a visualizar
- **AND** cada layer indica quantas teclas mudaram
- **AND** ao abrir, a primeira layer com mudanças é selecionada

#### Scenario: Alternância Visual/Texto
- **WHEN** o usuário aciona o toggle para "Texto"
- **THEN** o dialog mostra o diff textual do git no lugar do board
- **AND** ao voltar para "Visual", o board de diff é exibido novamente
- **AND** o botão Salvar continua disponível em ambas as visões

#### Scenario: Behaviors e renomeações no rodapé
- **WHEN** a edição inclui mudanças de behaviors ou renomeação de layer
- **THEN** a visão Visual lista essas mudanças num rodapé, fora do board

### Requirement: Diff visual no envio pro repo de build

O preview do sync SHALL oferecer o mesmo diff visual (board com teclas destacadas, por layer, + behaviors/renomeações) para a comparação entre o keymap local e o do repo de build, com alternância para o diff textual.

#### Scenario: Preview do sync inclui diff estruturado
- **WHEN** `GET /api/sync/preview` roda com um keymap local diferente do destino no repo de build
- **THEN** a resposta inclui `visual` com as posições alteradas por layer (`before`/`after`/`kind`), mudanças de behaviors e renomeações
- **AND** inclui as layers do arquivo local para desenhar o board

#### Scenario: Board reflete o arquivo salvo, não a memória
- **WHEN** há edições não salvas abertas no editor e o usuário abre o preview do sync
- **THEN** o board de diff do sync é desenhado a partir do **arquivo local em disco** (o que será enviado), e não do estado editado em memória

#### Scenario: Alternância Visual/Texto no dialog de sync
- **WHEN** o usuário abre "Enviar pro repo de build" com mudanças
- **THEN** a visão Visual mostra o board com as teclas destacadas e o seletor de layer
- **AND** o usuário pode alternar para a visão Texto (diff do git) e voltar
- **AND** o botão de confirmar o envio permanece disponível

#### Scenario: Degradação quando não há diff visual
- **WHEN** o arquivo de destino não existe (primeiro sync) ou algum `.keymap` não parseia
- **THEN** `visual` vem nulo e o dialog mostra o diff textual, sem erro

### Requirement: Componente de diff visual reutilizável

A visualização do diff no board SHALL ser um componente único reutilizado pelo preview de pré-salvar e pelo preview do sync, parametrizado pela origem das layers "depois".

#### Scenario: Mesma apresentação nos dois dialogs
- **WHEN** o diff visual é exibido no preview do editor e no preview do sync
- **THEN** ambos usam o mesmo render (board, destaques, seletor de layer com contagem, rodapé), diferindo apenas na origem dos dados ("depois" = estado do editor no preview; = arquivo local no sync)

