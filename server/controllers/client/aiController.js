const { asyncHandler } = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const { ApiError } = require('../../utils/apiError');
const aiService = require('../../services/aiService');
const { AiCall } = require('../../models/client/Ai');

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw ApiError.badRequest('MESSAGE_REQUIRED', 'message required');

  const result = await aiService.tenantChat({
    tenantId: req.tenantId,
    branchId: req.branchId,
    message,
  });

  return ok(res, { reply: result.reply, model: result.model });
});

const insights = asyncHandler(async (req, res) => {
  const insight = await aiService.generateWeeklyInsights({
    tenantId: req.tenantId,
    branchId: req.branchId,
    force: req.query.refresh === 'true',
  });
  return ok(res, insight);
});

const forecast = asyncHandler(async (req, res) => {
  const insight = await aiService.generateStockForecast({
    tenantId: req.tenantId,
    branchId: req.branchId,
    force: req.query.refresh === 'true',
  });
  return ok(res, insight);
});

const expiryRisk = asyncHandler(async (req, res) => {
  const insight = await aiService.generateExpiryRisk({
    tenantId: req.tenantId,
    branchId: req.branchId,
    force: req.query.refresh === 'true',
  });
  return ok(res, insight);
});

const quota = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const used = await AiCall.countDocuments({ tenantId: req.tenantId, createdAt: { $gte: start } });

  return ok(res, {
    unlimited: false,
    used,
    max: 0,
    remaining: null,
  });
});

module.exports = { chat, insights, forecast, expiryRisk, quota };