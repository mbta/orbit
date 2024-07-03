export const mockNDEFReader = (): {
  mockScan: jest.Mocked<() => Promise<void>>;
} => {
  const mockScan = jest.fn(
    () =>
      new Promise<void>(() => {
        return;
      }),
  );

  // eslint-disable-next-line better-mutation/no-mutating-functions
  Object.defineProperty(window, "NDEFReader", {
    writable: true,
    value: function (): jest.Mocked<NDEFReader> {
      return {
        onreading: jest.fn(),
        onreadingerror: jest.fn(),
        scan: mockScan,
        write: jest.fn(),
        makeReadOnly: jest.fn(),

        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        removeEventListener: jest.fn(),
      };
    },
  });

  return { mockScan };
};
