//** Funções de uso de objetos como conjuntos de Strings **
// As chaves são as strings "normalizadas" (em minusculas), os elementos são as strings originais

// Converte um vetor em conjunto
var arrayToWordSet = function (a) {
  var n = a.length;
  var s = {};
  for (i = 0; i < n; i++) {
    s[a[i].toLowerCase()] = a[i];
  }
  return s;
};

// Retorna o tamanho de um conjunto
var setLength = function (s) {
  return Object.keys(s).length;
};

// Diferença de conjuntos
var diff = function (s1, s2) {
  var s = {};
  for (var k in s1) {
    if (!s2.hasOwnProperty(k)) {
      s[k] = s1[k];
    }
  }
  return s;
};

// União de conjuntos: s1 é modificado para incluir todos os elementos de s2
var union = function (s1, s2) {
  for (var k in s2) {
    s1[k] = s2[k];
  }
};

var isUpperCase = function (c) {
  return c == c.toUpperCase();
};

// Ordena o conjunto de modo especial: ordem alfabética, mas minúsculas antes de maiúsculas
var wordSetToSortedArrayUppercaseLast = function (s) {
  var ks = Object.keys(s);
  var n = ks.length;
  var ar = new Array(n);
  for (var i = 0; i < n; i++) {
    ar[i] = s[ks[i]];
  }
  ar.sort(function (a, b) {
    if (a.length === 0 || b.length === 0) {
      return a.localeCompare(b);
    } else {
      if (!isUpperCase(a[0])) {
        if (isUpperCase(b[0])) {
          return -1;
        } else {
          return a.localeCompare(b);
        }
      } else {
        if (!isUpperCase(b[0])) {
          return 1;
        } else {
          return a.localeCompare(b);
        }
      }
    }
  });
  return ar;
};

// Conversão para String (para exportação em arquivo texto)
var wordSetToString = function (s) {
  res = "";
  for (var k in s) {
    res += s[k] + "\r\n";
  }
  return res;
};

// ** Fim das funções de conjuntos **

// Downloadify necessita disto
var loadDownloadify = function (id, nomeArq, isDic) {
  Downloadify.create(id, {
    filename: function () {
      return nomeArq;
    },
    data: function () {
      var s = isDic ? dic : neo;
      return wordSetToString(s);
    },
    onComplete: function () {
      alert('Arquivo exportado em formato UTF-8.');
    },
    onCancel: function () {
      //alert('You have cancelled the saving of this file.');
    },
    onError: function () {
      alert('Erro na exportação do arquivo.');
    },
    swf: 'media/downloadify.swf',
    downloadImage: 'images/exportar.png',
    width: 76,
    height: 18,
    transparent: false,
    append: false
  });
};

var dic = {}; // Dicionário global

var neo = {}; // Neologismos

var clearStdout = function () {
  $('#stdout').text("");
};

var output = function (msg) {
  $('#stdout').append(msg + '\n');
};

var rePontuacao = /[.,;:!?()"']/g;
var reOutrosAscii = /[#$%*+\/<=>@\\_\[\]]/g;
var reHifen = /\s+-+\s+/g;
// esta regexp contém caracteres unicode "estranhos" encontrados em alguns textos
var reOutrosUnicode = /•/g;

// Um arquivo dicionário valido só contém letras, hífens e newlines.
// Ele não pode conter números nem espaços.
var reDicionarioInvalido = XRegExp("[^-\\p{Latin}\r\n]");

var atualizarTamanhoDicionario = function () {
  $('#dicSize').text(setLength(dic));
};

var adicionarDicionarioALista = function (nome) {
  $('#listDic').append($('<li>').append(nome));
};

var normalizarPalavrasDicionario = function(palavras) {
  var palavrasNormalizadas = new Array();
  
  // remove tremas
  var n = palavras.length;
  for (i=0; i<n; i++) {
    palavrasNormalizadas.push(palavras[i].replace(/ü/g, "u").replace(/Ü/g, "U"));
  }
  return palavrasNormalizadas;
}

// Lê o arquivo arq_dic e adiciona suas palavras às palavras presentes em dic.
var lerDicionario = function () {
  var inputDic = $('#fileDic')[0];
  var arqDic = inputDic.value;

  output("Processando dicionário: " + arqDic);
  var dicReader = new FileReader();
  dicReader.onload = function () {
    output(horaSimples(new Date()) + " - dicionário carregado.");
    textoDicionario = dicReader.result;
    var caracteresInvalidos = XRegExp.exec(textoDicionario, reDicionarioInvalido);
    if (caracteresInvalidos !== null) {
      console.log("caracteresInvalidos = ");
      console.log(caracteresInvalidos);
      output("Aviso: dicionário contém caractere(s) inválido(s): '" + caracteresInvalidos[0] + "' (ASCII " + caracteresInvalidos[0].charCodeAt(0) + ")");
    }
    var palavrasDicionario = textoDicionario.replace(/\r\n/gi, "\n").split("\n");
    palavrasDicionarioNormalizadas = normalizarPalavrasDicionario(palavrasDicionario);
    var n = palavrasDicionarioNormalizadas.length;
    var newDic = arrayToWordSet(palavrasDicionarioNormalizadas);
    output(setLength(newDic) + " palavras lidas do dicionário.");
    var qtePalavrasAdicionadas;
    if (jQuery.isEmptyObject(dic)) {
      dic = newDic;
      qtePalavrasAdicionadas = setLength(newDic);
    } else {
      output("Efetuando união do novo dicionário e do existente...");
      var diffDic = diff(newDic, dic);
      output(setLength(diffDic) + " palavras novas a adicionar.");
      union(dic, newDic);
      qtePalavrasAdicionadas = setLength(diffDic);
    }
    output("Dicionário atualizado (" + qtePalavrasAdicionadas + " palavras adicionadas).");

    // Atualização da interface
    adicionarDicionarioALista(arqDic + " (" + qtePalavrasAdicionadas + " palavras adicionadas)");
    atualizarTamanhoDicionario();
  };
  var encoding = $('input[type=radio][name=encodingDic]:checked')[0].value;
  if (encoding == "autodetect") {
    var encodingReader = new FileReader();
    encodingReader.onload = function () {
      output(horaSimples(new Date()) + " - dicionário carregado para detectar codificação.");
      var chardet = jschardet.detect(encodingReader.result);
      var cod = chardet.encoding;
      output("codificação: " + cod + " (confiança: " + chardet.confidence + ")");
      console.log("codificação: " + cod + " (confiança: " + chardet.confidence + ")");
      var detectedEncoding = "unknown";
      if (cod == "utf-8") {
	output("UTF-8 detectado");
	detectedEncoding = "UTF-8";
      } else if (cod == "windows-1252" || cod == "windows-1251" || cod.indexOf("ISO-8859") === 0) {
	output("ISO-8859 detectado");
	detectedEncoding = "ISO-8859-1";
      }
      if (detectedEncoding == "unknown") {
	output(horaSimples(new Date()) + "ERRO: codificação não detectada: " + cod);
	return;
      } else {
	output(horaSimples(new Date()) + " - carregando dicionário...");
	dicReader.readAsText(inputDic.files[0], detectedEncoding);
      }
    };
    output(horaSimples(new Date()) + " - carregando dicionário para detectar codificação...");
    encodingReader.readAsBinaryString(inputDic.files[0]);
  } else {
    output(horaSimples(new Date()) + " - carregando dicionário...");
    dicReader.readAsText(inputDic.files[0], encoding);
  }
};

var unknownCharRe = XRegExp("[^-\\p{Latin}\\d\\s]");

// Cria um indice invertido [palavra -> lista de posições no texto],
// onde "posição" é o numero da palavra no texto (0, 1, ...)
var calcularPosicoesPorPalavra = function (listaPalavras) {
  var n = listaPalavras.length;
  var posicoes = {};
  for (var i = 0; i < n; i++) {
    var palavra = listaPalavras[i];
    if (posicoes.hasOwnProperty(palavra)) {
      posicoes[palavra].push(i);
    } else {
      posicoes[palavra] = [i];
    }
  }
  return posicoes;
};

// Calcula o "contexto" (lista de palavras adjacentes) a uma palavra.
// [posicoes] é uma associação [palavra -> list int], construida com
// calcularPosicoesPorPalavra.
// [dist] é a distância máxima em palavras para o contexto, em cada
// lado da palavra. Exemplo: dist = 0 -> contexto vazio, dist = 1 ->
// contexto composto da palavra anterior E da palavra posterior à
// palavra em questão. Palavras no inicio e fim do texto podem ter
// um contexto menor que (2*dist) palavras.
// Retorna um contexto vazio se [palavra] não é encontrada em [posicoes].
var calcularContexto = function (posicoes, dist, palavra) {
  
};

// Retorna uma lista de palavras
var tokenizarTexto = function (texto) {
  // "des-unicodizacao" do texto: substituicao de caracteres Unicode "conhecidos"
  // por caracteres ASCII equivalentes (hifens, aspas)

  // hifens
  texto = texto.replace(/[\u2010\u2011]/g, "-");
  // aspas
  texto = texto.replace(/[\u2018\u2019]/g, "'");
  // aspas duplas
  texto = texto.replace(/[\u201c\u201d]/g, '"');

  // eliminacao da pontuacao (exceto hifen)
  texto = texto.replace(rePontuacao, " ");
  // eliminacao de hifens "solitarios"
  texto = texto.replace(reHifen, " ");
  // eliminacao de outros caracteres ASCII
  texto = texto.replace(reOutrosAscii, " ");
  // eliminacao de outros caracteres Unicode
  texto = texto.replace(reOutrosUnicode, " ");
  // eliminacao de numeros
  texto = texto.replace(/\d+/g, " ");
  // eliminacao de tremas
  texto = texto.replace(/ü/g, "u");
  texto = texto.replace(/Ü/g, "U");

  // Testa se ainda existe algum caractere "desconhecido"
  var unks = XRegExp.exec(texto, unknownCharRe);
  if (unks !== null) {
    console.log("unks = ");
    console.log(unks);
    output("Aviso: caractere(s) desconhecido(s) encontrado(s): " + unks[1]);
  }
  palavras = texto.split(/\s+/);
  return palavras;
};

var adicionarPalavra = function (palavra) {
  var k = palavra.toLowerCase();
  dic[k] = palavra;
  var textoPalavrasAdicionadas = $('#palavrasAdicionadas').text();
  $('#palavrasAdicionadas').text(textoPalavrasAdicionadas + " " + palavra);
  atualizarTamanhoDicionario();
  // Remoção da lista de palavras novas
  $('#resultados li#' + palavra).remove();
};

var ordenarPalavrasDesconhecidas = function (palavras) {
  return wordSetToSortedArrayUppercaseLast(palavras);
};

var adicionarNeologismo = function (palavra) {
  var k = palavra.toLowerCase();
  neo[k] = palavra;
  var novoItem = $('<li>').append($('<span>').text(palavra));
  novoItem.attr('id', palavra); // Para facilitar a identificação do item e sua remoção
  $('#neologismos').append(novoItem);
  // Remoção da lista de palavras novas
  $('#resultados li#' + palavra).remove();
};

var ignorarPalavra = function (palavra) {
  var textoPalavrasIgnoradas = $('#palavrasIgnoradas').text();
  $('#palavrasIgnoradas').text(textoPalavrasIgnoradas + " " + palavra);
  // Remoção da lista de palavras novas
  $('#resultados li#' + palavra).remove();
};

var exportarWordSet = function (titulo, s) {
  var res = "";
  for (var k in s) {
    res += s[k] + "\r\n";
  }
  location.href = "data:text;charset=utf-8," + encodeURI(res);
};

var exportarDicionario = function () {
  exportarWordSet("Dicionario", dic);
};

var exportarNeologismos = function () {
  exportarWordSet("Neologismos", neo);
};

var exibirPalavraDesconhecida = function (palavra) {
  var novoLinkAdicionarDic = $('<span>').addClass('linkLike').addClass('good').attr('onclick', 'adicionarPalavra("' + palavra + '")').text("Adicionar ao dicionário");
  var spanLinkAdicionarDic = $('<span>').append(novoLinkAdicionarDic);
  var novoLinkIgnorarDic = $('<span>').addClass('linkLike').addClass('warning').attr('onclick', 'ignorarPalavra("' + palavra + '")').text("Ignorar palavra");
  var spanLinkIgnorarDic = $('<span>').append(novoLinkIgnorarDic);
  var novoLinkAdicionarNeo = $('<span>').addClass('linkLike').addClass('neo').attr('onclick', 'adicionarNeologismo("' + palavra + '")').text("Neologismo");
  var novoItem = $('<li>').append($('<span>').text(palavra));
  novoItem.append(spanLinkAdicionarDic);
  novoItem.append(spanLinkIgnorarDic);
  novoItem.append(novoLinkAdicionarNeo);
  novoItem.attr('id', palavra); // Para facilitar a identificação do item e sua remoção
  $('#resultados').append(novoItem);
};

var horaSimples = function(date) {
  var hours = date.getHours();
  var mins = date.getMinutes();
  var secs = date.getSeconds();
  return (hours < 10 ? "0" : "") + hours + ":" + (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;
};

var lerTexto = function () {
  // Apaga a lista de palavras novas
  $('#resultados').empty();

  arqTexto = $('#fileTexto')[0].value;
  output("Processando texto: " + arqTexto);
  textoReader = new FileReader();
  textoReader.onload = function () {
    output(horaSimples(new Date()) + " - texto carregado.");
    var texto = textoReader.result;
    var textoPalavras = tokenizarTexto(texto);
    var palavras = arrayToWordSet(textoPalavras);
    output(textoPalavras.length + " palavras lidas (" + setLength(palavras) + " palavras unicas)");
    var palavrasDesconhecidas = diff(palavras, dic);
    output(setLength(palavrasDesconhecidas) + " palavra(s) desconhecida(s).");
    var listaPalavrasDesconhecidas = ordenarPalavrasDesconhecidas(palavrasDesconhecidas);
    for (var i in listaPalavrasDesconhecidas) {
      var palavra = listaPalavrasDesconhecidas[i];
      //output("Palavra nova: " + palavra);
      exibirPalavraDesconhecida(palavra);
    }
  };
  var encoding = $('input[type=radio][name=encodingTexto]:checked')[0].value;
  // Modificação da interface para informar que o tratamento está sendo realizado
  if (encoding == "autodetect") {
    var encodingReader = new FileReader();
    encodingReader.onload = function () {
      output(horaSimples(new Date()) + " - texto carregado para detectar codificação.");
      var chardet = jschardet.detect(encodingReader.result);
      var cod = chardet.encoding;
      output("codificação: " + cod + " (confiança: " + chardet.confidence + ")");
      console.log("codificação: " + cod + " (confiança: " + chardet.confidence + ")");
      var detectedEncoding = "unknown";
      if (cod == "utf-8") {
	output("UTF-8 detectado");
	detectedEncoding = "UTF-8";
      } else if (cod == "windows-1251" || cod == "windows-1252" || cod.indexOf("ISO-8859") === 0) {
	output("ISO-8859 detectado");
	detectedEncoding = "ISO-8859-1";
      }
      if (detectedEncoding == "unknown") {
	output(horaSimples(new Date()) + "ERRO: codificação não detectada: " + cod);
	return;
      } else {
	output(horaSimples(new Date()) + " - carregando texto...");
	textoReader.readAsText($('#fileTexto')[0].files[0], detectedEncoding);
      }
    };
    output(horaSimples(new Date()) + " - carregando dicionário para detectar codificação...");
    encodingReader.readAsBinaryString($('#fileTexto')[0].files[0]);
  } else {
    output(horaSimples(new Date()) + " - carregando texto...");
    textoReader.readAsText($('#fileTexto')[0].files[0], encoding);
  }
};