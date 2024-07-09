export const fetch: typeof window.fetch = window.fetch;

export const reload: typeof window.location.reload = () => {
  window.location.reload();
};
