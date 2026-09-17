# Estilo do mapa

> **ATENCAO — o formato deste arquivo esta desatualizado.**
>
> Em 17/09/2026 descobrimos que o editor de estilos do console do Google
> mudou. O formato antigo, uma LISTA de regras (`[{featureType, elementType,
> stylers}]`), e o que a documentacao da propriedade `styles` descreve e o
> que o `estilo-do-mapa.json` daqui usa — mas o editor novo espera um
> OBJETO, comecando por `{"variant": "light"}`. Ele recusa a lista dizendo
> "erro de sintaxe", que confunde: o JSON e valido, o esquema e que e outro.
>
> Este arquivo fica como registro das decisoes de design (o que ligar, o que
> desligar e por que). Antes de usa-lo, converta para o formato novo — ou
> aplique as mesmas decisoes pela aba "Elementos do mapa".

`estilo-do-mapa.json` é o visual do mapa do guia: fundo creme, verde da mata
nos parques e na água, rodovias em âmbar e o comércio do Google desligado.

## Por que ele não está no código

O mapa usa um **Map ID**, e a documentação do Google é direta sobre isso:

> This feature is not available when using a map ID, or when using vector maps
> (use cloud-based maps styling instead).

Ou seja: com Map ID, a propriedade `styles` em JavaScript é simplesmente
ignorada. Seria escolher entre os pinos do guia (que exigem Map ID) e as cores
do guia. Não precisa escolher — o editor do Google importa este JSON, e o
estilo passa a valer pelo Map ID.

O arquivo fica versionado aqui porque o console do Google não é lugar de
guardar decisão de design: se alguém mexer lá, esta é a referência do que
estava certo.

## Como aplicar

1. Google Cloud Console → **Google Maps Platform** → **Map Styles**
2. Abra o estilo ligado ao Map ID `14c49df2a3f5ef6c8e155db2`
   (ou crie um novo e **associe esse Map ID a ele**)
3. No editor, procure **Import JSON** (fica no menu de opções do estilo)
4. Cole o conteúdo de `estilo-do-mapa.json`
5. **Save** e depois **Publish** — sem publicar, a mudança não sai do editor

A propagação leva alguns minutos. Se o mapa do site continuar igual, é cache:
recarregue segurando Shift.

## As escolhas, e por quê

- **`poi` desligado.** É a mudança que mais muda o mapa. O Google desenha os
  próprios ícones de comércio — restaurantes, mercados, postos — em laranja, e
  eles competem com os pinos do guia justamente onde o guia tem mais a dizer.
  Desligados, os únicos comércios no mapa são os que estão cadastrados aqui.
- **`poi.park` religado.** Parque não é concorrente: é referência para se
  achar na cidade, e o verde ajuda a ler o mapa.
- **`labels.icon` desligado.** Tira os ícones que sobram nos rótulos sem tirar
  os nomes dos bairros e das ruas.
- **`transit` desligado.** Ivoti não tem metrô nem trem; a camada só somava
  linha no desenho.
- **Rodovia em âmbar.** É o `sol` da paleta do site. Dá hierarquia — a BR se
  distingue da rua do bairro sem precisar de cor forte.
- **Água em `mata-200`.** O azul padrão do Google era a única cor do mapa que
  não pertencia à identidade.
