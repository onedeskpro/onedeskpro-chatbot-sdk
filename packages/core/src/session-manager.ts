const SESSION_KEY = 'onedeskpro_chatbot_session_id';

/**
 * `typeof window !== 'undefined'` is not enough to reach localStorage safely:
 * Safari private mode, blocked site data, and sandboxed iframes all throw a
 * SecurityError on *access*, not just on write. The widget is embedded in
 * third-party pages, so both directions have to degrade to in-memory instead
 * of taking down init().
 */
function readStored(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable or full — the session lives in memory for this page.
  }
}

export class SessionManager {
  private sessionId: string | null = null;

  init(providedSessionId?: string): string {
    if (providedSessionId) {
      this.sessionId = providedSessionId;
      this.persist();
      return this.sessionId;
    }

    const stored = readStored(SESSION_KEY);
    if (stored) {
      this.sessionId = stored;
    } else {
      this.sessionId = this.generateId();
      this.persist();
    }

    return this.sessionId;
  }

  get(): string | null {
    return this.sessionId;
  }

  reset(): string {
    this.sessionId = this.generateId();
    this.persist();
    return this.sessionId;
  }

  private persist(): void {
    if (this.sessionId) writeStored(SESSION_KEY, this.sessionId);
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
