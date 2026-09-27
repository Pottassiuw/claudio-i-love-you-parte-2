# Atividade Avaliativa Individual 02 — API REST: Controle de Produção

API REST em Node.js + Express para gerenciar ordens de produção de uma indústria de peças automotivas, com controle de estoque e relatórios consolidados. Armazenamento em memória (array).

## Como rodar

```bash
npm install
npm start
```

Servidor sobe em `http://localhost:3000`.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/ordens` | Cadastra uma ordem (valida campos, duplicidade e tipoProduto 1–3). Retorna 201 com todos os campos calculados. |
| GET | `/ordens` | Lista todas as ordens. Filtros opcionais: `?tipo=2`, `?alerta=ALTO`. |
| GET | `/ordens/:codigoOrdem` | Retorna uma ordem específica. 404 se não existir. |
| PUT | `/ordens/:codigoOrdem` | Atualiza campos permitidos e recalcula tudo. 404 se não existir. |
| DELETE | `/ordens/:codigoOrdem` | Remove a ordem. Relatórios deixam de considerá-la. |
| GET | `/relatorios/ordens` | Relatório consolidado (total, estoque por tipo, média de custo, ordem mais cara/barata, alertas e consolidação por produto). |

## Regras de negócio

- `estoqueFinal = estoqueInicial + quantidadeProduzida`
- `custoUnitarioAjustado`: tipo 1 = base · tipo 2 = +10% · tipo 3 = +20%
- `custoTotal = quantidadeProduzida * custoUnitarioAjustado`
- `alertaEstoque`: `> 5000` → ALTO · `< 500` → CRITICO · senão NORMAL

## Exemplo de requisição

```bash
curl -X POST http://localhost:3000/ordens \
  -H "Content-Type: application/json" \
  -d '{"codigoOrdem":"OP123","codigoProduto":"P1","tipoProduto":2,"quantidadeProduzida":1000,"custoUnitarioBase":20,"estoqueInicial":300}'
```
