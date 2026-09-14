import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitorTokenManager } from '../session-manager';

const KEY = 'onedeskpro_visitor_token';
const SCOPED_KEY = 'onedeskpro_visitor_token:agent-1';

describe('VisitorTokenManager', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('persists a visitor token', () => {
    const m = new VisitorTokenManager();
    m.set('sv_abc');
    expect(m.get()).toBe('sv_abc');
    expect(localStorage.getItem(KEY)).toBe('sv_abc');
  });

  it('reuses a token already in storage', () => {
    localStorage.setItem(KEY, 'existing-token');
    const m = new VisitorTokenManager();
    m.setScope(null);
    expect(m.get()).toBe('existing-token');
  });

  it('scopes tokens by agent id', () => {
    const m = new VisitorTokenManager();
    m.setScope('agent-1');
    m.set('sv_scoped');
    expect(localStorage.getItem(SCOPED_KEY)).toBe('sv_scoped');
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('clear() removes the stored token', () => {
    const m = new VisitorTokenManager();
    m.set('sv_abc');
    m.clear();
    expect(m.get()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  // Safari private mode, blocked site data and sandboxed iframes throw on *access*,
  // not just on write — a `typeof window` guard does not catch this.
  describe('when localStorage is unavailable', () => {
    const throwing = {
      get getItem(): never { throw new DOMException('insecure', 'SecurityError'); },
      get setItem(): never { throw new DOMException('insecure', 'SecurityError'); },
      get removeItem(): never { throw new DOMException('insecure', 'SecurityError'); },
    };

    it('still keeps an in-memory token instead of throwing', () => {
      vi.stubGlobal('localStorage', throwing);
      const m = new VisitorTokenManager();
      expect(() => m.set('sv_mem')).not.toThrow();
      expect(m.get()).toBe('sv_mem');
    });

    it('survives clear() too', () => {
      vi.stubGlobal('localStorage', throwing);
      const m = new VisitorTokenManager();
      m.set('sv_mem');
      expect(() => m.clear()).not.toThrow();
      expect(m.get()).toBeNull();
    });
  });
});
