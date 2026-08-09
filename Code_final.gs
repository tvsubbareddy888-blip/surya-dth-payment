function doGet(e) {
  var params = e.parameter;
  if (params.action === "getdata") return getSheetData();
  if (params.action === "save") return saveToSheet(params);
  if (params.action === "updatestatus") return updateStatus(params);
  return ContentService.createTextOutput(JSON.stringify({"status":"ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveToSheet(params) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(),
      params.tech || "",
      params.customer || "",
      params.mobile || "",
      params.village || "",
      params.vccdsn || "",
      params.service || "",
      params.amount || "",
      "INITIATED",
      params.order_id || "",
      params.photo_url || ""
    ]);
    return ContentService.createTextOutput(JSON.stringify({"status":"saved"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({"error":err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateStatus(params) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][9] === params.order_id) {
        sheet.getRange(i+1, 9).setValue(params.status);
        return ContentService.createTextOutput(JSON.stringify({"status":"updated"}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({"status":"not_found"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({"error":err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var values = sheet.getDataRange().getValues();
    var data = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;
      data.push({
        "date": row[0].toString(),
        "tech": row[1],
        "customer": row[2],
        "mobile": row[3],
        "village": row[4],
        "vccdsn": row[5],
        "service": row[6],
        "amount": row[7],
        "status": row[8] || "INITIATED",
        "order_id": row[9] || "",
        "photo_url": row[10] || ""
      });
    }
    return ContentService.createTextOutput(JSON.stringify({"data":data}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({"error":err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testRun() {
  Logger.log("Test OK");
}
