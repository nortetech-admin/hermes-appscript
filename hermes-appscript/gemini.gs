function enviarPDFsAGeminiDesdeCarpeta(folderId, cambio, pedimentoNumber) {
  const urlAPI = "https://2ebb-189-236-32-19.ngrok-free.app/procesar"; // ← Cambia cada vez que abras ngrok

  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();

  const formData = {};
  let index = 0;

  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() === MimeType.PDF) {
      const blob = file.getBlob();
      formData[`file${index}`] = blob;
      index++;
    }
  }


  // ✅ Agregamos el tipo de cambio al formulario
  formData["cambio"] = cambio;

  const options = {
    method: "post",
    payload: formData,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(urlAPI, options);
    const content = response.getContentText();

    try {
      const json = JSON.parse(content);

      Logger.log("📋 Archivos recibidos:");
      if (json.archivos_recibidos) {
        json.archivos_recibidos.forEach(file => {
          Logger.log("📄 " + file.nombre + " (" + file.tipo + ")");
        });
      }

      Logger.log("📦 Resultado JSON:");
      Logger.log(json.resultado);

      // Intenta interpretar el JSON (por si viene como string markdown)
      let parsedData;
      try {
        if (typeof json.resultado === "string") {
          let limpio = json.resultado
            .replace(/```json/i, "")
            .replace(/```/g, "")
            .trim();
          parsedData = JSON.parse(limpio);
        } else {
          parsedData = json.resultado;
        }
      } catch (err) {
        Logger.log("⚠ Error al parsear resultado JSON:");
        Logger.log(err.toString());
        return;
      }

      // 📝 Escribir en la hoja "Formato Pedimento"
      const hoja = SpreadsheetApp
        .openById("1zGiq5PhX60X5N6fDrqZJ2QfJxEFA8BjpZSJuPJ8Kt0s")
        .getSheetByName("Formato Pedimento");

      escribirJSONEnHoja(hoja, parsedData, cambio, pedimentoNumber);

    } catch (parseError) {
      Logger.log("❌ No se pudo interpretar la respuesta como JSON:");
      Logger.log(content);
    }

  } catch (e) {
    Logger.log("❌ Error al conectar con el servidor:");
    Logger.log(e.toString());
  }
}



