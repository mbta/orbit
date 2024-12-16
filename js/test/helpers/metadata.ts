import { MetaDataKey } from "../../util/metadata";

export const putMetaData = (key: MetaDataKey, value: string) => {
  for (const el of document.head.querySelectorAll(`meta[name=${key}]`)) {
    el.remove();
  }
  const newMeta = document.createElement("meta");
  newMeta.name = key;
  newMeta.content = value;
  document.head.append(newMeta);
};
