import React from 'react';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { Order, Product, WebsiteConfig, ThemeConfig } from '../types';

export interface InvoicePrintData {
  order: Order;
  products?: Product[];
  shopName?: string;
  shopLogo?: string;
  shopWebsite?: string;
  shopEmail?: string;
  shopPhone?: string;
  shopAddress?: string;
  courierProvider?: string;
  consignmentId?: string;
}

// Generate invoice HTML for printing - matches Figma design node 909-60
export const generateInvoiceHTML = (data: InvoicePrintData): string => {
  const {
    order,
    products = [],
    shopName = 'Your Shop',
    shopLogo,
    shopWebsite = '',
    shopEmail = '',
    shopPhone = '',
    shopAddress = '',
    courierProvider = '',
    consignmentId = '',
  } = data;

  // Parse order items
  let orderItems: { name: string; description?: string; sku?: string; qty: number; unit?: string; rate: number; amount: number; image?: string }[] = [];
  
  if (order.items && Array.isArray(order.items)) {
    orderItems = order.items.map((item: any) => ({
      name: item.name || item.productName || 'Product',
      description: item.variant || item.description || '',
      sku: item.sku || '',
      qty: item.quantity || 1,
      unit: item.unit || 'pcs',
      rate: item.price || item.unitPrice || 0,
      amount: (item.price || item.unitPrice || 0) * (item.quantity || 1),
      image: item.image || item.productImage || '',
    }));
  } else if (order.productName) {
    orderItems = [{
      name: order.productName,
      description: (order as any).variantInfo || '',
      sku: (order as any).sku || '',
      qty: order.quantity || 1,
      unit: (order as any).unit || 'pcs',
      rate: order.amount / (order.quantity || 1),
      amount: order.amount,
      image: (order as any).productImage || '',
    }];
  }

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.amount, 0);
  const deliveryCharge = (order as any).deliveryCharge || (order as any).shippingCost || 0;
  const discountAmount = (order as any).discountAmount || 0;
  const discountPercent = subtotal > 0 ? ((discountAmount / subtotal) * 100).toFixed(2) : '0';
  const grandTotal = subtotal + deliveryCharge - discountAmount;
  const advancePaid = (order as any).advancePaid || (order as any).paidAmount || 0;
  const duePay = grandTotal - advancePaid;

  // Format currency
  const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Format date
  const orderDate = order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Invoice number
  const invoiceNumber = `#${(order.id || '').toString().slice(-8).toUpperCase() || 'INV-' + Date.now()}`;

  // Generate items HTML
  const itemsHTML = orderItems.map((item, index) => `
    <tr>
      <td style="padding: 12px 0; font-size: 10px; color: #1a1c21; vertical-align: top;">${index + 1}</td>
      <td style="padding: 12px 0; vertical-align: top;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <div style="width: 28px; height: 28px; background: #ededed; border-radius: 4px; flex-shrink: 0;${item.image ? ` background-image: url(${item.image}); background-size: cover; background-position: center;` : ''}"></div>
          <div>
            <div style="font-size: 10px; font-weight: 600; color: #1a1c21;">${item.name}</div>
            ${item.description ? `<div style="font-size: 10px; color: #5e6470;">${item.description}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 12px 0; font-size: 10px; color: #1a1c21; vertical-align: top;">${item.sku || '-'}</td>
      <td style="padding: 12px 0; font-size: 10px; color: #1a1c21; vertical-align: top;">${item.qty}</td>
      <td style="padding: 12px 0; font-size: 10px; color: #1a1c21; vertical-align: top;">${item.unit}</td>
      <td style="padding: 12px 0; font-size: 10px; color: #1a1c21; text-align: right; vertical-align: top;">${formatCurrency(item.rate)}</td>
      <td style="padding: 12px 0; font-size: 10px; color: #1a1c21; text-align: right; vertical-align: top;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f9fafc;
      padding: 20px;
      color: #1a1c21;
    }
    
    .invoice-container {
      max-width: 595px;
      margin: 0 auto;
      background: #f9fafc;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px 0;
    }
    
    .shop-info {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    
    .shop-logo {
      width: 93px;
      height: 63px;
      object-fit: contain;
    }
    
    .shop-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .shop-name {
      font-size: 18px;
      font-weight: 600;
    }
    
    .shop-contact {
      font-size: 10px;
      color: #5e6470;
      line-height: 14px;
    }
    
    .business-address {
      text-align: right;
      font-size: 10px;
      color: #5e6470;
      line-height: 14px;
      max-width: 150px;
    }
    
    .invoice-card {
      background: white;
      border: 0.5px solid #d7dae0;
      border-radius: 12px;
      padding: 20px 16px;
      margin-top: 16px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .info-item.right {
      text-align: right;
    }
    
    .info-label {
      font-size: 10px;
      font-weight: 500;
      color: #5e6470;
      line-height: 14px;
    }
    
    .info-value {
      font-size: 10px;
      font-weight: 600;
      color: #1a1c21;
      line-height: 14px;
    }
    
    .customer-address {
      font-size: 10px;
      font-weight: 400;
      color: #5e6470;
      line-height: 14px;
    }
    
    .divider {
      height: 0.5px;
      background: #d7dae0;
      margin: 12px 0;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .items-table th {
      font-size: 8px;
      font-weight: 600;
      color: #5e6470;
      text-transform: uppercase;
      letter-spacing: 0.32px;
      text-align: left;
      padding: 8px 0;
      border-bottom: 0.5px solid #d7dae0;
    }
    
    .items-table th:nth-child(6),
    .items-table th:nth-child(7) {
      text-align: right;
    }
    
    .items-table tr:last-child td {
      border-bottom: 0.5px solid #d7dae0;
    }
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    
    .totals-table {
      width: 240px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #1a1c21;
      margin-bottom: 8px;
    }
    
    .totals-row.discount {
      color: #da0000;
    }
    
    .totals-row.grand-total {
      font-size: 10px;
      font-weight: 600;
    }
    
    .totals-row.due-pay {
      font-size: 10px;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 24px;
      font-size: 10px;
      font-weight: 600;
      color: #1a1c21;
    }
    
    @media print {
      body {
        padding: 0;
        background: white;
      }
      
      .invoice-container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="shop-info">
        ${shopLogo ? `<img src="${normalizeImageUrl(shopLogo)}" alt="Logo" class="shop-logo" />` : ''}
        <div class="shop-details">
          <div class="shop-name">${shopName}</div>
          ${shopWebsite ? `<div class="shop-contact">${shopWebsite}</div>` : ''}
          ${shopEmail ? `<div class="shop-contact">${shopEmail}</div>` : ''}
          ${shopPhone ? `<div class="shop-contact">${shopPhone}</div>` : ''}
        </div>
      </div>
      <div class="business-address">
        <div style="font-weight: 500;">Business address</div>
        ${shopAddress || 'Address not set'}
      </div>
    </div>
    
    <!-- Invoice Card -->
    <div class="invoice-card">
      <!-- Info Grid Row 1 -->
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Billed to</div>
          <div class="info-value">${order.customer || 'Customer'}</div>
          <div class="customer-address">${order.location || ''}</div>
          <div class="customer-address">${order.phone || ''}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Invoice number</div>
          <div class="info-value">${invoiceNumber}</div>
        </div>
        <div class="info-item right">
          <div class="info-label">Date</div>
          <div class="info-value">${orderDate}</div>
        </div>
      </div>
      
      <!-- Info Grid Row 2 -->
      <div class="info-grid" style="margin-top: -8px;">
        <div class="info-item"></div>
        <div class="info-item">
          <div class="info-label">Provider</div>
          <div class="info-value">${courierProvider || order.courierProvider || 'N/A'}</div>
        </div>
        <div class="info-item right">
          <div class="info-label">Consignment ID</div>
          <div class="info-value">${consignmentId || (order as any).trackingId || (order as any).courierTrackingId || 'Pending'}</div>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 30px;">NO.</th>
            <th style="width: 140px;">ITEM DETAIL</th>
            <th style="width: 100px;">SKU</th>
            <th style="width: 40px;">QTY</th>
            <th style="width: 50px;">UNIT</th>
            <th style="width: 80px;">RATE</th>
            <th style="width: 80px;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-table">
          <div class="totals-row">
            <span>Sub Total</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          <div class="totals-row">
            <span>Delivery Charge</span>
            <span>${formatCurrency(deliveryCharge)}</span>
          </div>
          ${discountAmount > 0 ? `
          <div class="totals-row discount">
            <span>Discount (${discountPercent}%)</span>
            <span>- ${formatCurrency(discountAmount)}</span>
          </div>` : ''}
          <div class="totals-row grand-total">
            <span>Grand Total</span>
            <span>${formatCurrency(grandTotal)}</span>
          </div>
          ${advancePaid > 0 ? `
          <div class="totals-row">
            <span>Advance Pay</span>
            <span>${formatCurrency(advancePaid)}</span>
          </div>` : ''}
          <div class="totals-row due-pay">
            <span>Due Pay</span>
            <span>${formatCurrency(duePay)}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      Thanks for the business.
    </div>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;
};

// Print invoice function
export const printInvoice = (data: InvoicePrintData): void => {
  const popup = window.open('', 'PRINT_INVOICE', 'width=900,height=800');
  if (!popup) {
    console.error('Please allow popups to print invoice.');
    return;
  }
  
  popup.document.write(generateInvoiceHTML(data));
  popup.document.close();
  popup.focus();
};

// React component for preview
export const InvoicePrintTemplate: React.FC<InvoicePrintData> = (props) => {
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(props) }} 
      style={{ background: '#f9fafc' }}
    />
  );
};

export default InvoicePrintTemplate;
