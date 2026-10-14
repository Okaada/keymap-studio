## Context

O `.keymap` define behaviors custom no nó `behaviors { }`. No keymap atual há dois hold-taps —
`holdtap` e `mo_mt` — ambos `compatible = "zmk,behavior-hold-tap"` com `tapping-term-ms = <200>`
e `flavor = "hold-preferred"` (sem `quick-tap-ms`/`require-prior-idle-ms`). O parser hoje só
extrai `name` e `#binding-cells` desses nós (`parseCustomBehaviors`); o editor não mostra nem
edita a config. O serializer já aplica edições por offset (bindings + display-name), então
estender para propriedades de behavior é natural.

Modelo mental importante: a config do hold-tap fica na **definição** e vale para **todas** as
teclas que usam aquele behavior (`&holdtap …`). Não é por tecla.

## Goals / Non-Goals

**Goals:**
- Parsear as propriedades configuráveis dos hold-taps (com offsets) e round-trip ao salvar.
- Painel "Behaviors" para editar `tapping-term-ms`, `flavor`, `quick-tap-ms`, `require-prior-idle-ms`.
- Resumo + link a partir da tecla que usa um behavior configurável.
- Validar os valores.

**Non-Goals:**
- Criar behaviors novos; customizar `&mt`/`&lt` embutidos (exigiria gerar behavior custom);
  config por-binding; sticky-key/tap-dance/macro/combo; flags booleanas.

## Decisions

### D1 — Editar a definição do behavior (não por tecla)
O painel edita as propriedades no nó `behaviors { }`; a UI deixa claro que o ajuste vale para
todas as teclas que usam aquele behavior. _Por quê:_ é exatamente o modelo do ZMK; evita a
ilusão de config por-tecla (que no ZMK exigiria um behavior por configuração). _Alternativa
rejeitada:_ campos de hold-time inline na tecla — sugeririam config por-tecla, enganoso.

### D2 — Parser estende `behaviors` com propriedades + offsets
Para cada nó de behavior o parser captura `compatible` e, para as propriedades suportadas, a
região {start,end} do valor (quando presente) e um ponto de inserção (após `#binding-cells` ou
antes do `}`) com indentação. Numéricas `*-ms` casam `nome = < N >`; `flavor` casa `= "..."`.
_Por quê:_ dá ao serializer o que precisa para editar valor existente ou inserir propriedade
ausente, sem tocar no resto. _Alternativa rejeitada:_ reescrever o nó inteiro — perderia
formatação e quebraria o no-op.

### D3 — Serializer reusa a lista de edições por offset
As edições de propriedades de behavior entram na mesma lista `{start,end,text}` já aplicada da
maior para a menor offset (junto de bindings/display-name). _Por quê:_ um só mecanismo,
no-op preservado, sem risco de offsets cruzados.

### D4 — Propriedades e validação
Suportadas (hold-tap): `tapping-term-ms`, `quick-tap-ms`, `require-prior-idle-ms` (inteiros ≥ 0)
e `flavor` ∈ {tap-preferred, hold-preferred, balanced, tap-unless-interrupted}. Só exibidas
para behaviors `compatible = "zmk,behavior-hold-tap"`. _Por quê:_ cobre "tempo do hold e etc"
com inputs corretos e evita gravar lixo.

### D5 — UI: painel dedicado + link da tecla
Botão "⚙️ Behaviors" abre um dialog listando cada hold-tap com seus campos e um "Salvar". Na
paleta de edição da tecla, quando o behavior é configurável, mostra um resumo
(ex.: "holdtap · 200ms · hold-preferred") e um link "configurar" que abre o painel. _Por quê:_
organiza num lugar só e ainda é alcançável de onde se usa — o "não ficar jogado" do pedido.

## Risks / Trade-offs

- **Config compartilhada entre teclas** → a UI avisa que o ajuste afeta todas as teclas que usam
  o behavior (lista quantas teclas usam, se fácil).
- **Inserir propriedade ausente** (ex.: `quick-tap-ms`) → ponto de inserção determinístico após
  `#binding-cells` com a indentação do nó; reusa o edit-list.
- **Round-trip no-op** → só propriedades alteradas geram edição; sem mudança → arquivo idêntico
  (coberto por teste).
- **Valor fora do padrão no arquivo** (ex.: `flavor` desconhecido) → a UI mostra o valor cru e a
  validação sinaliza se o usuário tentar salvar algo inválido.

## Open Questions

- Mostrar a contagem de teclas que usam cada behavior (útil para entender o impacto; provável
  incluir se o cálculo sair barato a partir do modelo já carregado).
