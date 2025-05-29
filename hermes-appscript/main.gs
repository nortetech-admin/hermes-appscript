const controlPedimentos = SpreadsheetApp.openById("1zGiq5PhX60X5N6fDrqZJ2QfJxEFA8BjpZSJuPJ8Kt0s");
const ssDatosBilly = controlPedimentos.getSheetByName("Datos Billy");
const ssControl = controlPedimentos.getSheetByName("Control");
const thread = GmailApp.getInboxThreads(0, 1)[0];  // Get first thread in inbox
const message = thread.getMessages()[0];           // Get first message


var threads = GmailApp.search('subject:"Daily Report"-Details')
var msgs = GmailApp.getMessagesForThreads(threads);



function generatePedimentoNumber() {
  if (!ssDatosBilly) {
    console.log("⚠ The sheet 'Datos Billy' was not found.");
    return;
  }
  if (!ssControl) {
    console.log("⚠ The sheet 'Control' was not found.");
    return;
  }

  var year = new Date().getFullYear();
  var lastTwoDigitsYear = year.toString().slice(-2);
  var lastDigitYear = year.toString().slice(-1);

  var customsCode = ssDatosBilly.getRange("B1").getValue() || "99";
  var customsPatent = ssDatosBilly.getRange("B2").getValue() || "9999";

  var pedimentoCount = ssControl.getRange("I2").getValue();
  pedimentoCount = (pedimentoCount ?? 0) === 0 ? 1 : pedimentoCount;

  var identifierNumber = pedimentoCount.toString().padStart(6, "0");

  var pedimentoNumber = `${lastTwoDigitsYear}${customsCode}${customsPatent}${lastDigitYear}${identifierNumber}`;

  console.log("✅ Generated Pedimento Number: " + pedimentoNumber);

  ssControl.getRange("I2").setValue(pedimentoCount + 1);

  return pedimentoNumber;
}




function saveAttachmentsToDrive() {
  if (!ssControl) {
    console.log("❌ Sheet 'Control' not found");
    return;
  }
  const cambio = guardarTipoCambioDolarEnSpreadsheet();
  const dataControl = ssControl.getRange(1, 1, ssControl.getLastRow(), 4).getValues();
  const threads = GmailApp.search('is:unread in:inbox subject:"Pedimento"');

  console.log("📩 Emails found: " + threads.length);

  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();

    for (let j = messages.length - 1; j >= 0; j--) {
      const message = messages[j];
      const fullSender = message.getFrom();

      let senderName = fullSender;
      let senderEmail = "";

      const match = fullSender.match(/(.*)<(.+)>/);
      if (match) {
        senderName = match[1].trim();
        senderEmail = match[2].trim();
      }

      console.log("📤 Sender name: " + senderName);
      console.log("✉ Sender email: " + senderEmail);

      const matchedClient = dataControl.find(row => row[1] === senderEmail);

      if (!matchedClient) {
        console.log("⚠ No client found for email: " + senderEmail);
        continue;
      }

      const clientName = matchedClient[0];
      const clientFolderId = matchedClient[2];

      const clientFolder = DriveApp.getFolderById(clientFolderId);
      if (!clientFolder) {
        console.log("❌ Client folder not found: " + clientName);
        continue;
      }

      const attachments = message.getAttachments();
      const emailDate = message.getDate();
      const month = emailDate.getMonth() + 1;
      const year = emailDate.getFullYear();

      const monthFolder = getDestinationFolder(clientFolderId, year, month);

      const pedimentoNumber = generatePedimentoNumber();
      const pedimentoFolder = monthFolder.createFolder(pedimentoNumber);

      for (let k = 0; k < attachments.length; k++) {
        const file = attachments[k];
        const savedFile = pedimentoFolder.createFile(file);
        console.log("📄 Saved to pedimento " + pedimentoNumber + ": " + savedFile.getName());
      }

      // 🏷️ Apply label and mark as read (on the thread, not the message)
      const thread = message.getThread();
      const label = getOrCreateLabel(clientName);
      thread.addLabel(label);
      thread.markRead();
      thread.moveToArchive();

      console.log("✅ Email labeled as '" + clientName + "' and marked as read.");
      enviarPDFsAGeminiDesdeCarpeta(pedimentoFolder.getId(), cambio, pedimentoNumber);
    }
  }
}



function getDestinationFolder(clientFolderId, year, month) {
  const monthNames = [
    "1. Enero", "2. Febrero", "3. Marzo", "4. Abril",
    "5. Mayo", "6. Junio", "7. Julio", "8. Agosto",
    "9. Septiembre", "10. Octubre", "11. Noviembre", "12. Diciembre"
  ];

  const clientFolder = DriveApp.getFolderById(clientFolderId);
  const yearFolders = clientFolder.getFoldersByName(year.toString());
  const yearFolder = yearFolders.hasNext() ? yearFolders.next() : clientFolder.createFolder(year.toString());

  const monthName = monthNames[month - 1];
  const monthFolders = yearFolder.getFoldersByName(monthName);
  const monthFolder = monthFolders.hasNext() ? monthFolders.next() : yearFolder.createFolder(monthName);

  return monthFolder;
}

function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
    console.log("🏷️ Label created: " + labelName);
  }
  return label;
}



function carpetasClientes() {
  const dataControl = ssControl.getRange(1, 1, ssControl.getLastRow(), 4).getValues();

  const carpetaRaiz = DriveApp.getFolderById("1UnuzQUwUcX49A_-a1BXRhAlNxMvRkyDK"); // Carpeta raíz para clientes
  const anoActual = new Date().getFullYear();

  const meses = [
    "1. Enero", "2. Febrero", "3. Marzo", "4. Abril",
    "5. Mayo", "6. Junio", "7. Julio", "8. Agosto",
    "9. Septiembre", "10. Octubre", "11. Noviembre", "12. Diciembre"
  ];

  for (let i = 0; i < dataControl.length; i++) {
    const nombreCliente = dataControl[i][0];
    const correoCliente = dataControl[i][1];
    const idCarpetaExistente = dataControl[i][2];

    if (!idCarpetaExistente) {
      // Crear carpeta principal del cliente con número de iteración
      const nombreCarpetaCliente = `${i}. ${nombreCliente}`;
      const carpetaCliente = carpetaRaiz.createFolder(nombreCarpetaCliente);
      const idClienteFolder = carpetaCliente.getId();

      // Crear subcarpeta del año actual
      const carpetaAno = carpetaCliente.createFolder(anoActual.toString());

      // Crear subcarpetas de los 12 meses con nombres adecuados
      for (let mes = 0; mes < 12; mes++) {
        carpetaAno.createFolder(meses[mes]);
      }

      // Registrar ID de carpeta en la hoja
      ssControl.getRange(i + 1, 3).setValue(idClienteFolder); // Columna C

      console.log(`📁 Carpeta creada para ${nombreCliente} con ID: ${idClienteFolder}`);
    } else {
      console.log(`✅ ${nombreCliente} ya tiene carpeta asignada.`);
    }
  }

  console.log("✅ Proceso completado.");
}







