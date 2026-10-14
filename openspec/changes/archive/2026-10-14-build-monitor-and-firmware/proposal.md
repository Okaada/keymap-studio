## Why

Hoje o envio pro build termina num push + link de PR; pra saber se o firmware compilou e pra pegar o `.uf2`, o usuário tem que sair pro GitHub. Como o editor já orquestra o repo de build (via `gh`), ele pode **acompanhar o build e entregar o firmware** sem toolchain local — fechando o ciclo editar → enviar → compilar → baixar dentro do app.

## What Changes

- Após o sync (que já devolve a `branch`), o editor **acompanha o GitHub Actions** do `buildRepo` do perfil ativo: faz **poll** do status (rodando / ✅ sucesso / ❌ falha) e mostra no resultado do sync.
- **Falha** → exibe o trecho de erro do log (reusa o `--log-failed` do `gh`) + link pro run.
- **Sucesso** → lista os artefatos `.uf2` e oferece **download** de cada um pela UI.
- Tudo via o `gh` já usado no sync (sem novas deps, sem compilar). **Degrada** se não houver `buildRepo` no perfil ou o `gh` não puder listar/baixar (mostra link pro run).

## Capabilities

### New Capabilities
- `build-monitor`: acompanhar o build remoto (GitHub Actions) do repo de build do perfil ativo — status por poll, log de erro em falha, e download dos `.uf2` em sucesso — orquestrando o CI existente.

### Modified Capabilities
<!-- build-repo-sync não muda de comportamento; o sync continua devolvendo a branch. O monitor é aditivo, acoplado ao resultado do sync. -->

## Impact

- `src/sync/repo.js` (ou `src/sync/build.js`): `buildStatus(cfg, branch)` (último run da branch via `gh run list --json`), `buildLogFailed(cfg, runId)` (trecho de erro), `listFirmware(cfg, runId, destDir)` (`gh run download` → acha `*.uf2`). Reusa `exec`/cwd no `buildRepo`.
- `src/server.js`: `GET /api/build/status?branch=`, `GET /api/build/log?run=`, `GET /api/build/firmware?run=` (baixa+lista) e `GET /api/build/firmware/download?run=&name=` (stream do `.uf2`). Todos gated no `state.buildRepo`.
- `web/` (`app.js`, `index.html`, `style.css`): no resultado do sync, área de build que faz poll até concluir; em falha, erro + link; em sucesso, botões de download dos `.uf2`.
- Sem novas dependências de runtime; usa `gh` (READ basta pra `run list/view/download`). Artefatos vão pro `.cache/` (já ignorado).
- Testes (`node --test`): parsing do JSON de `gh run list` → status normalizado; seleção dos `.uf2` numa listagem; caminho de degradação (sem buildRepo / sem artefato) não lança.
- **Não-objetivos**: compilar firmware localmente; flashear o `.uf2` no teclado (copiar pro drive do bootloader) — só download.
