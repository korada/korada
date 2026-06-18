/**
 * Sravya's Seemantham RSVP — Google Apps Script Backend
 *
 * ── SETUP INSTRUCTIONS ──────────────────────────────────────────────────────
 *
 *  1. Create a new Google Sheet:
 *     → sheets.google.com → Blank spreadsheet
 *     → Name it "Sravya Seemantham RSVPs"
 *     → Copy the Spreadsheet ID from the URL:
 *         https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
 *
 *  2. Open Google Apps Script:
 *     → From the sheet: Extensions → Apps Script
 *     → OR go to script.google.com → New Project
 *
 *  3. Paste this entire file into the editor (Code.gs)
 *
 *  4. Set your Spreadsheet ID on the line below:
 */
var SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';   // ← paste your Sheet ID
var SHEET_NAME     = 'RSVPs';                         // tab name (auto-created)
var NOTIFY_EMAIL   = 'venkata@korada.in';             // email for new RSVP alerts

/**
 * ── DEPLOY STEPS ────────────────────────────────────────────────────────────
 *
 *  5. Click Deploy → New Deployment
 *  6. Click the gear ⚙️ next to "Select type" → Web App
 *  7. Settings:
 *       Description:  Seemantham RSVP
 *       Execute as:   Me
 *       Who has access: Anyone
 *  8. Click Deploy → Authorize → Copy the Web App URL
 *
 *  9. Open docs/SravyaBabyShower/index.html in the repo
 *     and replace the placeholder:
 *       var GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
 *     with the URL you just copied.
 *
 * 10. Commit and push — done! 🎉
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── doPost: receives RSVP submissions from the web page ────────────────────
function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var data  = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      data.name     || '',
      data.email    || '',
      data.phone    || '',
      data.adults   || '1',
      data.children || '0',
      data.dietary  || 'Vegetarian',
      data.message  || '',
    ]);

    // Optional: send email notification for each new RSVP
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to:      NOTIFY_EMAIL,
        subject: '🌸 New RSVP from ' + (data.name || 'guest'),
        body:    formatEmailBody(data),
      });
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ── doGet: health-check so you can verify the URL works ───────────────────
function doGet(e) {
  return jsonResponse({ status: 'RSVP endpoint is active 🌸' });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getOrCreateSheet() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Header row
    sheet.appendRow([
      'Timestamp', 'Name', 'Email', 'Phone',
      'Adults', 'Children', 'Dietary', 'Wishes',
    ]);
    // Style header
    var header = sheet.getRange(1, 1, 1, 8);
    header.setFontWeight('bold');
    header.setBackground('#1B4332');
    header.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 8, 160);
  }

  return sheet;
}

function formatEmailBody(data) {
  return [
    'New RSVP for Sravya\'s Seemantham!',
    '',
    'Name:     ' + (data.name    || '—'),
    'Email:    ' + (data.email   || '—'),
    'Phone:    ' + (data.phone   || '—'),
    'Adults:   ' + (data.adults  || '1'),
    'Children: ' + (data.children|| '0'),
    'Dietary:  ' + (data.dietary || '—'),
    'Wishes:   ' + (data.message || '—'),
    '',
    'Submitted: ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  ].join('\n');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
