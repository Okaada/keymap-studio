# AGENTS.md — contexto para edições por agente

Este repositório é um **configurador visual local de keymaps ZMK**. Use este arquivo como
contexto antes de editar um keymap via agente.

## Perfis (o que é específico de cada teclado)

Tudo que é específico de um teclado vive num **perfil** em `profiles/<nome>.json`:

```json
{ "name": "lily58", "keyboard": "lily58",
  "layout": "src/layout/lily58.layout.json",
  "keymapPath": "keymaps/lily58.keymap",
  "buildRepo": { "path": "../zmk-config", "keymapDest": "config/lily58.keymap",
                 "baseBranch": "main", "remote": "origin" } }
```

- `config.json` é o config **global**: `{ "activeProfile": "<nome>", "port": 5173 }`.
- O editor opera sempre sobre o **perfil ativo**: o keymap-alvo é `keymapPath`, a geometria
  é `layout`, e o envio pro build usa `buildRepo` desse perfil.
- Arquivos reais (`config.json`, `profiles/*.json`, `keymaps/*.keymap`) são **locais/gitignored**;
  o repositório versiona apenas os `*.example.*`. Num clone novo, copie um exemplo e edite.

## Regras de edição segura do `.keymap`

1. **Fonte da verdade** = o `keymapPath` do perfil ativo. Edite esse arquivo (ou use a API do app).
2. **Preserve o que não muda**: o serializer reescreve por offset só os `bindings`/propriedades
   alterados; o resto fica intacto. Se editar à mão, não reformate o arquivo inteiro.
3. **Mantenha a contagem de teclas do layout** (`layout.keyCount`) por layer — o app valida isso;
   uma layer com contagem errada é rejeitada. (No Lily58 são 58.)
4. **Aridade dos behaviors**: respeite o nº de parâmetros (`&kp` 1, `&mt`/`&lt` 2, `&mo`/`&to`/`&tog` 1,
   `&trans`/`&none` 0). O catálogo está em `src/keymap/catalog.js`.
5. **Nomes de layer** via `display-name = "..."` (não renomeie o identificador do nó).
6. **Behaviors** novos/editados: tipos e campos em `src/keymap/behaviorTypes.js`
   (`*-ms` inteiros ≥ 0; `flavor` ∈ tap-preferred/hold-preferred/balanced/tap-unless-interrupted).
7. **Valide antes de dar por salvo**: `npm test` cobre round-trip/validação; smoke extra:
   `uvx --from keymap-drawer keymap parse -z <keymapPath>`.

## App (resumo)

- Servidor local sem deps: `node src/server.js` (http em 127.0.0.1:5173) — serve a UI e a API.
- `src/profiles/profiles.js` → perfis; `src/keymap/parser.js` → modelo; `serializer.js` →
  round-trip por offset; `validate.js` → validação; `catalog.js`/`behaviorTypes.js` → catálogo/tipos;
  `diff.js`/`visualDiff.js` → diffs (textual/visual); `cheatsheet.js` → export.
- UI (`web/`): trocar/criar perfil, editar teclas, renomear layers (duplo-clique na aba), painel de
  behaviors, tester, pré-visualizar (diff visual/textual), cheatsheet/PDF e envio pro build.

## Fluxo de build/firmware

- Editar aqui → **⬆️ Enviar pro build** (branch + PR no `buildRepo` do perfil). O repo de build
  (GitHub Actions) compila os `.uf2`. Nunca commitar/push sem confirmação do usuário.
- O board no `build.yaml` do repo de build precisa casar com a versão do ZMK (ex.: no HWMv2 do
  Zephyr 4.1, `nice_nano_v2` virou `nice_nano//zmk`).

## Detalhes formais

As especificações vivem em `openspec/` (changes e specs). Consulte lá para o comportamento
detalhado de cada capability (keyboard-profiles, keymap-model, visual-keymap-editor, behavior-config,
keymap-diff-preview, visual-keymap-diff, build-repo-sync, etc.).
