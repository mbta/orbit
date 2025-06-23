import { MutableRefObject, useEffect, useRef } from "react";

// https://stackoverflow.com/a/77753024
export function useClickOutside(
  elementRefs: MutableRefObject<HTMLElement | null>[],
  callback: (event: MouseEvent) => void,
): void {
  const callbackRef = useRef(callback);
  // eslint-disable-next-line better-mutation/no-mutation
  callbackRef.current = callback;
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target;
      if (
        !(target instanceof Node) ||
        elementRefs.every((elementRef) => !elementRef.current?.contains(target))
      ) {
        callbackRef.current(event);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [elementRefs]);
}
