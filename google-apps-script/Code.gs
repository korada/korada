/**
 * Sravya's Seemantham RSVP — Google Apps Script Backend
 * VERSION 5 — email is the primary key; no UUID; plain-text guest email
 *
 * ── SETUP ───────────────────────────────────────────────────────────────────
 *
 *  1. script.google.com → paste this file → Save (💾).
 *
 *  2. Deploy → New deployment → Web app
 *       Execute as:      Me
 *       Who has access:  Anyone
 *     → Deploy → Authorize → copy the /exec URL.
 *
 *  3. GAS_URL in docs/SravyaBabyShower/index.html and
 *     client/components/BabyShower.jsx must match that /exec URL.
 *
 *  ⚠️  After EVERY edit you must redeploy a NEW VERSION:
 *       Deploy → Manage deployments → ✏️ edit → Version: "New version" → Deploy.
 *      The /exec URL stays the same, but the old code keeps running otherwise.
 *
 *  ── HOW TO CONFIRM THIS VERSION IS LIVE ────────────────────────────────────
 *  Open the /exec URL in a browser. You should see:
 *    { "version": 5, "status": "RSVP endpoint is active" }
 *  If you see a lower version number, you haven't deployed a new version yet.
 * ────────────────────────────────────────────────────────────────────────────
 */

var SCRIPT_VERSION = 5;
var SHEET_ID     = '1-Vl-0uW5WhZDwtNg_1l4OveKLCgjKLYbWd4fdCejuvw';
var SHEET_NAME   = 'RSVPs';
var NOTIFY_EMAIL = 'korvenadi@gmail.com,sasanapuris@gmail.com';
var RSVP_PAGE    = 'https://korada.in/SravyaBabyShower';

// 8 columns — email is the identifier, no separate RSVP ID column
var HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone',
  'Adults', 'Children', 'Wishes', 'Last Updated',
];

// ── doGet: open /exec in browser to verify the deployed version ─────────────
function doGet(e) {
  return jsonResponse({ version: SCRIPT_VERSION, status: 'RSVP endpoint is active' });
}

// ── doPost: receives RSVP submissions from the web page ─────────────────────
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (ignore) {}
    }
    if (e && e.parameter && !data.name) {
      data = e.parameter;
    }

    Logger.log('doPost received: ' + JSON.stringify(data));

    var sheet = getSheet();
    ensureHeader(sheet);

    var now  = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    var name     = data.name     || '';
    var email    = data.email    || '';
    var phone    = data.phone    || '';
    var adults   = data.adults   || '1';
    var children = data.children || '0';
    var message  = data.message  || '';

    // Email is the primary key — find the existing row if any
    var existingRow = isEmail(email) ? findRowByEmail(sheet, email) : -1;
    var isUpdate    = existingRow > 0;

    if (isUpdate) {
      // Overwrite cols 2–8, keep original Timestamp in col 1
      sheet.getRange(existingRow, 2, 1, 7)
           .setValues([[name, email, phone, adults, children, message, now]]);
      Logger.log('Updated row ' + existingRow + ' for ' + email);
    } else {
      sheet.appendRow([now, name, email, phone, adults, children, message, now]);
      Logger.log('Appended new row for ' + email);
    }

    // (a) Notify the hosts
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        (isUpdate ? 'Updated RSVP from ' : 'New RSVP from ') + (name || 'guest'),
        formatOwnerEmail(data, isUpdate)
      );
    }

    // (b) Confirmation email to the guest
    var guestEmailSent = false;
    var guestEmailError = '';
    if (isEmail(email)) {
      try {
        var subject = isUpdate
          ? 'Your RSVP has been updated - Sravya & Venkata Aditya Seemantham'
          : 'Your RSVP is confirmed - Sravya & Venkata Aditya Seemantham';
        MailApp.sendEmail(email, subject, formatGuestEmail(data, isUpdate));
        guestEmailSent = true;
        Logger.log('Guest email sent to ' + email);
      } catch (mailErr) {
        guestEmailError = mailErr.toString();
        Logger.log('Guest email FAILED: ' + guestEmailError);
      }
    } else {
      guestEmailError = 'invalid or missing email: "' + email + '"';
      Logger.log('Guest email skipped — ' + guestEmailError);
    }

    return jsonResponse({
      success: true,
      updated: isUpdate,
      guestEmailSent: guestEmailSent,
      guestEmailError: guestEmailError,
      version: SCRIPT_VERSION,
    });

  } catch (err) {
    Logger.log('doPost ERROR: ' + err.toString());
    return jsonResponse({ success: false, error: err.toString(), version: SCRIPT_VERSION });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getSheet() {
  var ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Cannot open spreadsheet. Check SHEET_ID.');
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader(sheet) {
  // Re-writes headers if column 8 is not 'Last Updated' (handles schema migration)
  if (sheet.getRange(1, 8).getValue() !== 'Last Updated') {
    var hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setValues([HEADERS]);
    hdr.setFontWeight('bold');
    hdr.setBackground('#1B4332');
    hdr.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 150);
  }
}

// Returns the 1-based row number whose Email (col 3) matches, or -1.
function findRowByEmail(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var emails = sheet.getRange(2, 3, last - 1, 1).getValues();
  var target = email.trim().toLowerCase();
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === target) return i + 2;
  }
  return -1;
}

function isEmail(s) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s || '');
}

function formatOwnerEmail(data, isUpdate) {
  return [
    (isUpdate ? 'UPDATED RSVP' : 'New RSVP') + " for Sravya's Seemantham!",
    '',
    'Name:     ' + (data.name     || '-'),
    'Email:    ' + (data.email    || '-'),
    'Phone:    ' + (data.phone    || '-'),
    'Adults:   ' + (data.adults   || '1'),
    'Children: ' + (data.children || '0'),
    'Wishes:   ' + (data.message  || '-'),
    '',
    'Time: ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
  ].join('\n');
}

function formatGuestEmail(data, isUpdate) {
  var firstName = (data.name || 'Friend').split(' ')[0];
  var adults    = data.adults   || '1';
  var kids      = data.children || '0';
  var party     = adults + ' adult' + (adults === '1' ? '' : 's') +
                  (kids !== '0' ? ', ' + kids + ' child' + (kids === '1' ? '' : 'ren') : '');

  var lines = [
    isUpdate ? 'Your RSVP has been updated!' : 'Thank you for your RSVP!',
    '',
    'Dear ' + firstName + ',',
    '',
    isUpdate
      ? "We've updated your RSVP. Here's what we have on file:"
      : "We are so happy you'll be joining us to celebrate this special milestone! Here's a copy of your RSVP:",
    '',
    'Party:    ' + party,
  ];
  if (data.message) lines.push('Wishes:   ' + data.message);
  lines.push(
    '',
    '--- Event Details ---',
    'Date:     16th August 2026',
    'Time:     Muhurtham - 11:45 AM',
    'Dress:    Green',
    'Venue:    Golden Meadows Farm',
    'Address:  9009 Poplar Tent Rd, Concord, NC 28027',
    '',
    'Need to change your response? Visit: ' + RSVP_PAGE,
    '',
    'With love and joy,',
    'Sravya & Venkata Aditya'
  );
  return lines.join('\n');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Manual tests — select in the editor dropdown and click Run ───────────────
function testGuestEmailNew() {
  var data = { name: 'Test Guest', email: 'korvenadi@gmail.com', adults: '2', children: '1', message: 'Congrats!' };
  MailApp.sendEmail(data.email, 'TEST - RSVP confirmed - Seemantham', formatGuestEmail(data, false));
  Logger.log('Sent new-RSVP test to ' + data.email);
}
function testGuestEmailUpdate() {
  var data = { name: 'Test Guest', email: 'korvenadi@gmail.com', adults: '3', children: '0', message: '' };
  MailApp.sendEmail(data.email, 'TEST - RSVP updated - Seemantham', formatGuestEmail(data, true));
  Logger.log('Sent update-RSVP test to ' + data.email);
}
