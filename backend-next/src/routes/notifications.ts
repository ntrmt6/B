import { Router } from "express";
import { z } from "zod";
import { Notification } from "../models/Notification";
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth';
import { getDatabase } from '../db/mongo';
import { ObjectId } from 'mongodb';

export const notificationsRouter = Router();

// ========== DASHBOARD NOTIFICATION BANNERS (Super Admin) ==========

// Get active dashboard notification banners (public - shown on all tenant dashboards)
notificationsRouter.get("/dashboard-banners", async (req, res, next) => {
  try {
    const db = await getDatabase();
    const banners = await db.collection("dashboard_banners")
      .find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    
    res.json({ data: banners });
  } catch (error) {
    next(error);
  }
});

// Get all dashboard notification banners (Super Admin)
notificationsRouter.get("/dashboard-banners/all", authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const banners = await db.collection("dashboard_banners")
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    
    res.json({ data: banners });
  } catch (error) {
    next(error);
  }
});

// Create a dashboard notification banner (Super Admin only)
notificationsRouter.post("/dashboard-banners", authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      imageUrl: z.string().url().min(1),
      linkUrl: z.string().optional().default(""),
      title: z.string().optional().default(""),
      isActive: z.boolean().optional().default(true),
      order: z.number().optional().default(0)
    });
    
    const payload = schema.parse(req.body);
    const db = await getDatabase();
    
    const banner = {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection("dashboard_banners").insertOne(banner);
    
    res.status(201).json({ 
      data: { ...banner, _id: result.insertedId }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Update a dashboard notification banner (Super Admin only)
notificationsRouter.put("/dashboard-banners/:bannerId", authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { bannerId } = req.params;
    const schema = z.object({
      imageUrl: z.string().url().min(1).optional(),
      linkUrl: z.string().optional(),
      title: z.string().optional(),
      isActive: z.boolean().optional(),
      order: z.number().optional()
    });
    
    const payload = schema.parse(req.body);
    const db = await getDatabase();
    
    const result = await db.collection("dashboard_banners").updateOne(
      { _id: new ObjectId(bannerId) },
      { $set: { ...payload, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Banner not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Delete a dashboard notification banner (Super Admin only)
notificationsRouter.delete("/dashboard-banners/:bannerId", authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { bannerId } = req.params;
    const db = await getDatabase();
    
    const result = await db.collection("dashboard_banners").deleteOne(
      { _id: new ObjectId(bannerId) }
    );
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Banner not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get notifications for a tenant
notificationsRouter.get("/:tenantId", async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { unreadOnly, limit = "50" } = req.query;
    
    const query: any = { tenantId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .lean();
    
    const unreadCount = await Notification.countDocuments({ tenantId, isRead: false });
    
    res.json({ data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// Create a notification (called when order is placed)
notificationsRouter.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      tenantId: z.string().min(1),
      type: z.enum(["order", "review", "customer", "inventory", "system"]),
      title: z.string().min(1),
      message: z.string().min(1),
      data: z.record(z.any()).optional()
    });
    
    const payload = schema.parse(req.body);
    const notification = await Notification.create(payload);
    
    // Emit socket event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.to(`tenant:${payload.tenantId}`).emit("new-notification", notification);
    }
    
    res.status(201).json({ data: notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Mark notification(s) as read
notificationsRouter.patch("/:tenantId/mark-read", async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { notificationIds } = req.body;
    
    if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.updateMany(
        { tenantId, _id: { $in: notificationIds } },
        { isRead: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany({ tenantId }, { isRead: true });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete old notifications (cleanup)
notificationsRouter.delete("/:tenantId/cleanup", async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      tenantId,
      isRead: true,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    next(error);
  }
});

// ========== SUPER ADMIN BROADCAST NOTIFICATIONS ==========

// Create a broadcast notification to all or selected tenants (Super Admin only)
notificationsRouter.post("/broadcast", authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      type: z.enum(["info", "warning", "success", "error"]),
      title: z.string().min(1),
      message: z.string().min(1),
      priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
      targetTenants: z.union([z.literal("all"), z.array(z.string())]),
      expiresAt: z.string().optional()
    });
    
    const payload = schema.parse(req.body);
    const io = req.app.get("io");
    
    // Get target tenant IDs
    let targetTenantIds: string[] = [];
    
    if (payload.targetTenants === "all") {
      // Get all active tenants from database
      const { getDatabase } = await import("../db/mongo.js");
      const db = await getDatabase();
      const tenants = await db.collection("tenants").find({ status: { $ne: "inactive" } }).toArray();
      targetTenantIds = tenants.map((t: any) => t._id.toString());
    } else {
      targetTenantIds = payload.targetTenants;
    }
    
    // Create notification for each tenant
    const notifications = [];
    
    for (const tenantId of targetTenantIds) {
      const notification = await Notification.create({
        tenantId,
        type: "system",
        title: payload.title,
        message: payload.message,
        data: {
          broadcastType: payload.type,
          priority: payload.priority,
          fromSuperAdmin: true,
          expiresAt: payload.expiresAt || null
        },
        isRead: false
      });
      
      notifications.push(notification);
      
      // Emit real-time notification to the tenant room
      if (io) {
        io.to(`tenant:${tenantId}`).emit("new-notification", notification);
        console.log(`[Broadcast] Sent notification to tenant ${tenantId}`);
      }
    }
    
    console.log(`[Broadcast] Sent ${notifications.length} notifications to ${targetTenantIds.length} tenants`);
    
    res.status(201).json({ 
      success: true,
      data: {
        sentCount: notifications.length,
        targetTenants: targetTenantIds.length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Get all broadcast notifications (for Super Admin listing)
notificationsRouter.get("/broadcast/history", authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { limit = "50" } = req.query;
    
    const notifications = await Notification.aggregate([
      {
        $match: {
          "data.fromSuperAdmin": true
        }
      },
      {
        $group: {
          _id: { title: "$title", message: "$message", createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } } },
          id: { $first: "$_id" },
          type: { $first: "$data.broadcastType" },
          priority: { $first: "$data.priority" },
          title: { $first: "$title" },
          message: { $first: "$message" },
          createdAt: { $first: "$createdAt" },
          expiresAt: { $first: "$data.expiresAt" },
          tenantCount: { $sum: 1 }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: parseInt(limit as string, 10) }
    ]);
    
    const formatted = notifications.map(n => ({
      id: n.id.toString(),
      type: n.type || "info",
      priority: n.priority || "medium",
      title: n.title,
      message: n.message,
      targetTenants: "all",
      createdAt: new Date(n.createdAt).toLocaleString(),
      expiresAt: n.expiresAt,
      read: false
    }));
    
    res.json({ data: formatted });
  } catch (error) {
    next(error);
  }
});

// Delete a broadcast notification (removes from all tenants)
notificationsRouter.delete("/broadcast/:notificationId", authenticateToken, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    
    // First get the notification to find its title
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    // Delete all notifications with same title from super admin
    const result = await Notification.deleteMany({
      "data.fromSuperAdmin": true,
      title: notification.title
    });
    
    res.json({ 
      success: true,
      deleted: result.deletedCount 
    });
  } catch (error) {
    next(error);
  }
});
