/**
 * Sravya's Seemantham RSVP — Google Apps Script Backend
 *
 * Writes to your existing sheet "Seemantham - Sravya - rsvp".
 *
 * ── SETUP (do these IN ORDER) ───────────────────────────────────────────────
 *
 *  1. Go to script.google.com → New project.
 *
 *  2. Delete any starter code, paste THIS entire file, and Save (💾).
 *     (SHEET_ID below already points at your RSVP sheet — nothing to change.)
 *
 *  3. Deploy → New deployment → (gear ⚙️) Web app
 *       Execute as:      Me
 *       Who has access:  Anyone
 *     → Deploy → Authorize access → allow (it will ask for Sheets + Gmail
 *       permission because of SHEET_ID and the email alert) → Copy the URL.
 *       It MUST end in  /exec   (not /dev).
 *
 *  4. Paste that /exec URL into GAS_URL in BOTH files:
 *       • docs/SravyaBabyShower/index.html
 *       • client/components/BabyShower.jsx
 *     Then commit & push.
 *
 *  5. TEST it: open the /exec URL in your browser. You should see
 *       {"status":"RSVP endpoint is active 🌸"}
 *     Then submit the form once and confirm a row appears in the sheet.
 *
 *  ⚠️  IMPORTANT — the #1 reason changes "do nothing":
 *      Every time you EDIT this script you must redeploy a NEW VERSION:
 *        Deploy → Manage deployments → ✏️ edit → Version: "New version" → Deploy.
 *      The /exec URL stays the same, but the old code keeps running until you do.
 * ────────────────────────────────────────────────────────────────────────────
 */

// Your existing sheet: "Seemantham - Sravya - rsvp"
var SHEET_ID     = '1-Vl-0uW5WhZDwtNg_1l4OveKLCgjKLYbWd4fdCejuvw';
var SHEET_NAME   = 'RSVPs';              // tab name (auto-created)
var NOTIFY_EMAIL = 'korvenadi@gmail.com';  // email alerts; set to '' to disable

// ── doPost: receives RSVP submissions from the web page ────────────────────
function doPost(e) {
  try {
    // Accepts either a JSON body or form-encoded params (both work here).
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (ignore) {}
    }
    if (e && e.parameter && !data.name) {
      data = e.parameter;
    }

    var sheet = getOrCreateSheet();
    sheet.appendRow([
      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      data.name     || '',
      data.email    || '',
      data.phone    || '',
      data.adults   || '1',
      data.children || '0',
      data.message  || '',
    ]);

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

// ── doGet: open the /exec URL in a browser to confirm it's live ────────────
function doGet(e) {
  return jsonResponse({ status: 'RSVP endpoint is active 🌸' });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getOrCreateSheet() {
  // Opens the specific RSVP sheet by ID (works from a standalone script).
  // Falls back to the bound spreadsheet if the script is attached to a sheet.
  var ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Could not open the RSVP spreadsheet. Check SHEET_ID.');
  }

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp', 'Name', 'Email', 'Phone', 'Adults', 'Children', 'Wishes',
    ]);
    var header = sheet.getRange(1, 1, 1, 7);
    header.setFontWeight('bold');
    header.setBackground('#1B4332');
    header.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 7, 160);
  }
  return sheet;
}

function formatEmailBody(data) {
  return [
    'New RSVP for Sravya\'s Seemantham!',
    '',
    'Name:     ' + (data.name     || '—'),
    'Email:    ' + (data.email    || '—'),
    'Phone:    ' + (data.phone    || '—'),
    'Adults:   ' + (data.adults   || '1'),
    'Children: ' + (data.children || '0'),
    'Wishes:   ' + (data.message  || '—'),
    '',
    'Submitted: ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  ].join('\n');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
