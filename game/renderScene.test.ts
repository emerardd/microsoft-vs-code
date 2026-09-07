import { describe, expect, it, vi } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants';
import { renderPausedFrame } from './renderScene';

const createStubContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  fillStyle: '',
  font: '',
  textAlign: 'left' as CanvasTextAlign,
});

const render = (
  ctx: ReturnType<typeof createStubContext>,
  showPauseMessage: boolean,
  frozenFrame: CanvasImageSource | null = null,
) => renderPausedFrame(
  ctx as unknown as CanvasRenderingContext2D,
  showPauseMessage,
  frozenFrame,
);

describe('paused frame', () => {
  it('repaints the frozen frame before dimming so the overlay cannot stack', () => {
    const ctx = createStubContext();
    const frozenFrame = {} as CanvasImageSource;

    render(ctx, true, frozenFrame);

    expect(ctx.drawImage).toHaveBeenCalledWith(
      frozenFrame,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );
    expect(ctx.drawImage.mock.invocationCallOrder[0])
      .toBeLessThan(ctx.fillRect.mock.invocationCallOrder[0]);
  });

  it('still dims the canvas when no frozen frame is available', () => {
    const ctx = createStubContext();

    render(ctx, false);

    expect(ctx.drawImage).not.toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });
});
