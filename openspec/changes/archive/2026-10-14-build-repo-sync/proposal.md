## Why

Hoje o ciclo "editei o keymap → quero o firmware" tem um degrau manual: copiar
`keymaps/lily58.keymap` pra dentro do repo `zmk-config`, commitar e abrir PR no GitHub pra
disparar o build do `.uf2`. Quero fazer isso **a partir do próprio editor**, com segurança
(ver o que vai mudar antes), fechando o ciclo edição → build.

## What Changes

- Novo fluxo no app: **sincronizar** o keymap editado para o repo de build (`zmk-config`),
  criando uma **branch** + **Pull Request** no GitHub — o push da branch dispara o workflow
  de build (`.github/workflows/build.yml`) que gera os `.uf2` do Lily58.
- **Preview antes de agir**: a UI mostra o diff entre o keymap local e o do repo de build;
  nada é commitado/enviado sem confirmação explícita.
- Reuso da autenticação existente: `git` (remote SSH) + `gh` CLI já logado — sem novas
  credenciais nem dependências.
- Configuração do alvo em `config.json` (caminho do repo, destino do keymap, branch base).
- **Fora de escopo agora**: acompanhar o status do build, baixar o `.uf2`, puxar alterações
  do repo de volta (pull), outros teclados.

## Capabilities

### New Capabilities
- `build-repo-sync`: sincroniza o keymap editado para o repo de build via branch + PR, com
  preview de diff e confirmação, reaproveitando `git`/`gh`.

### Modified Capabilities
<!-- Nenhuma. As capabilities do editor (keymap-model, visual-keymap-editor,
     agent-keymap-editing, keymap-cheatsheet-export) não mudam de comportamento. -->

## Impact

- **Novo código**: módulo de sync (invoca `git`/`gh` com cwd no repo de build) + endpoints
  no servidor (preview, sync) + botão/fluxo na UI.
- **Config**: nova seção `buildRepo` em `config.json` (path, keymapDest, baseBranch, remote).
- **Dependências externas (já presentes)**: `git` com remote autenticado e `gh` CLI logado.
- **Ações externas**: criar branch, commit, push e PR no GitHub `<owner>/zmk-config` — sempre
  sob confirmação explícita do usuário na UI.
