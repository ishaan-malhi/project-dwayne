import type { DayType, Phase, SpeedTarget } from '../types'
import { WEEKLY_SCHEDULE } from '../data/schedule'
import { PHASE_BY_WEEK, PLAN_START, PLAN_END } from '../data/phases'
import { SPEED_TARGETS, ZONE2_DURATION } from '../data/sessions'
import { GENERAL_TIPS, REST_TIPS } from '../data/tips'
import type { Exercise } from '../types'

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today(): string {
  return toIsoDate(new Date())
}

export function parseDate(isoDate: string): Date {
  // Parse without timezone shift
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getCurrentWeek(): number {
  return getWeekForDate(today())
}

export function getWeekForDate(isoDate: string): number {
  const start = parseDate(PLAN_START)
  const target = parseDate(isoDate)
  const diffMs = target.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1
  return Math.max(1, Math.min(7, week))
}

export function getCurrentPhase(): Phase {
  return getPhaseForWeek(getCurrentWeek())
}

export function getPhaseForDate(isoDate: string): Phase {
  return getPhaseForWeek(getWeekForDate(isoDate))
}

export function getPhaseForWeek(week: number): Phase {
  return PHASE_BY_WEEK[Math.max(1, Math.min(7, week))] ?? 1
}

export function getDayType(isoDate: string): DayType {
  const date = parseDate(isoDate)
  const dow = date.getDay() // 0=Sun
  return WEEKLY_SCHEDULE[dow]?.type ?? 'REST'
}

export function getDayLocation(isoDate: string): string | undefined {
  const date = parseDate(isoDate)
  const dow = date.getDay()
  return WEEKLY_SCHEDULE[dow]?.location
}

export function getLoadForPhase(exercise: Exercise, phase: Phase): string {
  return exercise.load[`phase${phase}`]
}

export function getSpeedTarget(week: number): SpeedTarget {
  return SPEED_TARGETS.find(t => t.week === week) ?? SPEED_TARGETS[0]
}

export function getZone2Duration(week: number): string {
  return ZONE2_DURATION[Math.max(1, Math.min(7, week))] ?? '50 min'
}

export function getDaysRemaining(): number {
  const end = parseDate(PLAN_END)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isWeek6TimeTrialDay(isoDate: string): boolean {
  const week = getWeekForDate(isoDate)
  const dayType = getDayType(isoDate)
  return week === 6 && dayType === 'SPEED'
}

export function getTipForDate(isoDate: string): string {
  const dayType = getDayType(isoDate)
  const start = parseDate(PLAN_START)
  const target = parseDate(isoDate)
  const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const pool = dayType === 'REST' ? [...GENERAL_TIPS, ...REST_TIPS] : GENERAL_TIPS
  return pool[Math.abs(diffDays) % pool.length]
}

export function formatDate(isoDate: string): string {
  const date = parseDate(isoDate)
  const todayStr = today()
  if (isoDate === todayStr) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (isoDate === toIsoDate(yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatShortDate(isoDate: string): string {
  const date = parseDate(isoDate)
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function addDays(isoDate: string, n: number): string {
  const date = parseDate(isoDate)
  date.setDate(date.getDate() + n)
  return toIsoDate(date)
}

export function isInPlan(isoDate: string): boolean {
  return isoDate >= PLAN_START && isoDate <= PLAN_END
}

export function formatWater(ml: number): string {
  if (ml < 1000) return `${ml}ml`
  return `${parseFloat((ml / 1000).toFixed(2))}L`
}

export function getTotalPlanDays(): number {
  const start = parseDate(PLAN_START)
  const end = parseDate(PLAN_END)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatPace(seconds: number): string {
  // seconds per km → mm:ss/km
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}/km`
}
