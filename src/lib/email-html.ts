import "server-only";
import { colors } from "@/lib/design-tokens";

// Deliberately plain: a thin accent rule and a simple card, not a glossy
// marketing template — these are personal replies from Jenna, and heavy
// HTML tends to get flagged as spam or arrive with images blocked anyway.
// Every send still carries a plain-text body too; this is progressive
// enhancement, not the only version.

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Runs on already-escaped text — escapeHtml never introduces whitespace or
// `<` into a URL, so this is safe to match against afterward. Without this,
// a bare URL pasted into the body (e.g. a booking/portal link inserted by
// the reply composer) just sits there as plain text even in the "styled"
// HTML email, relying entirely on the recipient's email client to notice
// and auto-link it.
function linkifyUrls(escapedText: string) {
  return escapedText.replace(
    /https?:\/\/[^\s<]+/g,
    (url) => `<a href="${url}" style="color:${colors.warm};text-decoration:underline;">${url}</a>`
  );
}

function textToParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;">${linkifyUrls(escapeHtml(block).replace(/\n/g, "<br>"))}</p>`)
    .join("");
}

interface EmailOptions {
  ctaLabel?: string;
  ctaUrl?: string;
}

export function renderEmailHtml(bodyText: string, options: EmailOptions = {}) {
  const cta = options.ctaUrl
    ? `<tr>
        <td style="padding-top:22px;">
          <a href="${options.ctaUrl}" style="display:inline-block;background:${colors.warm};color:${colors.accentContrast};font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;text-decoration:none;padding:12px 24px;border-radius:999px;">${
        options.ctaLabel ?? "View"
      }</a>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:${colors.background};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:18px;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;letter-spacing:1px;color:${colors.foreground};">SAMSARAFILMSS</span>
                <div style="height:3px;width:32px;background:${colors.warm};margin-top:8px;line-height:0;font-size:0;">&nbsp;</div>
              </td>
            </tr>
            <tr>
              <td style="background:${colors.surface};border:1px solid ${colors.border};border-radius:4px;padding:26px;">
                <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${colors.foreground};">
                  ${textToParagraphs(bodyText)}
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0">${cta}</table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:18px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:12px;color:${colors.muted};">
                Samsarafilmss &middot; Nature, adventure &amp; wedding photography
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
