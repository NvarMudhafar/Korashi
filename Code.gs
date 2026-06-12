/**
 * KORASHI — order receiver
 * Paste this into Extensions → Apps Script of your orders Google Sheet,
 * then deploy as a Web App (execute as: Me, access: Anyone).
 * Full setup steps are in the site README.
 */

// Optional: get an email for every order. Leave "" to disable.
const NOTIFY_EMAIL = "korashimatcha@gmail.com";

const SHEET_NAME = "Orders";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Received", "Order ID", "Name", "Phone", "City", "Address",
        "Notes", "Items", "Subtotal (IQD)", "Delivery (IQD)", "Total (IQD)", "Status",
      ]);
      sheet.setFrozenRows(1);
      sheet.getRange("1:1").setFontWeight("bold");
    }

    const items = (data.items || [])
      .map(function (i) { return i.qty + "x " + i.name + " (" + i.price + ")"; })
      .join("\n");

    sheet.appendRow([
      new Date(),
      data.orderId || "",
      data.name || "",
      "'" + (data.phone || ""), // apostrophe keeps the leading 0
      data.city || "",
      data.address || "",
      data.notes || "",
      items,
      data.subtotal || "",
      data.shipping || "",
      data.total || 0,
      "NEW",
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        "🍵 Korashi order " + data.orderId + " — " + data.total + " IQD",
        "From: " + data.name + " (" + data.phone + ")\n" +
        "City: " + data.city + "\nAddress: " + data.address + "\n\n" +
        items + "\n\nSubtotal: " + data.subtotal + " IQD\nDelivery: " + data.shipping +
        " IQD\nTotal: " + data.total + " IQD (cash on delivery)" +
        (data.notes ? "\n\nNotes: " + data.notes : "")
      );
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, orderId: data.orderId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows a friendly check.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "korashi-orders" }))
    .setMimeType(ContentService.MimeType.JSON);
}
