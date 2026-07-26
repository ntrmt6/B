import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Plus, Search, Package, Printer, Calendar, ChevronLeft, ChevronRight, UserPlus, X, TrendingUp, TrendingDown, Phone, History } from 'lucide-react';
import { dueListService } from '../../../../services/DueListService';
import { DueEntity, DueTransaction, EntityType, CreateDueTransactionPayload } from '../../../../types';
import { DueSummaryData } from '../types';
import AddNewDueModal from '../../../AddNewDueModal';
import DueHistoryModal from '../../../DueHistoryModal';
import AddEntityModal from '../../../AddEntityModal';

interface DueBookTabProps {
  tenantId?: string;
  dueSummary: DueSummaryData;
  allDueEntities: DueEntity[];
  setAllDueEntities: (entities: DueEntity[]) => void;
  dueEntities: DueEntity[];
  setDueEntities: (entities: DueEntity[]) => void;
  getDateRangeDisplayText: () => string;
  isWithinDateRange: (date: string | Date | undefined) => boolean;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
];

const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const DueBookTab: React.FC<DueBookTabProps> = ({
  tenantId,
  dueSummary,
  allDueEntities,
  setAllDueEntities,
  dueEntities,
  setDueEntities,
  getDateRangeDisplayText,
  isWithinDateRange,
}) => {
  const [dueTabType, setDueTabType] = useState<EntityType>('Customer');
  const [dueSearch, setDueSearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [dueTransactions, setDueTransactions] = useState<DueTransaction[]>([]);
  const [dueLoading, setDueLoading] = useState(false);
  const [showDueHistoryModal, setShowDueHistoryModal] = useState(false);
  const [showAddDueModal, setShowAddDueModal] = useState(false);
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);

  const [adjustModal, setAdjustModal] = useState<{ type: 'get' | 'give'; mode: 'increase' | 'decrease' } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustEntityId, setAdjustEntityId] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const openCardModal = (type: 'get' | 'give') => {
    setAdjustModal({ type, mode: 'increase' });
    setAdjustAmount('');
    setAdjustNote('');
    setAdjustEntityId(selectedEntityId || (dueEntities[0]?._id ?? ''));
  };

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      setDueLoading(true);
      try {
        const entities = await dueListService.getEntities(dueTabType, dueSearch || undefined);
        setDueEntities(entities);
        if (entities.length > 0 && !selectedEntityId) {
          setSelectedEntityId(entities[0]._id || null);
        }
      } catch (e) {
        console.error('Error loading due entities:', e);
        setDueEntities([]);
      } finally {
        setDueLoading(false);
      }
    };
    load();
  }, [dueTabType, dueSearch, tenantId]);

  useEffect(() => {
    if (!selectedEntityId || !tenantId) return;
    const load = async () => {
      try {
        const transactions = await dueListService.getTransactions(selectedEntityId);
        setDueTransactions(transactions);
      } catch (e) {
        console.error('Error loading transactions:', e);
        setDueTransactions([]);
      }
    };
    load();
  }, [selectedEntityId, tenantId]);

  const selectedEntity = useMemo(
    () => dueEntities.find(e => e._id === selectedEntityId) || null,
    [dueEntities, selectedEntityId]
  );

  const filteredDueTransactions = useMemo(
    () => dueTransactions.filter(tx => isWithinDateRange(tx.transactionDate)),
    [dueTransactions, isWithinDateRange]
  );

  const filteredDueSummary = useMemo(() => {
    const totalWillGet = filteredDueTransactions.filter(tx => tx.direction === 'INCOME').reduce((s, tx) => s + tx.amount, 0);
    const totalWillGive = filteredDueTransactions.filter(tx => tx.direction === 'EXPENSE').reduce((s, tx) => s + tx.amount, 0);
    return { totalWillGet, totalWillGive };
  }, [filteredDueTransactions]);

  const refreshAllData = async (overrideSelectedId?: string) => {
    const effectiveSelectedId = overrideSelectedId ?? selectedEntityId;
    const [customers, suppliers, employees, tabEntities] = await Promise.all([
      dueListService.getEntities('Customer'),
      dueListService.getEntities('Supplier'),
      dueListService.getEntities('Employee'),
      dueListService.getEntities(dueTabType, dueSearch || undefined),
    ]);
    setAllDueEntities([...customers, ...suppliers, ...employees]);
    setDueEntities(tabEntities);
    if (effectiveSelectedId) {
      const txns = await dueListService.getTransactions(effectiveSelectedId);
      setDueTransactions(txns);
    }
  };

  const handleEntitySaved = async (entity: DueEntity) => {
    setShowAddEntityModal(false);
    if (entity._id) setSelectedEntityId(entity._id);
    await refreshAllData(entity._id);
  };

  const handleDueTabChange = (type: EntityType) => {
    setDueTabType(type);
    setSelectedEntityId(null);
    setDueTransactions([]);
  };

  const handlePrintDueList = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    const htmlContent = `
      <!DOCTYPE html><html><head><title>Due List - ${dueTabType}s</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #38bdf8; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #023337; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: linear-gradient(to right, #38bdf8, #1e90ff); color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .get { color: #008c09; font-weight: bold; }
        .give { color: #da0000; font-weight: bold; }
        .summary { display: flex; gap: 30px; margin-bottom: 20px; }
        .summary-card { padding: 15px; border-radius: 8px; }
        .summary-get { background: #e6f8e6; }
        .summary-give { background: #ffe6e6; }
      </style></head><body>
      <div class="header"><div class="title">Due List - ${dueTabType}s</div></div>
      <div class="summary">
        <div class="summary-card summary-get">
          <div style="font-size:14px;">You will Get</div>
          <div class="get" style="font-size:20px;">৳${dueSummary.totalWillGet.toLocaleString('en-IN')}</div>
        </div>
        <div class="summary-card summary-give">
          <div style="font-size:14px;">You will Give</div>
          <div class="give" style="font-size:20px;">৳${dueSummary.totalWillGive.toLocaleString('en-IN')}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Phone</th><th>Will Get</th><th>Will Give</th></tr></thead>
        <tbody>
          ${dueEntities.map(e => `
            <tr>
              <td>${e.name}</td>
              <td>${e.phone || '-'}</td>
              <td class="get">৳${(e.totalOwedToMe || 0).toLocaleString('en-IN')}</td>
              <td class="give">৳${(e.totalIOweThemNumber || 0).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </body></html>`;
    doc.document.write(htmlContent);
    doc.document.close();
    doc.print();
  };

  const handleAddDueSave = async (data: CreateDueTransactionPayload) => {
    try {
      await dueListService.createTransaction(data);
      await refreshAllData();
      setShowAddDueModal(false);
    } catch (e) {
      console.error('Error creating due transaction:', e);
    }
  };

  const handleAdjustSave = async () => {
    if (!adjustModal || !adjustEntityId || !adjustAmount) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) return;

    let direction: 'INCOME' | 'EXPENSE';
    if (adjustModal.type === 'get') {
      direction = adjustModal.mode === 'increase' ? 'INCOME' : 'EXPENSE';
    } else {
      direction = adjustModal.mode === 'increase' ? 'EXPENSE' : 'INCOME';
    }

    const entityName = allDueEntities.find(e => e._id === adjustEntityId)?.name || '';
    setAdjustLoading(true);
    try {
      await dueListService.createTransaction({
        entityId: adjustEntityId,
        entityName,
        amount,
        direction,
        transactionDate: new Date().toISOString(),
        notes: adjustNote || `${adjustModal.mode === 'increase' ? 'Increased' : 'Decreased'} ${adjustModal.type === 'get' ? 'receivable' : 'payable'}`,
      });
      await refreshAllData(adjustEntityId);
      setAdjustModal(null);
    } catch (e) {
      console.error('Error adjusting due:', e);
    } finally {
      setAdjustLoading(false);
    }
  };

  const netBalance = selectedEntity
    ? (selectedEntity.totalOwedToMe || 0) - (selectedEntity.totalIOweThemNumber || 0)
    : 0;

  return (
    <div className="bg-white rounded-lg overflow-hidden relative">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-900 tracking-tight font-['Roboto']">
          Due List
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintDueList}
            className="flex items-center gap-1.5 bg-[#f4f4f4] text-slate-700 px-3 h-[38px] rounded-lg text-[13px] font-semibold"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={() => setShowAddDueModal(true)}
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white px-4 h-[38px] rounded-lg text-[13px] font-bold"
          >
            <Plus size={16} />
            Add Due
          </button>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="flex gap-3 px-4 py-3">
        <button
          onClick={() => openCardModal('get')}
          className="flex-1 bg-[#f0fdf4] active:bg-[#dcfce7] rounded-2xl px-4 py-4 flex flex-col gap-1 text-left border-2 border-[#bbf7d0] active:border-[#008c09] shadow-sm transition-all"
        >
          <p className="text-[22px] sm:text-[26px] font-bold text-[#008c09] tracking-tight tabular-nums font-['Roboto'] truncate leading-tight">
            ৳{dueSummary.totalWillGet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto']">You will Get</p>
          <p className="text-[10px] text-[#008c09] font-medium mt-0.5">Tap to adjust ↗</p>
        </button>

        <button
          onClick={() => openCardModal('give')}
          className="flex-1 bg-[#fff1f2] active:bg-[#ffe4e6] rounded-2xl px-4 py-4 flex flex-col gap-1 text-left border-2 border-[#fecdd3] active:border-[#da0000] shadow-sm transition-all"
        >
          <p className="text-[22px] sm:text-[26px] font-bold text-[#da0000] tracking-tight tabular-nums font-['Roboto'] truncate leading-tight">
            ৳{dueSummary.totalWillGive.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto']">You will Give</p>
          <p className="text-[10px] text-[#da0000] font-medium mt-0.5">Tap to adjust ↗</p>
        </button>
      </div>

      {/* ── DATE RANGE INFO ── */}
      <div className="px-4 pb-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-blue-500 shrink-0" />
            <span className="text-[12px] text-blue-700 font-semibold font-['Roboto']">{getDateRangeDisplayText()}</span>
          </div>
          {selectedEntity && filteredDueTransactions.length > 0 && (
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-[#008c09] tabular-nums font-medium">+৳{filteredDueSummary.totalWillGet.toLocaleString('en-IN')}</span>
              <span className="text-[#da0000] tabular-nums font-medium">-৳{filteredDueSummary.totalWillGive.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── TWO-PANEL LAYOUT ── */}
      <div className="flex flex-col md:flex-row md:overflow-hidden" style={{ minHeight: 400 }}>

        {/* ── LEFT PANEL (entity list) — hidden on mobile when detail is open ── */}
        <div className={`${selectedEntityId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[360px] lg:w-[400px] md:border-r border-[#e5e5e5]`}>

          {/* Entity type tabs + add button */}
          <div className="flex items-center justify-between px-4 bg-white border-b border-[#e8e8e8]">
            <div className="flex gap-0 flex-1">
              {(['Customer', 'Supplier', 'Employee'] as EntityType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleDueTabChange(type)}
                  className={`flex-1 py-3 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors ${
                    dueTabType === type
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] border-[#38bdf8]'
                      : 'text-slate-500 border-transparent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddEntityModal(true)}
              title={`Add ${dueTabType}`}
              className="flex items-center gap-1 text-[#38bdf8] py-3 pl-3 text-[13px] font-semibold shrink-0"
            >
              <UserPlus size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="bg-[#f5f5f5] h-[44px] rounded-xl flex items-center px-3 gap-2">
              <Search size={17} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder={`Search ${dueTabType.toLowerCase()}s…`}
                value={dueSearch}
                onChange={e => setDueSearch(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-[14px] text-slate-700 placeholder:text-slate-400"
              />
              {dueSearch && (
                <button onClick={() => setDueSearch('')}>
                  <X size={15} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Entity list */}
          <div className="overflow-auto md:max-h-[calc(100vh-460px)]">
            {dueLoading ? (
              <div className="flex flex-col gap-0">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-[#f0f0f0]">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dueEntities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Package size={28} className="text-gray-400" />
                </div>
                <p className="text-[14px] font-semibold text-slate-700 mb-1">No {dueTabType.toLowerCase()}s yet</p>
                <p className="text-[12px] text-slate-400 mb-4">Add your first {dueTabType.toLowerCase()} to track dues</p>
                <button
                  onClick={() => setShowAddEntityModal(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold"
                >
                  <UserPlus size={15} /> Add {dueTabType}
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {dueEntities.map(entity => {
                  const net = (entity.totalOwedToMe || 0) - (entity.totalIOweThemNumber || 0);
                  const isSelected = selectedEntityId === entity._id;
                  return (
                    <button
                      key={entity._id}
                      onClick={() => setSelectedEntityId(entity._id!)}
                      className={`flex items-center gap-3 px-4 py-4 text-left border-b border-[#f0f0f0] transition-colors active:bg-gray-50 ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-[#38bdf8]' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[16px] shrink-0 ${getAvatarColor(entity.name)}`}>
                        {entity.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-semibold text-slate-900 truncate font-['Roboto']">{entity.name}</span>
                          <span className={`text-[14px] font-bold tabular-nums font-['Roboto'] shrink-0 ${net >= 0 ? 'text-[#008c09]' : 'text-[#da0000]'}`}>
                            {net >= 0 ? '+' : '-'}৳{Math.abs(net).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-[12px] text-slate-400 font-['Roboto']">{entity.phone || 'No phone'}</span>
                          <span className={`text-[11px] font-medium ${net >= 0 ? 'text-[#008c09]' : 'text-[#da0000]'}`}>
                            {net >= 0 ? 'to receive' : 'to pay'}
                          </span>
                        </div>
                      </div>

                      <ChevronRight size={16} className={`shrink-0 ${isSelected ? 'text-[#38bdf8]' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (transaction detail) — hidden on mobile when no entity selected ── */}
        <div className={`${!selectedEntityId ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>

          {/* Mobile: entity info header with back nav */}
          {selectedEntity && (
            <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
              <button
                onClick={() => setSelectedEntityId(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={20} className="text-slate-700" />
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0 ${getAvatarColor(selectedEntity.name)}`}>
                {selectedEntity.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900 truncate font-['Roboto']">{selectedEntity.name}</p>
                {selectedEntity.phone && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Phone size={10} /> {selectedEntity.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowDueHistoryModal(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100"
              >
                <History size={16} className="text-slate-600" />
              </button>
            </div>
          )}

          {/* Mobile: entity balance bar */}
          {selectedEntity && (
            <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
              <div className="flex-1 text-center">
                <p className="text-[18px] font-bold text-[#008c09] tabular-nums">৳{(selectedEntity.totalOwedToMe || 0).toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500">Will Get</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex-1 text-center">
                <p className="text-[18px] font-bold text-[#da0000] tabular-nums">৳{(selectedEntity.totalIOweThemNumber || 0).toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500">Will Give</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex-1 text-center">
                <p className={`text-[18px] font-bold tabular-nums ${netBalance >= 0 ? 'text-[#008c09]' : 'text-[#da0000]'}`}>
                  {netBalance >= 0 ? '+' : '-'}৳{Math.abs(netBalance).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500">Net</p>
              </div>
            </div>
          )}

          {/* Desktop: action buttons row */}
          <div className="hidden md:flex items-center gap-3 px-5 py-3 border-b border-gray-100">
            {selectedEntity && (
              <>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0 ${getAvatarColor(selectedEntity.name)}`}>
                  {selectedEntity.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 font-['Roboto']">{selectedEntity.name}</p>
                  <p className="text-[11px] text-slate-400">{selectedEntity.phone}</p>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowDueHistoryModal(true)}
                className="flex items-center gap-1.5 bg-[#f4f4f4] text-slate-700 px-3 h-[38px] rounded-lg text-[13px] font-semibold"
              >
                <History size={15} /> History
              </button>
              <button
                onClick={() => setShowAddDueModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white px-4 h-[38px] rounded-lg text-[13px] font-bold"
              >
                <Plus size={15} /> Add Due
              </button>
            </div>
          </div>

          {/* Transaction list */}
          <div className="flex-1 overflow-auto md:max-h-[calc(100vh-460px)]">
            {selectedEntity ? (
              filteredDueTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Package size={28} className="text-gray-400" />
                  </div>
                  <p className="text-[14px] font-semibold text-slate-700 mb-1">No transactions</p>
                  <p className="text-[12px] text-slate-400 mb-4">No entries in this date range</p>
                  <button
                    onClick={() => setShowAddDueModal(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold"
                  >
                    <Plus size={15} /> Add Due
                  </button>
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-2">
                  {filteredDueTransactions.map(tx => (
                    <div
                      key={tx._id}
                      className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex"
                    >
                      {/* Color bar */}
                      <div className={`w-1 shrink-0 ${tx.direction === 'INCOME' ? 'bg-[#008c09]' : 'bg-[#da0000]'}`} />
                      <div className="flex-1 flex items-center justify-between gap-3 px-3 py-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[13px] font-semibold text-slate-900 font-['Roboto'] truncate">
                            {tx.transactionType || tx.items || 'Transaction'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-['Roboto']">
                            {new Date(tx.transactionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                          </span>
                          {tx.notes && (
                            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{tx.notes}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[15px] font-bold tabular-nums font-['Roboto'] ${tx.direction === 'INCOME' ? 'text-[#008c09]' : 'text-[#da0000]'}`}>
                            {tx.direction === 'INCOME' ? '+' : '-'}৳{tx.amount.toLocaleString('en-IN')}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            tx.status === 'Paid' ? 'bg-[#d4f4d4] text-[#008c09]' : 'bg-[#fff2bc] text-[#7a5f00]'
                          }`}>
                            {tx.status === 'Paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-full py-16 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Package size={28} className="text-gray-400" />
                </div>
                <p className="text-[14px] font-semibold text-slate-700 mb-1">No {dueTabType.toLowerCase()} selected</p>
                <p className="text-[12px] text-slate-400">Select a {dueTabType.toLowerCase()} from the list</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE FAB — Add Due ── */}
      {!adjustModal && (
        <button
          onClick={() => setShowAddDueModal(true)}
          className="fixed bottom-6 right-5 md:hidden z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#1e90ff] shadow-lg shadow-blue-200 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus size={26} className="text-white" />
        </button>
      )}

      {/* ── QUICK ADJUST MODAL — bottom sheet on mobile ── */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 max-h-[92vh] overflow-y-auto">
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <h3 className="text-[16px] font-bold text-slate-900 font-['Roboto']">
                Adjust{' '}
                <span className={adjustModal.type === 'get' ? 'text-[#008c09]' : 'text-[#da0000]'}>
                  You will {adjustModal.type === 'get' ? 'Get' : 'Give'}
                </span>
              </h3>
              <button onClick={() => setAdjustModal(null)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Increase / Decrease toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mx-5 mb-4">
              <button
                onClick={() => setAdjustModal({ ...adjustModal, mode: 'increase' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-semibold transition-colors ${
                  adjustModal.mode === 'increase'
                    ? adjustModal.type === 'get' ? 'bg-[#008c09] text-white' : 'bg-[#da0000] text-white'
                    : 'bg-white text-slate-500'
                }`}
              >
                <TrendingUp size={16} /> Increase
              </button>
              <button
                onClick={() => setAdjustModal({ ...adjustModal, mode: 'decrease' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-semibold border-l border-gray-200 transition-colors ${
                  adjustModal.mode === 'decrease'
                    ? adjustModal.type === 'get' ? 'bg-[#cc0000] text-white' : 'bg-[#008c09] text-white'
                    : 'bg-white text-slate-500'
                }`}
              >
                <TrendingDown size={16} /> Decrease
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 pb-6">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 font-['Roboto'] mb-1.5 block">Select Person</label>
                <select
                  value={adjustEntityId}
                  onChange={e => setAdjustEntityId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[14px] font-['Roboto'] outline-none focus:border-[#38bdf8] bg-[#f9f9f9]"
                >
                  <option value="">— Choose —</option>
                  {allDueEntities.map(e => (
                    <option key={e._id} value={e._id}>{e.name} ({e.type || 'Entity'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-500 font-['Roboto'] mb-1.5 block">Amount (৳)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[18px] font-bold font-['Roboto'] outline-none focus:border-[#38bdf8] bg-[#f9f9f9] tabular-nums"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-500 font-['Roboto'] mb-1.5 block">Note (optional)</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="Add a note…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[14px] font-['Roboto'] outline-none focus:border-[#38bdf8] bg-[#f9f9f9]"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setAdjustModal(null)}
                  className="flex-1 py-3 rounded-xl bg-[#f4f4f4] text-slate-700 text-[14px] font-bold font-['Roboto']"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustSave}
                  disabled={adjustLoading || !adjustEntityId || !adjustAmount}
                  className={`flex-1 py-3 rounded-xl text-white text-[14px] font-bold font-['Roboto'] transition-opacity disabled:opacity-50 ${
                    adjustModal.type === 'get'
                      ? adjustModal.mode === 'increase' ? 'bg-[#008c09]' : 'bg-[#cc0000]'
                      : adjustModal.mode === 'increase' ? 'bg-[#da0000]' : 'bg-[#008c09]'
                  }`}
                >
                  {adjustLoading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddNewDueModal
        isOpen={showAddDueModal}
        onClose={() => setShowAddDueModal(false)}
        onSave={handleAddDueSave}
        defaultEntity={selectedEntity}
      />

      <DueHistoryModal
        isOpen={showDueHistoryModal}
        onClose={() => setShowDueHistoryModal(false)}
      />

      <AddEntityModal
        isOpen={showAddEntityModal}
        onClose={() => setShowAddEntityModal(false)}
        onSave={handleEntitySaved}
        defaultType={dueTabType}
      />
    </div>
  );
};

export default DueBookTab;
