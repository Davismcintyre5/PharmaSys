export const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
export const formatDate = (date) => new Date(date).toLocaleDateString();