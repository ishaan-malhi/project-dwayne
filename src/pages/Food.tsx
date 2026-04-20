import { useState, type FC } from 'react'
import { useNutritionStore } from '../store/nutritionStore'
import { useSessionStore } from '../store/sessionStore'
import { MACRO_TARGETS, WATER_TARGET_ML } from '../data/nutrition'
import { getDayType, today, getDaysRemaining, getTotalPlanDays } from '../utils/plan'
import MealAddSheet from '../components/MealAddSheet'
import WaterCard from '../components/WaterCard'
import ProgressRing from '../components/ProgressRing'
import type { MealEntry } from '../types'

type Category = MealEntry['category']

const CATEGORY_ORDER: Category[] = ['breakfast', 'lunch', 'dinner', 'snack']
const CATEGORY_LABELS: Record<Category, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
}

const Food: FC = () => {
  const [showAdd, setShowAdd] = useState(false)

  const date = today()
  const dayType = getDayType(date)
  const macroTarget = MACRO_TARGETS[dayType]
  const waterTarget = WATER_TARGET_ML[dayType]

  const streak = useSessionStore(s => s.getStreak())
  const daysLeft = getDaysRemaining()
  const totalDays = getTotalPlanDays()

  const { getLog, removeMeal, updateWater, proteinTotal, caloriesTotal } = useNutritionStore()

  const log = getLog(date)
  const meals = log?.meals ?? []
  const waterLogged = log?.water ?? 0
  const proteinLogged = proteinTotal(date)
  const caloriesLogged = caloriesTotal(date)
  const carbsLogged = Math.round(meals.reduce((s, m) => s + m.macros.carbs, 0))
  const fatLogged = Math.round(meals.reduce((s, m) => s + m.macros.fat, 0))

  const now = new Date()
  const hour = now.getHours()
  const showProteinFloor = hour >= 21 && proteinLogged < 140

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  // Group meals by category
  const mealsByCategory = CATEGORY_ORDER.reduce<Record<Category, MealEntry[]>>(
    (acc, cat) => {
      acc[cat] = meals
        .filter(m => (m.category ?? 'snack') === cat)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      return acc
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] }
  )
  const hasAnyMeals = meals.length > 0

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingRight: 16, paddingBottom: 12, paddingLeft: 16, borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0' }}>Food Diary</span>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#ffaa47' }}>{streak}</span>
            </div>
          )}
          <ProgressRing daysLeft={daysLeft} totalDays={totalDays} />
        </div>
      </div>

      {showProteinFloor && (
        <div style={{ margin: '12px 16px 0', padding: '10px 12px', background: 'rgba(255,71,71,0.08)', border: '1px solid rgba(255,71,71,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#ff4747' }}>
            Protein floor warning — you're at {proteinLogged}g, target is 160g. The deficit doesn't matter if protein is under.
          </p>
        </div>
      )}

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Totals bar */}
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Today's totals</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#f0f0f0' }}>
              {caloriesLogged} <span style={{ color: '#6b6b6b' }}>/ {macroTarget.calories} kcal</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Protein', value: proteinLogged, target: macroTarget.protein, color: proteinLogged > 0 ? '#5ba3ff' : '#333' },
              { label: 'Carbs', value: carbsLogged, target: macroTarget.carbs, color: carbsLogged > 0 ? '#ffaa47' : '#333' },
              { label: 'Fat', value: fatLogged, target: macroTarget.fat, color: fatLogged > 0 ? '#47ff8a' : '#333' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: m.color, fontWeight: 500 }}>{m.value}</div>
                <div style={{ fontSize: 10, color: '#6b6b6b', marginTop: 1 }}>/ {m.target}g</div>
                <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Protein progress bar */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span style={{ fontSize: 10, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Protein</span>
            <span style={{ fontSize: 11, color: proteinLogged >= 160 ? '#47ff8a' : proteinLogged >= 120 ? '#ffaa47' : '#5ba3ff' }}>
              {proteinLogged}g / 160g
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#1c1c1c' }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: proteinLogged >= 160 ? '#47ff8a' : proteinLogged >= 120 ? '#ffaa47' : '#5ba3ff',
              width: `${Math.min(100, (proteinLogged / 160) * 100)}%`,
              transition: 'width 0.3s ease-out',
            }} />
          </div>
        </div>

        {/* Water tracker */}
        <WaterCard
          waterLogged={waterLogged}
          waterTarget={waterTarget}
          onUpdate={ml => updateWater(date, ml)}
        />

        {/* Meals grouped by category */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Meals</span>
            <button
              onClick={() => setShowAdd(true)}
              style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0', background: '#1c1c1c', border: '1px solid #333', borderRadius: 5, padding: '4px 12px' }}
            >
              + Add
            </button>
          </div>

          {!hasAnyMeals ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b6b6b', fontSize: 13 }}>
              No meals logged yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {CATEGORY_ORDER.map(cat => {
                const catMeals = mealsByCategory[cat]
                if (catMeals.length === 0) return null
                return (
                  <div key={cat}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 6 }}>
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catMeals.map((meal: MealEntry) => (
                        <MealCard key={meal.id} meal={meal} onRemove={() => removeMeal(date, meal.id)} formatTime={formatTime} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <MealAddSheet open={showAdd} onClose={() => setShowAdd(false)} date={date} />
    </div>
  )
}

function MealCard({ meal, onRemove, formatTime }: { meal: MealEntry; onRemove: () => void; formatTime: (iso: string) => string }) {
  return (
    <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, overflow: 'hidden' }}>
      {meal.photoBase64 && (
        <img
          src={`data:${meal.photoMimeType ?? 'image/jpeg'};base64,${meal.photoBase64}`}
          alt="Meal"
          style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
        />
      )}
      <div style={{ padding: '10px 12px' }}>
        <div className="flex items-start justify-between">
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: '#6b6b6b', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatTime(meal.timestamp)}
            </span>
            {meal.description && (
              <p style={{ fontSize: 13, color: '#f0f0f0', marginTop: 2 }}>{meal.description}</p>
            )}
          </div>
          <button
            onClick={onRemove}
            aria-label="Remove meal"
            style={{ color: '#6b6b6b', background: 'none', border: 'none', padding: '0 0 0 8px', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
        <div className="flex gap-3 mt-2">
          {[
            { label: 'P', value: meal.macros.protein, color: '#5ba3ff' },
            { label: 'C', value: meal.macros.carbs, color: '#ffaa47' },
            { label: 'F', value: meal.macros.fat, color: '#47ff8a' },
            { label: 'kcal', value: meal.macros.calories, color: '#6b6b6b' },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: m.color, fontWeight: 500 }}>{m.value}</span>
              <span style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase' }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Food
