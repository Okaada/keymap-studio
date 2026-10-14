## ADDED Requirements

### Requirement: Preview do diff antes de sincronizar
O sistema SHALL mostrar, sem alterar nada, o diff entre o keymap editado localmente e o
keymap de destino no repo de build.

#### Scenario: Keymap local difere do repo
- **WHEN** o usuário pede o preview e o keymap local difere do `config/lily58.keymap` do repo
- **THEN** o sistema retorna o diff e não cria branch, commit, push nem PR

#### Scenario: Sem diferenças
- **WHEN** o keymap local é idêntico ao do repo de build
- **THEN** o sistema informa que não há nada a sincronizar e não executa nenhuma ação externa

### Requirement: Sincronizar via branch + Pull Request
O sistema SHALL, mediante confirmação explícita do usuário, copiar o keymap local para o repo
de build numa nova branch, commitar, fazer push e abrir um Pull Request, retornando a URL do PR.

#### Scenario: Sync bem-sucedido
- **WHEN** o usuário confirma a sincronização com o repo de build limpo e na branch base
- **THEN** o sistema cria uma branch, commita o keymap atualizado, faz push e abre um PR, e
  retorna a URL do PR

#### Scenario: `gh` indisponível
- **WHEN** o `gh` não está instalado ou autenticado no momento do sync
- **THEN** o sistema ainda cria a branch, commita e faz push, e retorna a URL de criação de PR
  para o usuário abrir manualmente

### Requirement: Recusar em estado ambíguo do repo de build
O sistema SHALL recusar a sincronização quando o repo de build tiver alterações não
commitadas ou não estiver na branch base, reportando o motivo, sem executar ações externas.

#### Scenario: Working tree sujo
- **WHEN** o repo de build tem mudanças não commitadas e o usuário tenta sincronizar
- **THEN** o sistema recusa com mensagem explicando o estado e não cria branch/commit/push/PR

#### Scenario: Fora da branch base
- **WHEN** o repo de build não está na branch base configurada
- **THEN** o sistema recusa com mensagem indicando a branch esperada e a atual

### Requirement: Nunca agir sem confirmação
O sistema SHALL executar qualquer operação externa (branch, commit, push, PR) apenas após
uma ação de confirmação explícita; a geração de preview nunca deve mutar o repo de build.

#### Scenario: Apenas preview
- **WHEN** o usuário gera o preview mas não confirma a sincronização
- **THEN** o repo de build permanece inalterado (sem branch, commit, push ou PR novos)
