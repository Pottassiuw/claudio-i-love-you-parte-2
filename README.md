# API REST - Controle de Produção

API em Node.js + Express para controle de ordens de produção, estoque e relatórios.
Os dados ficam em memória (um array), então são perdidos quando o servidor reinicia.

## Como executar

```
npm install
npm start
```

O servidor sobe em http://localhost:3000.

## Endpoints

**POST /ordens**
Cadastra uma ordem. O corpo em JSON precisa ter: codigoOrdem, codigoProduto, tipoProduto, quantidadeProduzida, custoUnitarioBase, estoqueInicial.
Retorna 201 com a ordem e os campos calculados. Retorna 400 se faltar campo, se o tipoProduto não for 1, 2 ou 3, ou se o codigoOrdem já existir.

**GET /ordens**
Lista todas as ordens. Aceita filtros opcionais: `?tipo=2` e `?alerta=ALTO`.

**GET /ordens/:codigoOrdem**
Retorna uma ordem pelo código. Retorna 404 se não existir.

**PUT /ordens/:codigoOrdem**
Atualiza os campos permitidos (codigoProduto, tipoProduto, quantidadeProduzida, custoUnitarioBase, estoqueInicial) e recalcula estoqueFinal, custoUnitarioAjustado, custoTotal e alertaEstoque. Retorna 404 se não existir.

**DELETE /ordens/:codigoOrdem**
Remove a ordem. Retorna 404 se não existir.

**GET /relatorios/ordens**
Relatório consolidado com: totalOrdens, estoquePorTipo, mediaCustoTotalPorOrdem, ordemMaisCara, ordemMaisBarata, quantidadeAlertas e porProduto.

## Regras de negócio

- estoqueFinal = estoqueInicial + quantidadeProduzida
- custoUnitarioAjustado: tipo 1 = custo base; tipo 2 = base + 10%; tipo 3 = base + 20%
- custoTotal = quantidadeProduzida * custoUnitarioAjustado
- alertaEstoque: estoqueFinal maior que 5000 = ALTO; menor que 500 = CRITICO; senão NORMAL

## Exemplo de requisição

```
curl -X POST http://localhost:3000/ordens -H "Content-Type: application/json" -d "{\"codigoOrdem\":\"OP123\",\"codigoProduto\":\"P1\",\"tipoProduto\":2,\"quantidadeProduzida\":1000,\"custoUnitarioBase\":20,\"estoqueInicial\":300}"
```
