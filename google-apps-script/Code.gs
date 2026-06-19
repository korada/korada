/**
 * Sravya's Seemantham RSVP — Google Apps Script Backend
 * VERSION 8 — email is the primary key; styled HTML guest emails
 *             (new / update / cancel) each with a plain-text fallback.
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
 *    { "version": 8, "status": "RSVP endpoint is active" }
 *  If you see a lower version number, you haven't deployed a new version yet.
 * ────────────────────────────────────────────────────────────────────────────
 */

var SCRIPT_VERSION = 8;
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
    // Only fall back to form params if the JSON body was empty/unparseable —
    // never overwrite a parsed body (that used to wipe action='cancel').
    if ((!data || !Object.keys(data).length) && e && e.parameter) {
      data = e.parameter;
    }

    Logger.log('doPost received: ' + JSON.stringify(data));

    var sheet = getSheet();
    ensureHeader(sheet);

    var now   = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    var name  = (data.name  || '').trim();
    var email = (data.email || '').trim();

    // ── Cancel / remove RSVP ───────────────────────────────────────────────
    if (data.action === 'cancel') {
      var cancelRow = isEmail(email) ? findRowByEmail(sheet, email) : -1;
      if (cancelRow < 0) {
        return jsonResponse({ success: false, error: 'No RSVP found for that email.', version: SCRIPT_VERSION });
      }
      sheet.deleteRow(cancelRow);
      Logger.log('Deleted row ' + cancelRow + ' for ' + email);

      if (NOTIFY_EMAIL) {
        MailApp.sendEmail(
          NOTIFY_EMAIL,
          (name || email) + ' has removed their RSVP - Seemantham',
          (name || 'A guest') + ' has REMOVED their RSVP for Sravya\'s Seemantham.\n\n' +
          'Name:  ' + (name || '-') + '\n' +
          'Email: ' + (email || '-') + '\n\n' +
          'Their row has been deleted from the sheet.\n\n' +
          'Time: ' + now
        );
        Logger.log('Host cancel notification sent to ' + NOTIFY_EMAIL);
      }
      var cancelEmailSent = false;
      var cancelEmailError = '';
      if (isEmail(email)) {
        try {
          MailApp.sendEmail({
            to:       email,
            subject:  "We're sad to see you go - Sravya & Venkata Aditya Seemantham",
            body:     cancelEmailPlain(name),
            htmlBody: cancelEmailHtml(name),
            name:     'Sravya & Venkata Aditya',
          });
          cancelEmailSent = true;
          Logger.log('Cancel confirmation sent to ' + email);
        } catch (mailErr) {
          cancelEmailError = mailErr.toString();
          Logger.log('Cancel email FAILED: ' + cancelEmailError);
        }
      }
      return jsonResponse({
        success: true,
        cancelled: true,
        guestEmailSent: cancelEmailSent,
        guestEmailError: cancelEmailError,
        version: SCRIPT_VERSION,
      });
    }

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
        MailApp.sendEmail({
          to:       email,
          subject:  subject,
          body:     guestEmailPlain(data, isUpdate),
          htmlBody: guestEmailHtml(data, isUpdate),
          name:     'Sravya & Venkata Aditya',
        });
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

function partyText(data) {
  var adults = data.adults   || '1';
  var kids   = data.children || '0';
  return adults + ' adult' + (adults === '1' ? '' : 's') +
         (kids !== '0' ? ', ' + kids + ' child' + (kids === '1' ? '' : 'ren') : '');
}

// ── Plain-text fallbacks (delivered alongside the HTML versions) ─────────────
function guestEmailPlain(data, isUpdate) {
  var firstName = (data.name || 'Friend').split(' ')[0];
  var lines = [
    isUpdate ? 'Your RSVP has been updated!' : 'Thank you for your RSVP!',
    '',
    'Dear ' + firstName + ',',
    '',
    isUpdate
      ? "We've updated your RSVP. Here's what we have on file:"
      : "We are so happy you'll be joining us to celebrate this special milestone! Here's a copy of your RSVP:",
    '',
    'Party:    ' + partyText(data),
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

function cancelEmailPlain(name) {
  var firstName = (name || 'Friend').split(' ')[0];
  return [
    'Your RSVP has been removed.',
    '',
    'Dear ' + firstName + ',',
    '',
    "We are so sad to hear that you won't be able to join us for our Seemantham.",
    'Your RSVP has been successfully removed from our list.',
    '',
    "If your plans change, you're always welcome to RSVP again:",
    RSVP_PAGE,
    '',
    'With love and best wishes,',
    'Sravya & Venkata Aditya',
  ].join('\n');
}

// ── Styled HTML emails (theme matches the RSVP site: green + gold) ───────────
//
// emailShell wraps inner content in the bordered card with shimmering gold
// bars and a marigold/flower header, exactly like the site's look.
function emailShell(headingHtml, innerHtml) {
  var goldBar = '<div style="height:7px;line-height:7px;font-size:0;' +
    'background:linear-gradient(90deg,#9B6A00,#D4A017,#F5C842,#D4A017,#9B6A00)">&nbsp;</div>';
  return '' +
  '<div style="margin:0;padding:24px 12px;background:#FFFDF4">' +
  '<div style="font-family:Georgia,\'Playfair Display\',serif;max-width:540px;margin:0 auto;' +
    'background:#FFFFFF;border:1px solid #EDD57A;border-radius:16px;overflow:hidden;color:#1B4332">' +
    goldBar +
    '<div style="padding:28px 28px 6px;text-align:center">' +
      '<div style="font-size:22px;letter-spacing:.08em">&#127804; &middot; &#127800; &middot; &#127804; &middot; &#127800; &middot; &#127804;</div>' +
      '<h1 style="font-family:\'Dancing Script\',\'Brush Script MT\',cursive;color:#1B4332;' +
        'font-size:30px;font-weight:700;margin:10px 0 0">' + headingHtml + '</h1>' +
    '</div>' +
    '<div style="padding:4px 28px 8px;font-size:15px;line-height:1.7;color:#2D6A4F">' + innerHtml + '</div>' +
    goldBar +
  '</div>' +
  '<div style="text-align:center;font-family:Georgia,serif;color:#6B8F71;font-size:11px;padding:14px 0 0">' +
    'Sravya &amp; Venkata Aditya &middot; Concord, NC &middot; 2026' +
  '</div>' +
  '</div>';
}

function eventDetailsCard() {
  return '' +
  '<div style="margin:18px 0 6px;background:#1B4332;color:#FFF9E6;border-radius:12px;padding:20px;text-align:center">' +
    '<div style="font-size:11px;letter-spacing:.25em;color:#D4A017;text-transform:uppercase">&#128197; Date &amp; Time</div>' +
    '<div style="font-size:21px;font-weight:600;margin:6px 0 2px;color:#FFF9E6">16th August 2026</div>' +
    '<div style="color:#A8D5B5;font-size:14px">Muhurtham &middot; 11:45 AM</div>' +
    '<div style="margin:12px 0 2px"><span style="display:inline-block;padding:5px 14px;' +
      'border:1px solid #6FCF97;border-radius:18px;color:#B7F5C8;font-size:13px">' +
      '&#128154; Dress Code: <b>Green</b></span></div>' +
    '<div style="font-weight:600;color:#F5C842;font-size:16px;margin-top:14px">&#127969; Golden Meadows Farm</div>' +
    '<div style="color:#A8D5B5;font-size:13px">9009 Poplar Tent Rd, Concord, NC 28027</div>' +
  '</div>';
}

function summaryRow(label, value) {
  return '<tr>' +
    '<td style="padding:8px 10px;border-bottom:1px solid #EDD57A;color:#6B8F71;font-size:13px;' +
      'width:38%;vertical-align:top">' + escapeHtml(label) + '</td>' +
    '<td style="padding:8px 10px;border-bottom:1px solid #EDD57A;font-weight:600;color:#1B4332">' +
      escapeHtml(value) + '</td></tr>';
}

function guestEmailHtml(data, isUpdate) {
  var firstName = (data.name || 'Friend').split(' ')[0];
  var heading   = isUpdate ? 'Your RSVP is updated!' : 'Thank you for your RSVP!';

  var inner =
    '<p style="margin:8px 0">Dear ' + escapeHtml(firstName) + ',</p>' +
    '<p style="margin:8px 0">' + (isUpdate
      ? "We've updated your RSVP. Here's what we have on file:"
      : "We are so happy you'll be joining us to celebrate this special milestone! " +
        "Here's a copy of your RSVP:") + '</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:14px 0">' +
      summaryRow('Name', data.name || firstName) +
      summaryRow('Attending', partyText(data)) +
      (data.message ? summaryRow('Your wishes', data.message) : '') +
    '</table>' +
    eventDetailsCard() +
    '<p style="text-align:center;font-size:13px;color:#6B8F71;margin:16px 0 4px">' +
      'Need to change your response? You can ' +
      '<a href="' + RSVP_PAGE + '" style="color:#C8860A;font-weight:600;text-decoration:none">' +
      'edit or remove your RSVP here</a>.</p>' +
    '<p style="text-align:center;font-family:\'Dancing Script\',cursive;font-size:20px;' +
      'color:#1B4332;margin:14px 0 8px">With love and joy,<br>Sravya &amp; Venkata Aditya &#128153;</p>';

  return emailShell(heading, inner);
}

function cancelEmailHtml(name) {
  var firstName = (name || 'Friend').split(' ')[0];
  var inner =
    '<p style="margin:8px 0">Dear ' + escapeHtml(firstName) + ',</p>' +
    '<p style="margin:8px 0">We are so sad to hear that you won\'t be able to join us for our ' +
      'Seemantham. Your RSVP has been removed from our list. &#128153;</p>' +
    '<div style="text-align:center;margin:20px 0">' +
      '<a href="' + RSVP_PAGE + '" style="display:inline-block;padding:11px 26px;' +
        'background:linear-gradient(135deg,#9B6A00,#C8860A,#D4A017);color:#FFFFFF;' +
        'border-radius:50px;font-weight:700;font-size:14px;text-decoration:none">' +
        'Changed your mind? RSVP again</a>' +
    '</div>' +
    '<p style="text-align:center;font-family:\'Dancing Script\',cursive;font-size:20px;' +
      'color:#1B4332;margin:14px 0 8px">With love and best wishes,<br>Sravya &amp; Venkata Aditya</p>';

  return emailShell('We\'ll miss you!', inner);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Manual tests — select in the editor dropdown and click Run ───────────────
// Each sends the real styled HTML (with plain-text fallback) to yourself.
var TEST_EMAIL = 'korvenadi@gmail.com';

function testGuestEmailNew() {
  var data = { name: 'Test Guest', email: TEST_EMAIL, adults: '2', children: '1', message: 'So excited for you both!' };
  MailApp.sendEmail({
    to: TEST_EMAIL, subject: 'TEST - RSVP confirmed - Seemantham',
    body: guestEmailPlain(data, false), htmlBody: guestEmailHtml(data, false),
    name: 'Sravya & Venkata Aditya',
  });
  Logger.log('Sent NEW-RSVP test to ' + TEST_EMAIL);
}
function testGuestEmailUpdate() {
  var data = { name: 'Test Guest', email: TEST_EMAIL, adults: '3', children: '0', message: '' };
  MailApp.sendEmail({
    to: TEST_EMAIL, subject: 'TEST - RSVP updated - Seemantham',
    body: guestEmailPlain(data, true), htmlBody: guestEmailHtml(data, true),
    name: 'Sravya & Venkata Aditya',
  });
  Logger.log('Sent UPDATE-RSVP test to ' + TEST_EMAIL);
}
function testGuestEmailCancel() {
  MailApp.sendEmail({
    to: TEST_EMAIL, subject: 'TEST - RSVP removed - Seemantham',
    body: cancelEmailPlain('Test Guest'), htmlBody: cancelEmailHtml('Test Guest'),
    name: 'Sravya & Venkata Aditya',
  });
  Logger.log('Sent CANCEL test to ' + TEST_EMAIL);
}
