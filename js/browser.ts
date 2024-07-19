export const fetch = window.fetch;

export const reload = () => {
  window.location.reload();
};

export const back = () => {
  history.go(-1);
};
