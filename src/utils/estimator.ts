export function estimatePERT({
  optimistic,
  mostLikely,
  pessimistic,
  hourlyRate = 50,
}: {
  optimistic: number
  mostLikely: number
  pessimistic: number
  hourlyRate?: number
}) {
  const hours = (optimistic + 4 * mostLikely + pessimistic) / 6
  const price = hours * hourlyRate

  return {
    hours: Math.round(hours * 10) / 10,
    price: Math.round(price),
  }
} 