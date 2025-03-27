import { format } from 'date-fns'

export function formatDate(date: Date): string {
  return format(new Date(date), 'EEEE, MMMM do, yyyy \'at\' h:mm a')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
} 