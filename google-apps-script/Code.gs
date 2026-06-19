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
 *       permission because of SHEET_ID and the email alerts) → Copy the URL.
 *       It MUST end in  /exec   (not /dev).
 *
 *  4. The /exec URL is already wired into the site (docs/SravyaBabyShower/
 *     index.html and client/components/BabyShower.jsx). If you ever create a
 *     NEW deployment with a new URL, update GAS_URL in both files.
 *
 *  ⚠️  IMPORTANT — the #1 reason changes "do nothing":
 *      Every time you EDIT this script you must redeploy a NEW VERSION:
 *        Deploy → Manage deployments → ✏️ edit → Version: "New version" → Deploy.
 *      The /exec URL stays the same, but the old code keeps running until you do.
 *
 *  NOTE: This version adds (a) a confirmation email to the guest, and
 *  (b) edit support — submissions carry a unique "id"; if a row with that id
 *  already exists it is UPDATED in place instead of creating a duplicate.
 * ────────────────────────────────────────────────────────────────────────────
 */

// Your existing sheet: "Seemantham - Sravya - rsvp"
var SHEET_ID     = '1-Vl-0uW5WhZDwtNg_1l4OveKLCgjKLYbWd4fdCejuvw';
var SHEET_NAME   = 'RSVPs';                // tab name (auto-created)
// owner alerts (comma-separated for multiple recipients); set to '' to disable
var NOTIFY_EMAIL = 'korvenadi@gmail.com,sasanapuris@gmail.com';
var RSVP_PAGE    = 'https://korada.in/SravyaBabyShower';

var HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone',
  'Adults', 'Children', 'Wishes', 'RSVP ID', 'Last Updated',
];

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

    var sheet = getSheet();
    ensureHeader(sheet);

    var now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    var id  = (data.id || '').toString();

    var row = [
      data.name     || '',
      data.email    || '',
      data.phone    || '',
      data.adults   || '1',
      data.children || '0',
      data.message  || '',
    ];

    // Edit support: if this id already has a row, update it; else append.
    var existingRow = id ? findRowById(sheet, id) : -1;
    var isUpdate = false;

    if (existingRow > 0) {
      isUpdate = true;
      // Keep the original Timestamp (col 1); overwrite cols 2–9.
      sheet.getRange(existingRow, 2, 1, 8)
           .setValues([[row[0], row[1], row[2], row[3], row[4], row[5], id, now]]);
    } else {
      if (!id) id = Utilities.getUuid();
      sheet.appendRow([now, row[0], row[1], row[2], row[3], row[4], row[5], id, now]);
    }

    // (a) Notify the hosts
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to:      NOTIFY_EMAIL,
        subject: (isUpdate ? '✏️ Updated RSVP from ' : '🌸 New RSVP from ') +
                 (data.name || 'guest'),
        body:    formatOwnerEmail(data, isUpdate),
      });
    }

    // (b) Confirmation email to the guest
    if (isEmail(data.email)) {
      MailApp.sendEmail({
        to:       data.email,
        subject:  isUpdate
          ? '🌸 Your RSVP has been updated — Sravya & Venkata Aditya'
          : '🌸 Your RSVP is confirmed — Sravya & Venkata Aditya',
        htmlBody: formatGuestEmail(data, isUpdate),
        name:     'Sravya & Venkata Aditya',
      });
    }

    return jsonResponse({ success: true, id: id, updated: isUpdate });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ── doGet: open the /exec URL in a browser to confirm it's live ────────────
function doGet(e) {
  return jsonResponse({ status: 'RSVP endpoint is active 🌸' });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getSheet() {
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
  }
  return sheet;
}

// Make sure row 1 has our 9 headers (safe to call every time; only touches row 1).
function ensureHeader(sheet) {
  if (sheet.getRange(1, 8).getValue() !== 'RSVP ID') {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    var header = sheet.getRange(1, 1, 1, HEADERS.length);
    header.setFontWeight('bold');
    header.setBackground('#1B4332');
    header.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 150);
  }
}

// Returns the 1-based row number whose "RSVP ID" (col 8) matches id, or -1.
function findRowById(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 8, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) return i + 2;
  }
  return -1;
}

function isEmail(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s || '');
}

function formatOwnerEmail(data, isUpdate) {
  return [
    (isUpdate ? 'An RSVP was UPDATED' : 'New RSVP') + ' for Sravya\'s Seemantham!',
    '',
    'Name:     ' + (data.name     || '—'),
    'Email:    ' + (data.email    || '—'),
    'Phone:    ' + (data.phone    || '—'),
    'Adults:   ' + (data.adults   || '1'),
    'Children: ' + (data.children || '0'),
    'Wishes:   ' + (data.message  || '—'),
    '',
    'Time: ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  ].join('\n');
}

function formatGuestEmail(data, isUpdate) {
  var name    = escapeHtml((data.name || 'Friend').split(' ')[0]);
  var adults  = escapeHtml(data.adults   || '1');
  var kids    = escapeHtml(data.children || '0');
  var wishes  = data.message ? escapeHtml(data.message) : '';

  return '' +
  '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;' +
  'border:1px solid #EDD57A;border-radius:16px;overflow:hidden;color:#1B4332">' +
    '<div style="height:7px;background:linear-gradient(90deg,#9B6A00,#D4A017,#F5C842,#D4A017,#9B6A00)"></div>' +
    '<div style="padding:28px 28px 8px;text-align:center">' +
      '<div style="font-size:1.6rem;letter-spacing:.1em">🌼 · 🌸 · 🌼 · 🌸 · 🌼</div>' +
      '<h1 style="font-family:\'Dancing Script\',cursive;color:#1B4332;font-size:2rem;margin:.4rem 0">' +
        (isUpdate ? 'Your RSVP is updated!' : 'Thank you for your RSVP!') +
      '</h1>' +
    '</div>' +
    '<div style="padding:0 28px 8px;font-size:15px;line-height:1.7">' +
      '<p>Dear ' + name + ',</p>' +
      '<p>' + (isUpdate
        ? 'We\'ve updated your RSVP details. Here\'s what we have on file:'
        : 'We are so happy you\'ll be joining us to celebrate this special milestone! ' +
          'Here\'s a copy of your RSVP:') +
      '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:14px 0">' +
        rowHtml('Party', adults + ' adult' + (adults === '1' ? '' : 's') +
                (kids !== '0' ? ' · ' + kids + ' child' + (kids === '1' ? '' : 'ren') : '')) +
        (wishes ? rowHtml('Your wishes', wishes) : '') +
      '</table>' +
    '</div>' +
    '<div style="margin:8px 28px 20px;background:#1B4332;color:#FFF9E6;border-radius:12px;' +
    'padding:18px;text-align:center">' +
      '<div style="font-size:.7rem;letter-spacing:.25em;color:#D4A017">📅 DATE &amp; TIME</div>' +
      '<div style="font-size:1.3rem;font-weight:600;margin:4px 0">16th August 2026</div>' +
      '<div style="color:#A8D5B5;font-size:.9rem">Muhurtham · 11:45 AM</div>' +
      '<div style="font-weight:600;color:#F5C842;margin-top:10px">🏡 Golden Meadows Farm</div>' +
      '<div style="color:#A8D5B5;font-size:.85rem">9009 Poplar Tent Rd, Concord, NC 28027</div>' +
      '<div style="margin-top:12px;display:inline-block;padding:5px 14px;border:1px solid #6FCF97;' +
      'border-radius:18px;color:#B7F5C8;font-size:.82rem">💚 Dress Code: <b>Green</b></div>' +
    '</div>' +
    '<div style="padding:0 28px 24px;text-align:center;font-size:13px;color:#6B8F71">' +
      '<p>Need to change your response? You can ' +
      '<a href="' + RSVP_PAGE + '" style="color:#C8860A;font-weight:600">' +
      'edit your RSVP here</a> (from the same device &amp; browser).</p>' +
      '<p style="font-family:\'Dancing Script\',cursive;font-size:1.3rem;color:#1B4332;margin-top:14px">' +
      'With love and joy,<br>Sravya &amp; Venkata Aditya 💛</p>' +
    '</div>' +
    '<div style="height:7px;background:linear-gradient(90deg,#9B6A00,#D4A017,#F5C842,#D4A017,#9B6A00)"></div>' +
  '</div>';
}

function rowHtml(label, value) {
  return '<tr>' +
    '<td style="padding:8px 10px;border-bottom:1px solid #EDD57A;color:#6B8F71;' +
    'font-size:13px;width:38%;vertical-align:top">' + escapeHtml(label) + '</td>' +
    '<td style="padding:8px 10px;border-bottom:1px solid #EDD57A;font-weight:600">' +
    value + '</td></tr>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
