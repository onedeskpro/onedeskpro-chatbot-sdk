import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionManager } from '../session-manager';

const KEY = 'onedeskpro_chatbot_session_id';

describe('SessionManager', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('generates and persists a new session id', () => {
    const id = new SessionManager().init();
    expect(id).toBeTruthy();
    expect(localStorage.getItem(KEY)).toBe(id);
  });

  it('reuses an id already in storage', () => {
    localStorage.setItem(KEY, 'existing-id');
    expect(new SessionManager().init()).toBe('existing-id');
  });

  it('prefers a caller-supplied id and persists it', () => {
    localStorage.setItem(KEY, 'stored');
    expect(new SessionManager().init('explicit')).toBe('explicit');
    expect(localStorage.getItem(KEY)).toBe('explicit');
  });

  it('reset() issues a different id and persists it', () => {
    const m = new SessionManager();
    const first = m.init();
    const second = m.reset();
    expect(second).not.toBe(first);
    expect(localStorage.getItem(KEY)).toBe(second);
  });

  // Safari private mode, blocked site data and sandboxed iframes throw on *access*,
  // not just on write — a `typeof window` guard does not catch this.
  describe('when localStorage is unavailable', () => {
    const throwing = {
      get getItem(): never { throw new DOMException('insecure', 'SecurityError'); },
      get setItem(): never { throw new DOMException('insecure', 'SecurityError'); },
    };

    it('still produces a working in-memory session instead of throwing', () => {
      vi.stubGlobal('localStorage', throwing);
      const m = new SessionManager();
      const id = m.init();
      expect(id).toBeTruthy();
      expect(m.get()).toBe(id);
    });

    it('survives reset() too', () => {
      vi.stubGlobal('localStorage', throwing);
      const m = new SessionManager();
      m.init();
      expect(() => m.reset()).not.toThrow();
    });
  });
});
