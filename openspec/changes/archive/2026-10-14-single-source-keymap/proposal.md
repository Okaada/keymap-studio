## Why

Hoje há **duas cópias** do keymap: a do editor (`keymapPath`, ex.: `keymaps/lily58.keymap`) e a do repo de build (`config/<keymapDest>`). O sync copia editor→build, mas o caminho de volta não existe: depois que um PR é mergeado (ou alguém edita o `zmk-config` direto), o editor continua olhando a **cópia local velha**. Precisa de um caminho "repo de build é a fonte da verdade" que reflita o estado mergeado — mantendo a identidade **local-first** (sem OAuth/hospedagem, diferente do keymap-editor hospedado).

## What Changes

- Ação **"⬇ Puxar do build"** no editor: faz `git fetch` + `pull --ff-only` da `baseBranch` do repo de build (do perfil ativo) e reconcilia a cópia local com `config/<keymapDest>`.
- **Repo vence, com segurança**: se a cópia local está igual ao repo → recarrega o que vier do merge. Se **divergirem** (ex.: edições locais não enviadas), **não sobrescreve calado**: mostra o **diff** (reusa o diff visual/textual) e pede confirmação ("Adotar versão do repo").
- Endpoint `POST /api/build/pull` (opcional `{ adopt: true }`); gated no `buildRepo` do perfil ativo; degrada com mensagem acionável se o repo estiver sujo / fora da baseBranch / sem rede.
- Mantém local-first e por perfil; o sync editor→build (branch+PR) segue igual.

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova; é o caminho inverso (build→editor) da sincronização existente. -->

### Modified Capabilities
- `build-repo-sync`: além de enviar (editor→build), passa a **puxar/reconciliar** (build→editor), tornando o repo de build a fonte da verdade após o merge, com confirmação quando há divergência.

## Impact

- `src/sync/repo.js`: `pullFromBuild(cfg, localKeymapPath, { adopt })` — `precheck` (limpo + baseBranch, reusa), `git fetch` + `pull --ff-only`, compara `destPath` × local; igual → nada; diferente → devolve `diff`/`visual` (sem sobrescrever) a menos que `adopt`, quando copia dest→local. Reusa `diffText`/`visualDiff`.
- `src/server.js`: `POST /api/build/pull` → `pullFromBuild(state.buildRepo, state.profile.keymapPath, …)`; em `adopt`, `loadModel()` + `modelPayload()`.
- `web/` (`app.js`, `index.html`, `style.css`): botão "⬇ Puxar do build" (ao lado de "↻ Recarregar"); se divergir, dialog com o diff (reusa o componente de diff visual/textual) + "Adotar versão do repo"; flash quando já está igual.
- Sem novas deps (git, já usado). Degrada sem `buildRepo`/rede.
- Testes (`node --test`): reconciliação (igual → no-op; diferente+adopt → local vira o do repo); precheck recusa repo sujo/fora da base sem sobrescrever.
- **Não-objetivos**: OAuth/app hospedado; editar direto no working tree do build repo; resolver conflitos de merge (usa `--ff-only` e reporta); auto-pull no startup.
