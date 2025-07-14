export const removeLeadingZero = (str: string) => {
  return str.replace(/^0+/, "");
};

export const capitalizeFirstLetter = (str: string | null | undefined) => {
  if (str === undefined || str === null) {
    return undefined;
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
