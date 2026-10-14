## Why

O configurador está pronto pra ser útil além do dono: hoje tudo é hard-coded pro Lily58 do usuário e pro repo de build `<owner>/zmk-config` (paths, keyboard, build repo no `config.json`; keymap real versionado). Pra virar **open source** e servir outras pessoas, o que é exclusivo de um usuário precisa virar **perfil configurável** (trocável na UI) e o repositório público precisa de **licença + documentação de uso** e não conter dados pessoais.

## What Changes

- **Perfis de teclado** (`keyboard-profiles`): o que hoje é um `config.json` único vira um **perfil** (`profiles/<nome>.json`: keyboard, layout, keymapPath, buildRepo). Vários perfis podem coexistir; um é o **ativo**. Novos endpoints `GET /api/profiles`, `POST /api/profiles/select`, `POST /api/profiles` (criar). O editor passa a operar sempre sobre o **perfil ativo** (keymap, layout, behaviors, sync).
- **Troca/criação na UI**: seletor de perfil no header ("Perfil: Lily58 ▾" + "Novo perfil"); trocar recarrega layout/keymap/behaviors/build sem editar arquivo; criar pede nome + keyboard + layout + keymapPath + buildRepo.
- **Migração sem quebra**: no startup, se não houver `profiles/`, cria um perfil a partir do `config.json` legado e o marca ativo. Usuários atuais continuam funcionando.
- **Des-personalização** (`open-source-packaging`): shippar **exemplos** genéricos (`profiles/example.json`, `keymaps/lily58.example.keymap`) e **gitignorar** os reais (`config.json`/perfis reais, `keymaps/*.keymap`), pro repo público ficar limpo. `AGENTS.md` fica genérico (sem Okaada/e-mail; referencia o perfil ativo).
- **Licença + docs**: `LICENSE` **MIT**; `README.md` reescrito (o que é, quick start, perfis, edição/behaviors/tester/cheatsheet, build/sync, uso por agente); `CONTRIBUTING.md` curto.

## Capabilities

### New Capabilities
- `keyboard-profiles`: modelar teclado + layout + keymap + build repo como perfis locais trocáveis (listar/selecionar/criar na UI), com o editor operando sobre o perfil ativo e migração do `config.json` legado.
- `open-source-packaging`: tornar o repositório publicável — licença MIT, README de uso, arquivos de exemplo versionados e os reais ignorados, e contexto de agente genérico.

### Modified Capabilities
<!-- Nenhum requisito existente é reescrito: editor/sync/cheatsheet passam a resolver paths pelo perfil ativo, mas o comportamento por-keymap é o mesmo. A mudança é aditiva (de "config único" para "perfil ativo"). -->

## Impact

- `src/server.js`: substituir o `config` único por um resolvedor de **perfil ativo** (carrega `profiles/<ativo>.json`, resolve paths, `loadModel` do keymap do perfil, `buildRepo` do perfil). Novos handlers de profiles. `ZMK_KEYMAP_PATH` continua como override de teste.
- `src/profiles/` (novo): carregar/listar/criar/selecionar perfis; estado do perfil ativo (em `config.json` global: `{ activeProfile, port }`); migração do formato legado.
- `web/` (`app.js`, `index.html`, `style.css`): seletor de perfil + dialog "Novo perfil"; `load()` e render passam a refletir o perfil ativo (layout pode mudar entre perfis).
- Raiz: `LICENSE` (MIT), `README.md` (reescrito), `CONTRIBUTING.md`, `AGENTS.md` (genérico), `.gitignore` (ignorar reais, versionar exemplos), `profiles/example.json`, `keymaps/lily58.example.keymap`, `config.example.json`.
- Sem novas dependências de runtime. Testes (`node --test`): migração do config legado → perfil; criar/selecionar perfil; validação de perfil; paths resolvidos a partir do perfil ativo.
- **Não-objetivos**: sem auth/multiusuário, sem nuvem/sync de perfis, sem editor visual de layout (o layout é um JSON fornecido), sem hospedagem. Continua local, single-user.
