/**
 * Builds the public payment link for a tag: PAYMENT_LINK_BASE_URL + "/@" + tag.
 */
export function buildPaymentLink(baseUrl: string, tag: string): string {
  return `${baseUrl}/@${tag}`;
}

/**
 * The public profile page for a tag lives at the same base URL as the
 * payment link, since PAYMENT_LINK_BASE_URL is the public-facing site's
 * domain, not this API's own.
 */
export function buildProfileLink(baseUrl: string, tag: string): string {
  return `${baseUrl}/@${tag}`;
}

/**
 * The QR view for a tag on the public-facing site, a conventional sub-path
 * off the same profile page.
 */
export function buildQrLink(baseUrl: string, tag: string): string {
  return `${baseUrl}/@${tag}/qr`;
}
