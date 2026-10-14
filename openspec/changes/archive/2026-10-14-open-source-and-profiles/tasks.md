## 1. Modelo de perfis (core)

- [x] 1.1 Criar `src/profiles/profiles.js` (I/O puro, dir base por parâmetro/env): `listProfiles()`, `readProfile(name)`, `createProfile(p)`, `validateProfile(p, existing)`, `getActive()`/`setActive(name)` (lê/grava `activeProfile` no `config.json` global), `migrateLegacy()`
- [x] 1.2 Formato do perfil: `{ name, keyboard, layout, keymapPath, buildRepo }`; `config.json` global = `{ activeProfile, port }`
- [x] 1.3 Migração: se `profiles/` ausente/vazio e `config.json` legado tem `keymapPath`, criar `profiles/<keyboard>.json` e marcá-lo ativo (idempotente; não apaga o legado)

## 2. Servidor orientado a perfil ativo

- [x] 2.1 Em `src/server.js`, substituir o `config` único por `state.profile` (perfil ativo resolvido); `loadModel()` usa `state.profile.keymapPath`/`layout`; manter `ZMK_KEYMAP_PATH` como override
- [x] 2.2 `resolveBuildRepo`/`/api/sync*` passam a usar `state.profile.buildRepo`; `cheatsheet`/`modelPayload` usam os paths do perfil
- [x] 2.3 Endpoints: `GET /api/profiles` (lista + ativo), `POST /api/profiles/select` ({name} → setActive + loadModel + modelPayload), `POST /api/profiles` (criar: valida, grava, bootstrap do keymap via example se faltar)

## 3. UI de perfis

- [x] 3.1 Header: seletor "Perfil: <nome> ▾" (lista via `/api/profiles`) + botão "Novo perfil"
- [x] 3.2 Trocar perfil → `POST /api/profiles/select` → recarregar `state.data` e re-render (layout pode mudar)
- [x] 3.3 Dialog "Novo perfil": name/keyboard/layout/keymapPath/buildRepo → `POST /api/profiles`; mostrar erros de validação; ao criar, selecionar o novo
- [x] 3.4 CSS do seletor/dialog reusando tokens existentes

## 4. Des-personalização do repositório

- [x] 4.1 Gerar exemplos versionados: `config.example.json` (`{activeProfile:"lily58",port:5173}`), `profiles/example.json` (Lily58 genérico, buildRepo com path relativo/placeholder), `keymaps/lily58.example.keymap` (keymap Lily58 de partida)
- [x] 4.2 `.gitignore`: ignorar `config.json`, `profiles/*.json` (exceto `example.json`), `keymaps/*.keymap` (exceto `*.example.keymap`); manter `src/layout/*.json` versionado
- [x] 4.3 `AGENTS.md` genérico: descrever o teclado pelo **perfil ativo**, remover Okaada/e-mail/alias SSH; manter invariantes (58→keyCount do perfil, round-trip, etc.)

## 5. Licença e docs

- [x] 5.1 `LICENSE` MIT (holder como placeholder editável)
- [x] 5.2 `README.md` reescrito: o que é, quick start, perfis (criar/trocar), edição/behaviors/tester/cheatsheet, build/sync, uso por agente, "adicione seu teclado", onde editar a licença
- [x] 5.3 `CONTRIBUTING.md` curto (rodar testes, estrutura, abrir PR)

## 6. Testes e verificação

- [x] 6.1 Teste: `migrateLegacy()` cria o perfil a partir do config legado e é idempotente (não roda 2x)
- [x] 6.2 Teste: `createProfile`/`validateProfile` (nome único/slug, layout existente) e `setActive`/`getActive`
- [x] 6.3 Teste: paths do modelo resolvem a partir do perfil ativo (keymap/layout corretos)
- [x] 6.4 `npm test` verde + smoke no navegador: migração (abre no perfil migrado), criar um 2º perfil, trocar entre eles (layout/keymap mudam), editor/sync refletindo o ativo; restaurar estado real e não versionar dados pessoais
