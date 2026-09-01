import { describe, expect, it } from 'vitest';
import * as react from '../index';

describe('public API', () => {
  it('exports exactly the documented runtime members', () => {
    expect(Object.keys(react).sort()).toEqual([
      'ChatbotContext',
      'ChatbotHeadless',
      'ChatbotProvider',
      'ChatbotWidget',
      'useChatbot',
    ]);
  });
});
