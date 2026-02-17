export type SpriteDefinition = {
  sheet: string;
  sheetWidth: number;
  sheetHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Default sprite sheets. You can add more or change paths as needed.
const DEFAULT_SHEET = "/cars/car_sprite_02.png";
const ALT_SHEET = "/cars/car_sprite_03.png";

// Map sprite keys to their sheet and rect within that sheet.
const SPRITE_MAP: Record<string, SpriteDefinition> = {
  // car1: measured rect on DEFAULT_SHEET: 137, 109, 179 x 335
  car1: {
    sheet: DEFAULT_SHEET,
    sheetWidth: 1024,
    sheetHeight: 1536,
    x: 137,
    y: 109,
    width: 179,
    height: 335,
  },
  // Example: car2 using the same sheet and rect for now.
  car2: {
    sheet: DEFAULT_SHEET,
    sheetWidth: 1024,
    sheetHeight: 1536,
    x: 137,
    y: 109,
    width: 179,
    height: 335,
  },
  // Example: car3 coming from a different sprite sheet.
  car3: {
    sheet: ALT_SHEET,
    sheetWidth: 1024,
    sheetHeight: 1536,
    x: 137,
    y: 109,
    width: 179,
    height: 335,
  },
};

const DEFAULT_KEY = "car1";

export function getSpriteForKey(key?: string | null): SpriteDefinition {
  const resolved = key || DEFAULT_KEY;
  return SPRITE_MAP[resolved] || SPRITE_MAP[DEFAULT_KEY];
}
