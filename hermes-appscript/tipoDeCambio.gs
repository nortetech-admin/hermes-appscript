function guardarTipoCambioDolarEnSpreadsheet() {
  const url = 'https://www.dof.gob.mx/';
  const response = UrlFetchApp.fetch(url);
  const html = response.getContentText();
  var tipoCambio;
  // Buscar el valor después de "DOLAR"
  const regex = /<span class="tituloBloque4">DOLAR<\/span>\s*<br\s*\/>\s*([\d.,]+)/i;
  const match = html.match(regex);

  if (match && match[1]) {
    tipoCambio = parseFloat(match[1].replace(',', ''));
    const fechaHoy = new Date();

    const spreadsheetId = '1zGiq5PhX60X5N6fDrqZJ2QfJxEFA8BjpZSJuPJ8Kt0s';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Tipos de cambio');

    // Escribir la fecha y el tipo de cambio en la siguiente fila disponible
    sheet.appendRow([fechaHoy, tipoCambio]);

    // Dar formato a la columna B como moneda MXN
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('"$"#,##0.0000');

    Logger.log(`✅ Tipo de cambio DÓLAR guardado: ${fechaHoy.toLocaleDateString()} - $${tipoCambio}`);
    return tipoCambio;
  } else {
    Logger.log("❌ No se encontró el tipo de cambio con el nuevo formato.");
    return null;
  }
  return tipoCambio
}

