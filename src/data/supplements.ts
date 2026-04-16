import type { Supplement } from '../types'

export const SUPPLEMENTS: Supplement[] = [
  {
    name: 'Creatine monohydrate',
    dose: '5g',
    timing: 'morning',
    notes: 'Empty stomach. Wait 1hr before coffee.',
  },
  {
    name: 'Vitamin D3 + K2',
    dose: '2,000–4,000 IU D3',
    timing: 'morning',
    notes: 'Take with food.',
  },
  {
    name: 'Omega-3 (fish oil)',
    dose: '2–3g EPA+DHA',
    timing: 'with-meals',
    notes: 'Split across meals if possible.',
  },
  {
    name: 'Caffeine',
    dose: '100–200mg',
    timing: 'pre-session',
    sessionTypes: ['VO2', 'SPEED'],
    notes: 'Pre VO2 and Speed sessions only.',
  },
  {
    name: 'Electrolytes',
    dose: 'As needed',
    timing: 'pre-session',
    sessionTypes: ['VO2', 'SPEED'],
    notes: 'VO2/Speed days and when walking in Singapore heat.',
  },
  {
    name: 'Magnesium glycinate',
    dose: '300mg',
    timing: 'night',
    notes: 'Before bed.',
  },
  {
    name: 'Whey protein',
    dose: 'As needed to hit 160g protein',
    timing: 'pre-session',
    sessionTypes: ['STRENGTH_A', 'STRENGTH_B', 'VO2', 'ZONE2', 'SPEED'],
    notes: 'Post-session or mid-morning gap-fill.',
  },
]
