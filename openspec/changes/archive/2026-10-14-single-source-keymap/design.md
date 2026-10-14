## Context

`src/sync/repo.js` já tem: `precheck(cfg)` (repo limpo + na `baseBranch`), `destPath(cfg)` (`config/<keymapDest>`), `git(cfg,args)`, `diffText`, e `sync()` que envia editor→build (branch+PR) e volta pra baseBranch limpa. Falta o caminho **build→editor**: trazer o estado mergeado do repo pro editor, que hoje edita uma cópia local (`keymapPath`) que pode ficar velha.

`sync-visual-diff` já parseia dois `.keymap` e roda `visualDiff` — reutilizável pra mostrar "o que adotar do repo mudaria".

## Goals / Non-Goals

**Goals:**
- "Puxar do build": atualizar o clone local do repo de build (`fetch` + `pull --ff-only` da baseBranch) e reconciliar a cópia local do editor com `config/<keymapDest>`.
- Repo é a fonte da verdade **após o merge**, sem sobrescrever edições locais caladamente: divergência → diff + confirmação.
- Local-first, por perfil, sem OAuth.

**Non-Goals:**
- Não edita direto no working tree do build repo (mantém a cópia do editor).
- Não resolve conflitos de merge (usa `--ff-only`; se não dá ff, reporta).
- Sem auto-pull no startup (ação explícita por botão); sem app hospedado.

## Decisions

- **`pullFromBuild(cfg, localKeymapPath, { adopt })` em repo.js**:
  1. `precheck(cfg)` — se o clone do build estiver sujo ou fora da `baseBranch`, retorna erro acionável e **não toca em nada** (não arrisca perder trabalho no repo de build).
  2. `git fetch <remote> <base>` + `git merge --ff-only` (ou `pull --ff-only`). Se não for fast-forward (clone local divergiu) → erro claro, sem mexer na cópia do editor.
  3. Compara `destPath(cfg)` (keymap do repo, agora atualizado) × `localKeymapPath`:
     - **iguais** → `{ ok, changed: false }` (editor já reflete o repo).
     - **diferentes** e sem `adopt` → `{ ok, changed: true, diff, visual }` (preview; **não** sobrescreve).
     - **diferentes** e `adopt: true` → copia `dest → local`, `{ ok, changed: true, adopted: true }`.
  - Reusa `diffText` e `visualDiff` (antes = local, depois = repo) pro preview/adoção.
  - Alternativa rejeitada: sobrescrever local sempre no pull — perde edições locais não enviadas sem aviso (o usuário pediu "avisa se divergirem").
- **Endpoint único `POST /api/build/pull`** com corpo opcional `{ adopt }`: na adoção, `loadModel()` + `modelPayload()` (UI recarrega). Gated em `state.buildRepo`.
- **UI**: botão "⬇ Puxar do build" ao lado de "↻ Recarregar". Fluxo: pull → se `changed:false`, flash "já igual ao repo"; se `changed:true`, abre dialog com o diff (reusa o componente de diff visual/textual, direção local→repo) + botão "Adotar versão do repo" (que chama pull com `adopt:true`).
- **Segurança de dados**: nunca sobrescreve a cópia local sem `adopt` explícito; nunca força push/merge; `--ff-only` evita merges automáticos no clone do build.

## Risks / Trade-offs

- [Perder edições locais não enviadas] → sem `adopt`, nada é sobrescrito; a adoção é explícita e mostra o diff antes. Mitigado por design.
- [Clone do build sujo/fora da base] → `precheck` recusa com mensagem; o usuário resolve no repo. Não tentamos stash automático.
- [Não é fast-forward (clone divergiu do remoto)] → reporta; fora de escopo resolver (raro num clone só-leitura de keymap).
- [Offline / fetch falha] → erro acionável; a cópia local permanece intacta.
- [Direção do diff confundir] → o dialog deixa claro "adotar do repo" (repo = depois); reusa o mesmo componente visual já conhecido.

## Migration Plan

Aditivo; sem migração. O `keymapPath` e o `buildRepo.keymapDest` do perfil continuam como estão. Rollback = esconder o botão e remover o endpoint. Nada externo é tocado (pull é leitura + ff-only local).
