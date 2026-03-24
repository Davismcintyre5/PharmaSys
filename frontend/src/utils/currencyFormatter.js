export const formatCurrency = (amount) => {
  // This will be enhanced when we fetch currency from settings
  return `KES ${amount.toFixed(2)}`
}