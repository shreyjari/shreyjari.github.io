export const FULL_NAME = "Shrey Jariwala";
export const LINKEDIN_URL = "https://www.linkedin.com/in/shrey-jariwala-pmp%C2%AE-98b236206";
export const SITE_URL = "https://shreyjariwala.github.io/";

function escapeVCardValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildVCard() {
  const [first, ...rest] = FULL_NAME.split(" ");
  const last = rest.join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(last)};${escapeVCardValue(first)};;;`,
    `FN:${escapeVCardValue(FULL_NAME)}`,
    `URL:${LINKEDIN_URL}`,
    `URL:${SITE_URL}`,
    "END:VCARD",
  ];
  return lines.join("\r\n") + "\r\n";
}
