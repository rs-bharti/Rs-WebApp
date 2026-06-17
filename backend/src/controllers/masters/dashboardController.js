const prisma = require('../../utils/prisma');
const { getBranchId } = require('./masterHelpers');

// ── Dashboard Balance ──────────────────────────────────────────────────────────
const getDashboardBalance = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    // Get or create opening balance for this branch
    let opening = await prisma.dashboardBalance.findUnique({ where: { branchId } });
    if (!opening) {
      opening = await prisma.dashboardBalance.create({ data: { branchId, openingCash: 0, openingBank: 0, openingReceivables: 0 } });
    }

    // Fetch payment methods: branch-specific OR global (branchId = null).
    // Global methods are used in some branches (e.g. dummy branch) where methods were
    // created without a branch — their vouchers still carry the correct branchId.
    const [allMethods, receiptsByMethod, paymentsByMethod, contraFromByMethod, contraToByMethod] = await Promise.all([
      prisma.paymentMethodMaster.findMany({
        where: { OR: [{ branchId }, { branchId: null }] },
        select: { id: true, category: true, openingBalance: true },
      }),
      prisma.receiptVoucher.groupBy({ by: ['paymentMethodId'], where: { branchId }, _sum: { amount: true } }),
      prisma.paymentVoucher.groupBy({ by: ['paymentMethodId'], where: { branchId }, _sum: { amount: true } }),
      prisma.contraVoucher.groupBy({ by: ['fromPaymentMethodId'], where: { branchId }, _sum: { amount: true } }),
      prisma.contraVoucher.groupBy({ by: ['toPaymentMethodId'],   where: { branchId }, _sum: { amount: true } }),
    ]);

    // Case-insensitive category match to handle any legacy data inconsistencies
    const cashMethods = allMethods.filter(m => m.category?.toUpperCase() === 'CASH');
    const bankMethods = allMethods.filter(m => m.category?.toUpperCase() === 'BANK');
    const cashIds = new Set(cashMethods.map(m => m.id));
    const bankIds = new Set(bankMethods.map(m => m.id));
    // Opening balances = sum of payment method opening balances by category
    //                  + any additional opening set via the dashboard edit button
    const openingCash = cashMethods.reduce((s, m) => s + (m.openingBalance || 0), 0) + (opening.openingCash || 0);
    const openingBank = bankMethods.reduce((s, m) => s + (m.openingBalance || 0), 0) + (opening.openingBank || 0);

    const sumFor = (rows, idField, idSet) =>
      rows.filter(r => idSet.has(r[idField])).reduce((s, r) => s + (r._sum.amount || 0), 0);

    const currentCash = openingCash
      + sumFor(receiptsByMethod,    'paymentMethodId',     cashIds)
      + sumFor(contraToByMethod,    'toPaymentMethodId',   cashIds)
      - sumFor(paymentsByMethod,    'paymentMethodId',     cashIds)
      - sumFor(contraFromByMethod,  'fromPaymentMethodId', cashIds);
    const currentBank = openingBank
      + sumFor(receiptsByMethod,    'paymentMethodId',     bankIds)
      + sumFor(contraToByMethod,    'toPaymentMethodId',   bankIds)
      - sumFor(paymentsByMethod,    'paymentMethodId',     bankIds)
      - sumFor(contraFromByMethod,  'fromPaymentMethodId', bankIds);

    // Total Receivables = sum of unpaid Sales Vouchers + sum of unpaid Purchase Return Vouchers
    const [salesAgg, purchaseReturnAgg] = await Promise.all([
      prisma.salesVoucher.aggregate({ where: { branchId, isPaid: false }, _sum: { totalAmount: true } }),
      prisma.purchaseReturnVoucher.aggregate({ where: { branchId, isPaid: false }, _sum: { totalAmount: true } }),
    ]);

    const totalReceivables =
      (opening.openingReceivables || 0)
      + (salesAgg._sum.totalAmount || 0)
      + (purchaseReturnAgg._sum.totalAmount || 0);

    res.json({
      openingCash:         Math.round(openingCash * 100) / 100,
      openingBank:         Math.round(openingBank * 100) / 100,
      openingReceivables:  Math.round((opening.openingReceivables || 0) * 100) / 100,
      currentCash:         Math.round(currentCash * 100) / 100,
      currentBank:         Math.round(currentBank * 100) / 100,
      totalReceivables:    Math.round(totalReceivables * 100) / 100,
    });
  } catch (err) {
    console.error('getDashboardBalance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDashboardBalance = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    const { openingCash, openingBank, openingReceivables } = req.body;

    const balance = await prisma.dashboardBalance.upsert({
      where:  { branchId },
      update: {
        ...(openingCash        !== undefined ? { openingCash:        Number(openingCash)        } : {}),
        ...(openingBank        !== undefined ? { openingBank:        Number(openingBank)        } : {}),
        ...(openingReceivables !== undefined ? { openingReceivables: Number(openingReceivables) } : {}),
      },
      create: {
        branchId,
        openingCash:        Number(openingCash        ?? 0),
        openingBank:        Number(openingBank        ?? 0),
        openingReceivables: Number(openingReceivables ?? 0),
      },
    });

    res.json(balance);
  } catch (err) {
    console.error('updateDashboardBalance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardBalance, updateDashboardBalance };
