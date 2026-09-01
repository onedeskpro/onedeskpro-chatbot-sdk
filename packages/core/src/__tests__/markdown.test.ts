import { describe, expect, it } from 'vitest';
import { buildMessageEl } from '../widget/render';

/** Render AI content and hand back the parsed bubble for real DOM assertions. */
function bubble(content: string): HTMLElement {
  const el = buildMessageEl(content, 'ai');
  return el.querySelector('.ttcb-bubble') as HTMLElement;
}

describe('message rendering', () => {
  it('renders human messages as plain text, never as markup', () => {
    const el = buildMessageEl('<b>not bold</b>', 'human');
    const b = el.querySelector('.ttcb-bubble') as HTMLElement;
    expect(b.querySelector('b')).toBeNull();
    expect(b.textContent).toBe('<b>not bold</b>');
  });

  it('renders basic markdown', () => {
    const b = bubble('**bold** and *italic* and [link](https://example.com)');
    expect(b.querySelector('strong')?.textContent).toBe('bold');
    expect(b.querySelector('em')?.textContent).toBe('italic');
    const a = b.querySelector('a') as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('https://example.com');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders headings and lists', () => {
    const b = bubble('## Title\n\n- one\n- two\n\n1. first');
    expect(b.querySelector('h2')?.textContent).toBe('Title');
    expect(b.querySelectorAll('ul li')).toHaveLength(2);
    expect(b.querySelectorAll('ol li')).toHaveLength(1);
  });

  it('keeps inline code inside the paragraph', () => {
    const b = bubble('Use `npm i` to install.');
    expect(b.querySelectorAll('p > code')).toHaveLength(1);
    expect(b.querySelector('pre')).toBeNull();
  });

  // A <pre> inside a <p> is auto-closed by the parser, which breaks bubble layout.
  describe('fenced code is block level', () => {
    const cases: Record<string, string> = {
      'surrounded by blank lines': 'Here:\n\n```js\nconst a = 1;\n```\n\nDone.',
      'with no blank lines': 'Try:\n```\nnpm i\n```\nThen run.',
      'alongside inline code': 'Run `a` then:\n\n```\nb\n```',
      'on its own': '```\nsolo\n```',
    };
    for (const [name, src] of Object.entries(cases)) {
      it(name, () => {
        const b = bubble(src);
        expect(b.querySelectorAll('pre')).toHaveLength(1);
        expect(b.querySelector('p pre')).toBeNull();
      });
    }
  });

  it('escapes markup inside fenced code', () => {
    const b = bubble('```\n<img src=x onerror=alert(1)>\n```');
    expect(b.querySelector('pre code')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(b.querySelector('img')).toBeNull();
  });

  describe('does not execute untrusted content', () => {
    const payloads: Record<string, string> = {
      'script tag': '<script>alert(1)</script>',
      'img onerror': '<img src=x onerror=alert(1)>',
      'svg onload': '<svg onload=alert(1)>',
      'iframe': '<iframe srcdoc="x"></iframe>',
      'single-quoted attribute': "<img src='x' onerror='alert(1)'>",
      'javascript: url': '[click](javascript:alert(1))',
      'data: url': '[click](data:text/html,<script>alert(1)</script>)',
      'quote break out of href': '[x](https://a" onmouseover="alert(1))',
      'escaping out of a code fence': '```\n</code></pre><img src=x onerror=alert(1)>\n```',
      'nested in link text': '[<img src=x onerror=alert(1)>](https://ok.com)',
    };

    for (const [name, payload] of Object.entries(payloads)) {
      it(name, () => {
        const b = bubble(payload);
        expect(b.querySelector('script,iframe,object,embed,svg,img')).toBeNull();
        for (const el of Array.from(b.querySelectorAll('*'))) {
          for (const attr of Array.from(el.attributes)) {
            expect(attr.name.toLowerCase()).not.toMatch(/^on/);
          }
        }
        for (const a of Array.from(b.querySelectorAll('a[href]'))) {
          expect(a.getAttribute('href')).toMatch(/^https?:\/\//);
        }
      });
    }
  });
});
