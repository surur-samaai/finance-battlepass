/**
 * Credentialed CORS allowlist for the browser client.
 * Supports local dev, production CLIENT_URL, and Netlify branch/deploy previews.
 */
export function isAllowedCorsOrigin(origin: string, clientUrl: string): boolean {
  if (origin === clientUrl) {
    return true;
  }
  if (/^http:\/\/localhost:\d+$/.test(origin)) {
    return true;
  }
  return isNetlifyPreviewOrigin(origin, clientUrl);
}

function isNetlifyPreviewOrigin(origin: string, clientUrl: string): boolean {
  let clientHostname: string;
  let originHostname: string;
  try {
    const client = new URL(clientUrl);
    const request = new URL(origin);
    if (client.protocol !== "https:" || request.protocol !== "https:") {
      return false;
    }
    clientHostname = client.hostname;
    originHostname = request.hostname;
  } catch {
    return false;
  }

  if (!clientHostname.endsWith(".netlify.app")) {
    return false;
  }

  if (originHostname === clientHostname) {
    return true;
  }

  // e.g. deploy-preview-42--myapp.netlify.app or feature--myapp.netlify.app
  return originHostname.endsWith(`--${clientHostname}`);
}
