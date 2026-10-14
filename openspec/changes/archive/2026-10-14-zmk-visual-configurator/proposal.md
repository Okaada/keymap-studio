## Why

Editar o keymap do meu Lily58 hoje significa mexer à mão em devicetree (`.keymap`),
decorar os nomes dos behaviors do ZMK e recompilar às cegas para descobrir se ficou
certo. Quero um configurador visual **local e meu** (no espírito do
nickcoutsos/keymap-editor, mas sob meu controle e com minhas customizações) que me dê
duas formas complementares de trabalhar: um painel visual para mapear teclas por layer
e a capacidade de pedir alterações a um agente — mantendo o mesmo `.keymap` como fonte
única da verdade — além de gerar um cheatsheet/PDF para consulta rápida.

## What Changes

- Novo app local (frontend web + servidor local) que lê e escreve o `.keymap` do Lily58.
- **Parser/serializer round-trip** do ZMK `.keymap`: devicetree ⇄ modelo estruturado
  (layers + bindings), preservando o que não é editado pela UI.
- **Painel visual de keymap**: layout físico do Lily58, uma layer por vez, mostrando o
  que já está mapeado em cada tecla e uma paleta das funções/behaviors disponíveis
  (`&kp`, `&mt`, `&lt`, `&mo`, `&trans`, `&none`, macros, etc.) com seus parâmetros.
- **Caminho de edição por agente**: formato canônico + validação, de modo que o agente
  (Claude Code) edite o mesmo arquivo com segurança e a UI reflita as mudanças.
- **Export de cheatsheet/PDF**: geração de uma visão impressa/visual do keymap (todas as
  layers) reutilizando o `keymap-drawer` para renderização.
- Escopo inicial: **apenas Lily58** e **somente local** (sem deploy, sem nuvem, sem
  multiusuário).

## Capabilities

### New Capabilities
- `keymap-model`: parse e serialização round-trip do `.keymap` do ZMK para um modelo
  estruturado (layers, bindings, nomes de layer), usado como fonte da verdade por UI e agente.
- `visual-keymap-editor`: UI web com o layout físico do Lily58, edição por layer, exibição
  do que está mapeado e paleta das funções/behaviors disponíveis.
- `agent-keymap-editing`: contrato de edição baseado em arquivo, com validação, que permite
  ao agente alterar o keymap de forma segura e verificável.
- `keymap-cheatsheet-export`: geração de cheatsheet visual / PDF de todas as layers.

### Modified Capabilities
<!-- Nenhuma: projeto OpenSpec vazio, sem specs existentes. -->

## Impact

- **Novo código**: app local (frontend + servidor leve), parser/serializer ZMK, módulo de export.
- **Dependências**: runtime do frontend (Node/Vite) e `keymap-drawer` (Python) para o cheatsheet,
  mais um passo SVG→PDF. Sem dependências de rede/nuvem.
- **Dados**: o `.keymap` do Lily58 é lido e reescrito in-place; definição do layout físico do Lily58
  (posições das teclas) vinda de fonte conhecida (QMK/keymap-drawer) em vez de hardcode frágil.
- **Fora de escopo agora**: outros teclados, flash/compilação do firmware, hospedagem remota.
