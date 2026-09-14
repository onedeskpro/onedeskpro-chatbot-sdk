import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChatWidget } from '../widget/widget';

type WidgetInternals = {
  input: HTMLInputElement;
  sendBtn: HTMLButtonElement;
  shadow: ShadowRoot;
};

function internals(widget: ChatWidget): WidgetInternals {
  return widget as unknown as WidgetInternals;
}

describe('ChatWidget input focus after send', () => {
  let widget: ChatWidget;

  beforeEach(() => {
    document.body.innerHTML = '';
    widget = new ChatWidget(
      { apiKey: 'test', chatbotName: 'Test' },
      {
        onSend: () => {},
        onIdentify: () => {},
        onOpen: () => {},
        onClose: () => {},
        onReset: () => {},
      },
    );
    widget.readyToChat({ apiKey: 'test', chatbotName: 'Test' });
    widget.open();
  });

  afterEach(() => {
    widget.destroy();
  });

  it('does not disable the input or steal focus while loading', () => {
    const { input, sendBtn, shadow } = internals(widget);
    input.focus();
    expect(shadow.activeElement).toBe(input);

    widget.setLoading(true);

    expect(input.disabled).toBe(false);
    expect(sendBtn.disabled).toBe(true);
    expect(shadow.activeElement).toBe(input);
  });

  it('restores input focus when loading ends', () => {
    const { input, shadow } = internals(widget);
    input.focus();
    widget.setLoading(true);
    widget.setLoading(false);

    expect(input.disabled).toBe(false);
    expect(shadow.activeElement).toBe(input);
  });
});
