/** Base class for test spy management across component test support files. */
export abstract class BaseSpies {
  protected spies: Record<string, jest.SpyInstance> = {};

  /** Cleanup after each jest test - resets all mocks */
  public afterEach(): void {
    jest.resetAllMocks();
  }

  /** Cleanup after all jest tests - restores all mocks */
  public afterAll(): void {
    jest.restoreAllMocks();
  }

  /** Override to set mockImplementation/mockReturnValue for spy instances */
  public abstract setupMockImplementations(): void;

  /**
   * Register a spy instance for automatic cleanup
   *
   * @param module the module containing the method to spy on.
   * @param method the method name to spy on.
   * @param impl optional mock implementation.
   * @return the created spy instance.
   */
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
}
