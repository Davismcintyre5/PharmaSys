const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const PharmacySetting = require('../models/PharmacySetting');
const { sendSMS, sendEmail } = require('../utils/communication');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');

// @desc    Create a new invoice
const createInvoice = async (req, res) => {
  try {
    const { type, amount, dueDate, description, client, clientModel, items, sendTo } = req.body;
    const invoiceNumber = await generateInvoiceNumber();
    const invoice = new Invoice({
      invoiceNumber,
      type,
      amount,
      dueDate,
      description,
      client,
      clientModel,
      items,
      createdBy: req.user._id,
      status: 'draft',
    });
    await invoice.save();

    if (sendTo && (sendTo.phone || sendTo.email)) {
      const pharmacy = await PharmacySetting.getSingleton();
      const message = `Invoice ${invoiceNumber} for ${amount} ${pharmacy.currency} is due on ${dueDate}. Please pay.`;
      if (sendTo.phone) await sendSMS(sendTo.phone, message);
      if (sendTo.email) await sendEmail(sendTo.email, `Invoice ${invoiceNumber}`, message);
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all invoices with filters
const getInvoices = async (req, res) => {
  try {
    const { status, type, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
    if (to) filter.createdAt = { ...filter.createdAt, $lte: new Date(to) };
    const invoices = await Invoice.find(filter)
      .populate('client', 'firstName lastName name phone email')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single invoice
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'firstName lastName name phone email')
      .populate('createdBy', 'username');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update invoice (e.g., mark as paid)
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    if (req.body.status === 'paid' && invoice.status !== 'paid') {
      const transactionType = invoice.type === 'sale' ? 'sale' : 'expense';
      const transaction = new Transaction({
        type: transactionType,
        reference: `Invoice ${invoice.invoiceNumber}`,
        amount: invoice.amount,
        paymentMethod: req.body.paymentMethod || 'cash',
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        status: 'pending',
        createdBy: req.user._id,
      });
      await transaction.save();
      invoice.transaction = transaction._id;
    }

    const allowed = ['status', 'dueDate', 'amount', 'description', 'items'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) invoice[field] = req.body[field];
    });
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete invoice (only draft)
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft invoices can be deleted' });
    }
    await invoice.deleteOne();
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Print invoice
const printInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const pharmacy = await PharmacySetting.getSingleton();
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        .header { text-align: center; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: gray; }
      </style>
      </head>
      <body>
        <div class="header"><h1>${pharmacy.name}</h1><p>${pharmacy.address}</p><h2>INVOICE</h2></div>
        <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleString()}</p>
        <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Client:</strong> ${invoice.client?.firstName || invoice.client?.name || 'N/A'}</p>
        <p><strong>Amount:</strong> ${pharmacy.currency} ${invoice.amount.toFixed(2)}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
        <hr />
        <div class="footer">
          <p>${pharmacy.name} – Official Invoice</p>
          <p>Generated: ${new Date().toLocaleString()} | Generated by: ${req.user.username}</p>
          <p>Powered by PharmaSys</p>
        </div>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Print invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send invoice via SMS/email
const sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const pharmacy = await PharmacySetting.getSingleton();
    const message = `Invoice ${invoice.invoiceNumber} for ${invoice.amount} ${pharmacy.currency} is due on ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'soon'}. Please pay.`;
    const phone = invoice.client?.phone;
    const email = invoice.client?.email;
    if (!phone && !email) return res.status(400).json({ message: 'No contact method for client' });
    if (phone) await sendSMS(phone, message);
    if (email) await sendEmail(email, `Invoice ${invoice.invoiceNumber}`, message);
    invoice.status = 'sent';
    await invoice.save();
    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  printInvoice,
  sendInvoice,
};