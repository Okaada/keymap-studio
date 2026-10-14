## Context

O editor edita `keymaps/lily58.keymap` via parser/serializer round-trip (só reescreve os
arrays `bindings` alterados) e renderiza o board a partir de `src/layout/lily58.layout.json`
(posições centradas, unidade 56). Hoje: layers mostradas pelo nome do nó; keys desenhadas no
tamanho da célula (coladas) e legenda bruta (`LEFT_SHIFT`, `BACKSPACE`…) que transborda.
Nenhum `display-name` existe no keymap atual.

## Goals / Non-Goals

**Goals:**
- Renomear layer = definir/editar `display-name` no nó da layer, preservando o resto do arquivo.
- Board com espaçamento entre teclas e rótulos legíveis (sem quebra/overflow), com tooltip do
  binding completo.
- Modo tester: ao pressionar teclas físicas, destacar a posição correspondente e mostrar
  contagem, tempo de hold e chatter.

**Non-Goals:**
- Pressão analógica (hardware digital) e latência por switch (precisa de firmware/host tooling).
- Renomear o nó da layer (identificador) — só `display-name`; outros teclados.

## Decisions

### D1 — Renomear via `display-name`, não o nó
A UI edita o `display-name` da layer (propriedade usada pelo ZMK/ZMK Studio). Se a layer não
tem, o sync insere `display-name = "<nome>";` logo após o `{` do nó. _Por quê:_ os bindings
referenciam layers por índice, então renomear o nó não é necessário e seria mais arriscado;
`display-name` é o canal idiomático para rótulo humano. _Alternativa rejeitada:_ renomear o
identificador do nó — mexe em mais texto sem ganho funcional.

### D2 — Serializer generalizado por lista de edições
O serializer passa a montar uma lista de edições `{start, end, text}` (bindings alterados
**e** display-name inseridos/alterados) e aplica da maior offset para a menor, preservando o
resto. O round-trip no-op continua válido (sem edições → arquivo idêntico). _Por quê:_ rename
e edição de binding podem coexistir numa mesma layer; uma lista ordenada evita invalidar
offsets. _Alternativa rejeitada:_ reescrever o nó inteiro da layer — perderia formatação não
tocada e quebraria o no-op.

### D3 — Parser captura display-name (valor+região) ou ponto de inserção
Para cada layer o parser guarda: região do valor do `display-name` se existir, senão o offset
logo após o `{` do nó (ponto de inserção) e a indentação base. _Por quê:_ dá ao serializer o
necessário para atualizar **ou** criar a propriedade sem tocar no resto.

### D4 — Render com célula × tecla (gap) + mapa de rótulos
Cada tecla é desenhada menor que sua célula (gap interno configurável), aumentando o
espaçamento visual sem mudar as coordenadas (que vêm do layout físico real). Um mapa
keycode→rótulo curto (ex.: `LEFT_SHIFT`→`⇧`, `BACKSPACE`→`⌫`, `SPACE`→`␣`, `RET`→`⏎`) e
`white-space: nowrap` + ellipsis evitam quebra; o binding completo fica no `title`
(tooltip). _Por quê:_ resolve "apertado" e "texto quebrado" sem recalcular geometria.

### D5 — Tester via eventos do navegador, mapeando pela layer base
No modo tester o app escuta `keydown`/`keyup` no documento. Mapeia o evento à posição física
casando `event.code`/`event.key` com o `&kp <KEY>` da **layer base**; destaca a tecla, conta
pressionamentos, mede tempo entre keydown→keyup (hold) e sinaliza **chatter** (keydown
repetido sem keyup, ou down/up/down muito rápidos). Teclas sem mapeamento claro (thumb,
mod-tap, camadas, BT) mostram o evento cru ("última tecla: <code>") sem destaque. _Por quê:_
é o máximo honesto sem firmware especial; o `event.code` dá a posição física
independente de layout do SO para teclas padrão. _Alternativas rejeitadas:_ pressão analógica
(hardware não suporta) e medição de latência (precisa de host tooling dedicado).

### D6 — Escolhas de UI (definidas com o usuário)
- **Renomear layer**: duplo-clique no nome da aba transforma em campo editável; Enter salva
  (envia `displayName` e atualiza abas + dropdowns). Sem botão extra.
- **Tester no próprio board**: o modo tester reusa o board do editor (as teclas acendem ao
  pressionar) com um painel lateral de métricas (contagem/hold/chatter); não é uma tela separada.

## Risks / Trade-offs

- **Offset ao inserir display-name** → serializer aplica edições da maior para a menor offset (D2).
- **Round-trip no-op** → só layers com nome alterado recebem escrita de display-name; sem
  mudança, nada é reescrito (teste de regressão garante arquivo idêntico).
- **Mapeamento impreciso do tester** (mod-tap/camadas/thumb/split) → não forçar: destacar só
  o que casa com `&kp` da base e mostrar o evento cru no resto, deixando o limite explícito na UI.
- **Expectativa de "pressão"** → UI deixa claro que mede registro/resposta/tempo, não força.
- **display-name com aspas/caracteres especiais** → escapar/limitar o nome ao gravar.

## Open Questions

- Glyphs vs. abreviações textuais para os rótulos (começar com um mapa pequeno de glyphs +
  fallback textual; expandir conforme uso).
- Qual layer usar como referência do tester quando a base tem mod-taps no lugar de `&kp` puro
  (começar pela primeira layer; permitir trocar a layer de referência é incremento).
