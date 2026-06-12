'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import AdminNote from '../../../views/AdminNote';
import { ExpenseService, setExpenseTenantId } from '../../../services/ExpenseService';
import { IncomeService, setIncomeTenantId } from '../../../services/IncomeService';
import { CategoryService, CategoryDTO, setCategoryTenantId } from '../../../services/CategoryService';
import { dueListService } from '../../../services/DueListService';
import { DueEntity } from '../../../types';
import CustomDateRangePicker, { DateRange } from '../CustomDateRangePicker';

import {
  OverviewIcon, WaterfallIcon, InvoiceIcon, MoneyReceiveIcon,
  ShoppingBagIcon, BookIcon, NoteIcon,
} from './icons';
import {
  ExpenseItem, IncomeItem, FigmaBusinessReportProps,
  TabType, DateRangeType, SummaryData, DueSummaryData, DueGraphData,
} from './types';

import BusinessOverviewTab from './tabs/BusinessOverviewTab';
import ProfitLossTab from './tabs/ProfitLossTab';
import ExpenseTab from './tabs/ExpenseTab';
import IncomeTab from './tabs/IncomeTab';
import PurchaseTab from './tabs/PurchaseTab';
import DueBookTab from './tabs/DueBookTab';

const FigmaBusinessReport: React.FC<FigmaBusinessReportProps> = ({
  orders = [],
  products = [],
  user,
  onLogout,
  tenantId,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState<DateRangeType>('all');
  const [chartAnimated, setChartAnimated] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Map initialTab prop to activeTab
  useEffect(() => {
    if (!initialTab) return;
    const tabMap: Record<string, TabType> = {
      'business_report': 'overview',
      'purchases': 'purchase',
      'business_report_purchase': 'purchase',
      'business_report_expense': 'expense',
      'expenses': 'expense',
      'business_report_income': 'income',
      'income': 'income',
      'business_report_due': 'due',
      'due_book': 'due',
      'business_report_note': 'note',
      'business_report_profit_loss': 'profit',
    };
    const mapped = tabMap[initialTab];
    if (mapped) setActiveTab(mapped);
  }, [initialTab]);

  // Shared data state (used across multiple tabs or in profit/loss summary)
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryDTO[]>([]);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [allDueEntities, setAllDueEntities] = useState<DueEntity[]>([]);
  const [dueEntities, setDueEntities] = useState<DueEntity[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setChartAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Date range boundaries
  const getDateRangeBoundaries = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    switch (dateRange) {
      case 'day': {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        return { start, end: today };
      }
      case 'month': {
        const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }
      case 'year': {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start, end };
      }
      case 'custom': {
        return {
          start: customDateRange.startDate || new Date(0),
          end: customDateRange.endDate || today,
        };
      }
      case 'all':
      default:
        return { start: new Date(0), end: today };
    }
  }, [dateRange, customDateRange, selectedMonth]);

  const isWithinDateRange = (dateStr: string | Date | undefined): boolean => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const { start, end } = getDateRangeBoundaries;
    return date >= start && date <= end;
  };

  const getDateRangeDisplayText = (): string => {
    const { start, end } = getDateRangeBoundaries;
    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (dateRange === 'day') return formatDate(start);
    if (dateRange === 'month') return start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (dateRange === 'year') return start.getFullYear().toString();
    if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      return `${formatDate(customDateRange.startDate)} - ${formatDate(customDateRange.endDate)}`;
    }
    return 'All Time';
  };

  // Set service tenant IDs
  useEffect(() => {
    if (tenantId) {
      setExpenseTenantId(tenantId);
      setIncomeTenantId(tenantId);
      setCategoryTenantId(tenantId);
      dueListService.setTenantId(tenantId);
    }
  }, [tenantId]);

  // Preload expenses, incomes, and categories when tenant/date range changes
  useEffect(() => {
    if (!tenantId) return;
    const { start, end } = getDateRangeBoundaries;
    ExpenseService.list({ page: 1, pageSize: 500, from: start.toISOString(), to: end.toISOString() })
      .then(res => setExpenses(res.items as any))
      .catch(console.error);
    CategoryService.list().then(res => setExpenseCategories(res.items)).catch(console.error);
    IncomeService.list({ page: 1, pageSize: 500, from: start.toISOString(), to: end.toISOString() })
      .then(res => setIncomes(res.items as any))
      .catch(console.error);
  }, [tenantId, getDateRangeBoundaries]);

  // Load all due entities for summary on mount
  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      dueListService.getEntities('Customer'),
      dueListService.getEntities('Supplier'),
      dueListService.getEntities('Employee'),
    ]).then(([c, s, e]) => setAllDueEntities([...c, ...s, ...e]))
     .catch(console.error);
  }, [tenantId]);

  // Summary computations
  const summary: SummaryData = useMemo(() => {
    const filteredOrders = orders.filter(o => isWithinDateRange(o.date || o.createdAt));
    const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const purchaseCost = deliveredOrders.reduce((sum, order) => {
      const orderItems = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : [{ productId: order.productId, productName: order.productName, quantity: order.quantity || 1, price: (order.amount || 0) - (order.deliveryCharge || 0) }];
      return sum + orderItems.reduce((itemSum: number, item: any) => {
        const product = products.find((p: any) => String(p.id) === String(item.productId) || p._id === item.productId || p.name === item.productName);
        const costPrice = product?.costPrice || (item.price * 0.6);
        return itemSum + (costPrice * (item.quantity || 1));
      }, 0);
    }, 0);
    const profitFromSell = totalRevenue - purchaseCost;
    const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = profitFromSell + totalIncome - totalExpense;
    const netProfitPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const inventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    return {
      totalRevenue,
      purchaseCost,
      profitFromSell,
      otherIncome: totalIncome,
      otherExpenses: totalExpense,
      netProfit,
      netProfitPercent,
      isProfit: netProfit >= 0,
      businessValue: inventoryValue + totalRevenue,
      ordersCount: filteredOrders.length,
      deliveredCount: deliveredOrders.length,
    };
  }, [orders, products, incomes, expenses, getDateRangeBoundaries]);

  const dueSummary: DueSummaryData = useMemo(() => ({
    totalWillGet: allDueEntities.reduce((sum, e) => sum + (e.totalOwedToMe || 0), 0),
    totalWillGive: allDueEntities.reduce((sum, e) => sum + (e.totalIOweThemNumber || 0), 0),
  }), [allDueEntities]);

  const dueGraphData: DueGraphData = useMemo(() => {
    const totalGet = dueSummary.totalWillGet;
    const totalGive = dueSummary.totalWillGive;
    const total = totalGet + totalGive;
    if (total === 0) return { getPercent: 50, givePercent: 50, youWillGet: 0, youWillGive: 0 };
    return {
      getPercent: Math.round((totalGet / total) * 100),
      givePercent: Math.round((totalGive / total) * 100),
      youWillGet: totalGet,
      youWillGive: totalGive,
    };
  }, [dueSummary]);

  // Refresh handler for current tab
  const handleRefreshData = async () => {
    const { start, end } = getDateRangeBoundaries;
    if (activeTab === 'overview') {
      // Refresh all data sources for the overview
      Promise.all([
        ExpenseService.list({ page: 1, pageSize: 500, from: start.toISOString(), to: end.toISOString() }),
        IncomeService.list({ page: 1, pageSize: 500, from: start.toISOString(), to: end.toISOString() }),
        dueListService.getEntities('Customer'),
        dueListService.getEntities('Supplier'),
        dueListService.getEntities('Employee'),
      ]).then(([expenseRes, incomeRes, customers, suppliers, employees]) => {
        setExpenses(expenseRes.items as any);
        setIncomes(incomeRes.items as any);
        setAllDueEntities([...customers, ...suppliers, ...employees]);
      }).catch(console.error);
    } else if (activeTab === 'expense') {
      ExpenseService.list({ page: 1, pageSize: 500, from: start.toISOString(), to: end.toISOString() })
        .then(res => setExpenses(res.items as any))
        .catch(console.error);
    } else if (activeTab === 'income') {
      IncomeService.list({ page: 1, pageSize: 500, from: start.toISOString(), to: end.toISOString() })
        .then(res => setIncomes(res.items as any))
        .catch(console.error);
    } else if (activeTab === 'due') {
      Promise.all([
        dueListService.getEntities('Customer'),
        dueListService.getEntities('Supplier'),
        dueListService.getEntities('Employee'),
      ]).then(([c, s, e]) => setAllDueEntities([...c, ...s, ...e]))
       .catch(console.error);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: OverviewIcon },
    { id: 'profit' as TabType, label: 'Profit/Loss', icon: WaterfallIcon },
    { id: 'expense' as TabType, label: 'Expense', icon: InvoiceIcon },
    { id: 'income' as TabType, label: 'Income', icon: MoneyReceiveIcon },
    { id: 'purchase' as TabType, label: 'Purchase info', icon: ShoppingBagIcon },
    { id: 'due' as TabType, label: 'Due Book', icon: BookIcon },
    { id: 'note' as TabType, label: 'Note', icon: NoteIcon },
  ];

  const dateRangeOptions: { id: DateRangeType; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="bg-[#f9f9f9] min-h-screen font-['Roboto']">
      <div className="bg-white rounded-lg mx-2 sm:mx-5 my-2 sm:my-5 p-2 sm:p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
          <h1 className="text-lg sm:text-xl lg:text-[22px] font-bold text-slate-900 tracking-tight font-['Roboto']">
            Business Report
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-6">
            <button
              onClick={handleRefreshData}
              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-[12px] text-slate-500 font-['Roboto']">Refresh</span>
              <RefreshCw size={16} className="text-gray-600" />
            </button>

            <div className="flex flex-wrap items-center gap-2 relative">
              {dateRangeOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => { setDateRange(option.id); setShowCustomDatePicker(false); }}
                  className={`px-2 py-1 rounded-lg font-medium font-['Roboto'] min-w-[56px] sm:min-w-[72px] flex items-center justify-center gap-1 sm:gap-2 text-[12px] sm:text-[14px] ${
                    dateRange === option.id
                      ? 'bg-gradient-to-b from-[#ff6a00] to-[#ff9f1c] text-white'
                      : 'bg-[#f9f9f9] text-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              {dateRange === 'month' && (
                <div className="flex items-center gap-1 px-3 py-1 border border-[#38bdf8] rounded-lg text-[14px] font-medium text-[#1e90ff] font-['Roboto']">
                  <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))} className="p-0.5 hover:bg-gray-100 rounded">
                    <ChevronLeft size={14} />
                  </button>
                    <span className="min-w-[90px] sm:min-w-[110px] text-center text-[12px] sm:text-[14px] font-['Roboto']">
                    {selectedMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))} className="p-0.5 hover:bg-gray-100 rounded">
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate && (
                <div className="px-3 py-1 border border-[#38bdf8] rounded-lg text-[14px] font-medium text-[#1e90ff] font-['Roboto']">
                  {getDateRangeDisplayText()}
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => {
                    if (dateRange === 'custom') {
                      setShowCustomDatePicker(!showCustomDatePicker);
                    } else {
                      setDateRange('custom');
                      setShowCustomDatePicker(true);
                    }
                  }}
                  className={`px-2 py-1 rounded-lg font-medium font-['Roboto'] min-w-[56px] sm:min-w-[72px] flex items-center justify-center gap-1 sm:gap-2 text-[12px] sm:text-[14px] ${
                    dateRange === 'custom'
                      ? 'bg-gradient-to-b from-[#ff6a00] to-[#ff9f1c] text-white'
                      : 'bg-[#f9f9f9] text-slate-500'
                  }`}
                >
                  Custom
                  <ChevronDown size={16} className={showCustomDatePicker ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
                <CustomDateRangePicker
                  isOpen={showCustomDatePicker}
                  onClose={() => setShowCustomDatePicker(false)}
                  onApply={(range) => {
                    setCustomDateRange(range);
                    setDateRange('custom');
                    setShowCustomDatePicker(false);
                  }}
                  initialDateRange={customDateRange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 border-b border-gray-100 mb-5 overflow-x-auto pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 sm:px-[22px] py-2 sm:py-3 border-b-2 whitespace-nowrap transition-colors ${
                  isActive ? 'border-[#38bdf8]' : 'border-transparent'
                }`}
              >
                <Icon />
                <span className={`text-[13px] sm:text-[16px] font-medium font-['Roboto'] ${
                  isActive ? 'bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] bg-clip-text text-transparent' : 'text-slate-900'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <BusinessOverviewTab
            summary={summary}
            dueSummary={dueSummary}
            tenantId={tenantId}
            getDateRangeDisplayText={getDateRangeDisplayText}
            onNavigateTab={setActiveTab}
            onRefresh={handleRefreshData}
          />
        )}
        {activeTab === 'profit' && (
          <ProfitLossTab
            summary={summary}
            dueGraphData={dueGraphData}
            dueSummary={dueSummary}
            dueEntities={dueEntities}
            chartAnimated={chartAnimated}
            tenantId={tenantId}
            getDateRangeDisplayText={getDateRangeDisplayText}
          />
        )}
        {activeTab === 'expense' && (
          <ExpenseTab
            expenses={expenses}
            setExpenses={setExpenses}
            expenseCategories={expenseCategories}
            setExpenseCategories={setExpenseCategories}
            tenantId={tenantId}
          />
        )}
        {activeTab === 'income' && (
          <IncomeTab
            incomes={incomes}
            setIncomes={setIncomes}
            tenantId={tenantId}
          />
        )}
        {activeTab === 'purchase' && (
          <PurchaseTab
            tenantId={tenantId}
            expenseCategories={expenseCategories}
            getDateRangeBoundaries={getDateRangeBoundaries}
            isWithinDateRange={isWithinDateRange}
          />
        )}
        {activeTab === 'due' && (
          <DueBookTab
            tenantId={tenantId}
            dueSummary={dueSummary}
            allDueEntities={allDueEntities}
            setAllDueEntities={setAllDueEntities}
            dueEntities={dueEntities}
            setDueEntities={setDueEntities}
            getDateRangeDisplayText={getDateRangeDisplayText}
            isWithinDateRange={isWithinDateRange}
          />
        )}
        {activeTab === 'note' && (
          <AdminNote tenantId={tenantId} />
        )}
      </div>
    </div>
  );
};

export default FigmaBusinessReport;
