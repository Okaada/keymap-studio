## 1. Modelo: display-name (rename)

- [x] 1.1 Parser captura por layer: região do valor do `display-name` (se existe) ou ponto de inserção (após `{`) + indentação
- [x] 1.2 Generalizar serializer: montar lista de edições `{start,end,text}` (bindings + display-name) e aplicar da maior offset p/ menor
- [x] 1.3 Escrever/inserir `display-name` só para layers com nome alterado; escapar aspas/limitar o nome
- [x] 1.4 Testes: inserir display-name, atualizar existente, no-op idêntico, rename+edição de binding na mesma layer

## 2. Rename na API/UI

- [x] 2.1 Save aceita `displayName` por layer; modelo aplica e serializa
- [x] 2.2 UI: renomear layer (ex.: duplo-clique na aba ou botão) → envia e atualiza abas + dropdowns de layer

## 3. Layout visual

- [x] 3.1 Render com gap interno (tecla menor que a célula) e board maior; preservar posições físicas
- [x] 3.2 Mapa keycode→rótulo curto/glyph (⇧ ⌫ ␣ ⏎ etc.) + `nowrap`/ellipsis; binding completo no tooltip
- [x] 3.3 Ajustar legenda de mod-tap/trans/none para caber sem overflow

## 4. Keyboard tester

- [x] 4.1 Toggle de modo "Tester" (desativa edição; escuta keydown/keyup no documento)
- [x] 4.2 Índice keycode→posição a partir da layer base (`&kp`); destacar posição no press; soltar remove destaque
- [x] 4.3 Painel: última tecla (code/key), contagem total e por tecla, tempo de hold
- [x] 4.4 Detecção de chatter (down repetido sem up / down-up-down muito rápido) + aviso
- [x] 4.5 Nota na UI sobre limites (sem pressão analógica; teclas não mapeáveis mostram evento cru)

## 5. Verificação

- [x] 5.1 `npm test` (round-trip incl. display-name) verde
- [x] 5.2 e2e: renomear uma layer via API e conferir `display-name` no arquivo + resto intacto
- [x] 5.3 Conferir board com espaçamento e rótulos sem quebra (render)
- [x] 5.4 Conferir tester: destaque em tecla mapeável, evento cru em não-mapeável, contagem/hold/chatter
