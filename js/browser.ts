export const fetch = window.fetch;

export const reload = () => {
  window.location.reload();
};

/**
 * Socket and API connections can fail for all sorts of reasons, and the resulting errors may not
 * be helpful. This utility function checks to see if `/_health` works, to distinguish between
 * deliberate Orbit failures or internet connection outages.
 */
export const canReachOrbit = async (): Promise<boolean> => {
  try {
    const cancel = new AbortController();
    setTimeout(() => {
      cancel.abort();
    }, 3000);
    const response = await fetch("/_health", { signal: cancel.signal });
    return response.ok;
  } catch (_) {
    return false;
  }
};
