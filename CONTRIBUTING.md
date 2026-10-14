# Contributing

Obrigado pelo interesse! Este é um app local, sem dependências de runtime (só Node) e com
frontend vanilla.

## Rodando

```sh
npm start    # http://127.0.0.1:5173
npm test     # node --test (parser/serializer/validação/perfis/diffs)
```

Para testar contra uma cópia do keymap sem tocar no seu perfil, use `ZMK_KEYMAP_PATH=/tmp/x.keymap npm start`.

## Estrutura

- `src/keymap/` — núcleo: parser, serializer (round-trip por offset), catálogo, tipos de behavior,
  validação, diffs, cheatsheet.
- `src/profiles/` — perfis de teclado.
- `src/server.js` — servidor local (API + estáticos). `web/` — UI.
- `openspec/` — specs e changes (o projeto é dirigido por spec: proposal → design → specs → tasks).

## Convenções

- **Round-trip é invariante**: serializar sem editar devolve o arquivo byte-idêntico (há teste).
  Não reformate o `.keymap` inteiro ao editar.
- Mantenha a **contagem de teclas** do layout por layer e a **aridade** correta dos behaviors.
- Não versione dados pessoais: `config.json`, `profiles/*.json` e `keymaps/*.keymap` reais são
  gitignored; adicione/edite os `*.example.*`.
- Cubra mudanças com `node --test` e, para features visuais/interativas, verifique no navegador.

## Pull requests

Descreva o quê/porquê, rode `npm test` (verde) e, se mexer no comportamento do keymap, inclua um
smoke `uvx --from keymap-drawer keymap parse -z <keymap>`.
