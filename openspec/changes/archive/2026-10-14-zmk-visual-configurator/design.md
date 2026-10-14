## Context

O keymap do Lily58 vive em um arquivo ZMK `.keymap` (devicetree): nós `keymap { }` com
uma lista de `layer_X { bindings = <...>; };` por layer, mais `behaviors`/`macros`
opcionais. Hoje a edição é manual e sem feedback visual. Este design cobre um app
**local** (localhost, usuário único) que oferece edição visual e edição por agente sobre
o **mesmo** arquivo, além de um export de cheatsheet. Não há backend remoto, autenticação
nem compilação de firmware no escopo.

Restrições: apenas Lily58; o `.keymap` precisa continuar compilável pelo ZMK após cada
escrita; o agente (Claude Code) deve conseguir editar sem quebrar o arquivo.

## Goals / Non-Goals

**Goals:**
- `.keymap` como **fonte única da verdade**, editável por UI e por agente sem divergência.
- Round-trip seguro: reescrever só o que a UI edita (as `bindings` por layer), preservando
  byte a byte o resto do arquivo (comentários, defines, behaviors, macros).
- Painel visual: layout físico do Lily58, uma layer por vez, mostrando o binding atual de
  cada tecla e uma paleta das funções/behaviors disponíveis com seus parâmetros.
- Validação que torna a edição por agente segura (aridade dos behaviors, tamanho da layer).
- Cheatsheet/PDF de todas as layers reutilizando `keymap-drawer`.

**Non-Goals:**
- Flash/compilação do firmware; outros teclados; hospedagem remota/nuvem; multiusuário;
  editor de behaviors/macros customizados pela UI (edição manual continua no arquivo).

## Decisions

### D1 — Fonte da verdade é o `.keymap` (não um JSON paralelo)
UI e agente editam o mesmo arquivo. A UI faz parse → modelo em memória para renderizar e,
ao salvar, serializa de volta. _Por quê:_ elimina o problema de sincronizar duas
representações e garante que o que você vê é o que compila; o agente já opera naturalmente
sobre arquivos. _Alternativa rejeitada:_ JSON como SoT + codegen para `.keymap` — adiciona
uma segunda fonte e um gerador para manter em dia, sem ganho para um único teclado.

### D2 — Parser/serializer ZMK focado e preservador
Um parser próprio entende **apenas** o nó `keymap`: nomes de layer (via `display-name`
ou nome do nó) e a sequência de bindings de cada layer. Na escrita, só os arrays
`bindings = <...>` são regerados; todo o resto do texto é mantido intacto (edição por
região/offset). _Por quê:_ mantém o app "meu" com modelo próprio, evita a complexidade de
um parser devicetree completo e garante fidelidade de round-trip. _Alternativas
rejeitadas:_ (a) reusar o parser JS do nickcoutsos — acopla ao modelo dele e é mais do que
preciso; (b) `keymap-drawer parse` — é lossy, serve para visualização, não para round-trip.

### D3 — App local único: servidor Node + frontend web
Um processo Node serve a UI estática, expõe IO de arquivo (ler/salvar/validar `.keymap`) e
invoca o `keymap-drawer`. Frontend em SPA (Vite). _Por quê:_ escrever arquivo com segurança
e chamar um binário Python exigem um processo local de qualquer forma; um processo só é o
mais simples. _Alternativa rejeitada:_ SPA puro com File System Access API — ainda
precisaria de um processo para o `keymap-drawer`, então não simplifica.

### D4 — Catálogo de behaviors dirige paleta e validação
Um catálogo declarativo dos behaviors do ZMK (`&kp`, `&mt`, `&lt`, `&mo`, `&to`, `&tog`,
`&sk`, `&sl`, `&trans`, `&none`, `&bt`, `&out`, …) com aridade e tipo de cada parâmetro
(keycode, índice de layer, etc.). Alimenta tanto a paleta de "funções possíveis" quanto a
validação de aridade. _Por quê:_ uma única definição serve às duas necessidades que o
usuário pediu (o que dá pra mapear + segurança na edição).

### D5 — Layout físico do Lily58 de fonte conhecida
As posições/coordenadas das teclas vêm de uma definição conhecida (layout QMK do Lily58 /
o mesmo que o `keymap-drawer` usa), não de coordenadas hardcoded no código. _Por quê:_
layout correto sem manutenção frágil e consistência entre editor e cheatsheet.

### D6 — Cheatsheet alimentado pelo modelo, renderizado pelo `keymap-drawer`
O export converte o modelo já parseado para o YAML do `keymap-drawer` e roda
`keymap draw` → SVG; um passo SVG→PDF produz o PDF. _Por quê:_ reusa a renderização madura
do `keymap-drawer` e usa o mesmo layout do editor, sem reparsear o arquivo (evita o parse
lossy).

### D7 — Reflexão de edições do agente
Depois que o agente edita o `.keymap`, a UI recarrega o arquivo (watch do servidor ou botão
"recarregar") e revalida. _Por quê:_ fecha o loop agente→UI de forma simples; watch é
incremento opcional sobre o reload manual.

## Risks / Trade-offs

- **Fidelidade de round-trip em devicetree variado** → reescrever só os arrays `bindings`
  por offset e preservar o resto; teste de round-trip no-op (parse→serialize sem edição
  deve devolver arquivo idêntico) como barreira de regressão.
- **Edição por agente gerando aridade/tamanho errados** → validação contra o catálogo (D4)
  e contra a contagem de teclas da layer (D5); salvar/validar rejeita keymap inválido com
  mensagem clara.
- **Divergência de layout entre editor e cheatsheet** → mesma fonte de layout (D5/D6).
- **Disponibilidade do passo SVG→PDF** → escolher uma ferramenta única; fallback de
  "imprimir para PDF" via navegador documentado se o binário não existir.
- **Behavior fora do catálogo no arquivo existente** → tratar binding desconhecido como
  texto opaco editável/preservado, sem travar o parse.

## Migration Plan

Projeto novo, sem estado legado. Rollback = descartar o app; o `.keymap` permanece um
arquivo de texto comum versionado em git, então qualquer escrita indevida é revertível por
`git`. Recomenda-se commitar o `.keymap` antes de usar o app pela primeira vez.

## Open Questions

- Invocação exata do `keymap-drawer` (config de layout do Lily58) e ferramenta SVG→PDF
  preferida (resvg/rsvg-convert vs. impressão via navegador headless).
- Watch automático de arquivo vs. reload manual para refletir edições do agente (começar no
  reload manual; watch como incremento).
