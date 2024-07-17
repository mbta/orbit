export type BadgeMethod = "manual" | "nfc";

export type BadgeEntry = {
  number: string;
  method: BadgeMethod;
};
