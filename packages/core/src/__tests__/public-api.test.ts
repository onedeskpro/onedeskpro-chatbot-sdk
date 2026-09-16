import { describe, expect, it } from 'vitest';
import * as core from '../index';

// The published surface is a contract: adding to it is fine, removing or renaming
// is a breaking change, and anything the README promises must actually be here.
describe('public API', () => {
  it('exports exactly the documented runtime members', () => {
    expect(Object.keys(core).sort()).toEqual([
      'ApiClient',
      'ChatbotCore',
      'DEFAULT_API_BASE_URL',
      'DEFAULT_REQUEST_TIMEOUT_MS',
      'EventEmitter',
      'OnedeskProChatbot',
      'SdkSocket',
      'SessionManager',
      'isChatbotRequestError',
      'resolveSdkSocketUrl',
    ]);
  });

  it('exposes the CDN singleton used by the script-tag build', () => {
    expect(typeof core.OnedeskProChatbot.init).toBe('function');
    expect(core.OnedeskProChatbot.getInstance()).toBeNull();
  });

  it('keeps the documented defaults', () => {
    expect(core.DEFAULT_API_BASE_URL).toBe('https://api.onedeskpro.com');
    expect(core.DEFAULT_REQUEST_TIMEOUT_MS).toBe(30_000);
  });
});
