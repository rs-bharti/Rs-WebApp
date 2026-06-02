const express = require('express');
const prisma   = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

async function nextNo(model, prefix) {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const last = await prisma[model].findFirst({
    where: { voucherNo: { startsWith: fullPrefix } },
    orderBy: { voucherNo: 'desc' },
  });
  const seq = last ? parseInt(last.voucherNo.split('-').pop()) + 1 : 1;
  return `${fullPrefix}${String(seq).padStart(3, '0')}`;
}

// ── Sales Voucher ─────────────────────────────────────────────────────────────
router.get('/sales/next-number', async (req, res) => {
  try { res.json({ voucherNo: await nextNo('salesVoucher', 'SV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/sales', async (req, res) => {
  const { date, customerId, paymentMethodId, items } = req.body;
  if (!customerId)       return res.status(400).json({ message: 'Customer is required' });
  if (!paymentMethodId)  return res.status(400).json({ message: 'Payment method is required' });
  if (!items?.length)    return res.status(400).json({ message: 'At least one item is required' });
  const totalAmount = items.reduce((s, i) => s + parseFloat(i.qty) * parseFloat(i.rate), 0);
  try {
    const voucher = await prisma.salesVoucher.create({
      data: {
        voucherNo:       await nextNo('salesVoucher', 'SV'),
        date:            date ? new Date(date) : new Date(),
        customerId:      parseInt(customerId),
        branchId:        req.user.branchId,
        paymentMethodId: parseInt(paymentMethodId),
        createdById:     req.user.id,
        subTotal:        totalAmount,
        taxAmount:       0,
        discountAmount:  0,
        totalAmount,
        items: {
          create: items.map(i => ({
            productId:      parseInt(i.productId),
            qty:            parseFloat(i.qty),
            rate:           parseFloat(i.rate),
            amount:         parseFloat(i.qty) * parseFloat(i.rate),
            subTotal:       parseFloat(i.qty) * parseFloat(i.rate),
            taxRate:        0,
            taxAmount:      0,
            discountAmount: 0,
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

// ── Purchase Voucher ──────────────────────────────────────────────────────────
router.get('/purchase/next-number', async (req, res) => {
  try { res.json({ voucherNo: await nextNo('purchaseVoucher', 'PV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/purchase', async (req, res) => {
  const { date, supplierId, paymentMethodId, items } = req.body;
  if (!supplierId)       return res.status(400).json({ message: 'Supplier is required' });
  if (!paymentMethodId)  return res.status(400).json({ message: 'Payment method is required' });
  if (!items?.length)    return res.status(400).json({ message: 'At least one item is required' });
  const totalAmount = items.reduce((s, i) => s + parseFloat(i.qty) * parseFloat(i.rate), 0);
  try {
    const voucher = await prisma.purchaseVoucher.create({
      data: {
        voucherNo:       await nextNo('purchaseVoucher', 'PV'),
        date:            date ? new Date(date) : new Date(),
        supplierId:      parseInt(supplierId),
        branchId:        req.user.branchId,
        paymentMethodId: parseInt(paymentMethodId),
        createdById:     req.user.id,
        subTotal:        totalAmount,
        taxAmount:       0,
        discountAmount:  0,
        totalAmount,
        items: {
          create: items.map(i => ({
            productId:      parseInt(i.productId),
            qty:            parseFloat(i.qty),
            rate:           parseFloat(i.rate),
            amount:         parseFloat(i.qty) * parseFloat(i.rate),
            subTotal:       parseFloat(i.qty) * parseFloat(i.rate),
            taxRate:        0,
            taxAmount:      0,
            discountAmount: 0,
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

// ── Sales Return Voucher ──────────────────────────────────────────────────────
router.get('/sales-return/next-number', async (req, res) => {
  try { res.json({ voucherNo: await nextNo('salesReturnVoucher', 'SRV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/sales-return', async (req, res) => {
  const { date, customerId, paymentMethodId, narration, items } = req.body;
  if (!customerId)       return res.status(400).json({ message: 'Customer is required' });
  if (!paymentMethodId)  return res.status(400).json({ message: 'Payment method is required' });
  if (!items?.length)    return res.status(400).json({ message: 'At least one item is required' });
  const totalAmount = items.reduce((s, i) => s + parseFloat(i.qty) * parseFloat(i.rate), 0);
  try {
    const voucher = await prisma.salesReturnVoucher.create({
      data: {
        voucherNo:       await nextNo('salesReturnVoucher', 'SRV'),
        date:            date ? new Date(date) : new Date(),
        customerId:      parseInt(customerId),
        branchId:        req.user.branchId,
        paymentMethodId: parseInt(paymentMethodId),
        createdById:     req.user.id,
        narration:       narration || null,
        subTotal:        totalAmount,
        taxAmount:       0,
        discountAmount:  0,
        totalAmount,
        items: {
          create: items.map(i => ({
            productId:      parseInt(i.productId),
            qty:            parseFloat(i.qty),
            rate:           parseFloat(i.rate),
            amount:         parseFloat(i.qty) * parseFloat(i.rate),
            subTotal:       parseFloat(i.qty) * parseFloat(i.rate),
            taxRate:        0,
            taxAmount:      0,
            discountAmount: 0,
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

// ── Purchase Return Voucher ───────────────────────────────────────────────────
router.get('/purchase-return/next-number', async (req, res) => {
  try { res.json({ voucherNo: await nextNo('purchaseReturnVoucher', 'PRV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/purchase-return', async (req, res) => {
  const { date, supplierId, paymentMethodId, narration, items } = req.body;
  if (!supplierId)       return res.status(400).json({ message: 'Supplier is required' });
  if (!paymentMethodId)  return res.status(400).json({ message: 'Payment method is required' });
  if (!items?.length)    return res.status(400).json({ message: 'At least one item is required' });
  const totalAmount = items.reduce((s, i) => s + parseFloat(i.qty) * parseFloat(i.rate), 0);
  try {
    const voucher = await prisma.purchaseReturnVoucher.create({
      data: {
        voucherNo:       await nextNo('purchaseReturnVoucher', 'PRV'),
        date:            date ? new Date(date) : new Date(),
        supplierId:      parseInt(supplierId),
        branchId:        req.user.branchId,
        paymentMethodId: parseInt(paymentMethodId),
        createdById:     req.user.id,
        narration:       narration || null,
        subTotal:        totalAmount,
        taxAmount:       0,
        discountAmount:  0,
        totalAmount,
        items: {
          create: items.map(i => ({
            productId:      parseInt(i.productId),
            qty:            parseFloat(i.qty),
            rate:           parseFloat(i.rate),
            amount:         parseFloat(i.qty) * parseFloat(i.rate),
            subTotal:       parseFloat(i.qty) * parseFloat(i.rate),
            taxRate:        0,
            taxAmount:      0,
            discountAmount: 0,
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

// ── Receipt Voucher ───────────────────────────────────────────────────────────
router.get('/receipt/next-number', async (req, res) => {
  try { res.json({ voucherNo: await nextNo('receiptVoucher', 'RV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/receipt', async (req, res) => {
  const { date, customerId, paymentMethodId, amount, narration } = req.body;
  if (!customerId)                           return res.status(400).json({ message: 'Customer is required' });
  if (!paymentMethodId)                      return res.status(400).json({ message: 'Payment method is required' });
  if (!amount || parseFloat(amount) <= 0)   return res.status(400).json({ message: 'Amount must be greater than 0' });
  try {
    const voucher = await prisma.receiptVoucher.create({
      data: {
        voucherNo:       await nextNo('receiptVoucher', 'RV'),
        date:            date ? new Date(date) : new Date(),
        customerId:      parseInt(customerId),
        paymentMethodId: parseInt(paymentMethodId),
        amount:          parseFloat(amount),
        narration:       narration || null,
        createdById:     req.user.id,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

// ── Payment Voucher ───────────────────────────────────────────────────────────
router.get('/payment/next-number', async (req, res) => {
  try { res.json({ voucherNo: await nextNo('paymentVoucher', 'PMV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/payment', async (req, res) => {
  const { date, supplierId, paymentMethodId, amount, narration } = req.body;
  if (!supplierId)                           return res.status(400).json({ message: 'Supplier is required' });
  if (!paymentMethodId)                      return res.status(400).json({ message: 'Payment method is required' });
  if (!amount || parseFloat(amount) <= 0)   return res.status(400).json({ message: 'Amount must be greater than 0' });
  try {
    const voucher = await prisma.paymentVoucher.create({
      data: {
        voucherNo:       await nextNo('paymentVoucher', 'PMV'),
        date:            date ? new Date(date) : new Date(),
        supplierId:      parseInt(supplierId),
        paymentMethodId: parseInt(paymentMethodId),
        amount:          parseFloat(amount),
        narration:       narration || null,
        createdById:     req.user.id,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

// ── Contra Voucher ────────────────────────────────────────────────────────────
router.get('/contra/next-number', async (req, res) => {
  try { res.json({ voucherNo: await nextNo('contraVoucher', 'CV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/contra', async (req, res) => {
  const { date, fromPaymentMethodId, toPaymentMethodId, amount, narration } = req.body;
  if (!fromPaymentMethodId || !toPaymentMethodId)
    return res.status(400).json({ message: 'Both accounts are required' });
  if (parseInt(fromPaymentMethodId) === parseInt(toPaymentMethodId))
    return res.status(400).json({ message: 'Source and destination accounts must be different' });
  if (!amount || parseFloat(amount) <= 0)
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  try {
    const voucher = await prisma.contraVoucher.create({
      data: {
        voucherNo:           await nextNo('contraVoucher', 'CV'),
        date:                date ? new Date(date) : new Date(),
        fromPaymentMethodId: parseInt(fromPaymentMethodId),
        toPaymentMethodId:   parseInt(toPaymentMethodId),
        amount:              parseFloat(amount),
        narration:           narration || null,
        createdById:         req.user.id,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

module.exports = router;
