import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDatabase } from '../db/mongo';
import { ObjectId } from 'mongodb';
import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { getTenantData, getTenantDataBatch } from '../services/tenantDataService';
import { KeyManager, backoffWithJitter } from '../utils/keyManager';

export const aiAssistantRouter = Router();

// Initialize multi-key manager (supports GEMINI_KEY_1/2/3 + GEMINI_API_KEY fallback)
const keyManager = new KeyManager('AI Assistant');

// Collection name for conversation history
const CONVERSATION_COLLECTION = 'ai_conversations';

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a friendly and knowledgeable AI business assistant for e-commerce shop owners in Bangladesh. Your role is to help shop owners grow their business by providing:

1. Practical advice on increasing sales
2. Marketing strategies suitable for the Bangladeshi market
3. Tips on product listing optimization
4. Customer service best practices
5. Inventory management guidance
6. Pricing strategies
7. Social media marketing tips
8. Business growth strategies
9. Dashboard navigation and features explanation
10. Analytics and metrics interpretation

**DASHBOARD KNOWLEDGE:**

**Shop Dashboard Overview:**
The shop dashboard is the main control center where shop owners can monitor their business. It includes:

**Order Analytics Section:**
- **Products on Hands**: Total number of products in inventory
- **Total Orders**: All orders placed in the shop
- **Today's Orders**: Orders received today
- **Courier Orders**: Orders sent through courier services
- **Confirmed Orders**: Orders that have been confirmed
- **Pending Orders**: Orders awaiting confirmation
- **Cancelled Orders**: Cancelled orders
- **Returns**: Returned orders
- **Visits (Last 7 days)**: Number of store visitors in the past week
- **To Be Reviewed**: Orders pending review (same as pending orders)

**Revenue Information:**
- **Total Revenue**: Sum of all order amounts
- **Low Stock Products**: Products with less than 10 units in stock
- Revenue charts showing sales trends over time
- Category-wise sales breakdown

**Best Selling Products:**
- Shows top-selling products by order count
- Displays product images, names, and sales metrics

**Dashboard Features:**
1. **Search**: Quick search functionality for orders and products
2. **View Website**: Button to open the live store in a new tab
3. **Tutorials**: Access to video tutorials
4. **Language Toggle**: Switch between English and Bangla (বাংলা)
5. **Real-time Updates**: Dashboard refreshes automatically to show latest data
6. **Export Data**: Download order data as CSV files
7. **Visitor Statistics**: Track store visits and online visitors

**Common Dashboard Questions:**
- "What does Products on Hands mean?" → Total products in inventory
- "Why is my total products count changing?" → It updates when products are added/removed
- "How do I see my sales?" → Check Total Revenue in the Order Analytics section
- "Where can I see pending orders?" → Look at the Pending Orders metric
- "How do I track visitors?" → Check the Visits (Last 7 days) metric
- "What's the difference between confirmed and pending?" → Confirmed orders are approved, pending awaits action

**Navigation:**
- Dashboard shows key metrics at a glance
- Use sidebar to navigate to Orders, Products, Settings, etc.
- Click on metrics to see detailed breakdowns

Guidelines:
- Be concise but thorough
- Use bullet points and formatting for clarity
- Give actionable advice
- Consider the local Bangladeshi e-commerce context
- Be encouraging and supportive
- Use simple language
- Include specific examples when helpful
- Currency should be in BDT (৳) when discussing money
- When asked about dashboard features, provide specific, accurate information

**TOOLS AVAILABLE:**
You have access to the following tools that you MUST use when relevant:

1. **get_tenant_analytics** — Use this tool when the user asks about performance, analytics, conversion rates, revenue trends, or how their store is doing over a time period (7d or 30d). This fetches REAL data from their database.

2. **create_landing_page_section** — Use this tool when the user asks you to create, build, or generate a landing page section (hero, cta, or features). After creating a section, always include the preview URL: /dashboard/builder?preview=true in your response so the user can preview their new section.

Keep responses focused and practical. If asked something outside your expertise (like medical/legal advice), politely redirect to the appropriate professional.`;

// In-memory cache for active conversations
const conversationCache = new Map<string, { 
  messages: Array<{ role: string; content: string; timestamp: Date }>;
  lastActive: number;
}>();

// Helper function to save conversation to database
async function saveConversationToDb(tenantId: string, userId: string, messages: any[]) {
  try {
    const db = await getDatabase();
    
    await db.collection(CONVERSATION_COLLECTION).updateOne(
      { tenantId, userId },
      {
        $set: {
          messages: messages.slice(-50), // Keep last 50 messages
          lastActive: new Date(),
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('[AI Assistant] Error saving conversation:', error);
  }
}

// Helper function to load conversation from database
async function loadConversationFromDb(tenantId: string, userId: string) {
  try {
    const db = await getDatabase();
    const doc = await db.collection(CONVERSATION_COLLECTION).findOne({ tenantId, userId });
    return doc?.messages || [];
  } catch (error) {
    console.error('[AI Assistant] Error loading conversation:', error);
    return [];
  }
}

// Fallback business knowledge
const businessKnowledge = {
  sales: [
    "Focus on understanding your customer's needs before pitching your products.",
    "Use social proof - showcase reviews and testimonials prominently.",
    "Create urgency with limited-time offers and flash sales.",
    "Implement a loyalty program to encourage repeat purchases.",
    "Offer bundle deals to increase average order value."
  ],
  marketing: [
    "Define your target audience clearly before creating marketing content.",
    "Use social media platforms where your customers spend their time.",
    "Create valuable content that solves your customers' problems.",
    "Invest in SEO to improve organic visibility.",
    "Use email marketing for personalized communication."
  ],
  pricing: [
    "Research competitor pricing before setting your prices.",
    "Consider value-based pricing instead of cost-plus pricing.",
    "Use psychological pricing (e.g., ৳999 instead of ৳1000).",
    "Offer tiered pricing for different customer segments.",
    "Test different price points to find the optimal one."
  ],
  inventory: [
    "Use ABC analysis to prioritize inventory management efforts.",
    "Set reorder points based on lead time and sales velocity.",
    "Implement just-in-time inventory for fast-moving items.",
    "Track inventory turnover rate to identify slow-moving items.",
    "Use safety stock for high-demand items."
  ],
  customerService: [
    "Respond to customer inquiries within 24 hours.",
    "Train your team to handle complaints professionally.",
    "Use chatbots for common questions to free up human agents.",
    "Collect and act on customer feedback regularly.",
    "Create a comprehensive FAQ section."
  ],
  growth: [
    "Focus on retaining existing customers - it's cheaper than acquiring new ones.",
    "Expand product lines based on customer demand.",
    "Consider entering new markets or demographics.",
    "Build partnerships with complementary businesses.",
    "Invest in automation to scale operations efficiently."
  ],
  dashboard: [
    "**Products on Hands** shows your total inventory count - products you have available to sell.",
    "**Total Orders** displays all orders ever placed in your shop since the beginning.",
    "**Today's Orders** shows only the orders received today - resets at midnight.",
    "**Pending Orders** are orders waiting for your confirmation - these need your attention!",
    "**Confirmed Orders** have been approved and are ready for processing/shipping.",
    "**Low Stock Products** warns you about items with less than 10 units - time to reorder!",
    "**Total Revenue** is the sum of all your order amounts - your total sales income.",
    "**Visits (Last 7 days)** shows how many people visited your store in the past week.",
    "The dashboard updates in real-time to show your latest business metrics.",
    "Use the search bar to quickly find specific orders or information.",
    "Click 'View Website' to see your live store as customers see it.",
    "Revenue charts help you identify sales trends and peak periods.",
    "Best Selling Products section shows which items are performing well.",
    "Export data button lets you download your order information as CSV files.",
    "Language toggle (Eng/বাংলা) switches the interface language."
  ]
};

/**
 * Generates a comprehensive business report from actual tenant data.
 * The report includes inventory summary, order statistics, top products,
 * low stock alerts, out of stock products, and recent orders.
 * 
 * @param data - The tenant's business data containing products, orders, and computed stats
 * @returns A formatted markdown string containing the complete business report
 */
function generateComprehensiveBusinessReport(data: NonNullable<Awaited<ReturnType<typeof getTenantBusinessData>>>): string {
  const { products, orders, inventoryStats, orderStats } = data;
  
  // Get low stock products
  const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
  
  // Get out of stock products
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
  
  // Get recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);
  
  // Get top products by value
  const topProducts = [...products]
    .sort((a, b) => ((b.costPrice || b.price || 0) * (b.stock || 0)) - ((a.costPrice || a.price || 0) * (a.stock || 0)))
    .slice(0, 5);
  
  let report = `📊 **Your Business Report**\n\n`;
  
  report += `**📦 Inventory Summary:**\n`;
  report += `• Total Products: ${inventoryStats.totalProducts}\n`;
  report += `• Total Units in Stock: ${inventoryStats.totalUnits}\n`;
  report += `• Inventory Value: ৳${inventoryStats.totalInventoryValue.toLocaleString()}\n`;
  if (inventoryStats.lowStockCount > 0) {
    report += `• ⚠️ Low Stock Alert: ${inventoryStats.lowStockCount} product(s)\n`;
  }
  if (inventoryStats.outOfStockCount > 0) {
    report += `• ❌ Out of Stock: ${inventoryStats.outOfStockCount} product(s)\n`;
  }
  report += `\n`;
  
  report += `**📋 Order Summary:**\n`;
  report += `• Total Orders: ${orderStats.totalOrders}\n`;
  report += `• Pending: ${orderStats.pendingOrders} | Completed: ${orderStats.completedOrders} | Cancelled: ${orderStats.cancelledOrders}\n`;
  report += `• Total Revenue: ৳${orderStats.totalRevenue.toLocaleString()}\n\n`;
  
  if (topProducts.length > 0) {
    report += `**🔝 Top Products by Value:**\n`;
    topProducts.forEach((p, i) => {
      report += `${i + 1}. ${p.name} - Stock: ${p.stock || 0}, Price: ৳${p.price || 0}\n`;
    });
    report += `\n`;
  }
  
  if (lowStockProducts.length > 0) {
    report += `**⚠️ Products Needing Restock:**\n`;
    lowStockProducts.slice(0, 5).forEach(p => {
      report += `• ${p.name}: Only ${p.stock} units left\n`;
    });
    report += `\n`;
  }
  
  if (outOfStockProducts.length > 0) {
    report += `**❌ Out of Stock Products:**\n`;
    outOfStockProducts.slice(0, 5).forEach(p => {
      report += `• ${p.name}\n`;
    });
    report += `\n`;
  }
  
  if (recentOrders.length > 0) {
    report += `**📝 Recent Orders:**\n`;
    recentOrders.forEach((o, i) => {
      report += `${i + 1}. ${o.customerName || 'Customer'} - ৳${o.total} - ${o.status}\n`;
    });
    report += `\n`;
  }
  
  report += `Need more details on any specific area?`;
  
  return report;
}

// Type alias for tenant business data
type TenantBusinessData = Awaited<ReturnType<typeof getTenantBusinessData>>;

// Chart data types
interface ChartData {
  stockStatus?: Array<{ name: string; value: number; percentage: number }>;
  categoryDistribution?: Array<{ category: string; products: number; stock: number; value: number }>;
  topProducts?: Array<{ name: string; stock: number; value: number }>;
  statusDistribution?: Array<{ name: string; value: number }>;
  revenueBreakdown?: Array<{ status: string; revenue: number }>;
}

/**
 * Generates a comprehensive inventory report with chart data.
 * Includes stock distribution, category breakdown, and value analysis.
 */
function generateInventoryReportWithCharts(data: NonNullable<Awaited<ReturnType<typeof getTenantBusinessData>>>): {
  report: string;
  chartData: ChartData;
} {
  const { products, inventoryStats } = data;
  
  // Category-wise distribution
  const categoryDistribution = products.reduce((acc, p) => {
    const category = p.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { count: 0, value: 0, stock: 0 };
    }
    acc[category].count++;
    acc[category].stock += (p.stock || 0);
    acc[category].value += ((p.costPrice || p.price || 0) * (p.stock || 0));
    return acc;
  }, {} as Record<string, { count: number; value: number; stock: number }>);
  
  // Stock status distribution
  const inStock = products.filter(p => (p.stock || 0) > 10).length;
  const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
  
  // Top products by stock value
  const topProducts = [...products]
    .sort((a, b) => ((b.costPrice || b.price || 0) * (b.stock || 0)) - ((a.costPrice || a.price || 0) * (a.stock || 0)))
    .slice(0, 10);
  
  let report = `📦 **Comprehensive Inventory Report**\n\n`;
  
  report += `**📊 Overall Statistics:**\n`;
  report += `• Total Products: ${inventoryStats.totalProducts}\n`;
  report += `• Total Units in Stock: ${inventoryStats.totalUnits.toLocaleString()}\n`;
  report += `• Total Inventory Value: ৳${inventoryStats.totalInventoryValue.toLocaleString()}\n\n`;
  
  report += `**📈 Stock Status Breakdown:**\n`;
  report += `• In Stock (>10 units): ${inStock} products (${((inStock/inventoryStats.totalProducts)*100).toFixed(1)}%)\n`;
  report += `• Low Stock (1-10 units): ${lowStock} products (${((lowStock/inventoryStats.totalProducts)*100).toFixed(1)}%)\n`;
  report += `• Out of Stock: ${outOfStock} products (${((outOfStock/inventoryStats.totalProducts)*100).toFixed(1)}%)\n\n`;
  
  report += `**📂 Category Distribution:**\n`;
  Object.entries(categoryDistribution)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .forEach(([category, stats]) => {
      report += `• ${category}: ${stats.count} products, ${stats.stock} units, Value: ৳${stats.value.toLocaleString()}\n`;
    });
  report += `\n`;
  
  report += `**💎 Top 10 Products by Stock Value:**\n`;
  topProducts.forEach((p, i) => {
    const value = (p.costPrice || p.price || 0) * (p.stock || 0);
    report += `${i + 1}. ${p.name}\n`;
    report += `   Stock: ${p.stock || 0} units | Price: ৳${p.price || 0} | Value: ৳${value.toLocaleString()}\n`;
  });
  report += `\n`;
  
  if (lowStock > 0) {
    const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    report += `**⚠️ Low Stock Alerts (${lowStock} products):**\n`;
    lowStockProducts.slice(0, 10).forEach(p => {
      report += `• ${p.name}: ${p.stock} units remaining\n`;
    });
    report += `\n`;
  }
  
  report += `💡 **Recommendation:** `;
  if (outOfStock > 0) {
    report += `Restock ${outOfStock} out-of-stock items immediately. `;
  }
  if (lowStock > 0) {
    report += `Monitor ${lowStock} low-stock items closely. `;
  }
  if (outOfStock === 0 && lowStock === 0) {
    report += `Great job! Your inventory is well-maintained.`;
  }
  
  // Chart data for frontend visualization
  const chartData = {
    stockStatus: [
      { name: 'In Stock', value: inStock, percentage: (inStock/inventoryStats.totalProducts)*100 },
      { name: 'Low Stock', value: lowStock, percentage: (lowStock/inventoryStats.totalProducts)*100 },
      { name: 'Out of Stock', value: outOfStock, percentage: (outOfStock/inventoryStats.totalProducts)*100 },
    ],
    categoryDistribution: Object.entries(categoryDistribution)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5)
      .map(([category, stats]) => ({
        category,
        products: stats.count,
        stock: stats.stock,
        value: stats.value
      })),
    topProducts: topProducts.map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      stock: p.stock || 0,
      value: (p.costPrice || p.price || 0) * (p.stock || 0)
    }))
  };
  
  return { report, chartData };
}

/**
 * Generates tenant-specific order report with detailed breakdown.
 */
function generateOrderReportForTenant(data: NonNullable<Awaited<ReturnType<typeof getTenantBusinessData>>>): {
  report: string;
  chartData: ChartData;
} {
  const { orders, orderStats } = data;
  
  // Status distribution
  const statusCounts = orders.reduce((acc, o) => {
    const status = o.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Revenue by status
  const revenueByStatus = orders.reduce((acc, o) => {
    const status = o.status || 'unknown';
    if (!acc[status]) acc[status] = 0;
    if (['delivered', 'completed'].includes(status.toLowerCase())) {
      acc[status] += (o.total || 0);
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10);
  
  // Calculate average order value
  const avgOrderValue = orderStats.totalOrders > 0 ? orderStats.totalRevenue / orderStats.completedOrders : 0;
  
  let report = `📋 **Comprehensive Order Report (Tenant-Specific)**\n\n`;
  
  report += `**📊 Overall Order Statistics:**\n`;
  report += `• Total Orders: ${orderStats.totalOrders}\n`;
  report += `• Completed Revenue: ৳${orderStats.totalRevenue.toLocaleString()}\n`;
  report += `• Average Order Value: ৳${avgOrderValue.toLocaleString()}\n\n`;
  
  report += `**📈 Order Status Breakdown:**\n`;
  report += `• Pending/Processing: ${orderStats.pendingOrders} orders\n`;
  report += `• Completed/Delivered: ${orderStats.completedOrders} orders (৳${orderStats.totalRevenue.toLocaleString()})\n`;
  report += `• Cancelled/Refunded: ${orderStats.cancelledOrders} orders\n\n`;
  
  report += `**📝 Recent Orders (Last 10):**\n`;
  recentOrders.forEach((o, i) => {
    report += `${i + 1}. Order #${o.id || 'N/A'}\n`;
    report += `   Customer: ${o.customerName || 'N/A'} | Amount: ৳${o.total} | Status: ${o.status}\n`;
    if (o.createdAt) {
      const date = new Date(o.createdAt);
      report += `   Date: ${date.toLocaleDateString()}\n`;
    }
  });
  report += `\n`;
  
  report += `💡 **Insights:**\n`;
  if (orderStats.pendingOrders > orderStats.completedOrders) {
    report += `• High pending orders - Focus on order fulfillment to improve cash flow.\n`;
  }
  if (orderStats.cancelledOrders > orderStats.totalOrders * 0.1) {
    report += `• Cancellation rate is ${((orderStats.cancelledOrders/orderStats.totalOrders)*100).toFixed(1)}% - Investigate reasons.\n`;
  }
  if (orderStats.completedOrders > orderStats.pendingOrders) {
    report += `• Good order completion rate - Keep up the excellent work!\n`;
  }
  
  // Chart data
  const chartData = {
    statusDistribution: [
      { name: 'Pending', value: orderStats.pendingOrders },
      { name: 'Completed', value: orderStats.completedOrders },
      { name: 'Cancelled', value: orderStats.cancelledOrders },
    ],
    revenueBreakdown: Object.entries(revenueByStatus).map(([status, revenue]) => ({
      status,
      revenue
    }))
  };
  
  return { report, chartData };
}

/**
 * Generates a fallback response when Gemini AI is unavailable or fails.
 * If business data is provided, uses real data to generate comprehensive reports.
 * Otherwise, provides generic business tips based on the query topic.
 * 
 * @param message - The user's message/query
 * @param businessData - Optional tenant business data for generating real reports
 * @returns A formatted response string
 */
function generateFallbackResponse(message: string, businessData?: TenantBusinessData): string {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.match(/^(hello|hi|hey|assalamu alaikum|salam)/)) {
    return `Hello! 👋 I'm your AI business assistant. I can help you with:\n\n• Understanding dashboard metrics and features\n• Increasing sales and revenue\n• Marketing strategies\n• Pricing products\n• Managing inventory\n• Customer service tips\n• Growing your business\n\nWhat would you like to know?`;
  }
  
  // If we have business data and the query is about business data, generate a comprehensive report
  if (businessData && isBusinessDataQuery(message)) {
    return generateComprehensiveBusinessReport(businessData);
  }
  
  // DASHBOARD SPECIFIC QUERIES - Check these FIRST before general keywords
  // These are very specific dashboard terms that should be prioritized
  
  // Products on Hands / Total Products - SPECIFIC
  if (lowerMessage.includes('products on hands') || 
      (lowerMessage.includes('total product') && !lowerMessage.includes('how many')) ||
      lowerMessage.includes('product on hand')) {
    return `**Products on Hands** shows your total inventory count.\n\nThis is the total number of products you have available to sell in your shop. It updates automatically when you:\n• Add new products\n• Delete products\n• Update product status\n\nYou can click on the Products menu to manage your inventory. Need help adding products?`;
  }
  
  // Low Stock - SPECIFIC
  if ((lowerMessage.includes('low stock') || lowerMessage.includes('low-stock')) && 
      !lowerMessage.includes('sale') && !lowerMessage.includes('sell')) {
    return `**Low Stock Products** warns you about items running out of inventory.\n\nA product is considered low stock when:\n• It has less than 10 units remaining\n• It's still available but needs restocking soon\n\n**What to do:**\n1. Check which products are low\n2. Order more from suppliers\n3. Update inventory when stock arrives\n4. Consider removing from sale if can't restock\n\nThis helps prevent selling out-of-stock items! Want inventory management tips?`;
  }
  
  // Pending Orders - SPECIFIC
  if (lowerMessage.includes('pending order') || lowerMessage.includes('pending') && lowerMessage.includes('order')) {
    return `**Pending Orders** are orders waiting for your confirmation.\n\nThese orders need your attention! You should:\n1. Review the order details\n2. Confirm the order if everything is correct\n3. Contact the customer if there are any issues\n4. Update the status to move them forward\n\nPending orders are shown in the dashboard metrics. Click 'Orders' to manage them. Want tips on handling orders efficiently?`;
  }
  
  // Confirmed Orders - SPECIFIC
  if (lowerMessage.includes('confirmed order') || (lowerMessage.includes('confirmed') && lowerMessage.includes('order'))) {
    return `**Confirmed Orders** are orders you've approved and are ready for processing.\n\nAfter confirmation, these orders typically move to:\n1. Processing (preparing the order)\n2. Shipped (sent to customer)\n3. Delivered (received by customer)\n\nYou can track confirmed orders in the Orders section. Need help with order fulfillment?`;
  }
  
  // Total Orders - SPECIFIC
  if (lowerMessage.includes('total order') || (lowerMessage.includes('all order') && !lowerMessage.includes('how'))) {
    return `**Total Orders** displays all orders ever placed in your shop.\n\nThis count includes:\n• Pending orders (waiting for confirmation)\n• Confirmed orders (approved)\n• Processing orders\n• Shipped orders\n• Delivered orders\n• Cancelled orders\n• Returned orders\n\nTo see order details, click on the Orders menu in the sidebar. Need help managing orders?`;
  }
  
  // Visits / Visitors - SPECIFIC  
  if ((lowerMessage.includes('visit') || lowerMessage.includes('visitor')) && 
      (lowerMessage.includes('track') || lowerMessage.includes('see') || lowerMessage.includes('check') || 
       lowerMessage.includes('last 7') || lowerMessage.includes('how many'))) {
    return `**Visits (Last 7 days)** shows how many people visited your store.\n\nThis metric tracks:\n• Unique visitors to your shop\n• Page views\n• Traffic trends over the past week\n• Online visitor activity\n\n**Why it matters:**\n• Higher visits = more potential customers\n• Track marketing campaign effectiveness\n• Understand when customers browse your shop\n• Compare week-over-week growth\n\nWant tips on increasing store traffic?`;
  }
  
  // Dashboard help - SPECIFIC
  if (lowerMessage.includes('dashboard help') || lowerMessage === 'dashboard' || 
      (lowerMessage.includes('show me') && lowerMessage.includes('dashboard'))) {
    const tips = businessKnowledge.dashboard.sort(() => 0.5 - Math.random()).slice(0, 5);
    return `**Dashboard Help:**\n\nHere's what you can find on your shop dashboard:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\n**Quick Tips:**\n• Use search to find orders quickly\n• Click metrics for detailed views\n• Export data for reports\n• Check daily to stay updated\n\nWhat specific dashboard feature would you like to know about?`;
  }
  
  // NOW check GENERAL topics (sales, marketing, etc.)
  
  // Sales / Revenue - but NOT if asking about dashboard metric
  if ((lowerMessage.includes('sale') || lowerMessage.includes('sell') || 
       (lowerMessage.includes('revenue') && !lowerMessage.includes('total revenue') && !lowerMessage.includes('see revenue'))) &&
      !lowerMessage.includes('how to see') && !lowerMessage.includes('where')) {
    // If we have business data, include real stats
    if (businessData) {
      const { orderStats } = businessData;
      return `**Your Sales Overview:**\n\n• Total Orders: ${orderStats.totalOrders}\n• Completed Orders: ${orderStats.completedOrders}\n• Total Revenue: ৳${orderStats.totalRevenue.toLocaleString()}\n\n**Tips to Boost Sales:**\n${businessKnowledge.sales.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nWould you like more specific advice?`;
    }
    const tips = businessKnowledge.sales.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `Here are some tips to boost your sales:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\nWould you like more specific advice?`;
  }
  
  // Marketing
  if (lowerMessage.includes('market') || lowerMessage.includes('advertis') || lowerMessage.includes('promot')) {
    const tips = businessKnowledge.marketing.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `Here are some marketing strategies:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\nNeed help implementing any of these?`;
  }
  
  // Pricing
  if ((lowerMessage.includes('price') || lowerMessage.includes('pricing') || lowerMessage.includes('cost')) &&
      !lowerMessage.includes('product price')) {
    const tips = businessKnowledge.pricing.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `Here are some pricing strategies:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\nWant me to elaborate on any of these?`;
  }
  
  // Inventory - but NOT if asking about specific dashboard metrics
  if ((lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('product')) &&
      !lowerMessage.includes('products on hands') && !lowerMessage.includes('low stock') &&
      !lowerMessage.includes('total product')) {
    // If we have business data, show real inventory stats
    if (businessData) {
      const { inventoryStats, products } = businessData;
      const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
      let response = `**Your Inventory Status:**\n\n• Total Products: ${inventoryStats.totalProducts}\n• Total Units: ${inventoryStats.totalUnits}\n• Inventory Value: ৳${inventoryStats.totalInventoryValue.toLocaleString()}\n`;
      if (inventoryStats.lowStockCount > 0) {
        response += `• ⚠️ Low Stock: ${inventoryStats.lowStockCount} products\n`;
        if (lowStockProducts.length > 0) {
          response += `\n**Products to Restock:**\n${lowStockProducts.slice(0, 5).map(p => `• ${p.name}: ${p.stock} units`).join('\n')}\n`;
        }
      }
      if (inventoryStats.outOfStockCount > 0) {
        response += `• ❌ Out of Stock: ${inventoryStats.outOfStockCount} products\n`;
      }
      response += `\nNeed help managing your inventory?`;
      return response;
    }
    const tips = businessKnowledge.inventory.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `Here are some inventory management tips:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\nNeed more guidance?`;
  }
  
  // Customer Service
  if (lowerMessage.includes('customer') || lowerMessage.includes('service') || 
      (lowerMessage.includes('support') && !lowerMessage.includes('chat support'))) {
    const tips = businessKnowledge.customerService.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `Here are some customer service best practices:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\nWould you like specific advice?`;
  }
  
  // Business Growth
  if (lowerMessage.includes('grow') || lowerMessage.includes('expand') || lowerMessage.includes('scale')) {
    const tips = businessKnowledge.growth.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `Here are some growth strategies:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\nWant to dive deeper into any of these?`;
  }
  
  // GENERAL dashboard queries - only if none of the above matched
  if (lowerMessage.includes('what does') || lowerMessage.includes('what is') || 
      lowerMessage.includes('explain') || lowerMessage.includes('meaning') ||
      lowerMessage.includes('how to see') || lowerMessage.includes('where can i') ||
      lowerMessage.includes('how do i') || lowerMessage.includes('where is')) {
    // This catches questions that weren't matched by specific dashboard queries
    return `I can help you with many things! Here are some topics:\n\n**Dashboard Metrics:**\n• Products on Hands (inventory count)\n• Total Orders, Pending Orders, Confirmed Orders\n• Low Stock alerts\n• Revenue and sales tracking\n• Visitor statistics\n\n**Business Topics:**\n• Sales and marketing strategies\n• Pricing tips\n• Inventory management\n• Customer service\n• Business growth\n\nPlease ask me something more specific, like:\n• "What is Products on Hands?"\n• "How do I boost sales?"\n• "Explain pending orders"\n• "Give me marketing tips"\n\nWhat would you like to know?`;
  }
  
  // If we have business data but didn't match a specific query, provide a summary
  if (businessData) {
    return generateComprehensiveBusinessReport(businessData);
  }
  
  // Final fallback - encourage specific questions
  return `I'm here to help! I can assist you with:\n\n**Dashboard Questions:**\n• What is Products on Hands?\n• Explain Total Orders\n• What are pending orders?\n• How to track revenue?\n\n**Business Advice:**\n• How to increase sales?\n• Marketing strategies\n• Pricing tips\n• Inventory management\n\nPlease ask me a specific question and I'll give you a detailed answer!`;
}

// Interfaces for tenant data types
interface Product {
  id?: number | string;
  name: string;
  price: number;
  costPrice?: number;
  stock?: number;
  status?: string;
  category?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface OrderItem {
  productId: number | string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id?: number | string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryCharge?: number;
}

// Helper function to fetch tenant business data for AI context
async function getTenantBusinessData(tenantId: string): Promise<{
  products: Product[];
  orders: Order[];
  inventoryStats: {
    totalProducts: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
  };
  orderStats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  };
} | null> {
  try {
    // Fetch products and orders from tenant data
    const data = await getTenantDataBatch<{
      products: Product[] | null;
      orders: Order[] | null;
    }>(tenantId, ['products', 'orders']);
    
    const products: Product[] = data?.products || [];
    const orders: Order[] = data?.orders || [];
    
    // Calculate inventory stats
    const inventoryStats = {
      totalProducts: products.length,
      totalUnits: products.reduce((sum, p) => sum + (p.stock || 0), 0),
      lowStockCount: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length,
      outOfStockCount: products.filter(p => (p.stock || 0) === 0).length,
      totalInventoryValue: products.reduce((sum, p) => sum + ((p.costPrice || p.price || 0) * (p.stock || 0)), 0),
    };
    
    // Calculate order stats
    const orderStats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => ['pending', 'processing', 'confirmed'].includes(o.status?.toLowerCase() || '')).length,
      completedOrders: orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase() || '')).length,
      cancelledOrders: orders.filter(o => ['cancelled', 'refunded'].includes(o.status?.toLowerCase() || '')).length,
      totalRevenue: orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase() || '')).reduce((sum, o) => sum + (o.total || 0), 0),
    };
    
    return { products, orders, inventoryStats, orderStats };
  } catch (error) {
    console.error('[AI Assistant] Error fetching tenant business data:', error);
    return null;
  }
}

// Check if message is asking about business data (action-based keyword matching)
function isBusinessDataQuery(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Action words that indicate user wants to see/get data
  const actionKeywords = ['show', 'give', 'tell', 'what', 'how many', 'list', 'check', 'see', 'view', 'get', 'display', 'report', 'provide'];
  
  // Business data related terms
  const dataKeywords = [
    'inventory', 'stock', 'products', 'product list', 'items', 
    'orders', 'order status', 'sales', 'revenue', 'business report', 
    'out of stock', 'low stock', 'pending orders', 'delivered',
    'my shop', 'my store', 'my business', 'analytics', 'statistics',
    'summary', 'overview', 'business data', 'restocking'
  ];
  
  // Check for combination of action + data term, or explicit data requests
  const hasActionKeyword = actionKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasDataKeyword = dataKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Return true if both action and data keywords are present, or if explicitly asking for reports/analytics
  const explicitDataRequests = [
    'inventory report', 'business report', 'sales report', 'order report', 'product report', 
    'analytics', 'sn assignment', 'sn report', 'comprehensive report', 'detailed report',
    'full report', 'complete report', 'business summary', 'shop report', 'store report'
  ];
  const isExplicitRequest = explicitDataRequests.some(phrase => lowerMessage.includes(phrase));
  
  return isExplicitRequest || (hasActionKeyword && hasDataKeyword);
}

// ── Tool Declarations for Agentic System ────────────────────────────────────

const getTenantAnalyticsTool: FunctionDeclaration = {
  name: 'get_tenant_analytics',
  description:
    'Fetch real-time analytics and performance data for the current tenant store. Returns revenue, conversion rate, and low-performing pages. Use this when the user asks about performance, analytics, conversion, revenue trends, or how their store is doing.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {
      timeframe: {
        type: 'STRING' as any,
        description: 'The time period to analyze. Use "7d" for the last 7 days or "30d" for the last 30 days.',
        enum: ['7d', '30d'],
      },
    },
    required: ['timeframe'],
  } as any,
};

const createLandingPageSectionTool: FunctionDeclaration = {
  name: 'create_landing_page_section',
  description:
    'Create a new landing page section for the tenant store. Use this when the user asks to create, build, or add a landing page section such as a hero banner, call-to-action, or features section.',
  parameters: {
    type: 'OBJECT' as any,
    properties: {
      type: {
        type: 'STRING' as any,
        description: 'The type of landing page section to create.',
        enum: ['hero', 'cta', 'features'],
      },
      heading: {
        type: 'STRING' as any,
        description: 'The main heading text for the section.',
      },
      subheading: {
        type: 'STRING' as any,
        description: 'The subheading or supporting text for the section.',
      },
      buttonText: {
        type: 'STRING' as any,
        description: 'The call-to-action button text (e.g. "Shop Now", "Learn More").',
      },
    },
    required: ['type', 'heading', 'subheading', 'buttonText'],
  } as any,
};

/**
 * Execute get_tenant_analytics tool: queries real data from the DB.
 * Returns revenue, conversion rate, and low-performing pages for the given timeframe.
 */
async function executeTenantAnalytics(tenantId: string, timeframe: string): Promise<{
  revenue: number;
  totalOrders: number;
  totalVisitors: number;
  conversionRate: number;
  averageOrderValue: number;
  lowPerformingPages: Array<{ path: string; views: number; bounceRate: number }>;
  timeframe: string;
}> {
  const db = await getDatabase();
  const days = timeframe === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch orders within timeframe
  const orders = await db.collection('orders').find({
    tenantId,
    createdAt: { $gte: since },
  }).toArray();

  const completedOrders = orders.filter(
    (o) => ['delivered', 'completed'].includes((o.status || '').toLowerCase())
  );
  const revenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const averageOrderValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;

  // Fetch visitor data within timeframe
  let totalVisitors = 0;
  try {
    totalVisitors = await db.collection('visitors').countDocuments({
      tenantId,
      lastVisit: { $gte: since },
    });
  } catch {
    // visitors collection may not exist yet
  }

  // Fetch page views for low-performing analysis
  let lowPerformingPages: Array<{ path: string; views: number; bounceRate: number }> = [];
  try {
    const pageViewsAgg = await db.collection('page_views').aggregate([
      { $match: { tenantId, timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$path',
          views: { $sum: 1 },
          bounces: { $sum: { $cond: [{ $eq: ['$isBounce', true] }, 1, 0] } },
        },
      },
      { $project: { path: '$_id', views: 1, bounceRate: { $cond: [{ $gt: ['$views', 0] }, { $multiply: [{ $divide: ['$bounces', '$views'] }, 100] }, 0] } } },
      { $sort: { views: 1 } },
      { $limit: 5 },
    ]).toArray();

    lowPerformingPages = pageViewsAgg.map((p) => ({
      path: p.path || p._id || '/unknown',
      views: p.views || 0,
      bounceRate: Math.round((p.bounceRate || 0) * 100) / 100,
    }));
  } catch {
    // page_views collection may not exist
  }

  const conversionRate = totalVisitors > 0
    ? Math.round((orders.length / totalVisitors) * 10000) / 100
    : 0;

  return {
    revenue,
    totalOrders: orders.length,
    totalVisitors,
    conversionRate,
    averageOrderValue: Math.round(averageOrderValue),
    lowPerformingPages,
    timeframe: `Last ${days} days`,
  };
}

/**
 * Execute create_landing_page_section tool: inserts a landing page section into the DB.
 * Returns the created section data and a preview URL.
 */
async function executeCreateLandingPageSection(
  tenantId: string,
  type: string,
  heading: string,
  subheading: string,
  buttonText: string
): Promise<{ success: boolean; sectionId: string; previewUrl: string; section: Record<string, unknown> }> {
  const db = await getDatabase();
  const sectionId = new ObjectId().toString();

  const section = {
    id: sectionId,
    type,
    heading,
    subheading,
    buttonText,
    createdAt: new Date().toISOString(),
    status: 'draft',
  };

  // Store in the landing_pages collection under tenant_data
  await db.collection('tenant_data').updateOne(
    { tenantId, key: 'landing_pages' },
    {
      $push: { 'data.sections': section } as any,
      $set: { updatedAt: new Date().toISOString() },
      $setOnInsert: { createdAt: new Date().toISOString() },
    },
    { upsert: true }
  );

  return {
    success: true,
    sectionId,
    previewUrl: '/dashboard/builder?preview=true',
    section,
  };
}

// Check if message is requesting navigation to a specific section
function detectNavigationRequest(message: string): { navigate: boolean; section?: string; action?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Theme-related navigation
  if (lowerMessage.match(/change|update|modify|edit|customize|set/) && lowerMessage.match(/theme|color|appearance|look|design/)) {
    return { navigate: true, section: 'theme_colors', action: 'Navigate to theme customization' };
  }
  
  // Section-specific navigation patterns
  const navigationPatterns = [
    { pattern: /(go to|open|show|navigate to|take me to)\s+(theme|color)/i, section: 'theme_colors' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(customization|customize)/i, section: 'customization' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(inventory|stock)/i, section: 'inventory' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(order|orders)/i, section: 'orders' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(product|products)/i, section: 'products' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(business\s+report|report|analytics)/i, section: 'business_report_expense' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(settings|configuration)/i, section: 'settings' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(dashboard|home)/i, section: 'dashboard' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(catalog|categor)/i, section: 'catalog_categories' },
    { pattern: /(go to|open|show|navigate to|take me to)\s+(customer|customers)/i, section: 'customers_reviews' },
  ];
  
  for (const { pattern, section } of navigationPatterns) {
    if (pattern.test(message)) {
      return { navigate: true, section, action: `Navigate to ${section.replace(/_/g, ' ')}` };
    }
  }
  
  return { navigate: false };
}

// Format business data as context for AI
function formatBusinessDataContext(data: NonNullable<Awaited<ReturnType<typeof getTenantBusinessData>>>): string {
  const { products, orders, inventoryStats, orderStats } = data;
  
  // Get top 10 products by stock value
  const topProducts = [...products]
    .sort((a, b) => ((b.costPrice || b.price || 0) * (b.stock || 0)) - ((a.costPrice || a.price || 0) * (a.stock || 0)))
    .slice(0, 10);
  
  // Get low stock products
  const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
  
  // Get out of stock products
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
  
  // Get recent orders (last 10)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10);
  
  return `
=== TENANT BUSINESS DATA (REAL-TIME) ===

📦 INVENTORY OVERVIEW:
- Total Products: ${inventoryStats.totalProducts}
- Total Units in Stock: ${inventoryStats.totalUnits}
- Low Stock Products (≤10 units): ${inventoryStats.lowStockCount}
- Out of Stock Products: ${inventoryStats.outOfStockCount}
- Total Inventory Value: ৳${inventoryStats.totalInventoryValue.toLocaleString()}

📊 ORDER OVERVIEW:
- Total Orders: ${orderStats.totalOrders}
- Pending Orders: ${orderStats.pendingOrders}
- Completed Orders: ${orderStats.completedOrders}
- Cancelled Orders: ${orderStats.cancelledOrders}
- Total Revenue (Completed): ৳${orderStats.totalRevenue.toLocaleString()}

🔝 TOP 10 PRODUCTS BY STOCK VALUE:
${topProducts.map((p, i) => `${i + 1}. ${p.name} - Stock: ${p.stock || 0}, Price: ৳${p.price || 0}, Value: ৳${((p.costPrice || p.price || 0) * (p.stock || 0)).toLocaleString()}`).join('\n')}

⚠️ LOW STOCK ALERT (≤10 units):
${lowStockProducts.length > 0 
  ? lowStockProducts.slice(0, 5).map(p => `- ${p.name}: ${p.stock} units remaining`).join('\n')
  : '- No products with low stock! Great job managing inventory.'}

❌ OUT OF STOCK PRODUCTS:
${outOfStockProducts.length > 0 
  ? outOfStockProducts.slice(0, 5).map(p => `- ${p.name}`).join('\n')
  : '- All products are in stock! Excellent inventory management.'}

📋 RECENT ORDERS (Last 10):
${recentOrders.length > 0 
  ? recentOrders.map((o, i) => `${i + 1}. Order #${o.id || 'N/A'} - ${o.customerName || 'Customer'} - ৳${o.total} - Status: ${o.status}`).join('\n')
  : '- No orders yet.'}

=== END OF BUSINESS DATA ===
`;
}

// Chat endpoint with Gemini AI
aiAssistantRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, tenantId, userId = 'default' } = req.body;
    
    if (!message || !tenantId) {
      return res.status(400).json({ error: 'Message and tenantId are required' });
    }

    const contextKey = `${userId}-${tenantId}`;
    let conversationMessages: any[] = [];

    // Load from cache or database
    if (conversationCache.has(contextKey)) {
      conversationMessages = conversationCache.get(contextKey)!.messages;
    } else {
      conversationMessages = await loadConversationFromDb(tenantId, userId);
    }

    // Add user message
    conversationMessages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    let response: string | undefined;
    let navigationInfo = null;
    let chartData = null;
    let toolAction: { type: string; url: string; label: string; sectionId?: string } | null = null;

    // Check for navigation request first
    const navRequest = detectNavigationRequest(message);
    if (navRequest.navigate) {
      console.log(`[AI Assistant] Navigation request detected: ${navRequest.section}`);
      response = `I'll take you to the ${navRequest.section?.replace(/_/g, ' ')} section now. 🚀`;
      navigationInfo = { section: navRequest.section, action: navRequest.action };
    } else {
      // Check if specific report type is requested
      const lowerMessage = message.toLowerCase();
      const isInventoryReport = lowerMessage.includes('inventory report') || 
                                lowerMessage.includes('stock report') ||
                                (lowerMessage.includes('show') && lowerMessage.includes('inventory'));
      const isOrderReport = lowerMessage.includes('order report') || 
                           lowerMessage.includes('orders for') ||
                           (lowerMessage.includes('show') && lowerMessage.includes('order'));
      
      // Check if the message is asking about business data
      const needsBusinessData = isBusinessDataQuery(message) || isInventoryReport || isOrderReport;
      let businessDataContext = '';
      let businessData: Awaited<ReturnType<typeof getTenantBusinessData>> = null;
      
      if (needsBusinessData) {
        console.log('[AI Assistant] Business data query detected, fetching tenant data...');
        businessData = await getTenantBusinessData(tenantId);
        if (businessData) {
          // Generate specific report based on request
          if (isInventoryReport) {
            const { report, chartData: invChartData } = generateInventoryReportWithCharts(businessData);
            response = report;
            chartData = invChartData;
            console.log('[AI Assistant] Comprehensive inventory report generated with charts');
          } else if (isOrderReport) {
            const { report, chartData: orderChartData } = generateOrderReportForTenant(businessData);
            response = report;
            chartData = orderChartData;
            console.log('[AI Assistant] Tenant-specific order report generated with charts');
          } else {
            businessDataContext = formatBusinessDataContext(businessData);
            console.log('[AI Assistant] Business data context prepared successfully');
          }
        }
      }

      // If no specific report was generated, use AI or fallback
      if (!response) {
        // Try Gemini AI with multi-key failover (with tool/function calling support)
        if (keyManager.hasKeys) {
          try {
            // Build conversation history for Gemini
            const chatHistory = conversationMessages.slice(-10).map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            }));

            // Build the full prompt with business data context if needed
            let fullPrompt = SYSTEM_PROMPT;
            
            if (businessDataContext) {
              fullPrompt += `\n\nIMPORTANT: The user is asking about their business data. Use the following REAL-TIME data from their shop to provide accurate, specific answers. Always reference actual numbers and product names from this data:\n${businessDataContext}`;
            }
            
            fullPrompt += `\n\nUser: ${message}`;

            // Multi-key failover with retry
            const MAX_RETRIES = 3;
            let lastError: any;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
              const entry = keyManager.getGenAI();
              if (!entry) {
                console.warn('[AI Assistant] All API keys blacklisted — waiting before retry');
                await backoffWithJitter(attempt);
                continue;
              }
              try {
                // Initialize model with tools for agentic function calling
                const model = entry.genAI.getGenerativeModel({
                  model: 'gemini-2.5-flash',
                  tools: [
                    {
                      functionDeclarations: [
                        getTenantAnalyticsTool,
                        createLandingPageSectionTool,
                      ],
                    },
                  ],
                });

                // Start chat with history - use higher token limit only when business data is included
                const chat = model.startChat({
                  history: chatHistory.slice(0, -1), // All except the latest user message
                  generationConfig: {
                    maxOutputTokens: businessDataContext ? 2000 : 1000,
                    temperature: 0.7,
                  },
                });

                const result = await chat.sendMessage(fullPrompt);

                // Check if Gemini returned a function call
                const functionCall = result.response.functionCalls()?.[0];

                if (functionCall) {
                  console.log(`[AI Assistant] Function call detected: ${functionCall.name}`);

                  // ── get_tenant_analytics ─────────────────────────────────
                  if (functionCall.name === 'get_tenant_analytics') {
                    const args = functionCall.args as { timeframe?: string };
                    const timeframe = args.timeframe || '7d';

                    const analyticsResult = await executeTenantAnalytics(tenantId, timeframe);
                    console.log('[AI Assistant] Analytics data fetched:', JSON.stringify(analyticsResult));

                    // Send tool result back to Gemini for final response
                    const fnResult = await chat.sendMessage([
                      {
                        functionResponse: {
                          name: 'get_tenant_analytics',
                          response: analyticsResult,
                        },
                      },
                    ]);

                    response = fnResult.response.text();
                    console.log('[AI Assistant] Final response after analytics tool call generated');
                  }

                  // ── create_landing_page_section ─────────────────────────
                  if (functionCall.name === 'create_landing_page_section') {
                    const args = functionCall.args as {
                      type?: string;
                      heading?: string;
                      subheading?: string;
                      buttonText?: string;
                    };

                    const sectionResult = await executeCreateLandingPageSection(
                      tenantId,
                      args.type || 'hero',
                      args.heading || 'Welcome',
                      args.subheading || '',
                      args.buttonText || 'Learn More'
                    );
                    console.log('[AI Assistant] Landing page section created:', sectionResult.sectionId);

                    // Send tool result back to Gemini for final response
                    const fnResult = await chat.sendMessage([
                      {
                        functionResponse: {
                          name: 'create_landing_page_section',
                          response: sectionResult,
                        },
                      },
                    ]);

                    response = fnResult.response.text();

                    // Attach tool action for frontend to render a preview link
                    toolAction = {
                      type: 'landing_page_created',
                      url: sectionResult.previewUrl,
                      label: `Preview your new ${args.type || 'hero'} section`,
                      sectionId: sectionResult.sectionId,
                    };
                    console.log('[AI Assistant] Final response after landing page tool call generated');
                  }
                }

                // Standard text response (no function call)
                if (!response) {
                  response = result.response.text();
                }
                console.log('[AI Assistant] Gemini response generated successfully');
                break; // success
              } catch (err: any) {
                lastError = err;
                const status = err?.status || err?.httpError?.status || err?.response?.status;
                if (status === 429 || status === 500) {
                  keyManager.blacklistKey(entry.apiKey);
                  console.warn(`[AI Assistant] Key returned ${status}, retrying with next key (attempt ${attempt + 1}/${MAX_RETRIES})`);
                  await backoffWithJitter(attempt);
                } else {
                  throw err;
                }
              }
            }

            if (!response && lastError) {
              throw lastError;
            }
          } catch (geminiError) {
            console.error('[AI Assistant] Gemini error, using fallback:', geminiError);
            // Pass business data to fallback so it can generate a comprehensive report
            response = generateFallbackResponse(message, businessData);
          }
        } else {
          // Use fallback if Gemini not available - pass business data for comprehensive report
          response = generateFallbackResponse(message, businessData);
        }
      }
    }

    // Add assistant response
    conversationMessages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    // Update cache
    conversationCache.set(contextKey, {
      messages: conversationMessages.slice(-50),
      lastActive: Date.now()
    });

    // Save to database periodically
    if (conversationMessages.length % 5 === 0) {
      saveConversationToDb(tenantId, userId, conversationMessages);
    }

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      navigation: navigationInfo,
      chartData: chartData,
      toolAction: toolAction
    });
  } catch (error) {
    console.error('[AI Assistant] Error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear conversation history
aiAssistantRouter.post('/clear', async (req: Request, res: Response) => {
  try {
    const { tenantId, userId = 'default' } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'TenantId is required' });
    }

    const contextKey = `${userId}-${tenantId}`;
    conversationCache.delete(contextKey);

    // Also clear from database
    try {
      const db = await getDatabase();
      await db.collection(CONVERSATION_COLLECTION).deleteOne({ tenantId, userId });
    } catch (dbError) {
      console.error('[AI Assistant] Error clearing from DB:', dbError);
    }

    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('[AI Assistant] Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

// Get conversation history
aiAssistantRouter.get('/history/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const userId = (req.query.userId as string) || 'default';
    
    const messages = await loadConversationFromDb(tenantId, userId);
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('[AI Assistant] Error getting history:', error);
    res.status(500).json({ error: 'Failed to get conversation history' });
  }
});

// Get suggested questions
aiAssistantRouter.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const suggestions = [
      "Show me my inventory report",
      "How many products are out of stock?",
      "Give me a business summary",
      "What are my recent orders?",
      "Which products need restocking?",
      "How can I increase my sales?",
      "Analyze my store performance for the last 7 days",
      "Create a hero section for my landing page"
    ];
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('[AI Assistant] Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default aiAssistantRouter;

// Image analysis endpoint using Gemini Vision
aiAssistantRouter.post('/analyze-image', async (req: Request, res: Response) => {
  try {
    const { image, action, tenantId } = req.body;
    
    if (!image || !action || !tenantId) {
      return res.status(400).json({ error: 'Image, action, and tenantId are required' });
    }

    if (!keyManager.hasKeys) {
      return res.status(503).json({ error: 'AI service not available' });
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Create image part for Gemini
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };

    let prompt = '';
    
    switch (action) {
      case 'analyze':
        prompt = `Analyze this image in detail. Describe what you see, the composition, colors, subjects, and any notable elements. Be thorough but concise.`;
        break;
      case 'product':
        prompt = `Create a compelling e-commerce product listing for this image. Include:
1. **Product Title** - Catchy, SEO-friendly title
2. **Short Description** - 2-3 sentences highlighting key features
3. **Key Features** - 5 bullet points
4. **Suggested Price Range** - In BDT (৳)
5. **Target Audience** - Who would buy this
6. **SEO Keywords** - 5-7 relevant keywords

Make it suitable for the Bangladeshi e-commerce market.`;
        break;
      case 'improve':
        prompt = `As a professional photographer and image expert, analyze this image and suggest improvements:
1. **Composition** - How can framing be improved?
2. **Lighting** - What lighting adjustments would help?
3. **Colors** - Any color correction suggestions?
4. **Background** - Should it be changed or edited?
5. **Overall Quality** - Rate it 1-10 and explain why
6. **Specific Tips** - 3 actionable tips to make this image better for e-commerce use`;
        break;
      case 'description':
        prompt = `Write an engaging, SEO-optimized product description for this image. The description should:
- Be 150-200 words
- Highlight benefits and features
- Include emotional appeal
- Be suitable for Bangladeshi customers
- Include a call-to-action

Also provide:
- Meta description (160 characters)
- 5 relevant hashtags for social media`;
        break;
      case 'colors':
        prompt = `Analyze the colors in this image and provide:
1. **Dominant Colors** - List the main colors with approximate hex codes
2. **Color Palette** - Suggest a complementary color palette
3. **Mood** - What mood do these colors convey?
4. **Best Use** - Where would these colors work well (website, packaging, etc.)
5. **Color Combinations** - Suggest 3 color combinations that would work with this image`;
        break;
      case 'enhance':
        prompt = `As an image enhancement expert, analyze this image and provide detailed enhancement suggestions:

**Current Image Analysis:**
- Quality assessment (sharpness, noise, exposure)
- Color balance evaluation
- Composition analysis

**Enhancement Recommendations:**
1. **Brightness/Contrast** - Specific adjustments needed (e.g., +10% brightness)
2. **Color Correction** - Saturation, vibrance, white balance suggestions
3. **Sharpening** - Level of sharpening recommended
4. **Noise Reduction** - If needed, how much
5. **Cropping** - Recommended aspect ratio or crop suggestions
6. **Filter Style** - Suggest a filter or editing style that would enhance this image

**For E-commerce Use:**
- Background removal recommendation (yes/no and why)
- Recommended image dimensions
- File format suggestion (PNG/JPG/WebP)

Provide specific, actionable steps the user can apply in any photo editing software.`;
        break;
      default:
        prompt = `Describe this image in detail and suggest how it could be used for e-commerce purposes.`;
    }

    console.log(`[AI Assistant] Processing image with action: ${action}`);

    // Retry logic with multi-key failover
    const MAX_RETRIES = 3;
    let lastError: any;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const entry = keyManager.getGenAI();
      if (!entry) {
        console.warn('[AI Assistant] All API keys blacklisted — waiting before retry');
        await backoffWithJitter(attempt);
        continue;
      }
      try {
        const model = entry.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        console.log('[AI Assistant] Image analysis completed successfully');

        return res.json({
          success: true,
          response: responseText,
          action,
          timestamp: new Date().toISOString()
        });
      } catch (retryError: any) {
        lastError = retryError;
        const status = retryError?.status || retryError?.httpError?.status || retryError?.response?.status;
        console.log(`[AI Assistant] Attempt ${attempt + 1} failed:`, retryError?.message || 'Unknown error');
        
        if (status === 429 || status === 500) {
          keyManager.blacklistKey(entry.apiKey);
          console.warn(`[AI Assistant] Key returned ${status}, retrying with next key`);
          await backoffWithJitter(attempt);
          continue;
        }
        break;
      }
    }

    // If we get here, all retries failed
    const errorMessage = lastError?.status === 429 
      ? 'AI service is temporarily busy. Please wait a moment and try again.'
      : 'Failed to analyze image. Please try again.';
    
    console.error('[AI Assistant] Image analysis error:', lastError);
    return res.status(lastError?.status === 429 ? 429 : 500).json({
      error: errorMessage,
      retryAfter: lastError?.status === 429 ? 10 : undefined
    });
  } catch (error: any) {
    console.error('[AI Assistant] Image analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
