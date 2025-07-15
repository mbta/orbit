export const removeLeadingZero = (str: string) => {
  return str.replace(/^0+/, "");
};

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
