## 1. Helper de diff compartilhado

- [x] 1.1 Criar `src/keymap/diff.js` exportando `diffText(a, b)` — encapsula `git --no-index diff` em arquivos temporários; retorna `{ changed, diff }` e degrada para `{ changed: a!==b, diff: "(diff indisponível)" }` sem lançar
- [x] 1.2 Refatorar `src/sync/repo.js: preview()` para usar `diffText` (sem mudança de comportamento observável)

## 2. Aplicação de payload reutilizável

- [x] 2.1 Extrair a lógica de aplicação do payload do save (`layers` + `behaviors` + `newBehaviors`) do handler `POST /api/keymap` para `applyIncoming(model, incoming)` (retornando `newBehaviorErrors`)
- [x] 2.2 Fazer o handler do save usar `applyIncoming` (comportamento idêntico ao atual)

## 3. Endpoint de dry-run

- [x] 3.1 Implementar `POST /api/keymap/preview`: clonar o modelo (cópia profunda), rodar `applyIncoming` na cópia, validar (`validateKeymap` + `validateBehaviors`), serializar com `state.original`/`state.originalDN` e computar `diffText(arquivoSalvoAtual, pendente)`
- [x] 3.2 Garantir que o preview NÃO chama `writeFile`/`loadModel` e NÃO muta `state.model`; retornar `{ ok, changed, diff, validation, behaviorValidation, newBehaviorErrors }` (diff vazio + erros quando inválido)

## 4. UI do editor

- [x] 4.1 Adicionar botão "Pré-visualizar mudanças" no editor; montar o payload atual e chamar `POST /api/keymap/preview`
- [x] 4.2 Exibir o diff num dialog reusando o markup/estilo `.diff` do dialog de sync; mostrar erros de validação quando a edição for inválida
- [x] 4.3 Botão "Salvar" dentro do dialog que confirma via o fluxo de save existente (`POST /api/keymap`)

## 5. Testes e verificação

- [x] 5.1 Teste: preview de edição válida retorna `changed: true` e diff não-vazio; no-op retorna `changed: false` e diff vazio
- [x] 5.2 Teste: após o preview, `state.model` (bindings/display-names/config de behaviors) permanece igual ao baseline e o arquivo não é gravado
- [x] 5.3 Teste: o texto refletido no diff do preview é igual ao que o save grava para a mesma edição
- [x] 5.4 Teste: preview de edição inválida retorna os erros sem gravar
- [x] 5.5 `npm test` verde + smoke no navegador: pré-visualizar → ver diff → salvar; restaurar `keymaps/lily58.keymap` após edições de verificação
