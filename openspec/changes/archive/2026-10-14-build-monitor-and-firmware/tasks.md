## 1. Helpers de build (gh)

- [x] 1.1 Criar `src/sync/build.js` reusando o padrão `exec` com `cwd` no buildRepo: `buildStatus(cfg, branch)` via `gh run list --branch <branch> --limit 1 --json databaseId,status,conclusion,url,workflowName` → `{ runId, status, conclusion, url }` ou `{ none: true }`
- [x] 1.2 `buildLogFailed(cfg, runId)` via `gh run view <runId> --log-failed` → trecho com linhas de erro (filtrado/curto)
- [x] 1.3 `listFirmware(cfg, runId, destDir)` via `gh run download <runId> --dir <destDir>` → varre `*.uf2` → `[{name, path}]`; sem artefato → `[]` (sem lançar)

## 2. Endpoints

- [x] 2.1 `GET /api/build/status?branch=` → `buildStatus(state.buildRepo, branch)` (gated no buildRepo; 400 claro se ausente)
- [x] 2.2 `GET /api/build/log?run=` → `buildLogFailed`
- [x] 2.3 `GET /api/build/firmware?run=` → baixa pro `.cache/firmware/<runId>/` e devolve a lista de `.uf2`; `GET /api/build/firmware/download?run=&name=` → stream do arquivo (`attachment`)

## 3. UI (resultado do sync)

- [x] 3.1 Após `confirmSync` com `branch`, mostrar área de build e iniciar poll de `/api/build/status` (~10s) até `completed`; estados: aguardando run / rodando / ✅ / ❌ (com link do run)
- [x] 3.2 Falha → botão "ver erro" que busca `/api/build/log` e mostra o trecho
- [x] 3.3 Sucesso → buscar `/api/build/firmware`, renderizar um botão de download por `.uf2` (link pra `/api/build/firmware/download`); se vazio, avisar + link do run
- [x] 3.4 CSS do bloco de status/erro/downloads reusando tokens existentes

## 4. Testes e verificação

- [x] 4.1 Teste: normalização do JSON de `gh run list` (em andamento / sucesso / falha / vazio=none) a partir de fixtures
- [x] 4.2 Teste: seleção de `.uf2` numa listagem de diretório (ignora outros arquivos); lista vazia quando não há `.uf2`
- [x] 4.3 Teste: degradação sem buildRepo (endpoint responde erro claro, sem lançar)
- [x] 4.4 `npm test` verde + smoke no navegador: enviar pro build (ou apontar pra uma branch já buildada), ver o status concluir, abrir o log numa falha e baixar um `.uf2` no sucesso; NÃO compilar/flashear; limpar `.cache/firmware` de teste
