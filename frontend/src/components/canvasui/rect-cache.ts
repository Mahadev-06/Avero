export function createRectCache(element: HTMLElement | Element) {
  let rect =
    typeof element.getBoundingClientRect === "function"
      ? element.getBoundingClientRect()
      : { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };

  const update = () => {
    if (typeof element.getBoundingClientRect === "function") {
      rect = element.getBoundingClientRect();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });
  }

  return {
    get current() {
      return rect;
    },
    update,
    destroy() {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update);
      }
    },
  };
}
