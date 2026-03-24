const Invoice = require('../models/Invoice');

const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  let nextNum = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/\d+$/);
    if (match) nextNum = parseInt(match[0]) + 1;
  }
  const year = new Date().getFullYear();
  return `INV-${year}-${String(nextNum).padStart(4, '0')}`;
};

module.exports = generateInvoiceNumber;