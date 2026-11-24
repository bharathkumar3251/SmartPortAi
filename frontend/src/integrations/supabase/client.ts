/**
 * SmartPort AI — SQLite + FastAPI Client Adapter
 * 
 * Drop-in isomorphic adapter providing 100% compatibility with the frontend's
 * database, RPC, and authentication queries while directing all persistence
 * to the Python FastAPI backend backed by SQLite (smartport.db).
 */

const API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env.VITE_API_URL) ||
  "http://localhost:8000/api";

const TOKEN_KEY = "smartport.token";
const USER_KEY = "smartport.user";

export function getLocalToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setLocalSession(token: string | null, user: any | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getLocalUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

type AuthListener = (event: string, session: any) => void;
const authListeners = new Set<AuthListener>();

function notifyAuthChange(event: string, session: any) {
  authListeners.forEach((fn) => {
    try {
      fn(event, session);
    } catch (e) {
      console.error("[AuthListener]", e);
    }
  });
}

class QueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: any; count?: number | null }> {
  private table: string;
  private filters: Record<string, string> = {};
  private selectedColumns: string = "*";
  private limitCount?: number;
  private offsetCount?: number;
  private orderColumn?: string;
  private orderDescending: boolean = false;
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private bodyData?: any;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = "*", _options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): this {
    this.method = "GET";
    this.selectedColumns = columns;
    return this;
  }

  insert(data: any): this {
    this.method = "POST";
    this.bodyData = data;
    return this;
  }

  update(data: any): this {
    this.method = "PATCH";
    this.bodyData = data;
    return this;
  }

  delete(): this {
    this.method = "DELETE";
    return this;
  }

  eq(column: string, value: any): this {
    this.filters[column] = `eq.${value}`;
    return this;
  }

  neq(column: string, value: any): this {
    this.filters[column] = `neq.${value}`;
    return this;
  }

  in(column: string, values: any[]): this {
    this.filters[column] = `in.(${values.join(",")})`;
    return this;
  }

  is(column: string, value: any): this {
    this.filters[column] = `is.${value === null ? "null" : value}`;
    return this;
  }

  not(column: string, operator: string, value: any): this {
    if (operator === "is" && value === null) {
      this.filters[column] = "is.not.null";
    } else {
      this.filters[column] = `not.${operator}.${value}`;
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.orderColumn = column;
    this.orderDescending = options?.ascending === false;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  maybeSingle(): this {
    this.isMaybeSingle = true;
    return this;
  }

  async execute(): Promise<{ data: T | null; error: any; count?: number | null }> {
    try {
      const url = new URL(`${API_BASE}/db/${this.table}`);

      // Query parameters
      if (this.selectedColumns && this.selectedColumns !== "*") {
        url.searchParams.set("select", this.selectedColumns);
      }
      for (const [k, v] of Object.entries(this.filters)) {
        url.searchParams.set(k, v);
      }
      if (this.limitCount !== undefined) {
        url.searchParams.set("limit", String(this.limitCount));
      }
      if (this.offsetCount !== undefined) {
        url.searchParams.set("offset", String(this.offsetCount));
      }
      if (this.orderColumn) {
        url.searchParams.set("order", `${this.orderColumn}.${this.orderDescending ? "desc" : "asc"}`);
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = getLocalToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url.toString(), {
        method: this.method,
        headers,
        body: this.bodyData !== undefined ? JSON.stringify(this.bodyData) : undefined,
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j.detail || j.message || msg;
        } catch { }
        return { data: null, error: { message: msg, status: res.status } };
      }

      const json = await res.json();
      let data = json;

      if (this.isSingle) {
        if (!Array.isArray(data) || data.length === 0) {
          return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", details: "The result contains 0 rows" } };
        }
        data = data[0];
      } else if (this.isMaybeSingle) {
        data = Array.isArray(data) && data.length > 0 ? data[0] : null;
      }

      return { data, error: null, count: Array.isArray(json) ? json.length : null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Network error" } };
    }
  }

  then<TResult1 = { data: T | null; error: any; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from: <T = any>(table: string) => new QueryBuilder<T>(table),

  rpc: async (funcName: string, args: Record<string, any> = {}) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = getLocalToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/rpc/${funcName}`, {
        method: "POST",
        headers,
        body: JSON.stringify(args),
      });

      if (!res.ok) {
        let msg = `RPC failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j.detail || j.message || msg;
        } catch { }
        return { data: null, error: { message: msg } };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Network error" } };
    }
  },

  channel: (_name: string) => {
    const ch: any = {
      on: (_event: string, _filter: any, _callback?: any) => ch,
      subscribe: () => ch,
      unsubscribe: () => { },
    };
    return ch;
  },

  removeChannel: (_channel: any) => { },

  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          let detail = "Invalid email or password";
          try {
            const j = await res.json();
            detail = j.detail || detail;
          } catch { }
          return { data: { user: null, session: null }, error: { message: detail } };
        }

        const data = await res.json();
        const user = data.user;
        const session = {
          access_token: data.access_token,
          token_type: "bearer" as const,
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          user,
        };

        setLocalSession(data.access_token, user);
        notifyAuthChange("SIGNED_IN", session);

        return { data: { user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err?.message || "Network error" } };
      }
    },

    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            first_name: options?.data?.first_name,
            last_name: options?.data?.last_name,
            organization: options?.data?.organization,
            requested_role: options?.data?.requested_role,
          }),
        });

        if (!res.ok) {
          let detail = "Registration failed";
          try {
            const j = await res.json();
            detail = j.detail || detail;
          } catch { }
          return { data: { user: null, session: null }, error: { message: detail } };
        }

        const data = await res.json();
        const user = data.user;
        const session = {
          access_token: data.access_token,
          token_type: "bearer" as const,
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          user,
        };

        setLocalSession(data.access_token, user);
        notifyAuthChange("SIGNED_IN", session);

        return { data: { user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err?.message || "Network error" } };
      }
    },

    signOut: async (_options?: any) => {
      try {
        const token = getLocalToken();
        if (token) {
          void fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => { });
        }
      } finally {
        setLocalSession(null, null);
        notifyAuthChange("SIGNED_OUT", null);
      }
      return { error: null };
    },

    getSession: async () => {
      const token = getLocalToken();
      const user = getLocalUser();
      if (!token || !user) {
        return { data: { session: null }, error: null };
      }
      return {
        data: {
          session: {
            access_token: token,
            token_type: "bearer" as const,
            refresh_token: "mock-refresh-token",
            expires_in: 3600,
            user,
          },
        },
        error: null,
      };
    },

    setSession: async ({ access_token, refresh_token }: { access_token: string; refresh_token?: string }) => {
      const user = getLocalUser();
      setLocalSession(access_token, user);
      const session = {
        access_token,
        token_type: "bearer" as const,
        refresh_token: refresh_token || "mock-refresh-token",
        expires_in: 3600,
        user,
      };
      notifyAuthChange("TOKEN_REFRESHED", session);
      return { data: { session, user }, error: null };
    },

    getUser: async () => {
      const user = getLocalUser();
      if (!user) {
        return { data: { user: null }, error: null };
      }
      return { data: { user }, error: null };
    },

    resetPasswordForEmail: async (_email: string, _options?: any): Promise<{ data: any; error: { message: string } | null }> => {
      return { data: {}, error: null };
    },

    updateUser: async (updates: any): Promise<{ data: { user: any }; error: { message: string } | null }> => {
      const current = getLocalUser() || {};
      const updated = { ...current, ...updates };
      setLocalSession(getLocalToken(), updated);
      return { data: { user: updated }, error: null };
    },

    resend: async (_params: any): Promise<{ data: any; error: { message: string } | null }> => {
      return { data: {}, error: null };
    },

    onAuthStateChange: (callback: AuthListener) => {
      authListeners.add(callback);
      setTimeout(() => {
        const token = getLocalToken();
        const user = getLocalUser();
        const session = token && user ? {
          access_token: token,
          token_type: "bearer" as const,
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          user
        } : null;
        callback(session ? "INITIAL_SESSION" : "SIGNED_OUT", session);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  },

  storage: {
    from: (_bucket: string) => ({
      upload: async (path: string, file: File | Blob) => {
        try {
          const form = new FormData();
          const parts = path.split("/");

          let submissionId = "general";
          let docType = "vessel_arrival_notice";

          // Format from app.documents.tsx: `${userId}/${submissionId}/${docType}-${Date.now()}-${filename}`
          if (parts.length >= 3) {
            submissionId = parts[1];
            const filePart = parts[2];
            const typeMatch = filePart.match(/^([a-zA-Z0-9_]+)-/);
            if (typeMatch) docType = typeMatch[1];
          } else if (parts.length === 2) {
            submissionId = parts[0];
            const filePart = parts[1];
            const typeMatch = filePart.match(/^([a-zA-Z0-9_]+)-/);
            if (typeMatch) docType = typeMatch[1];
          } else if (parts.length === 1 && parts[0]) {
            submissionId = parts[0];
          }

          if (!submissionId || submissionId === "undefined" || submissionId === "null") {
            submissionId = "general";
          }

          form.append("submission_id", submissionId);
          form.append("doc_type", docType);
          form.append("file", file);

          const token = getLocalToken();
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(`${API_BASE}/documents/upload`, {
            method: "POST",
            headers,
            body: form,
          });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.detail || `Upload failed (Status ${res.status})`);
          }
          const j = await res.json();
          return { data: { path: j.storage_path, id: j.id }, error: null };
        } catch (e: any) {
          return { data: null, error: { message: e.message || "Upload failed" } };
        }
      },

      download: async (path: string) => {
        try {
          const token = getLocalToken();
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(path)}/download`, { headers });
          if (!res.ok) throw new Error("Download failed");
          const blob = await res.blob();
          return { data: blob, error: null };
        } catch (e: any) {
          return { data: null, error: { message: e.message } };
        }
      },

      remove: async (paths: string[]) => {
        return { data: paths, error: null };
      },

      getPublicUrl: (path: string) => {
        return {
          data: {
            publicUrl: `${API_BASE}/documents/${encodeURIComponent(path)}/download`,
          },
        };
      },
    }),
  },
};
