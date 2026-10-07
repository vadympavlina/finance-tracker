import {
  ArrowLeftRight,
  Baby,
  Banknote,
  Bike,
  Book,
  Briefcase,
  Building2,
  Bus,
  Car,
  Cat,
  Coffee,
  Coins,
  CreditCard,
  Droplet,
  Dumbbell,
  Ellipsis,
  Film,
  Flame,
  Fuel,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Lightbulb,
  Music,
  Package,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Scissors,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  Stethoscope,
  Tag,
  Target,
  Train,
  TreePalm,
  TrendingUp,
  Tv,
  Umbrella,
  Undo2,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Icon registry. Entities store only the key, so data stays serializable
 * and only these icons end up in the bundle.
 */
export const ICONS: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  coffee: Coffee,
  car: Car,
  bus: Bus,
  train: Train,
  fuel: Fuel,
  bike: Bike,
  gamepad: Gamepad2,
  film: Film,
  tv: Tv,
  music: Music,
  home: House,
  sofa: Sofa,
  zap: Zap,
  droplet: Droplet,
  wifi: Wifi,
  lightbulb: Lightbulb,
  flame: Flame,
  'heart-pulse': HeartPulse,
  pill: Pill,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,
  shirt: Shirt,
  'shopping-bag': ShoppingBag,
  scissors: Scissors,
  gem: Gem,
  laptop: Laptop,
  smartphone: Smartphone,
  gift: Gift,
  'graduation-cap': GraduationCap,
  book: Book,
  plane: Plane,
  'tree-palm': TreePalm,
  baby: Baby,
  paw: PawPrint,
  cat: Cat,
  wrench: Wrench,
  package: Package,
  receipt: Receipt,
  briefcase: Briefcase,
  wallet: Wallet,
  banknote: Banknote,
  coins: Coins,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  'hand-coins': HandCoins,
  undo: Undo2,
  tag: Tag,
  sparkles: Sparkles,
  shield: Shield,
  umbrella: Umbrella,
  target: Target,
  'credit-card': CreditCard,
  landmark: Landmark,
  building: Building2,
  'more-horizontal': Ellipsis,
  transfer: ArrowLeftRight,
}

export const CATEGORY_ICON_KEYS = Object.keys(ICONS).filter((k) => k !== 'more-horizontal' && k !== 'transfer')

export function getIcon(key: string | undefined): LucideIcon {
  return (key && ICONS[key]) || Package
}

/** Soft, non-acidic palette for categories, goals and accounts. */
export const PALETTE = [
  '#7C5CFC', // violet
  '#6366F1', // indigo
  '#3B82F6', // blue
  '#0EA5E9', // sky
  '#14B8A6', // teal
  '#10B981', // mint
  '#22C55E', // green
  '#84CC16', // lime
  '#F59E0B', // amber
  '#F97316', // orange
  '#EF4444', // red
  '#EC4899', // pink
  '#A855F7', // purple
  '#8B5E3C', // brown
  '#64748B', // slate
]
