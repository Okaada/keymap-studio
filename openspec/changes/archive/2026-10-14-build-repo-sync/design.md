## Context

O editor edita `keymaps/lily58.keymap` (cópia local, fonte da verdade da UI). O firmware é
compilado por um repo git **separado**, `zmk-config` (`git@github.com:<owner>/zmk-config.git`,
branch `master`), cujo `.github/workflows/build.yml` roda em push/PR e gera os `.uf2`
(`nice_nano_v2` + `lily58_left/right`). O destino do keymap lá é `config/lily58.keymap`.

Ambiente já disponível: `git` com remote SSH funcional e `gh` CLI autenticado
(conta `<gh-account>`). Logo, a integração orquestra ferramentas existentes — não fala com a
API do GitHub por conta própria nem gerencia tokens.

## Goals / Non-Goals

**Goals:**
- A partir do app: copiar o keymap local pro repo de build, criar branch, commit, push e
  abrir PR — o que dispara o build no GitHub Actions.
- Mostrar o **diff** (local × repo) antes de qualquer ação externa; só agir sob confirmação.
- Falhar de forma segura e clara (repo sujo, branch errada, push/PR falhou, `gh` ausente).

**Non-Goals:**
- Acompanhar status do build / baixar `.uf2` / notificar conclusão.
- Pull (repo → local); outros teclados; merge automático do PR.
- Gerenciar credenciais — depende da auth SSH/`gh` já configurada.

## Decisions

### D1 — Orquestrar `git` + `gh` via child_process (cwd = repo de build)
O módulo de sync roda `git`/`gh` com `cwd` no `buildRepo.path`, reusando a auth existente.
_Por quê:_ zero dependências novas, usa exatamente o que já funciona no terminal do usuário.
_Alternativa rejeitada:_ lib JS de git (isomorphic-git) ou chamadas diretas à API do GitHub
com token — reimplementa auth já resolvida e amplia superfície/credenciais à toa.

### D2 — Fluxo: base limpa → branch → copiar → commit → push → PR
1. Pré-checagem: working tree do repo de build limpo **e** em `baseBranch`; senão, recusa.
2. `git switch -c keymap-update-<stamp>` a partir da base.
3. Copia `keymaps/lily58.keymap` → `config/lily58.keymap`.
4. `git add` + `commit` (mensagem do usuário ou padrão).
5. `git push -u origin <branch>`.
6. `gh pr create` → retorna a URL do PR.
_Por quê:_ branch+PR dá histórico revisável (escolha do usuário) e isola a mudança; o push
da branch já dispara o workflow de build. _Alternativa rejeitada:_ push direto em `master` —
menos cerimônia, mas sem ponto de revisão (o usuário preferiu PR).

### D3 — Preview read-only separado da ação (segurança)
`GET /api/sync/preview` retorna o diff entre o keymap local e `config/lily58.keymap` do repo
**sem** mutar nada. A ação real (`POST /api/sync`) só roda após o usuário confirmar na UI
vendo esse diff. _Por quê:_ push/PR são ações externas e difíceis de reverter sem rastro; o
preview + confirmação explícita é a salvaguarda. _Alternativa rejeitada:_ sync num clique só
— rápido, mas arriscado para uma ação que publica no GitHub e dispara CI.

### D4 — Recusar em estado ambíguo do repo de build
Se o working tree estiver sujo ou fora da `baseBranch`, o sync recusa com mensagem explícita
em vez de tentar adivinhar. _Por quê:_ evita entrelaçar a mudança do keymap com alterações
não relacionadas do usuário e evita commits acidentais.

### D5 — `gh` ausente/sem auth → fallback sem travar
Se `gh` não existir ou não estiver logado, o fluxo ainda faz branch+commit+push e retorna a
**URL de criação de PR** (compare link) para o usuário abrir manualmente. _Por quê:_ entrega
o valor principal (código no GitHub, build disparado) mesmo sem o passo de PR automatizado.

## Risks / Trade-offs

- **Repo de build sujo / branch errada** → pré-checagem recusa com instrução clara (D4).
- **Push/PR falha (auth, rede, remote)** → capturar stderr e devolver mensagem acionável;
  nada fica pela metade no local (o keymap local não é afetado pelo sync).
- **Divergência local × repo** (alguém editou o repo) → o preview (D3) expõe o diff; a branch
  sai sempre da base, então não há clobber silencioso.
- **Ação externa disparada sem intenção** → só via `POST /api/sync` após confirmação na UI;
  o preview nunca muta.
- **Stamp de branch** → usar timestamp do servidor (Node) para nome único e determinístico.

## Migration Plan

Feature aditiva. Sem migração de dados. Rollback = remover o fluxo de sync; o editor segue
funcionando. No lado do repo de build, qualquer branch/PR criado é descartável (fechar PR /
apagar branch) sem afetar `master`.

## Open Questions

- Nome da branch: `keymap-update-<timestamp>` fixo vs. permitir rótulo do usuário (começar no
  timestamp; rótulo é incremento).
- Reaproveitar uma branch/PR aberto do mesmo dia vs. sempre criar nova (começar sempre nova).
