/**
 * One icon language for the whole catalog: 24px grid, 2px round strokes, currentColor.
 * Lucide covers most things; the drawings below fill gaps lucide doesn't have
 * (Indian kitchen items, home textiles, faith items). Items store an icon key, never an emoji.
 */
import type { SVGProps } from "react";
import {
  Armchair,
  Baby,
  Bath,
  BedDouble,
  BedSingle,
  Bike,
  Blinds,
  BookOpen,
  Camera,
  Car,
  Citrus,
  Clock,
  Coffee,
  Coins,
  CookingPot,
  Droplets,
  Dumbbell,
  Flower2,
  Frame,
  Gem,
  Gift,
  GlassWater,
  HandHeart,
  Headphones,
  House,
  Lamp,
  Laptop,
  Luggage,
  Microwave,
  Music,
  PawPrint,
  Plane,
  Refrigerator,
  Sandwich,
  Shirt,
  Smartphone,
  Sofa,
  Soup,
  Sprout,
  TreePalm,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type P = SVGProps<SVGSVGElement>;
type IconComponent = LucideIcon | ((p: P) => React.ReactElement);

function Svg({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      {children}
    </svg>
  );
}

const Mixer = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 14 6.5 4h10l-1 10" />
    <path d="M16.5 6h2v5h-2.4" />
    <rect x="5" y="14" width="13" height="7" rx="2" />
    <circle cx="11.5" cy="17.5" r="1" />
  </Svg>
);
const PressureCooker = (p: P) => (
  <Svg {...p}>
    <path d="M4 12h15v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5Z" />
    <path d="M4 12a7.5 3 0 0 1 15 0" />
    <path d="M19 12.5h3" />
    <path d="M11.5 9V6.5M10 6.5h3" />
  </Svg>
);
const SteelSet = (p: P) => (
  <Svg {...p}>
    <path d="M3 12h18a9 7 0 0 1-18 0Z" />
    <path d="M5.5 8h13" />
    <path d="M8 4.5h8" />
  </Svg>
);
const SpiceBox = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="6.5" r="1.6" />
    <circle cx="17.2" cy="10.3" r="1.6" />
    <circle cx="15.2" cy="16.4" r="1.6" />
    <circle cx="8.8" cy="16.4" r="1.6" />
    <circle cx="6.8" cy="10.3" r="1.6" />
  </Svg>
);
const AirFryer = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="18" rx="4" />
    <rect x="8" y="11" width="8" height="6" rx="1.5" />
    <circle cx="12" cy="7" r="1.3" />
  </Svg>
);
const Kettle = (p: P) => (
  <Svg {...p}>
    <path d="M7 20.5 8 9h8l1 11.5Z" />
    <path d="M8.5 12.5 4.5 9.5" />
    <path d="M16.3 10.5c3 0 3 6 .5 6.5" />
    <path d="M10 9a2 2 0 0 1 4 0" />
    <path d="M5.5 20.5h13" />
  </Svg>
);
const Iron = (p: P) => (
  <Svg {...p}>
    <path d="M3 17h17.5v-1.5A6.5 6.5 0 0 0 14 9H8" />
    <path d="M8 9V6h7.5a2 2 0 0 1 2 2" />
    <path d="M3 17c0-4 2.5-8 5-8" />
  </Svg>
);
const Vacuum = (p: P) => (
  <Svg {...p}>
    <circle cx="7" cy="17" r="4" />
    <path d="M10 14.5c4.5-2 6-6 6-11.5" />
    <path d="M14 3h5" />
    <path d="M3 21h8" />
  </Svg>
);
const Quilt = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 12h18M12 5v14" />
    <path d="m6 8 2 2m8-2 2 2m-12 4 2 2m8-2 2 2" />
  </Svg>
);
const Pillow = (p: P) => (
  <Svg {...p}>
    <path d="M5 6.5c3-1.5 11-1.5 14 0 1.5 3.5 1.5 7.5 0 11-3 1.5-11 1.5-14 0-1.5-3.5-1.5-7.5 0-11Z" />
    <path d="M8 12h8" />
  </Svg>
);
const Towel = (p: P) => (
  <Svg {...p}>
    <path d="M6 3h12v18H6z" />
    <path d="M6 7h12M6 17h12" />
    <path d="M9 3V1.5M15 3V1.5" />
  </Svg>
);
const Rug = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="5" width="16" height="14" rx="1" />
    <path d="M7 5V3m3.3 2V3m3.4 2V3M17 5V3M7 21v-2m3.3 2v-2m3.4 2v-2m3.3 2v-2" />
    <path d="m12 8.5 3 3.5-3 3.5-3-3.5Z" />
  </Svg>
);
const Lamp2 = (p: P) => (
  <Svg {...p}>
    <path d="M3 13.5c0 4 4 6.5 9 6.5s9-2.5 9-6.5Z" />
    <path d="M21 13.5 22.5 12" />
    <path d="M12 3.5c1.6 2 2 3.6 0 6-2-2.4-1.6-4 0-6Z" />
  </Svg>
);
const Tray = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="10" cy="10.5" r="1" />
    <circle cx="14" cy="10.5" r="1" />
    <path d="M10 14.5h4" />
  </Svg>
);
const Shrine = (p: P) => (
  <Svg {...p}>
    <path d="M5 21h14" />
    <path d="M6 21V12h12v9" />
    <path d="M6 12 12 4l6 8" />
    <path d="M10 21v-3.5a2 2 0 0 1 4 0V21" />
  </Svg>
);
const PrayerMat = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="2.5" width="12" height="19" rx="1" />
    <path d="M9 17v-6a3 3 0 0 1 6 0v6Z" />
  </Svg>
);
const BookStand = (p: P) => (
  <Svg {...p}>
    <path d="M3 7.5 12 11l9-3.5" />
    <path d="M3 4.5 12 8l9-3.5" />
    <path d="m6 21 12-9.5M18 21 6 11.5" />
  </Svg>
);
const CrossMark = (p: P) => (
  <Svg {...p}>
    <path d="M12 2.5v19M7 8h10" />
  </Svg>
);
const CandleIcon = (p: P) => (
  <Svg {...p}>
    <rect x="8.5" y="10" width="7" height="11" rx="1" />
    <path d="M12 2.5c1.3 1.7 1.7 3.2 0 5.3-1.7-2.1-1.3-3.6 0-5.3Z" />
    <path d="M6 21h12" />
  </Svg>
);
const Cooktop = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="12" r="3.2" />
    <circle cx="16.5" cy="10.5" r="1.8" />
    <path d="M15.5 16h2" />
  </Svg>
);
const GasStove = (p: P) => (
  <Svg {...p}>
    <rect x="2" y="12.5" width="20" height="7.5" rx="2" />
    <circle cx="7" cy="9" r="2.5" />
    <circle cx="17" cy="9" r="2.5" />
    <circle cx="7" cy="16.3" r=".6" />
    <circle cx="12" cy="16.3" r=".6" />
    <circle cx="17" cy="16.3" r=".6" />
  </Svg>
);
const WetGrinder = (p: P) => (
  <Svg {...p}>
    <path d="M5 9h14v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9Z" />
    <path d="M5 9a7 2.5 0 0 1 14 0" />
    <path d="M12 6.5V3M10 3h4" />
  </Svg>
);
const Cloth = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="1" />
    <path d="M3.5 8.5h17M3.5 15.5h17" />
    <path d="M8 12h.01M12 12h.01M16 12h.01" />
  </Svg>
);
const DinnerSet = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M1.5 6v4.5a1.5 1.5 0 0 0 3 0V6M3 12v6" />
    <path d="M22 6c-1.5 0-2.5 1.5-2.5 4h2.5v8" />
  </Svg>
);

/** Every icon a gift or fund can use. Keys are stored in the database. */
export const ICONS = {
  gift: Gift,
  blessing: HandHeart,
  honeymoon: TreePalm,
  travel: Plane,
  home: House,
  fridge: Refrigerator,
  sofa: Sofa,
  chair: Armchair,
  gold: Gem,
  savings: Coins,
  car: Car,
  bike: Bike,
  education: BookOpen,
  music: Music,
  baby: Baby,
  pet: PawPrint,
  laptop: Laptop,
  phone: Smartphone,
  camera: Camera,
  watch: Watch,
  headphones: Headphones,
  fitness: Dumbbell,
  plants: Sprout,
  flowers: Flower2,
  frame: Frame,
  // kitchen
  mixer: Mixer,
  pressureCooker: PressureCooker,
  steelSet: SteelSet,
  dinnerSet: DinnerSet,
  cookware: CookingPot,
  casserole: Soup,
  spiceBox: SpiceBox,
  glassware: GlassWater,
  wetGrinder: WetGrinder,
  gasStove: GasStove,
  teaSet: Coffee,
  cutlery: UtensilsCrossed,
  // appliances
  airFryer: AirFryer,
  juicer: Citrus,
  microwave: Microwave,
  purifier: Droplets,
  cooktop: Cooktop,
  kettle: Kettle,
  sandwichMaker: Sandwich,
  iron: Iron,
  vacuum: Vacuum,
  washingMachine: WashingMachine,
  tv: Tv,
  // home
  bed: BedDouble,
  mattress: BedSingle,
  quilt: Quilt,
  pillow: Pillow,
  towel: Towel,
  bath: Bath,
  curtains: Blinds,
  lamp: Lamp,
  clock: Clock,
  rug: Rug,
  clothes: Shirt,
  luggage: Luggage,
  // faith (shown only when a couple picks a ceremony style)
  oilLamp: Lamp2,
  tray: Tray,
  shrine: Shrine,
  prayerMat: PrayerMat,
  bookStand: BookStand,
  book: BookOpen,
  cross: CrossMark,
  candle: CandleIcon,
  cloth: Cloth,
} satisfies Record<string, IconComponent>;

export type IconKey = keyof typeof ICONS;

export function isIconKey(k: string | null | undefined): k is IconKey {
  return !!k && k in ICONS;
}

/** Icons offered when a couple adds their own gift or fund. */
export const PICKER_ICONS: IconKey[] = [
  "gift", "blessing", "honeymoon", "travel", "home", "fridge", "sofa", "gold", "savings", "car", "bike", "education",
  "music", "baby", "pet", "laptop", "phone", "camera", "watch", "fitness", "plants", "frame", "cookware", "mixer",
  "dinnerSet", "teaSet", "airFryer", "tv", "washingMachine", "bed", "quilt", "lamp", "rug", "luggage",
];

/** "airFryer" → "Air fryer", for screen readers. */
export function iconLabel(k: string): string {
  const words = k.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function GiftIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const C: IconComponent = isIconKey(name) ? ICONS[name] : Gift;
  return <C className={cn("size-6", className)} aria-hidden />;
}
