## ADDED Requirements

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
