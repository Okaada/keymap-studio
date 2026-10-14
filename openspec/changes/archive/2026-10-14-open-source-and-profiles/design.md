## Context

Hoje o `src/server.js` carrega **um** `config.json` na inicialização (`keymapPath`, `keyboard`, `layout`, `port`, `buildRepo`), resolve paths relativos contra `ROOT`, e mantém `state.model` (um keymap). `buildRepo` é resolvido uma vez. Tudo é single-user e hard-coded pro Lily58 do dono. O `keymaps/lily58.keymap` real está versionado; o `config.json` tem o path absoluto do `zmk-config` do dono.

O usuário quer: (1) abrir o projeto (MIT + docs + sem dados pessoais no repo público) e (2) tornar teclado/layout/keymap/build-repo **perfis trocáveis na UI**.

## Goals / Non-Goals

**Goals:**
- Perfil = `{ name, keyboard, layout, keymapPath, buildRepo }` em `profiles/<name>.json`; um perfil ativo; listar/selecionar/criar via API+UI; editor opera sobre o ativo.
- Migração automática do `config.json` legado → perfil (zero quebra pro dono).
- Repo público limpo: exemplos versionados, reais ignorados; `LICENSE` MIT; `README` de uso; `AGENTS.md` genérico.

**Non-Goals:**
- Sem auth, multiusuário, nuvem, hospedagem ou sync de perfis.
- Sem editor visual de layout (layout continua um JSON fornecido por teclado).
- Não reescreve o parser/serializer/validação — eles seguem operando sobre "o keymap do perfil ativo".

## Decisions

- **`config.json` vira config GLOBAL** `{ activeProfile, port }`; o que é por-teclado migra pra `profiles/<name>.json`. Alternativa rejeitada: manter tudo no config.json com uma lista de perfis — mistura global com por-perfil e complica o "arquivo por perfil" (mais fácil de versionar/editar/compartilhar).
- **Resolvedor de perfil ativo** em `src/profiles/profiles.js`: `listProfiles()`, `readProfile(name)`, `createProfile(p)`, `getActive()`/`setActive(name)`, `migrateLegacy()` (se `profiles/` vazio e `config.json` tem `keymapPath`, cria `profiles/<keyboard>.json` e seta ativo). O server passa a ter `state.profile` (perfil ativo resolvido) e `loadModel()` usa `state.profile.keymapPath`/`layout`. Trocar perfil = `setActive` + `loadModel` + devolver `modelPayload()` (que já inclui `layout`, então a UI troca de teclado sozinha).
- **buildRepo por perfil**: `resolveBuildRepo` roda sobre `state.profile.buildRepo`; `/api/sync*` usa o do perfil ativo. Assim "os repos conversam legal" por perfil.
- **Des-personalização via `.gitignore` com exceções**: ignorar `config.json`, `profiles/*.json`, `keymaps/*.keymap`; versionar `config.example.json`, `profiles/example.json`, `keymaps/*.example.keymap`, e os layouts (`src/layout/*.json` são ativos reutilizáveis, não pessoais). Bootstrap: se o keymap do perfil ativo não existir mas houver `*.example.keymap`, copiar como ponto de partida (onboarding sem erro).
- **Criar perfil (UI)**: form com name/keyboard/layout/keymapPath/buildRepo; valida nome único (slug), layout existente, e grava `profiles/<name>.json`. Keymap novo: copia do example do teclado se existir, senão exige um keymapPath válido.
- **Licença/holder**: `LICENSE` MIT com holder genérico (placeholder do dono do repo), documentado no README como editável.
- **Teste sem servidor**: `src/profiles/profiles.js` é puro I/O testável (usa um dir base passado por parâmetro / env), então migração/criar/selecionar têm teste unitário sem subir o HTTP.

## Risks / Trade-offs

- [Migração apagar/duplicar config do dono] → migração é idempotente (só roda se `profiles/` ausente/vazia) e **não** deleta o `config.json` legado; apenas cria o perfil e passa a ler dele. Teste cobre "roda uma vez / no-op na segunda".
- [Trocar perfil com keymap de outro teclado (layout/contagem diferente)] → `modelPayload` manda o `layout` do perfil; a UI redesenha com as coords certas; a validação usa `layout.keyCount` do perfil ativo. Perfis são independentes.
- [Gitignore esconder algo que o dono quer versionar] → exceções explícitas pros exemplos; o real fica local por escolha do usuário (decisão confirmada). Documentado no README.
- [Keymap ausente após clone] → bootstrap copia o example; o README explica o fluxo "copie o example e edite".
- [Expor dados pessoais já no histórico git] → o `.gitignore` evita daqui pra frente; limpeza de histórico é fora de escopo (o repo ainda não é público). Anotado como follow-up se necessário.

## Migration Plan

1. Introduzir `profiles/` + resolvedor + migração (dono: `config.json` atual → `profiles/lily58.json` ativo, sem perder nada).
2. Des-personalizar: mover reais pra ignorados, versionar exemplos, gerar `config.example.json`/`profiles/example.json`/`keymaps/lily58.example.keymap`.
3. UI de troca/criação.
4. Docs + licença.
Rollback: o `config.json` legado permanece; remover `profiles/` volta ao fluxo antigo. Nada externo é tocado.
