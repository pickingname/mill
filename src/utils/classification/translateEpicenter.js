import epicenterRef from "../../special/epicenterRef.json";

export default function translateEpicenter(unTranslatedEpicenter) {
  const found = epicenterRef.find((item) => item.jp === unTranslatedEpicenter);
  return found ? found.en : unTranslatedEpicenter;
}
