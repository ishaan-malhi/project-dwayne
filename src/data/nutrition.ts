import type { MacroTarget, DayType } from '../types'

export const MACRO_TARGETS: Record<DayType, MacroTarget> = {
  STRENGTH_A: { calories: 2400, protein: 160, carbs: 220, fat: 80 },
  STRENGTH_B: { calories: 2400, protein: 160, carbs: 220, fat: 80 },
  VO2:        { calories: 2350, protein: 160, carbs: 200, fat: 75 },
  ZONE2:      { calories: 2200, protein: 160, carbs: 160, fat: 85 },
  SPEED:      { calories: 2350, protein: 160, carbs: 200, fat: 75 },
  REST:       { calories: 2000, protein: 160, carbs: 120, fat: 85 },
}

export const WATER_TARGET_ML: Record<DayType, number> = {
  STRENGTH_A: 3000,
  STRENGTH_B: 3000,
  VO2:        3000,
  ZONE2:      3000,
  SPEED:      3000,
  REST:       3000,
}

export const MEAL_TIMING: Record<DayType, Record<string, string>> = {
  STRENGTH_A: {
    breakfast: 'Overnight oats + whey, or eggs + sourdough + yogurt bowl',
    midMorning: 'Greek yogurt (200g) + pumpkin seeds',
    lunch: 'Protein + rice + greens (4 hrs pre-session)',
    preSession: 'Banana + rice cakes + PB (60–90 min pre-session)',
    postSession: 'Protein shake or meal within 45 min',
    dinner: 'Protein + carb + veg',
    bedtime: 'Cottage cheese or casein shake',
  },
  STRENGTH_B: {
    breakfast: 'Overnight oats + whey, or eggs + sourdough + yogurt bowl',
    midMorning: 'Greek yogurt (200g) + pumpkin seeds',
    lunch: 'Protein + rice + greens (4 hrs pre-session)',
    preSession: 'Banana + rice cakes + PB (60–90 min pre-session)',
    postSession: 'Protein shake or meal within 45 min',
    dinner: 'Protein + carb + veg',
    bedtime: 'Cottage cheese or casein shake',
  },
  VO2: {
    breakfast: 'Overnight oats — eat 60–90 min pre-session',
    postSession: 'Whey shake + banana — mandatory',
    lunch: 'Full recovery meal 1–2 hrs post-session',
    dinner: 'Protein + small carb + veg',
    bedtime: 'Cottage cheese or casein shake',
  },
  ZONE2: {
    breakfast: 'Eggs + avocado toast (fat-forward)',
    midMorning: 'Handful almonds/walnuts',
    lunch: 'Protein + moderate carbs',
    postSession: 'Greek yogurt only — no carbs',
    dinner: 'Protein + veg, minimal carbs',
    bedtime: 'Cottage cheese or casein shake',
  },
  SPEED: {
    breakfast: 'Overnight oats — eat 60–90 min pre-session',
    postSession: 'Whey shake + banana — mandatory',
    lunch: 'Full recovery meal 1–2 hrs post-session',
    dinner: 'Protein + small carb + veg',
    bedtime: 'Cottage cheese or casein shake',
  },
  REST: {
    breakfast: 'Eggs — no oats on rest days',
    midMorning: '2 boiled eggs or Greek yogurt',
    lunch: 'High protein, moderate carbs, no heavy rice',
    snack: 'Cottage cheese + cucumber',
    dinner: 'Protein + veg, minimal carbs',
    bedtime: 'Cottage cheese or casein shake — especially important',
  },
}

export const OVERNIGHT_OATS = {
  name: 'Overnight Oats',
  prepInstructions: [
    '50g rolled oats into jar',
    '200ml milk',
    '1 scoop whey protein',
    '1 tbsp chia seeds',
    'Pinch of salt',
    'Stir, lid on, fridge overnight',
  ],
  morningToppings: 'Handful blueberries or half banana. Optional: small drizzle honey.',
  macros: { calories: 480, protein: 38, carbs: 55, fat: 10 },
}

export const FOOD_QUALITY_PRINCIPLES = [
  'Broccoli/broccolini: chop and wait 40 min before cooking → maximises sulforaphane. Add mustard seed or powder to cooked broccoli.',
  'Turmeric: always with black pepper + fat for curcumin absorption (10–20x improvement). Haldi milk before bed works.',
  'Garlic: crush/chop and wait 10 min before cooking → preserves allicin.',
  'Tomatoes: cook in olive oil → lycopene bioavailability significantly increased.',
  'Oats: soak overnight to reduce phytic acid and improve mineral absorption.',
  'Salmon and sardines are Tier 1 protein. Prioritise over processed sources.',
]

export const FOODS_TO_PRIORITISE = [
  'Salmon (wild), sardines', 'Eggs (pasture-raised)', 'Chicken breast/mince',
  'Greek yogurt, cottage cheese', 'Oats, sweet potato, butternut squash',
  'Pearl barley, sourdough (moderation)', 'Broccoli/broccolini, cauliflower',
  'Avocado, olive oil', 'Blueberries, dark chocolate (>85%)',
]

export const FOODS_TO_ELIMINATE = [
  'Alcohol — kills fat oxidation 24–48hrs',
  'Seed oils (canola, sunflower, vegetable)',
  'Synthetic emulsifiers (lecithin, carrageenan, polysorbate — check labels)',
  'Charred/blackened meat',
  'Liquid calories',
  'Eating past 9pm',
  'Ultra-processed anything',
]
