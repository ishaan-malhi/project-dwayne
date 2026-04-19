import { useState, useRef, type FC } from 'react'
import Sheet from './Sheet'
import { useNutritionStore } from '../store/nutritionStore'
import { useSettingsStore } from '../store/settingsStore'
import { estimateMacros, estimateMacrosFromText } from '../services/claudeApi'
import { scoreMeal, GRADE_COLORS, type MealScore } from '../utils/mealScore'
import { getDayType } from '../utils/plan'
import { MACRO_TARGETS } from '../data/nutrition'
import type { MacroEstimate, MealEntry } from '../types'

type Category = MealEntry['category']

const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
]

interface Props {
  open: boolean
  onClose: () => void
  date: string
}

const MealAddSheet: FC<Props> = ({ open, onClose, date }) => {
  const { addMeal, proteinTotal, caloriesTotal } = useNutritionStore()
  const { claudeApiKey, setApiKey } = useSettingsStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<Category>('lunch')
  const [description, setDescription] = useState('')
  const [photoBase64, setPhotoBase64] = useState<string | undefined>()
  const [photoMimeType, setPhotoMimeType] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg')
  const [photoPreview, setPhotoPreview] = useState<string | undefined>()
  const [estimate, setEstimate] = useState<MacroEstimate | undefined>()
  const [score, setScore] = useState<MealScore | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })

  const computeScore = (macros: MacroEstimate) => {
    const dayType = getDayType(date)
    const target = MACRO_TARGETS[dayType]
    const logged = { protein: proteinTotal(date), calories: caloriesTotal(date) }
    return scoreMeal(macros, target, logged)
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoMimeType('image/jpeg')
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 500
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const resized = canvas.toDataURL('image/jpeg', 0.85)
        setPhotoPreview(resized)
        setPhotoBase64(resized.split(',')[1])
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleEstimate = async () => {
    if (!claudeApiKey) {
      setError('Add your Claude API key in Settings first.')
      return
    }
    if (!description && !photoBase64) {
      setError('Add a photo or description first.')
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      const result = photoBase64
        ? await estimateMacros(photoBase64, photoMimeType, description, claudeApiKey)
        : await estimateMacrosFromText(description, claudeApiKey)
      setEstimate(result)
      setScore(computeScore(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimation failed — check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!estimate) return
    const [h, m] = timestamp.split(':').map(Number)
    const ts = new Date()
    ts.setHours(h, m, 0, 0)
    addMeal(date, {
      id: crypto.randomUUID(),
      timestamp: ts.toISOString(),
      description,
      category,
      photoBase64,
      photoMimeType,
      macros: estimate,
    })
    reset()
    onClose()
  }

  const reset = () => {
    setDescription('')
    setPhotoBase64(undefined)
    setPhotoPreview(undefined)
    setEstimate(undefined)
    setScore(undefined)
    setError(undefined)
    setApiKeyDraft('')
    setCategory('lunch')
  }

  const updateMacro = (field: keyof MacroEstimate, value: string) => {
    if (!estimate) return
    const updated = { ...estimate, [field]: field === 'notes' ? value : Number(value) }
    setEstimate(updated)
    setScore(computeScore(updated))
  }

  return (
    <Sheet open={open} onClose={() => { reset(); onClose() }} title="Add Meal">
      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Category */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b', textTransform: 'uppercase', marginBottom: 6 }}>Category</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 5, fontSize: 11, fontWeight: 500,
                  background: category === c.id ? '#f0f0f0' : '#1c1c1c',
                  color: category === c.id ? '#0a0a0a' : '#6b6b6b',
                  border: category === c.id ? 'none' : '1px solid #222',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11, color: '#6b6b6b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Time</span>
          <input
            type="time"
            value={timestamp}
            onChange={e => setTimestamp(e.target.value)}
            style={{ background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 16, padding: '6px 10px' }}
          />
        </div>

        {/* Photo */}
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', padding: 12, borderRadius: 8, border: '1px dashed #333',
              background: 'transparent', color: '#6b6b6b', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {photoPreview ? 'Change photo' : 'Add photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
          {photoPreview && (
            <img src={photoPreview} alt="Meal" style={{ width: '100%', borderRadius: 8, marginTop: 8, maxHeight: 200, objectFit: 'cover' }} />
          )}
        </div>

        {/* Description */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b', textTransform: 'uppercase', marginBottom: 6 }}>Description</p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Chicken breast 200g, white rice 150g, broccoli"
            rows={2}
            style={{
              width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5,
              color: '#f0f0f0', fontSize: 16, padding: '8px 10px', resize: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: '#ff4747', padding: '8px 10px', background: 'rgba(255,71,71,0.1)', borderRadius: 5 }}>
            {error}
          </p>
        )}

        {/* API key gate */}
        {!claudeApiKey && !estimate && (
          <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 8 }}>
              Claude API Key required
            </p>
            <input
              type="password"
              value={apiKeyDraft}
              onChange={e => setApiKeyDraft(e.target.value)}
              placeholder="sk-ant-api03-..."
              style={{ width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5, color: '#f0f0f0', fontSize: 16, padding: '8px 10px', marginBottom: 8, fontFamily: 'inherit' }}
            />
            <button
              onClick={() => { if (apiKeyDraft.trim()) setApiKey(apiKeyDraft.trim()) }}
              disabled={!apiKeyDraft.trim()}
              style={{ width: '100%', padding: 10, borderRadius: 6, background: apiKeyDraft.trim() ? '#f0f0f0' : '#1c1c1c', color: apiKeyDraft.trim() ? '#0a0a0a' : '#6b6b6b', fontSize: 13, fontWeight: 600, border: 'none' }}
            >
              Save key
            </button>
          </div>
        )}

        {/* Estimate button */}
        {claudeApiKey && !estimate && (
          <button
            onClick={handleEstimate}
            disabled={loading || (!description && !photoBase64)}
            style={{
              width: '100%', padding: 12, borderRadius: 8,
              background: loading ? '#1c1c1c' : '#f0f0f0',
              color: loading ? '#6b6b6b' : '#0a0a0a',
              fontSize: 13, fontWeight: 600, border: 'none',
            }}
          >
            {loading ? 'Estimating…' : 'Estimate macros'}
          </button>
        )}

        {/* Macro edit + score */}
        {estimate && (
          <div>
            {/* Meal score */}
            {score && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                padding: '10px 12px', background: `${GRADE_COLORS[score.grade]}10`,
                border: `1px solid ${GRADE_COLORS[score.grade]}30`, borderRadius: 8,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                  background: GRADE_COLORS[score.grade],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#0a0a0a' }}>
                    {score.grade}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#f0f0f0', fontWeight: 500 }}>{score.note}</div>
                  <div style={{ fontSize: 10, color: '#6b6b6b', marginTop: 2 }}>
                    {score.proteinFill}% of remaining protein · {score.calorieFit === 'fits' ? 'within budget' : score.calorieFit === 'tight' ? 'slightly over' : 'over budget'}
                  </div>
                </div>
              </div>
            )}

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b', textTransform: 'uppercase', marginBottom: 8 }}>
              Estimated macros — edit if needed
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['protein', 'carbs', 'fat', 'calories'] as const).map(field => (
                <div key={field}>
                  <p style={{ fontSize: 10, color: '#6b6b6b', marginBottom: 3, textTransform: 'capitalize' }}>{field}</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={estimate[field]}
                    onChange={e => updateMacro(field, e.target.value)}
                    style={{
                      width: '100%', background: '#1c1c1c', border: '1px solid #222', borderRadius: 5,
                      color: '#f0f0f0', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', padding: '6px 10px',
                    }}
                  />
                </div>
              ))}
            </div>
            {estimate.notes && (
              <p style={{ fontSize: 11, color: '#6b6b6b', marginTop: 8, fontStyle: 'italic' }}>{estimate.notes}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setEstimate(undefined); setScore(undefined) }}
                style={{ flex: 1, padding: 10, borderRadius: 8, background: 'transparent', border: '1px solid #333', color: '#6b6b6b', fontSize: 13 }}
              >
                Re-estimate
              </button>
              <button
                onClick={handleSave}
                style={{ flex: 2, padding: 10, borderRadius: 8, background: '#f0f0f0', color: '#0a0a0a', fontSize: 13, fontWeight: 600, border: 'none' }}
              >
                Save meal
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}

export default MealAddSheet
