import type { Goal } from '../../types'
import { diffInDays, isInRange, parseDate, type DateRange } from '../../utils/date'
import { roundMoney } from '../../utils/format'

export interface GoalProgress {
  goal: Goal
  current: number
  remaining: number
  percent: number
  isCompleted: boolean
  /** Days left until the deadline (negative if passed), null if no deadline. */
  daysLeft: number | null
  /** How much to save per month to reach the goal by the deadline. */
  monthlyNeeded: number | null
}

export function calculateGoalCurrent(goal: Goal): number {
  return roundMoney(goal.initialAmount + goal.contributions.reduce((s, c) => s + c.amount, 0))
}

export function calculateGoalProgress(goal: Goal, now = new Date()): GoalProgress {
  const current = goal.currentAmount
  const remaining = Math.max(0, roundMoney(goal.targetAmount - current))
  const percent = goal.targetAmount > 0 ? Math.min(100, (current / goal.targetAmount) * 100) : 0
  const daysLeft = goal.deadline ? diffInDays(parseDate(goal.deadline), now) : null
  const monthsLeft = daysLeft !== null && daysLeft > 0 ? Math.max(1, daysLeft / 30.4) : null
  return {
    goal,
    current,
    remaining,
    percent,
    isCompleted: remaining <= 0,
    daysLeft,
    monthlyNeeded: monthsLeft && remaining > 0 ? roundMoney(Math.ceil(remaining / monthsLeft)) : null,
  }
}

export function calculateGoalsSummary(goals: Goal[]) {
  const saved = roundMoney(goals.reduce((s, g) => s + g.currentAmount, 0))
  const target = roundMoney(goals.reduce((s, g) => s + g.targetAmount, 0))
  return { saved, target, percent: target ? (saved / target) * 100 : 0, count: goals.length }
}

/** Net amount saved into goals within a range (contributions minus withdrawals). */
export function calculateGoalSavings(goals: Goal[], range: DateRange): number {
  return roundMoney(
    goals.reduce((s, g) => s + g.contributions.filter((c) => isInRange(c.date, range)).reduce((a, c) => a + c.amount, 0), 0),
  )
}
