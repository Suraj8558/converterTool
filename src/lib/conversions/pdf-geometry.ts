// PDF pages can carry a rotation flag and a crop box, so what a reader sees differs from
// the coordinates used to draw on the page. These helpers work in "visual" coordinates:
// measured from the bottom-left corner of the page as it appears on screen.

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type QuarterTurn = 0 | 90 | 180 | 270;

export const normalizeRotation = (angle: number): QuarterTurn =>
  ((((Math.round(angle / 90) * 90) % 360) + 360) % 360) as QuarterTurn;

export function visualSize(box: Box, rotation: QuarterTurn) {
  return rotation === 90 || rotation === 270
    ? { width: box.height, height: box.width }
    : { width: box.width, height: box.height };
}

/** Converts a visual position into the page's own drawing coordinates. */
export function visualToPage(vx: number, vy: number, box: Box, rotation: QuarterTurn) {
  switch (rotation) {
    case 90:
      return { x: box.x + box.width - vy, y: box.y + vx };
    case 180:
      return { x: box.x + box.width - vx, y: box.y + box.height - vy };
    case 270:
      return { x: box.x + vy, y: box.y + box.height - vx };
    default:
      return { x: box.x + vx, y: box.y + vy };
  }
}

/** Converts a rectangle measured in visual coordinates into a page box. */
export function visualRectToPageBox(rect: Box, box: Box, rotation: QuarterTurn): Box {
  const a = visualToPage(rect.x, rect.y, box, rotation);
  const b = visualToPage(rect.x + rect.width, rect.y + rect.height, box, rotation);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export type StampPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Finds where to put the bottom-left corner of a stamp, in visual coordinates. */
export function placeStamp(
  position: StampPosition,
  page: { width: number; height: number },
  stamp: { width: number; height: number },
  margin: number
) {
  const [vertical, horizontal] = position === 'center' ? ['center', 'center'] : position.split('-');
  const x =
    horizontal === 'left'
      ? margin
      : horizontal === 'right'
        ? page.width - stamp.width - margin
        : (page.width - stamp.width) / 2;
  const y =
    vertical === 'top'
      ? page.height - stamp.height - margin
      : vertical === 'bottom'
        ? margin
        : (page.height - stamp.height) / 2;
  return { x, y };
}

/** Fits an image inside an area without distorting it, centered. */
export function fitInside(image: { width: number; height: number }, area: Box): Box {
  const scale = Math.min(area.width / image.width, area.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    x: area.x + (area.width - width) / 2,
    y: area.y + (area.height - height) / 2,
    width,
    height,
  };
}

/** The text to print on a page, counting from the chosen starting number. */
export function pageLabel(format: 'number' | 'page-of', index: number, total: number, start: number) {
  const current = index + start;
  return format === 'page-of' ? `Page ${current} of ${total + start - 1}` : String(current);
}
