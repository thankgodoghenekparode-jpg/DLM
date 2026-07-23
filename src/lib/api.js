const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this._onSessionExpired = null;
  }

  onSessionExpired(cb) {
    this._onSessionExpired = cb;
  }

  getToken() {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("dlm_session");
    if (!stored) return null;
    try {
      return JSON.parse(stored).accessToken;
    } catch {
      return null;
    }
  }

  getRefreshToken() {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("dlm_session");
    if (!stored) return null;
    try {
      return JSON.parse(stored).refreshToken;
    } catch {
      return null;
    }
  }

  setSession(accessToken, refreshToken, user) {
    localStorage.setItem("dlm_session", JSON.stringify({ accessToken, refreshToken, user }));
  }

  clearSession() {
    localStorage.removeItem("dlm_session");
  }

  getSession() {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("dlm_session");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  async request(method, path, body, retries = 0) {
    const token = this.getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      if (retries < 1 && (err.name === "AbortError" || err.message?.includes("fetch"))) {
        return this.request(method, path, body, retries + 1);
      }
      throw err;
    }
    clearTimeout(timeout);

    if (res.status === 401 || res.status === 403) {
      const session = this.getSession();
      if (session?.refreshToken) {
        try {
          const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            this.setSession(data.accessToken, data.refreshToken, data.user);
            const retryHeaders = { "Content-Type": "application/json" };
            if (data.accessToken) retryHeaders["Authorization"] = `Bearer ${data.accessToken}`;
            const retryRes = await fetch(`${this.baseUrl}${path}`, {
              method,
              headers: retryHeaders,
              body: body ? JSON.stringify(body) : undefined,
            });
            if (!retryRes.ok) {
              const err = await retryRes.json().catch(() => ({ message: "Request failed" }));
              throw new Error(err.message || err.error || "Request failed");
            }
            return retryRes.json();
          }
        } catch {
          // refresh failed, fall through
        }
        this.clearSession();
        if (this._onSessionExpired) this._onSessionExpired();
        throw new Error("Session expired");
      }
      // No session — let normal error handling process the 401/403 response
      this.clearSession();
      if (this._onSessionExpired) this._onSessionExpired();
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || err.error || "Request failed");
    }

    if (res.status === 204) return null;
    return res.json();
  }

  get(path) { return this.request("GET", path); }
  post(path, body) { return this.request("POST", path, body); }
  patch(path, body) { return this.request("PATCH", path, body); }
  delete(path) { return this.request("DELETE", path); }
}

export const api = new ApiClient();
