import { useState, useEffect, useMemo } from 'react';
import { Order, CourierConfig, PathaoConfig, ProductCourierStatus } from '../types';
import { CourierService } from '../../../services/CourierService';

const getOrderTimestamp = (order: Order) => {
  const rawValue = order.createdAt || order.date;
  const timestamp = new Date(String(rawValue || 0)).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const extractOrderProductIds = (order: Order): number[] => {
  const productIds = new Set<number>();

  if (order.productId !== undefined && order.productId !== null) {
    const id = Number(order.productId);
    if (!Number.isNaN(id)) productIds.add(id);
  }

  if (Array.isArray(order.items)) {
    order.items.forEach((item) => {
      const candidate = item?.productId ?? item?.id;
      const id = Number(candidate);
      if (!Number.isNaN(id)) productIds.add(id);
    });
  }

  return Array.from(productIds);
};

interface UseCourierStatusOptions {
  orders: Order[];
  tenantId?: string;
  courierConfig?: CourierConfig;
}

export function useCourierStatus({ orders, tenantId, courierConfig }: UseCourierStatusOptions) {
  const [pathaoConfig, setPathaoConfig] = useState<PathaoConfig | null>(null);
  const [courierStatuses, setCourierStatuses] = useState<Record<number, ProductCourierStatus>>({});

  const hasPathaoCourierOrders = useMemo(
    () => orders.some((order) => order.courierProvider === 'Pathao' && (order.trackingId || order.courierMeta)),
    [orders]
  );

  // Load Pathao config when needed
  useEffect(() => {
    if (!tenantId || !hasPathaoCourierOrders) {
      setPathaoConfig(null);
      return;
    }

    let cancelled = false;
    const loadConfig = async () => {
      const config = await CourierService.loadPathaoConfig(tenantId);
      if (!cancelled) setPathaoConfig(config);
    };
    loadConfig();
    return () => { cancelled = true; };
  }, [hasPathaoCourierOrders, tenantId]);

  // Sync courier statuses
  useEffect(() => {
    if (!tenantId) {
      setCourierStatuses({});
      return;
    }

    const courierOrders = orders.filter((order) =>
      Boolean(order.courierProvider) &&
      (order.status === 'Sent to Courier' || order.status === 'Shipped' || order.status === 'Delivered') &&
      (order.trackingId || order.courierMeta)
    );

    if (courierOrders.length === 0) {
      setCourierStatuses({});
      return;
    }

    const latestOrderByProduct = new Map<number, Order>();
    [...courierOrders]
      .sort((left, right) => getOrderTimestamp(right) - getOrderTimestamp(left))
      .forEach((order) => {
        extractOrderProductIds(order).forEach((productId) => {
          if (!latestOrderByProduct.has(productId)) {
            latestOrderByProduct.set(productId, order);
          }
        });
      });

    const groupedOrders = new Map<string, { order: Order; productIds: number[] }>();
    latestOrderByProduct.forEach((order, productId) => {
      const trackingId = order.trackingId || String(order.courierMeta?.consignment_id || order.courierMeta?.tracking_id || order.courierMeta?.invoice || '');
      const key = `${order.courierProvider}:${order.id}:${trackingId}`;
      const existing = groupedOrders.get(key);
      if (existing) {
        existing.productIds.push(productId);
      } else {
        groupedOrders.set(key, { order, productIds: [productId] });
      }
    });

    let cancelled = false;

    const syncStatuses = async () => {
      const entries = await Promise.all(Array.from(groupedOrders.values()).map(async ({ order, productIds }) => {
        try {
          if (order.courierProvider === 'Steadfast' && courierConfig?.apiKey && courierConfig?.secretKey) {
            const result = await CourierService.getSteadfastStatus(order, courierConfig);
            return { order, productIds, result };
          }
          if (order.courierProvider === 'Pathao' && pathaoConfig) {
            const result = await CourierService.getPathaoStatus(order, pathaoConfig, tenantId!);
            return { order, productIds, result };
          }
        } catch (error) {
          console.error('[useCourierStatus] Courier status sync failed:', error);
        }
        return null;
      }));

      if (cancelled) return;

      const nextStatuses: Record<number, ProductCourierStatus> = {};
      entries.forEach((entry) => {
        if (!entry) return;
        entry.productIds.forEach((productId) => {
          nextStatuses[productId] = {
            label: entry.result.status,
            provider: entry.result.provider,
            trackingId: entry.result.trackingId,
            orderId: entry.order.id,
          };
        });
      });
      setCourierStatuses(nextStatuses);
    };

    syncStatuses();
    return () => { cancelled = true; };
  }, [orders, tenantId, courierConfig, pathaoConfig]);

  return courierStatuses;
}
