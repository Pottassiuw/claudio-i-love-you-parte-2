const express = require('express');

const app = express();
app.use(express.json());

let ordens = [];

const NOMES_TIPO = { 1: 'padrao', 2: 'premium', 3: 'sobEncomenda' };

function tipoValido(tipoProduto) {
  const tiposValidos = [1, 2, 3];
  for (let i = 0; i < tiposValidos.length; i++) {
    switch (tiposValidos[i]) {
      case 1:
      case 2:
      case 3:
        if (tipoProduto === tiposValidos[i]) return true;
        break;
      default:
        break;
    }
  }
  return false;
}

function calcularCustoUnitarioAjustado(tipoProduto, custoUnitarioBase) {
  switch (tipoProduto) {
    case 1:
      return custoUnitarioBase;
    case 2:
      return custoUnitarioBase * 1.1;
    case 3:
      return custoUnitarioBase * 1.2;
    default:
      return custoUnitarioBase;
  }
}

function calcularAlertaEstoque(estoqueFinal) {
  if (estoqueFinal > 5000) return 'ALTO';
  if (estoqueFinal < 500) return 'CRITICO';
  return 'NORMAL';
}

function arredondar2(valor) {
  return parseFloat(valor.toFixed(2));
}

function aplicarRegrasDeNegocio(ordem) {
  ordem.estoqueFinal = ordem.estoqueInicial + ordem.quantidadeProduzida;
  ordem.custoUnitarioAjustado = arredondar2(
    calcularCustoUnitarioAjustado(ordem.tipoProduto, ordem.custoUnitarioBase)
  );
  ordem.custoTotal = arredondar2(ordem.quantidadeProduzida * ordem.custoUnitarioAjustado);
  ordem.alertaEstoque = calcularAlertaEstoque(ordem.estoqueFinal);
  return ordem;
}

function validarCampos(dados) {
  const erros = [];
  const obrigatorios = [
    'codigoOrdem',
    'codigoProduto',
    'tipoProduto',
    'quantidadeProduzida',
    'custoUnitarioBase',
    'estoqueInicial',
  ];

  for (const campo of obrigatorios) {
    if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
      erros.push(`Campo obrigatorio ausente: ${campo}`);
    }
  }
  if (erros.length > 0) return erros;

  if (!tipoValido(Number(dados.tipoProduto))) {
    erros.push('tipoProduto deve ser 1 (Padrao), 2 (Premium) ou 3 (Sob encomenda)');
  }

  for (const campo of ['quantidadeProduzida', 'custoUnitarioBase', 'estoqueInicial']) {
    if (Number.isNaN(Number(dados[campo]))) {
      erros.push(`${campo} deve ser um numero`);
    }
  }

  return erros;
}

app.post('/ordens', (req, res) => {
  const dados = req.body;

  const erros = validarCampos(dados);
  if (erros.length > 0) {
    return res.status(400).json({ erro: 'Dados invalidos', detalhes: erros });
  }

  const jaExiste = ordens.some((o) => String(o.codigoOrdem) === String(dados.codigoOrdem));
  if (jaExiste) {
    return res.status(400).json({ erro: `codigoOrdem '${dados.codigoOrdem}' ja existe` });
  }

  const ordem = {
    codigoOrdem: dados.codigoOrdem,
    codigoProduto: dados.codigoProduto,
    tipoProduto: Number(dados.tipoProduto),
    quantidadeProduzida: Number(dados.quantidadeProduzida),
    custoUnitarioBase: Number(dados.custoUnitarioBase),
    estoqueInicial: Number(dados.estoqueInicial),
  };

  aplicarRegrasDeNegocio(ordem);
  ordens.push(ordem);

  return res.status(201).json(ordem);
});

app.get('/ordens', (req, res) => {
  let resultado = ordens;

  if (req.query.tipo !== undefined) {
    resultado = resultado.filter((o) => o.tipoProduto === Number(req.query.tipo));
  }

  if (req.query.alerta !== undefined) {
    const alerta = String(req.query.alerta).toUpperCase();
    resultado = resultado.filter((o) => o.alertaEstoque === alerta);
  }

  return res.json(resultado);
});

app.get('/ordens/:codigoOrdem', (req, res) => {
  const ordem = ordens.find((o) => String(o.codigoOrdem) === String(req.params.codigoOrdem));

  if (!ordem) {
    return res.status(404).json({ erro: `Ordem '${req.params.codigoOrdem}' nao encontrada` });
  }

  return res.json(ordem);
});

app.put('/ordens/:codigoOrdem', (req, res) => {
  const indice = ordens.findIndex((o) => String(o.codigoOrdem) === String(req.params.codigoOrdem));

  if (indice === -1) {
    return res.status(404).json({ erro: `Ordem '${req.params.codigoOrdem}' nao encontrada` });
  }

  const atual = ordens[indice];
  const dados = req.body;

  const atualizada = {
    codigoOrdem: atual.codigoOrdem,
    codigoProduto: dados.codigoProduto ?? atual.codigoProduto,
    tipoProduto: dados.tipoProduto ?? atual.tipoProduto,
    quantidadeProduzida: dados.quantidadeProduzida ?? atual.quantidadeProduzida,
    custoUnitarioBase: dados.custoUnitarioBase ?? atual.custoUnitarioBase,
    estoqueInicial: dados.estoqueInicial ?? atual.estoqueInicial,
  };

  const erros = validarCampos(atualizada);
  if (erros.length > 0) {
    return res.status(400).json({ erro: 'Dados invalidos', detalhes: erros });
  }

  atualizada.tipoProduto = Number(atualizada.tipoProduto);
  atualizada.quantidadeProduzida = Number(atualizada.quantidadeProduzida);
  atualizada.custoUnitarioBase = Number(atualizada.custoUnitarioBase);
  atualizada.estoqueInicial = Number(atualizada.estoqueInicial);

  aplicarRegrasDeNegocio(atualizada);
  ordens[indice] = atualizada;

  return res.json(atualizada);
});

app.delete('/ordens/:codigoOrdem', (req, res) => {
  const indice = ordens.findIndex((o) => String(o.codigoOrdem) === String(req.params.codigoOrdem));

  if (indice === -1) {
    return res.status(404).json({ erro: `Ordem '${req.params.codigoOrdem}' nao encontrada` });
  }

  const removida = ordens.splice(indice, 1)[0];
  return res.json({
    mensagem: `Ordem '${removida.codigoOrdem}' removida com sucesso`,
    ordemRemovida: removida,
  });
});

app.get('/relatorios/ordens', (req, res) => {
  if (ordens.length === 0) {
    return res.json({
      totalOrdens: 0,
      estoquePorTipo: { padrao: 0, premium: 0, sobEncomenda: 0 },
      mediaCustoTotalPorOrdem: 0,
      ordemMaisCara: null,
      ordemMaisBarata: null,
      quantidadeAlertas: { alto: 0, critico: 0, normal: 0 },
      porProduto: {},
    });
  }

  const estoquePorTipo = { padrao: 0, premium: 0, sobEncomenda: 0 };
  for (const ordem of ordens) {
    estoquePorTipo[NOMES_TIPO[ordem.tipoProduto]] += ordem.estoqueFinal;
  }

  const somaCustos = ordens.reduce((soma, o) => soma + o.custoTotal, 0);
  const mediaCustoTotalPorOrdem = arredondar2(somaCustos / ordens.length);

  let maisCara = ordens[0];
  let maisBarata = ordens[0];
  for (const ordem of ordens) {
    if (ordem.custoTotal > maisCara.custoTotal) maisCara = ordem;
    if (ordem.custoTotal < maisBarata.custoTotal) maisBarata = ordem;
  }

  const quantidadeAlertas = { alto: 0, critico: 0, normal: 0 };
  for (const ordem of ordens) {
    if (ordem.alertaEstoque === 'ALTO') quantidadeAlertas.alto++;
    else if (ordem.alertaEstoque === 'CRITICO') quantidadeAlertas.critico++;
    else quantidadeAlertas.normal++;
  }

  const porProduto = {};
  for (const ordem of ordens) {
    const chave = String(ordem.codigoProduto);
    if (!porProduto[chave]) {
      porProduto[chave] = { estoqueFinalConsolidado: 0, valorTotalInvestido: 0 };
    }
    porProduto[chave].estoqueFinalConsolidado += ordem.estoqueFinal;
    porProduto[chave].valorTotalInvestido = arredondar2(
      porProduto[chave].valorTotalInvestido + ordem.custoTotal
    );
  }

  return res.json({
    totalOrdens: ordens.length,
    estoquePorTipo,
    mediaCustoTotalPorOrdem,
    ordemMaisCara: { codigoOrdem: maisCara.codigoOrdem, custoTotal: maisCara.custoTotal },
    ordemMaisBarata: { codigoOrdem: maisBarata.codigoOrdem, custoTotal: maisBarata.custoTotal },
    quantidadeAlertas,
    porProduto,
  });
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`API de Controle de Producao rodando na porta ${PORTA}`);
});
