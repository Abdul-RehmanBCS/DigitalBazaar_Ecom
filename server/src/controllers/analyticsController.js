import asyncHandler from "express-async-handler";
import Analytics from "../models/Analytics.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import ChatLog from "../models/ChatLog.js";

export const trackEvent = asyncHandler(async (req, res) => {
  const { type, data, sessionId } = req.body;
  if (!type) return res.status(400).json({ message: "Event type is required" });
  await Analytics.create({
    type,
    data: data || {},
    sessionId,
    userAgent: req.headers["user-agent"],
    ip: req.ip
  });
  res.json({ ok: true });
});

export const getFullAdminStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalOrders,
    totalProducts,
    revenueAgg,
    todayOrders,
    weekOrders,
    totalChats,
    todayChats,
    weekChats,
    uniqueChatSessions,
    chatHelpful,
    recentOrders,
    topProducts,
    dailyRevenue,
    chatCategoryBreakdown,
    chatDaily,
    orderStatusBreakdown,
    recentUsers,
    pageViewsToday,
    pageViewsWeek,
    pageViewsByPath,
    eventBreakdown,
    recentChats,
    seoHealth
  ] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: last7 } }),
    ChatLog.countDocuments(),
    ChatLog.countDocuments({ createdAt: { $gte: today } }),
    ChatLog.countDocuments({ createdAt: { $gte: last7 } }),
    ChatLog.distinct("sessionId"),
    ChatLog.aggregate([
      { $match: { helpful: { $ne: null } } },
      { $group: { _id: "$helpful", count: { $sum: 1 } } }
    ]),
    Order.find().sort({ createdAt: -1 }).limit(8).populate("userId", "name email"),
    Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          sold: { $sum: "$products.quantity" },
          revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $project: { title: "$product.title", sold: 1, revenue: 1 } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    ChatLog.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ChatLog.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    User.find().sort({ createdAt: -1 }).limit(6).select("name email role createdAt"),
    Analytics.countDocuments({ type: "page_view", createdAt: { $gte: today } }),
    Analytics.countDocuments({ type: "page_view", createdAt: { $gte: last7 } }),
    Analytics.aggregate([
      { $match: { type: "page_view", createdAt: { $gte: last7 } } },
      { $group: { _id: "$data.path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Analytics.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    ChatLog.find()
      .sort({ createdAt: -1 })
      .limit(12)
      .select("sessionId userMessage botResponse category helpful createdAt"),
    Product.aggregate([
      {
        $project: {
          title: 1,
          hasMetaTitle: { $cond: [{ $and: [{ $ne: ["$metaTitle", null] }, { $ne: ["$metaTitle", ""] }] }, 1, 0] },
          hasMetaDesc: { $cond: [{ $and: [{ $ne: ["$metaDescription", null] }, { $ne: ["$metaDescription", ""] }] }, 1, 0] },
          hasKeywords: { $cond: [{ $gt: [{ $size: { $ifNull: ["$metaKeywords", []] } }, 0] }, 1, 0] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withMetaTitle: { $sum: "$hasMetaTitle" },
          withMetaDesc: { $sum: "$hasMetaDesc" },
          withKeywords: { $sum: "$hasKeywords" }
        }
      }
    ])
  ]);

  const helpfulYes = chatHelpful.find((h) => h._id === true)?.count || 0;
  const helpfulNo = chatHelpful.find((h) => h._id === false)?.count || 0;
  const feedbackTotal = helpfulYes + helpfulNo;
  const seo = seoHealth[0] || { total: 0, withMetaTitle: 0, withMetaDesc: 0, withKeywords: 0 };

  res.json({
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue: revenueAgg[0]?.total || 0,
    todayOrders,
    weekOrders,
    totalChats,
    todayChats,
    weekChats,
    uniqueChatSessions: uniqueChatSessions.length,
    chatHelpfulRate: feedbackTotal ? Math.round((helpfulYes / feedbackTotal) * 100) : null,
    chatHelpfulYes: helpfulYes,
    chatHelpfulNo: helpfulNo,
    recentOrders,
    topProducts,
    dailyRevenue,
    chatCategoryBreakdown,
    chatDaily,
    orderStatusBreakdown,
    recentUsers,
    pageViewsToday,
    pageViewsWeek,
    pageViewsByPath,
    eventBreakdown,
    recentChats,
    seoHealth: {
      totalProducts: seo.total,
      withMetaTitle: seo.withMetaTitle,
      withMetaDesc: seo.withMetaDesc,
      withKeywords: seo.withKeywords,
      metaTitlePct: seo.total ? Math.round((seo.withMetaTitle / seo.total) * 100) : 0,
      metaDescPct: seo.total ? Math.round((seo.withMetaDesc / seo.total) * 100) : 0,
      keywordsPct: seo.total ? Math.round((seo.withKeywords / seo.total) * 100) : 0
    }
  });
});
