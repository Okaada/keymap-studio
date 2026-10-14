## 1. Configuração

- [x] 1.1 Adicionar seção `buildRepo` em `config.json` (path, keymapDest, baseBranch, remote)
- [x] 1.2 Carregar/validar `buildRepo` no servidor (resolver path; avisar se não for repo git)

## 2. Módulo de sync (git/gh)

- [x] 2.1 `src/sync/repo.js`: helpers que rodam `git`/`gh` via child_process com cwd no repo de build
- [x] 2.2 Pré-checagem: working tree limpo + na branch base; senão retorna erro acionável
- [x] 2.3 `preview()`: diff entre keymap local e `keymapDest` do repo (read-only, sem mutação)
- [x] 2.4 `sync({message})`: branch `keymap-update-<stamp>` → copiar → add/commit → push → `gh pr create` → URL do PR
- [x] 2.5 Fallback quando `gh` ausente/sem auth: push ok + retornar URL de criação de PR (compare link)

## 3. Endpoints

- [x] 3.1 `GET /api/sync/preview` → { changed, diff } (nunca muta)
- [x] 3.2 `POST /api/sync` → executa o fluxo e retorna { ok, prUrl|compareUrl, branch, warning? }; erros de estado → 409 com mensagem

## 4. UI

- [x] 4.1 Botão "Enviar pro build (PR)" que primeiro busca o preview e mostra o diff num dialog
- [x] 4.2 Campo opcional de mensagem/título do PR + botão "Confirmar e abrir PR"
- [x] 4.3 Exibir resultado (link do PR/compare) ou o erro de estado (repo sujo / branch errada)

## 5. Verificação

- [x] 5.1 Preview com diferença e sem diferença (read-only confirmado: repo não muda)
- [x] 5.2 Recusa com repo sujo e fora da branch base (mensagens claras)
- [x] 5.3 Sync e2e numa cópia/clone descartável do repo de build: branch+commit+push+PR e URL retornada
