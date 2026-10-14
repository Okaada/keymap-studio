## ADDED Requirements

### Requirement: Acompanhar o status do build remoto

Após o envio pro build, o sistema SHALL descobrir o run do GitHub Actions correspondente à branch enviada e reportar seu status, atualizando por poll até concluir.

#### Scenario: Status em andamento
- **WHEN** a UI consulta o status do build da branch recém-enviada e o run ainda está rodando
- **THEN** a resposta indica `status: "in_progress"` (ou equivalente) e a UI mostra que o build está em andamento, continuando a consultar

#### Scenario: Run ainda não apareceu
- **WHEN** o run ainda não existe logo após o push
- **THEN** o sistema responde que não há run ainda (sem erro) e a UI segue aguardando

#### Scenario: Conclusão com sucesso ou falha
- **WHEN** o run conclui
- **THEN** a resposta traz `status: "completed"` e `conclusion` (`success`/`failure`/…) e o link do run

### Requirement: Log de erro em falha

Quando o build falha, o sistema SHALL expor um trecho acionável do log de erro, além do link para o run.

#### Scenario: Build falhou
- **WHEN** o run concluiu com falha e a UI pede o log
- **THEN** a resposta traz um trecho com as linhas de erro relevantes
- **AND** a UI também oferece o link para o run completo

### Requirement: Download do firmware em sucesso

Quando o build conclui com sucesso, o sistema SHALL listar os artefatos `.uf2` e permitir baixá-los pela UI.

#### Scenario: Listar e baixar .uf2
- **WHEN** o build teve sucesso e há artefatos
- **THEN** o sistema baixa os artefatos e lista os arquivos `.uf2`
- **AND** a UI oferece um download por arquivo (ex.: left e right do split)

#### Scenario: Sem artefato disponível
- **WHEN** não há artefato (expirado ou o token não pode baixar)
- **THEN** o sistema responde com lista vazia, sem erro
- **AND** a UI informa e aponta o link do run para download manual

### Requirement: Dependência do perfil ativo e degradação

O acompanhamento de build SHALL usar o `buildRepo` do perfil ativo e degradar graciosamente quando indisponível.

#### Scenario: Sem build repo no perfil
- **WHEN** o perfil ativo não tem `buildRepo` configurado
- **THEN** os endpoints de build respondem com erro claro (não aplicável) e a UI não oferece o acompanhamento

#### Scenario: Sem compilar nem flashear
- **WHEN** o usuário usa o acompanhamento de build
- **THEN** nenhuma compilação local ocorre (o build é o do CI remoto)
- **AND** o firmware é apenas disponibilizado para download (não é gravado no teclado)
