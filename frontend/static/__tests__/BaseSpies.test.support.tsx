/** Base class for test spy management across component test support files. */
export abstract class BaseSpies {
  protected spies: Record<string, jest.SpyInstance> = {};

  /** Override to set mockImplementation/mockReturnValue for spy instances */
  abstract setupMockImplementations(): void;

  /** Register a spy instance for automatic cleanup */
  protected createSpy<T extends {}, M extends jest.FunctionPropertyNames<Required<T>>>(
    module: T,
    method: M,
    impl?: (...args: any[]) => any,
  ): jest.SpyInstance {
    const spy = jest.spyOn(module, method as any);
    if (impl) {
      spy.mockImplementation(impl);
    }
    this.spies[method as string] = spy;
    return spy;
  }

  /** Cleanup after each jest test - resets all mocks */
  public afterEach(): void {
    jest.resetAllMocks();
  }

  /** Cleanup after all jest tests - restores all mocks */
  public afterAll(): void {
    jest.restoreAllMocks();
  }
}
