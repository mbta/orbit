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

export const putEnabledFeatures = (features: string[]) => {
  const data = Object.fromEntries(features.map((x) => [x, true]));
  putMetaData("laboratoryFeatures", JSON.stringify(data));
};

export const resetMetaData = () => {
  for (const el of document.head.querySelectorAll("meta")) {
    el.remove();
  }
};
