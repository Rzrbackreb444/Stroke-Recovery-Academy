import assert from "node:assert/strict";

export function getSessionCookie(response: Response): string {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies =
    typeof getSetCookie === "function"
      ? getSetCookie.call(response.headers)
      : [response.headers.get("set-cookie") || ""];
  const setCookie = setCookies.find((cookie) => cookie.startsWith("connect.sid=")) || setCookies[0];
  assert.ok(setCookie, "login response did not set a session cookie");
  return setCookie.split(";", 1)[0];
}

export async function requestJson(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  cookie?: string,
): Promise<{ response: Response; body: any }> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Connection", "close");
  // The production session cookie is Secure because Replit terminates TLS at
  // the proxy. Tell Express this local request has already crossed that proxy.
  headers.set("X-Forwarded-Proto", "https");
  if (cookie) headers.set("Cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body };
}

export async function loginWithSession(baseUrl: string, email: string, password: string): Promise<string> {
  const { response, body } = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `login failed: ${JSON.stringify(body)}`);
  return getSessionCookie(response);
}

export async function cleanupDisposableAccount(
  baseUrl: string,
  email: string,
  cookie: string,
): Promise<void> {
  const { response, body } = await requestJson(
    baseUrl,
    "/api/account/delete",
    {
      method: "POST",
      body: JSON.stringify({ confirmEmail: email }),
    },
    cookie,
  );
  if (response.status !== 200 || body?.ok !== true) {
    throw new Error(`disposable account cleanup failed (HTTP ${response.status})`);
  }
}

export type DisposableAccount = {
  label: string;
  email: string;
  cookie: string;
};

export async function cleanupDisposableAccounts(
  baseUrl: string,
  accounts: DisposableAccount[],
): Promise<string[]> {
  const cleanupFailures: string[] = [];
  for (const account of accounts) {
    if (!baseUrl || !account.cookie) {
      cleanupFailures.push(`${account.label} account (authenticated session unavailable)`);
      continue;
    }
    try {
      await cleanupDisposableAccount(baseUrl, account.email, account.cookie);
    } catch {
      // Keep cleanup errors generic: never expose passwords or session values
      // in test output when account deletion cannot be verified.
      cleanupFailures.push(`${account.label} account`);
    }
  }
  return cleanupFailures;
}