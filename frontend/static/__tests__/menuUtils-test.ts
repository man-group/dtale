import { openMenu } from '../menuUtils';

describe('menuUtils tests', () => {
  let addEventListenerSpy: jest.SpyInstance<
    void,
    [
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions | undefined,
    ]
  >;
  let removeEventListenerSpy: jest.SpyInstance<
    void,
    [
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions | undefined,
    ]
  >;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(jest.restoreAllMocks);

  it('menuUtils: testing exceptions', () => {
    const open = jest.fn();
    const close = jest.fn();
    const opener = openMenu(open, close, { current: null });
    const event: MouseEvent = Object.assign({}, new MouseEvent('click'), {
      target: 'test_target',
    });
    opener(event);

    const event2: MouseEvent = Object.assign({}, new MouseEvent('click'), {
      target: 'test_target2',
    });
    (addEventListenerSpy.mock.calls[0][1] as EventListener)(event2);
    expect(open).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', addEventListenerSpy.mock.calls[0][1]);
  });
});
