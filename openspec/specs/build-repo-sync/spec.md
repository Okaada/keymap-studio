# build-repo-sync Specification

## Purpose
TBD - created by archiving change build-repo-sync. Update Purpose after archive.
## Requirements
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

### Requirement: Puxar o keymap do repo de build (reconciliação)

O sistema SHALL permitir puxar o estado do repo de build (do perfil ativo) pro editor, atualizando o clone local (`fetch` + fast-forward da baseBranch) e reconciliando a cópia do editor com `config/<keymapDest>`, tornando o repo a fonte da verdade após um merge.

#### Scenario: Editor já reflete o repo
- **WHEN** o usuário aciona "Puxar do build" e a cópia do editor é igual ao keymap do repo após o pull
- **THEN** nada é sobrescrito e o sistema informa que já está sincronizado

#### Scenario: Repo avançou (ex.: após merge)
- **WHEN** o repo de build tem uma versão diferente da cópia do editor
- **THEN** o sistema apresenta o diff (repo × editor) sem sobrescrever
- **AND** o usuário pode confirmar "adotar a versão do repo", que passa a ser a do editor

### Requirement: Não sobrescrever edições locais sem confirmação

O pull SHALL preservar edições locais não enviadas, só substituindo a cópia do editor mediante confirmação explícita.

#### Scenario: Divergência exige confirmação
- **WHEN** a cópia do editor difere do repo (ex.: há edições locais ainda não enviadas)
- **THEN** o sistema não sobrescreve automaticamente
- **AND** só adota a versão do repo quando o usuário confirma explicitamente

### Requirement: Segurança do clone de build no pull

O pull SHALL recusar-se a agir quando o clone do repo de build não estiver em estado seguro, sem arriscar perda de trabalho.

#### Scenario: Clone sujo ou fora da baseBranch
- **WHEN** o clone do repo de build tem alterações não commitadas ou está fora da `baseBranch`
- **THEN** o pull é recusado com uma mensagem acionável, sem alterar a cópia do editor nem o repo

#### Scenario: Não é fast-forward
- **WHEN** a baseBranch local divergiu do remoto (não dá fast-forward)
- **THEN** o sistema reporta o problema sem fazer merge automático nem tocar na cópia do editor

### Requirement: Local-first preservado

O caminho de reconciliação SHALL funcionar sobre o clone git local, sem autenticação OAuth nem serviço hospedado.

#### Scenario: Sem build repo no perfil
- **WHEN** o perfil ativo não tem `buildRepo` configurado
- **THEN** a ação de puxar não é oferecida / responde com erro claro

