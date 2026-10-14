## ADDED Requirements

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
