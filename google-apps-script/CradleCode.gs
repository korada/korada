/**
 * Anagha Saraswika's Barasala RSVP — Google Apps Script backend
 * (same design as Code.gs for the Seemantham page: email is the primary key,
 *  hosts get a notification, the guest gets a styled confirmation).
 *
 * ── SETUP ───────────────────────────────────────────────────────────────────
 *  1. Create a new Google Sheet (e.g. "Barasala - Anagha - rsvp").
 *  2. In that sheet: Extensions → Apps Script → paste this file → Save.
 *     (Because the script is created from the sheet, SHEET_ID can stay empty.)
 *  3. Deploy → New deployment → Web app
 *       Execute as:      Me
 *       Who has access:  Anyone
 *     → Deploy → Authorize → copy the /exec URL.
 *  4. Paste that URL as GAS_URL in client/components/CradleCeremony.jsx,
 *     then run `npm run build:prod` and commit docs/.
 *
 *  After EVERY edit here, redeploy a NEW VERSION:
 *    Deploy → Manage deployments → edit → Version: "New version" → Deploy.
 *  Open the /exec URL in a browser to confirm the live version number.
 * ────────────────────────────────────────────────────────────────────────────
 */

var SCRIPT_VERSION = 1;
var SHEET_ID     = '';   // empty = the spreadsheet this script is attached to
var SHEET_NAME   = 'RSVPs';
var NOTIFY_EMAIL = 'korvenadi@gmail.com,sasanapuris@gmail.com';
var RSVP_PAGE    = 'https://korada.in/AnaghaBarasala';
var HOSTS        = 'Sravya & Venkata Aditya';
var EVENT_NAME   = "Anagha Saraswika's Barasala";

// Event details shown in guest emails. Leave empty until they are final.
// Keep in sync with EVENT in client/components/CradleCeremony.jsx.
var EVENT_DATE    = '';
var EVENT_TIME    = '';
var EVENT_VENUE   = '';
var EVENT_ADDRESS = '';
var EVENT_DRESS   = '';

var HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone',
  'Adults', 'Children', 'Blessings', 'Dietary', 'Last Updated',
];

// ── doGet ────────────────────────────────────────────────────────────────────
// Plain visit → version JSON.  ?email= → lookup.  ?action=cancel&email= → remove.
// Add &callback=fn to get JSONP, which is how the page reads responses.
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'cancel' && p.email) {
      return jsonpOrJson(p, handleCancel({ email: p.email, name: p.name || '' }));
    }
    if (p.email) return jsonpOrJson(p, lookupByEmail(p.email));
    return jsonpOrJson(p, { version: SCRIPT_VERSION, status: 'RSVP endpoint is active' });
  } catch (err) {
    Logger.log('doGet ERROR: ' + err);
    return jsonpOrJson(p, { success: false, error: err.toString(), version: SCRIPT_VERSION });
  }
}

function lookupByEmail(email) {
  var sheet = getSheet();
  ensureHeader(sheet);
  var row = isEmail(email) ? findRowByEmail(sheet, email) : -1;
  if (row < 0) return { success: true, found: false, version: SCRIPT_VERSION };
  var v = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  return {
    success: true,
    found: true,
    rsvp: {
      name:     String(v[1] || ''),
      email:    String(v[2] || ''),
      phone:    String(v[3] || ''),
      adults:   String(v[4] || '1'),
      children: String(v[5] || '0'),
      message:  String(v[6] || ''),
      dietary:  String(v[7] || ''),
    },
    version: SCRIPT_VERSION,
  };
}

// ── doPost: RSVP submissions from the page ───────────────────────────────────
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); }
      catch (ignore) { Logger.log('doPost: body was not JSON'); }
    }
    if ((!data || !Object.keys(data).length) && e && e.parameter) data = e.parameter;
    Logger.log('doPost data: ' + JSON.stringify(data));

    if (data.action === 'cancel') {
      return jsonResponse(handleCancel({
        email: (data.email || '').trim(),
        name:  (data.name  || '').trim(),
      }));
    }
    return jsonResponse(processSubmission(data));
  } catch (err) {
    Logger.log('doPost ERROR: ' + err);
    return jsonResponse({ success: false, error: err.toString(), version: SCRIPT_VERSION });
  }
}

function processSubmission(data) {
  var now      = nowText();
  var name     = (data.name  || '').trim();
  var email    = (data.email || '').trim();
  var phone    = data.phone    || '';
  var adults   = data.adults   || '1';
  var children = data.children || '0';
  var message  = data.message  || '';
  var dietary  = data.dietary  || '';

  if (!isEmail(email)) {
    return { success: false, stage: 'validate', error: 'invalid or missing email', version: SCRIPT_VERSION };
  }

  var isUpdate = false;
  var writtenRow = -1;
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var sheet = getSheet();
    ensureHeader(sheet);
    var existingRow = findRowByEmail(sheet, email);
    isUpdate = existingRow > 0;
    if (isUpdate) {
      // Keep the original Timestamp in column 1
      sheet.getRange(existingRow, 2, 1, 8)
           .setValues([[name, email, phone, adults, children, message, dietary, now]]);
      writtenRow = existingRow;
    } else {
      writtenRow = sheet.getLastRow() + 1;
      sheet.getRange(writtenRow, 1, 1, HEADERS.length)
           .setValues([[now, name, email, phone, adults, children, message, dietary, now]]);
    }
    SpreadsheetApp.flush();
  } catch (writeErr) {
    Logger.log('SHEET WRITE FAILED: ' + writeErr);
    return { success: false, stage: 'sheet-write', error: writeErr.toString(), version: SCRIPT_VERSION };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }

  var hostEmailError = '';
  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        (isUpdate ? 'Updated RSVP from ' : 'New RSVP from ') + (name || 'guest') + ' - Barasala',
        formatOwnerEmail(data, isUpdate)
      );
    } catch (hostErr) {
      hostEmailError = hostErr.toString();
      Logger.log('Host email FAILED: ' + hostEmailError);
    }
  }

  var guestEmailError = '';
  try {
    MailApp.sendEmail({
      to:       email,
      subject:  (isUpdate ? 'Your RSVP has been updated - ' : 'Your RSVP is confirmed - ') + EVENT_NAME,
      body:     guestEmailPlain(data, isUpdate),
      htmlBody: guestEmailHtml(data, isUpdate),
      name:     HOSTS,
    });
  } catch (mailErr) {
    guestEmailError = mailErr.toString();
    Logger.log('Guest email FAILED: ' + guestEmailError);
  }

  return {
    success: true,
    updated: isUpdate,
    row: writtenRow,
    hostEmailError: hostEmailError,
    guestEmailError: guestEmailError,
    version: SCRIPT_VERSION,
  };
}

function handleCancel(data) {
  var email = (data.email || '').trim();
  var name  = (data.name  || '').trim();

  var sheet = getSheet();
  ensureHeader(sheet);
  var cancelRow = isEmail(email) ? findRowByEmail(sheet, email) : -1;
  if (cancelRow < 0) {
    return { success: false, found: false, error: 'No RSVP found for that email.', version: SCRIPT_VERSION };
  }
  sheet.deleteRow(cancelRow);

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        (name || email) + ' has removed their RSVP - Barasala',
        (name || 'A guest') + ' has REMOVED their RSVP for ' + EVENT_NAME + '.\n\n' +
        'Name:  ' + (name || '-') + '\n' +
        'Email: ' + email + '\n\n' +
        'Their row has been deleted from the sheet.\n\nTime: ' + nowText()
      );
    } catch (hostErr) {
      Logger.log('Host cancel email failed: ' + hostErr);
    }
  }

  var guestEmailError = '';
  try {
    MailApp.sendEmail({
      to:       email,
      subject:  'Your RSVP has been removed - ' + EVENT_NAME,
      body:     cancelEmailPlain(name),
      htmlBody: cancelEmailHtml(name),
      name:     HOSTS,
    });
  } catch (mailErr) {
    guestEmailError = mailErr.toString();
    Logger.log('Cancel email FAILED: ' + guestEmailError);
  }

  return { success: true, cancelled: true, deletedRow: cancelRow, guestEmailError: guestEmailError, version: SCRIPT_VERSION };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function nowText() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
}

function jsonpOrJson(params, obj) {
  var json = JSON.stringify(obj);
  // Only allow a plain identifier as the JSONP callback name.
  if (params && params.callback && /^[A-Za-z_$][\w$]*$/.test(params.callback)) {
    return ContentService
      .createTextOutput(params.callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse(obj);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Cannot open spreadsheet. Set SHEET_ID, or create this script from the sheet (Extensions → Apps Script).');
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader(sheet) {
  if (sheet.getRange(1, HEADERS.length).getValue() !== HEADERS[HEADERS.length - 1]) {
    var hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setValues([HEADERS]);
    hdr.setFontWeight('bold');
    hdr.setBackground('#8E1230');
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

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function partyText(data) {
  var adults = data.adults   || '1';
  var kids   = data.children || '0';
  return adults + ' adult' + (adults === '1' ? '' : 's') +
         (kids !== '0' ? ', ' + kids + ' child' + (kids === '1' ? '' : 'ren') : '');
}

// [label, value] pairs for whichever event details have been filled in.
function eventLines() {
  var rows = [];
  if (EVENT_DATE)    rows.push(['Date', EVENT_DATE]);
  if (EVENT_TIME)    rows.push(['Time', EVENT_TIME]);
  if (EVENT_VENUE)   rows.push(['Venue', EVENT_VENUE]);
  if (EVENT_ADDRESS) rows.push(['Address', EVENT_ADDRESS]);
  if (EVENT_DRESS)   rows.push(['Dress code', EVENT_DRESS]);
  return rows;
}

function formatOwnerEmail(data, isUpdate) {
  return [
    (isUpdate ? 'UPDATED RSVP' : 'New RSVP') + ' for ' + EVENT_NAME + '!',
    '',
    'Name:      ' + (data.name     || '-'),
    'Email:     ' + (data.email    || '-'),
    'Phone:     ' + (data.phone    || '-'),
    'Adults:    ' + (data.adults   || '1'),
    'Children:  ' + (data.children || '0'),
    'Blessings: ' + (data.message  || '-'),
    'Dietary:   ' + (data.dietary  || 'None'),
    '',
    'Time: ' + nowText(),
  ].join('\n');
}

// ── Guest emails: plain-text fallbacks ───────────────────────────────────────
function guestEmailPlain(data, isUpdate) {
  var firstName = (data.name || 'Friend').split(' ')[0];
  var lines = [
    isUpdate ? 'Your RSVP has been updated!' : 'Thank you for your RSVP!',
    '',
    'Dear ' + firstName + ',',
    '',
    isUpdate
      ? "We've updated your RSVP. Here's what we have on file:"
      : "We are so happy you'll be joining us to bless Anagha Saraswika. Here's a copy of your RSVP:",
    '',
    'Attending: ' + partyText(data),
  ];
  if (data.dietary) lines.push('Food:      ' + data.dietary);
  if (data.message) lines.push('Blessings: ' + data.message);
  var ev = eventLines();
  if (ev.length) {
    lines.push('', '--- Event details ---');
    ev.forEach(function (r) { lines.push(r[0] + ': ' + r[1]); });
  }
  lines.push('', 'Need to change your response? Visit: ' + RSVP_PAGE, '', 'With love,', HOSTS);
  return lines.join('\n');
}

function cancelEmailPlain(name) {
  var firstName = (name || 'Friend').split(' ')[0];
  return [
    'Your RSVP has been removed.',
    '',
    'Dear ' + firstName + ',',
    '',
    "We're sorry you won't be able to join us for " + EVENT_NAME + '.',
    'Your RSVP has been removed from our list.',
    '',
    "If your plans change, you're always welcome to RSVP again:",
    RSVP_PAGE,
    '',
    'With love,',
    HOSTS,
  ].join('\n');
}

// ── Guest emails: styled HTML (kumkum + turmeric + zari gold, like the page) ──
function emailShell(headingHtml, innerHtml) {
  var zari = '<div style="height:8px;line-height:8px;font-size:0;background:#C99A2E;' +
    'border-top:3px solid #5E0B1F;border-bottom:3px solid #5E0B1F">&nbsp;</div>';
  return '' +
  '<div style="margin:0;padding:24px 12px;background:#FFF8E8">' +
  '<div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;background:#FFFFFF;' +
    'border:2px solid #C99A2E;border-radius:6px;overflow:hidden;color:#3B1712">' +
    zari +
    '<div style="padding:26px 28px 6px;text-align:center">' +
      '<div style="color:#8E1230;font-size:26px;line-height:1.4">&#3116;&#3134;&#3120;&#3128;&#3134;&#3122;</div>' +
      '<h1 style="color:#8E1230;font-size:24px;font-weight:400;margin:8px 0 0">' + headingHtml + '</h1>' +
    '</div>' +
    '<div style="padding:4px 28px 14px;font-size:15px;line-height:1.7;color:#3B1712">' + innerHtml + '</div>' +
    zari +
  '</div>' +
  '<div style="text-align:center;font-family:Georgia,serif;color:#7A5548;font-size:12px;padding:14px 0 0">' +
    escapeHtml(HOSTS) +
  '</div>' +
  '</div>';
}

function eventDetailsCard() {
  var ev = eventLines();
  if (!ev.length) return '';
  var rows = ev.map(function (r) {
    return '<div style="margin:4px 0"><span style="color:#F2B11B">' + escapeHtml(r[0]) + ':</span> ' +
           escapeHtml(r[1]) + '</div>';
  }).join('');
  return '<div style="margin:18px 0 6px;background:#8E1230;color:#FFF8E8;border-radius:6px;' +
         'padding:18px 20px;text-align:center;font-size:15px">' + rows + '</div>';
}

function summaryRow(label, value) {
  return '<tr>' +
    '<td style="padding:8px 10px;border-bottom:1px solid #E8D5B0;color:#7A5548;font-size:13px;' +
      'width:38%;vertical-align:top">' + escapeHtml(label) + '</td>' +
    '<td style="padding:8px 10px;border-bottom:1px solid #E8D5B0;color:#3B1712">' +
      escapeHtml(value) + '</td></tr>';
}

function guestEmailHtml(data, isUpdate) {
  var firstName = (data.name || 'Friend').split(' ')[0];
  var inner =
    '<p style="margin:8px 0">Dear ' + escapeHtml(firstName) + ',</p>' +
    '<p style="margin:8px 0">' + (isUpdate
      ? "We've updated your RSVP. Here's what we have on file:"
      : "We are so happy you'll be joining us to bless Anagha Saraswika. Here's a copy of your RSVP:") + '</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:14px 0">' +
      summaryRow('Name', data.name || firstName) +
      summaryRow('Attending', partyText(data)) +
      (data.dietary ? summaryRow('Food', data.dietary) : '') +
      (data.message ? summaryRow('Your blessings', data.message) : '') +
    '</table>' +
    eventDetailsCard() +
    '<p style="text-align:center;font-size:13px;color:#7A5548;margin:16px 0 4px">' +
      'Need to change your response? ' +
      '<a href="' + RSVP_PAGE + '" style="color:#8E1230">Edit or remove your RSVP here</a>.</p>' +
    '<p style="text-align:center;font-size:17px;color:#8E1230;margin:14px 0 4px">With love,<br>' +
      escapeHtml(HOSTS) + '</p>';
  return emailShell(isUpdate ? 'Your RSVP is updated' : 'Thank you for your RSVP', inner);
}

function cancelEmailHtml(name) {
  var firstName = (name || 'Friend').split(' ')[0];
  var inner =
    '<p style="margin:8px 0">Dear ' + escapeHtml(firstName) + ',</p>' +
    '<p style="margin:8px 0">We\'re sorry you won\'t be able to join us for ' + escapeHtml(EVENT_NAME) +
      '. Your RSVP has been removed from our list.</p>' +
    '<div style="text-align:center;margin:20px 0">' +
      '<a href="' + RSVP_PAGE + '" style="display:inline-block;padding:11px 26px;background:#8E1230;' +
        'color:#FFF8E8;border-radius:6px;font-size:14px;text-decoration:none">' +
        'Changed your mind? RSVP again</a>' +
    '</div>' +
    '<p style="text-align:center;font-size:17px;color:#8E1230;margin:14px 0 4px">With love,<br>' +
      escapeHtml(HOSTS) + '</p>';
  return emailShell("We'll miss you", inner);
}

// ── Manual tests — pick one in the editor dropdown and click Run ─────────────
var TEST_EMAIL = 'korvenadi@gmail.com';

// Lists the tabs the script can see; confirms spreadsheet access.
function testSheetAccess() {
  var sheet = getSheet();
  Logger.log('Spreadsheet: "' + sheet.getParent().getName() + '", tab "' + sheet.getName() +
             '" has ' + sheet.getLastRow() + ' rows.');
}

// Runs a real submission through the full path: writes a row and sends both emails.
function testFullSubmission() {
  var res = processSubmission({
    name: 'Test Guest', email: TEST_EMAIL, phone: '555-0100',
    adults: '2', children: '1', message: 'Submitted via testFullSubmission', dietary: 'Vegetarian',
  });
  Logger.log('testFullSubmission result: ' + JSON.stringify(res));
}

// Removes the test row again and sends the cancel emails.
function testCancel() {
  Logger.log('testCancel result: ' + JSON.stringify(handleCancel({ email: TEST_EMAIL, name: 'Test Guest' })));
}
