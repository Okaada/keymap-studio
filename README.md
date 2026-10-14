# ZMK Visual Configurator

Configurador **visual e local** de keymaps [ZMK](https://zmk.dev), editável pela UI **e por
agente** (ex.: Claude Code), com diff visual das mudanças e export de **cheatsheet/PDF**. O
arquivo `.keymap` é a **fonte única da verdade**: a UI e o agente editam o mesmo arquivo.

Multi-teclado via **perfis**: cada perfil aponta para um teclado/layout/keymap e, **opcionalmente**,
um repo de build. Você troca entre eles na interface. Sem nuvem, sem dependências de runtime — só Node.

> O editor **não compila firmware**. A compilação dos `.uf2` fica num **repo de config ZMK separado**
> (GitHub Actions) — ver ["Build de firmware"](#build-de-firmware--repo-zmk-separado-opcional). Editar,
> behaviors, tester e cheatsheet funcionam **sem** nenhum repo de build.

## Pré-requisitos

- **Node** ≥ 20 (o servidor não tem dependências npm).
- **[uv](https://docs.astral.sh/uv/)** — o cheatsheet roda `uvx keymap-drawer` (sem instalar nada global).
- **rsvg-convert** (pacote `librsvg`) para gerar PDF — opcional (sem ele, o SVG ainda é gerado).

```sh
node --version
uvx --from keymap-drawer keymap --version   # opcional (cheatsheet)
```

## Começando (clone)

```sh
cp config.example.json config.json       # config global: perfil ativo + porta
npm start                                 # http://127.0.0.1:5173
```

No primeiro boot, o perfil `example` (Lily58) é carregado e o keymap é criado a partir de
`keymaps/lily58.example.keymap`. Edite, ou crie o seu próprio perfil (abaixo).

> Seus arquivos **reais** (`config.json`, `profiles/*.json`, `keymaps/*.keymap`) ficam
> **locais** — o `.gitignore` versiona apenas os `*.example.*`. Antes do primeiro uso, versione
> seu `.keymap` (o app reescreve ao salvar; `git checkout` reverte se algo sair errado).

## Perfis

Um **perfil** (`profiles/<nome>.json`) descreve um teclado:

```json
{
  "name": "lily58",
  "keyboard": "lily58",
  "layout": "src/layout/lily58.layout.json",
  "keymapPath": "keymaps/lily58.keymap",
  "buildRepo": { "path": "../zmk-config", "keymapDest": "config/lily58.keymap",
                 "baseBranch": "main", "remote": "origin" }
}
```

`config.json` é o config **global**: `{ "activeProfile": "<nome>", "port": 5173 }`.

- **Trocar de perfil**: o seletor no cabeçalho recarrega layout/keymap/behaviors/build.
- **Novo perfil**: botão **+ Perfil** → nome, keyboard, layout, keymapPath e (opcional) build repo.
- **Adicionar um teclado**: forneça um JSON de layout em `src/layout/<kbd>.layout.json`
  (posições das teclas na ordem exata dos `bindings`, com `keyCount`, `rows`, `viewBox`) e aponte
  o perfil para ele. O Lily58 é o exemplo incluído.
- Migração automática: um `config.json` legado (formato single-config) vira um perfil no primeiro boot.

## Uso

```sh
npm start          # sobe o servidor
npm test           # testes (parser/serializer/validação/perfis/diffs)
```

Na UI, sobre o **perfil ativo**:
- **Abas de layer** alternam a layer; **duplo-clique** numa aba renomeia (via `display-name`).
- **Clique numa tecla** → a paleta mostra as funções/behaviors e parâmetros (com descrições).
- **⚙️ Behaviors** — editar/criar behaviors configuráveis (hold-tap, mod-morph, macro, …).
- **👁️ Pré-visualizar** — diff das mudanças pendentes antes de salvar, **visual** (teclas
  destacadas no board: verde=add, amarelo=alterada, vermelho=removida) ou **textual**.
- **💾 Salvar** reescreve o `.keymap` (round-trip: só o alterado muda).
- **↻ Recarregar** relê o arquivo do disco — use depois que o **agente** editar o `.keymap`.
- **🧪 Tester** — pressione as teclas físicas pra conferir mapeamento/resposta.
- **🖨️ Cheatsheet** — visão de todas as layers (SVG + PDF).

## Edição por agente

O agente edita o keymap do perfil ativo diretamente (veja `AGENTS.md` para as regras: contagem de
teclas por layer, aridade de behaviors, round-trip por offset). Valide com `npm test` ou clique
**Recarregar** na UI.

## Build de firmware — repo ZMK separado (opcional)

**Este editor não compila firmware.** Quem gera os `.uf2` é um **repositório de config ZMK
separado** (o padrão da comunidade, com GitHub Actions) — o mesmo que você usaria sem este editor.
As features de **editar keymap, behaviors, tester e cheatsheet funcionam sem ele**; só o
envio/acompanhamento de build e o "puxar do build" precisam dele.

**Como obter o repo de build** (se ainda não tem): siga o **[ZMK User Setup](https://zmk.dev/docs/user-setup)**
oficial — ele cria o seu `zmk-config` pessoal (com `build.yaml`, `config/` e os `.keymap`/`.conf`),
cujo GitHub Actions compila os `.uf2`. **Não é este repositório** e não é um fork dele; é o seu
próprio `zmk-config`. Clone ele localmente e aponte o perfil pra esse clone:

```json
"buildRepo": {
  "path": "../zmk-config",            // caminho LOCAL do clone do seu repo de config ZMK
  "keymapDest": "config/lily58.keymap",
  "baseBranch": "main",
  "remote": "origin"
}
```

Sem `buildRepo` no perfil, os botões de build simplesmente não se aplicam (o editor avisa).

**Fluxo (quando há buildRepo):**
- **⬆️ Enviar pro build** — leva o keymap pro repo de build mostrando o **diff** antes; ao
  confirmar, cria branch + commit + push (dispara o Actions) e tenta abrir o PR (fallback: link de compare).
- **Acompanhamento de build** — faz poll do Actions, mostra status/erro e oferece download dos `.uf2`.
- **⬇ Puxar do build** — depois que um PR é mergeado, traz o keymap do repo de volta pro editor
  (o repo é a fonte da verdade após o merge), com confirmação se houver divergência.

> O `board` no `build.yaml` do repo de build precisa casar com a versão do ZMK. Ex.: no HWMv2 do
> Zephyr 4.1, `nice_nano_v2` passou a ser `nice_nano//zmk`. Pinar o ZMK em `config/west.yml`
> evita quebras ao acompanhar o `main`.

## Arquitetura (resumo)

- `src/profiles/profiles.js` — perfis (listar/criar/selecionar/migrar).
- `src/keymap/parser.js` / `serializer.js` — `.keymap` ⇄ modelo com round-trip por offset.
- `src/keymap/catalog.js` / `behaviorTypes.js` — catálogo e tipos de behaviors.
- `src/keymap/validate.js` — aridade + contagem de teclas por layer.
- `src/keymap/diff.js` / `visualDiff.js` — diff textual (git) e estruturado (board).
- `src/keymap/cheatsheet.js` — `keymap-drawer` + `rsvg-convert`.
- `src/server.js` — servidor local (API + estáticos). `web/` — frontend vanilla ES modules.

Especificações e decisões em `openspec/`. Contribuições: veja `CONTRIBUTING.md`.

## Licença

MIT — veja `LICENSE`. Ajuste o titular do copyright para o seu nome/organização ao publicar.
