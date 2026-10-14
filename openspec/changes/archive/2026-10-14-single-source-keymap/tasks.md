## 1. Reconciliação build→editor (core)

- [x] 1.1 `pullFromBuild(cfg, localKeymapPath, { adopt })` em `src/sync/repo.js`: `precheck` (limpo + baseBranch); se falhar, retorna erro sem tocar em nada
- [x] 1.2 `git fetch <remote> <base>` + `git merge --ff-only` (ou `pull --ff-only`); se não for ff, retorna erro acionável sem alterar a cópia do editor
- [x] 1.3 Comparar `destPath(cfg)` × `localKeymapPath`: iguais → `{ok, changed:false}`; diferentes sem `adopt` → `{ok, changed:true, diff, visual}` (reusa `diffText`/`visualDiff`, antes=local/depois=repo); diferentes com `adopt` → copia dest→local, `{ok, changed:true, adopted:true}`

## 2. Endpoint

- [x] 2.1 `POST /api/build/pull` (corpo opcional `{adopt}`) → `pullFromBuild(state.buildRepo, state.profile.keymapPath, …)`; gated no `buildRepo` (400 claro se ausente); em `adopt`, `loadModel()` + `...modelPayload()`

## 3. UI

- [x] 3.1 Botão "⬇ Puxar do build" no header, ao lado de "↻ Recarregar"
- [x] 3.2 Click → `POST /api/build/pull`; `changed:false` → flash "já igual ao repo de build"; erro → flash acionável
- [x] 3.3 `changed:true` → dialog com o diff (reusa o componente visual/textual; direção local→repo) + botão "Adotar versão do repo" → `pull {adopt:true}` → reload + flash
- [x] 3.4 CSS reusando tokens existentes

## 4. Testes e verificação

- [x] 4.1 Teste: reconciliação com dois arquivos — iguais → `changed:false`; diferentes → `changed:true` e, com `adopt`, a cópia local passa a ser a do repo (em dirs temporários, sem rede)
- [x] 4.2 Teste: `precheck` recusa (repo sujo / fora da base) → erro, cópia local intacta
- [x] 4.3 `npm test` verde + smoke no navegador: simular repo adiantado (ex.: editar a cópia e "puxar") → ver diff → adotar → editor reflete o repo; sem buildRepo → ação ausente/erro; restaurar estado real, não tocar o `zmk-config` remoto
