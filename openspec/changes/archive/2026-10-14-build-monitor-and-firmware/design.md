## Context

O sync (`src/sync/repo.js: sync()`) faz branch → commit → push → PR e devolve `{ ok, branch, prUrl, compareUrl, warning }`. O push dispara o workflow do `buildRepo` (GitHub Actions). O `repo.js` já tem `exec(cmd,args,{cwd})`, roda `gh` com `cwd` no repo de build, e tem `remoteSlug`. O `gh` está autenticado (READ no repo é suficiente pra `run list/view/download`). `.cache/` é ignorado pelo git.

O usuário quer fechar o ciclo: depois de enviar, ver o build acontecer e baixar o `.uf2` — sem toolchain local.

## Goals / Non-Goals

**Goals:**
- Dado a `branch` do sync, descobrir o run do Actions e seu status; poll até concluir.
- Em falha: trecho de erro acionável + link pro run. Em sucesso: baixar os `.uf2`.
- Reusar `gh` + o `buildRepo` do perfil ativo; degradar sem quebrar quando indisponível.

**Non-Goals:**
- Não compila firmware localmente (sem Zephyr/west/SDK).
- Não faz flash no teclado (copiar `.uf2` pro drive do bootloader) — só disponibiliza download.
- Não altera o fluxo de sync nem exige escrita no repo (READ basta).

## Decisions

- **Funções em `src/sync/build.js`** (separa do git/sync, mas reusa o mesmo padrão `exec` com `cwd` no `buildRepo`):
  - `buildStatus(cfg, branch)` → `gh run list --branch <branch> --limit 1 --json databaseId,status,conclusion,url,workflowName,createdAt` → `{ runId, status, conclusion, url }` ou `{ none: true }` (run ainda não apareceu).
  - `buildLogFailed(cfg, runId)` → `gh run view <runId> --log-failed`, filtra linhas de erro (reuso do padrão que já usamos) → texto curto.
  - `listFirmware(cfg, runId, destDir)` → `gh run download <runId> --dir <destDir>`; varre `*.uf2`; retorna `[{ name, path }]`. Sem artefato (expirou/ausente) → `[]`.
  - Alternativa rejeitada: GitHub API crua via fetch — o `gh` já resolve auth/host e é o que o resto usa.
- **Poll no frontend** (simples, sem estado no servidor): após `confirmSync` com `branch`, o app chama `GET /api/build/status?branch=` a cada ~8–10s até `status==="completed"`. Alternativa rejeitada: long-poll/stream no servidor — mais complexidade pra pouco ganho num app local single-user.
- **Download via servidor**: `/api/build/firmware?run=` baixa os artefatos pro `.cache/firmware/<runId>/` e devolve a lista de `.uf2`; `/api/build/firmware/download?run=&name=` faz stream do arquivo (content-type `application/octet-stream`, `content-disposition: attachment`). Assim o browser baixa sem o `gh` no cliente.
- **Escopo = branch do último sync**: o monitor acompanha a branch que o sync acabou de enviar (é o que o usuário quer ver). Checagem arbitrária de outras branches fica fora (YAGNI).
- **Gating/degradação**: todos os endpoints exigem `state.buildRepo`; sem ele → 400 com mensagem. Se `gh` falhar (sem permissão/erro) → resposta degradada com o link do run (quando houver) em vez de erro cru.

## Risks / Trade-offs

- [Run não aparece logo após o push] → `buildStatus` devolve `{none:true}`; o poll continua até surgir. UI mostra "aguardando o build iniciar…".
- [Token do `gh` sem permissão de baixar artefato] → `listFirmware` degrada pra `[]` + a UI mostra o link do run pra baixar manualmente. Não quebra.
- [Artefatos expiram (retenção do GH)] → `[]`; UI avisa "artefatos expiraram; rode o build de novo".
- [Build longo deixa o dialog aberto] → poll com intervalo folgado (~10s) e teto de tentativas; o usuário pode fechar e o estado não é perdido (é só re-consultar).
- [Lily58 gera 2 `.uf2` (left/right)] → `listFirmware` lista todos; a UI oferece um botão por arquivo.

## Migration Plan

Aditivo; sem migração. Rollback = esconder a área de build no resultado do sync e remover os endpoints. Nada persistido além de artefatos em `.cache/` (descartável/ignorado).
