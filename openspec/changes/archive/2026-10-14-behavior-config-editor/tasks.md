## 1. Modelo: propriedades dos behaviors

- [x] 1.1 Parser: estender o nó `behaviors` para capturar `compatible` e, por behavior, as propriedades suportadas com região do valor (ou ponto de inserção + indentação)
- [x] 1.2 Modelo expõe `behaviors: [{ ref, compatible, isHoldTap, config:{ tappingTermMs, flavor, quickTapMs, requirePriorIdleMs } }]`
- [x] 1.3 Serializer: adicionar edições de propriedade de behavior (editar valor existente / inserir ausente) à lista por offset
- [x] 1.4 Testes: ler config, atualizar valor, inserir propriedade ausente, no-op idêntico

## 2. Validação

- [x] 2.1 Validar `*-ms` (inteiro ≥ 0) e `flavor` (enum) no servidor; rejeitar com mensagem

## 3. API

- [x] 3.1 Save aceita config de behaviors; aplica no modelo, valida e serializa (reusando o round-trip)
- [x] 3.2 Payload de `/api/keymap` inclui os behaviors e sua config

## 4. UI

- [x] 4.1 Botão "⚙️ Behaviors" abre dialog listando os hold-taps configuráveis com campos (tempo do hold, flavor, quick-tap, require-prior-idle)
- [x] 4.2 Aviso de que a config é compartilhada por todas as teclas que usam o behavior (contagem de uso, se barato)
- [x] 4.3 Salvar via API + exibir erros de validação
- [x] 4.4 Na paleta da tecla, quando o behavior é configurável: resumo da config + link que abre o dialog

## 5. Verificação

- [x] 5.1 `npm test` (round-trip incl. config de behavior) verde
- [x] 5.2 e2e: alterar `tapping-term-ms` via API e conferir no arquivo + resto intacto
- [x] 5.3 e2e: inserir `quick-tap-ms` ausente e conferir inserção correta
- [x] 5.4 No navegador: editar config pelo painel e pelo link da tecla; validação rejeita valor inválido
