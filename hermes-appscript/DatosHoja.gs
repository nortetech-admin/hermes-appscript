function escribirJSONEnHoja(sheetDestino, data, cambio, pedimentoNumber) {
  const tipoOperacion = data["2"];
  const clavePedimento = data["3"];
  const regimen = data["4"];
  const destino = data["5"];
  //const cambio = data["6"];
  const peso = data["7"];
  const aduana = data["8"];
  const medioTransporte = data["9"];
  const arribo = data["10"];
  const salida = data["11"];
  const valorDolares = data["12"];
  const valorAduana = data["13"];
  const valorComercial = data["14"];
  const rfc = data["15"];
  const curp = data["16"];
  const nombre = data["17"];
  const domicilio = data["18"];



  if (!sheetDestino) {
    Logger.log("❌ No se encontró la hoja 'Modelo de Pedimento'");
    return;
  }

  // ✍️ Puedes asignar libremente cada valor a la celda que tú quieras
  //sheetDestino.getRange("B3").setValue(pedimentoNumber);
  sheetDestino.getRange("D3").setValue(tipoOperacion);
  sheetDestino.getRange("F3").setValue(clavePedimento);
  sheetDestino.getRange("H3").setValue(regimen);
  sheetDestino.getRange("B4").setValue(destino);
  sheetDestino.getRange("D4").setValue(cambio);
  sheetDestino.getRange("F4").setValue(peso);
  sheetDestino.getRange("H4").setValue(aduana);
  sheetDestino.getRange("A7").setValue(medioTransporte);
  sheetDestino.getRange("B7").setValue(arribo);
  sheetDestino.getRange("C7").setValue(salida);
  sheetDestino.getRange("E5").setValue(valorDolares);
  sheetDestino.getRange("E6").setValue(valorAduana);
  sheetDestino.getRange("E7").setValue(valorComercial);
  sheetDestino.getRange("B10").setValue(rfc);
  sheetDestino.getRange("B11").setValue(nombre);
  sheetDestino.getRange("B12").setValue(curp);
  sheetDestino.getRange("B13").setValue(domicilio);
}
