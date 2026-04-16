import { useState, type FC } from 'react'
import { useNutritionStore } from '../store/nutritionStore'
import { useSettingsStore } from '../store/settingsStore'
import { MACRO_TARGETS, WATER_TARGET_ML } from '../data/nutrition'
import { getDayType, today, formatWater } from '../utils/plan'
import MealAddSheet from '../components/MealAddSheet'
import type { MealEntry } from '../types'

type Category = MealEntry['category']

const CATEGORY_ORDER: Category[] = ['breakfast', 'lunch', 'dinner', 'snack']
const CATEGORY_LABELS: Record<Category, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
}

const Food: FC = () => {
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')

  const date = today()
  const dayType = getDayType(date)
  const macroTarget = MACRO_TARGETS[dayType]
  const waterTarget = WATER_TARGET_ML[dayType]

  const { getLog, removeMeal, updateWater, proteinTotal, caloriesTotal } = useNutritionStore()
  const { claudeApiKey, setApiKey } = useSettingsStore()

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

  const addWater = (delta: number) => {
    updateWater(date, (log?.water ?? 0) + delta)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const handleSaveKey = () => {
    setApiKey(apiKeyInput)
    setShowSettings(false)
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
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0' }}>Food Diary</span>
        <button
          onClick={() => { setApiKeyInput(claudeApiKey); setShowSettings(true) }}
          style={{ fontSize: 11, color: claudeApiKey ? '#47ff8a' : '#ff4747', background: 'none', border: 'none', padding: 0 }}
        >
          {claudeApiKey ? 'API ✓' : 'Set API key'}
        </button>
      </div>

      {showProteinFloor && (
        <div style={{ margin: '12px 16px 0', padding: '10px 12px', background: 'rgba(255,71,71,0.08)', border: '1px solid rgba(255,71,71,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#ff4747' }}>
            Protein floor warning — you're at {proteinLogged}g, target is 160g. The deficit doesn't matter if protein is under.
          </p>
        </div>
      )}

      {/* API key settings */}
      {showSettings && (
        <div style={{ margin: '12px 16px 0', padding: '12px 14px', background: '#141414', border: '1px solid #222', borderRadius: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 8 }}>
            Claude API Key
          </p>
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 13, padding: '8px 10px', marginBottom: 8 }}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(false)} style={{ flex: 1, padding: 8, borderRadius: 5, background: 'transparent', border: '1px solid #333', color: '#6b6b6b', fontSize: 12 }}>
              Cancel
            </button>
            <button onClick={handleSaveKey} style={{ flex: 2, padding: 8, borderRadius: 5, background: '#f0f0f0', color: '#0a0a0a', fontSize: 12, fontWeight: 600, border: 'none' }}>
              Save
            </button>
          </div>
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
              { label: 'Protein', value: proteinLogged, target: macroTarget.protein, color: '#5ba3ff' },
              { label: 'Carbs', value: carbsLogged, target: macroTarget.carbs, color: '#ffaa47' },
              { label: 'Fat', value: fatLogged, target: macroTarget.fat, color: '#47ff8a' },
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
        <div style={{ background: '#141414', border: '1px solid #1c1c1c', borderRadius: 8, padding: '12px 14px' }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b' }}>Water</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#f0f0f0' }}>
              {formatWater(waterLogged)} <span style={{ color: '#6b6b6b' }}>/ {formatWater(waterTarget)}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[250, 500, 750, 1000].map(ml => (
              <button
                key={ml}
                onClick={() => addWater(ml)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 5, fontSize: 11,
                  background: '#1c1c1c', border: '1px solid #222', color: '#f0f0f0', fontWeight: 500,
                }}
              >
                +{ml < 1000 ? `${ml}ml` : '1L'}
              </button>
            ))}
          </div>
          {waterLogged > 0 && (
            <button
              onClick={() => updateWater(date, Math.max(0, waterLogged - 250))}
              style={{ marginTop: 6, fontSize: 10, color: '#6b6b6b', background: 'none', border: 'none', padding: 0 }}
            >
              − undo 250ml
            </button>
          )}
        </div>

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
