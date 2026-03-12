let currentCurrency = 'KES';

export const setCurrency = (currency) => {
  currentCurrency = currency;
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return `${currentCurrency} 0`;
  return `${currentCurrency} ${amount.toFixed(2)}`;
};