## 1. Índice por layer

- [x] 1.1 Substituir `baseKpIndex()` por `layerKpIndex(i)` que resolve keycode testável por behavior
- [x] 1.2 Resolver `&kp`/`&sk` (keycode), tap de `&mt`/`&lt`/hold-taps custom (último param), e `&trans` → base
- [x] 1.3 `toggleTester()` e `selectLayer()` (quando em tester) refazem `state._kpIndex` para a layer ativa

## 2. UI do tester

- [x] 2.1 Painel mostra a layer alvo do mapeamento + aviso "ative esta layer no teclado para testá-la"
- [x] 2.2 (opcional) Mostrar "mapeáveis/58" da layer atual

## 3. Verificação

- [x] 3.1 No navegador: no modo tester, trocar para `raise_layer`, pressionar a tecla de um `&kp` dessa layer e ver o destaque
- [x] 3.2 Conferir `&trans` herdando a base (pressionar a tecla da base destaca a posição transparente)
- [x] 3.3 Conferir que `&none`/`&mo`/`&bt` não geram destaque falso
