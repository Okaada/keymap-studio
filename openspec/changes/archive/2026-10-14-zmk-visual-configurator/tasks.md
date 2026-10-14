## 1. Setup do projeto

- [x] 1.1 Inicializar o app local (repo git, servidor Node + frontend Vite, estrutura de pastas)
- [x] 1.2 Apontar para o `.keymap` do Lily58 como arquivo-alvo (config simples do caminho)
- [x] 1.3 Verificar disponibilidade do `keymap-drawer` (Python) e documentar instalação

## 2. keymap-model (parser/serializer round-trip)

- [x] 2.1 Parsear o nó `keymap`: extrair layers (nome via `display-name`/nó) e sequência de bindings
- [x] 2.2 Modelo em memória: layers ordenadas + bindings (behavior + parâmetros); bindings desconhecidos como texto opaco
- [x] 2.3 Serializer por offset: regerar apenas os arrays `bindings` alterados, preservando o resto do arquivo
- [x] 2.4 Teste de round-trip no-op (parse→serialize sem edição devolve arquivo idêntico) + teste de 1 tecla alterada

## 3. Catálogo de behaviors e layout do Lily58

- [x] 3.1 Catálogo declarativo dos behaviors ZMK com aridade/tipo de parâmetros (`&kp`,`&mt`,`&lt`,`&mo`,`&to`,`&tog`,`&sk`,`&sl`,`&trans`,`&none`,`&bt`,`&out`)
- [x] 3.2 Definição do layout físico do Lily58 (posições) a partir de fonte conhecida (QMK/keymap-drawer), sem hardcode frágil
- [x] 3.3 Validador: aridade dos behaviors contra catálogo + contagem de posições por layer, com mensagens claras (layer/posição)

## 4. Servidor local (IO + validação + export)

- [x] 4.1 Endpoints: ler keymap (→ modelo), salvar modelo (→ round-trip), validar
- [x] 4.2 Endpoint de recarregar arquivo para refletir edições feitas pelo agente
- [x] 4.3 Endpoint de export: modelo → YAML do keymap-drawer → `keymap draw` (SVG) → PDF (com fallback se faltar a ferramenta)

## 5. Painel visual (frontend)

- [x] 5.1 Renderizar o layout físico do Lily58 e seletor de layer
- [x] 5.2 Exibir binding de cada tecla de forma legível (incl. mod-tap, `&trans`, `&none`)
- [x] 5.3 Paleta de behaviors com preenchimento de parâmetros (keycode, seletor de layer para `&mo`/`&lt`/`&to`/`&tog`)
- [x] 5.4 Atribuir behavior à tecla selecionada, atualizar modelo e salvar via servidor
- [x] 5.5 Botão "recarregar" + exibir erros de validação em vez de estado quebrado

## 6. Cheatsheet / PDF

- [x] 6.1 Botão de gerar cheatsheet (todas as layers) e visualizar o resultado
- [x] 6.2 Export em PDF a partir do cheatsheet, com caminho alternativo documentado

## 7. Verificação end-to-end

- [x] 7.1 Editar uma tecla na UI, salvar, e confirmar que o `.keymap` continua compilável e só mudou o esperado
- [x] 7.2 Editar o `.keymap` como "agente", recarregar na UI e confirmar reflexo correto; keymap inválido é sinalizado
- [x] 7.3 Gerar cheatsheet/PDF e conferir consistência de layout com o editor
