## 1. Schema de tipos + descrições (#1)

- [x] 1.1 Criar `BEHAVIOR_TYPES` (compatible → label, bindingCells, hasBindings, props[{dt,key,type,desc,options}]) começando por hold-tap, mod-morph, sticky-key, tap-dance, macro, caps-word
- [x] 1.2 Adicionar `desc` aos params do catálogo (keycode, layer, mod, bt, out) em PT amigável
- [x] 1.3 UI: exibir as descrições (hint/tooltip) nos campos da paleta e do painel de behaviors

## 2. Modelo genérico de behaviors (#2)

- [x] 2.1 Parser: capturar por nó `ref`, `compatible`, `#binding-cells`, região de `bindings` e props escalares do tipo (valor/offset)
- [x] 2.2 Serializer: inserir um novo nó de behavior (template por tipo) antes do `}` do `behaviors`; editar props genéricas — reusando a lista de edições por offset
- [x] 2.3 Testes: parse de tipo não-hold-tap, inserir novo nó, no-op idêntico, editar prop genérica

## 3. Validação por tipo (#2)

- [x] 3.1 Validar nome (identificador único), `compatible` conhecido, `#binding-cells`, `*-ms` ≥ 0, enums, bindings exigidos
- [x] 3.2 Smoke: arquivo salvo continua parseável (keymap-drawer)

## 4. API (#2)

- [x] 4.1 Endpoint/payload para criar behavior; save aplica no modelo, valida e serializa
- [x] 4.2 `/api/keymap` inclui o schema de tipos e as descrições para a UI

## 5. UI de criar/editar + centralizar (#2, #4)

- [x] 5.1 No painel Behaviors: botão "Novo behavior" → escolher tipo → formulário por schema (bindings + props) → salvar
- [x] 5.2 Edição genérica por tipo no painel (não só hold-tap), com descrições
- [x] 5.3 CSS: centralizar o board horizontalmente (sem mudar escala/posições)

## 6. Documentação de contexto (#5, #3)

- [x] 6.1 Criar `AGENTS.md` na raiz: teclado (Lily58, layers/nomes), convenções, regras de edição segura, fluxo build/sync
- [x] 6.2 Registrar no ai-memory um arquivo `project` (arquitetura + fluxos + convenções) + ponteiro no `MEMORY.md`

## 7. Verificação

- [x] 7.1 `npm test` verde (incl. novos testes de behaviors genéricos)
- [x] 7.2 e2e: criar um hold-tap novo via API, conferir nó inserido + parseável + aparece na paleta
- [x] 7.3 No navegador: descrições visíveis; criar/editar behavior pelo painel; board centralizado
- [x] 7.4 Conferir `AGENTS.md` e a entrada no ai-memory
