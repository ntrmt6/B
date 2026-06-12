import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Plus, Search, Package, Printer, MoreHorizontal, Calendar } from 'lucide-react';
import { dueListService } from '../../../../services/DueListService';
import { DueEntity, DueTransaction, EntityType, CreateDueTransactionPayload } from '../../../../types';
import { DueSummaryData } from '../types';
import AddNewDueModal from '../../../AddNewDueModal';
import DueHistoryModal from '../../../DueHistoryModal';

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
      const [customers, suppliers, employees] = await Promise.all([
        dueListService.getEntities('Customer'),
        dueListService.getEntities('Supplier'),
        dueListService.getEntities('Employee'),
      ]);
      setAllDueEntities([...customers, ...suppliers, ...employees]);
      const tabEntities = await dueListService.getEntities(dueTabType);
      setDueEntities(tabEntities);
      if (selectedEntity) {
        const txns = await dueListService.getTransactions(selectedEntity._id);
        setDueTransactions(txns);
      }
      setShowAddDueModal(false);
    } catch (e) {
      console.error('Error creating due transaction:', e);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight font-['Roboto']">Due List</h2>
        <button
          onClick={handlePrintDueList}
          className="flex items-center gap-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white px-4 h-[48px] rounded-lg text-[15px] font-bold tracking-[-0.3px]"
        >
          <Printer size={20} />
          Print Due List
        </button>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-4 px-5 py-4">
        <div className="flex-1 bg-[#f9f9f9] rounded-lg h-[80px] px-[18px] py-5 flex flex-col justify-center">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#008c09] tracking-tight tabular-nums font-['Roboto']">
            ৳{dueSummary.totalWillGet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto']">You will Get (Total)</p>
        </div>
        <div className="flex-1 bg-[#f9f9f9] rounded-lg h-[80px] px-[18px] py-5 flex flex-col justify-center">
          <p className="text-xl sm:text-2xl lg:text-[32px] font-bold text-[#da0000] tracking-tight tabular-nums font-['Roboto']">
            ৳{dueSummary.totalWillGive.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[12px] text-slate-500 font-['Roboto']">You will Give (Total)</p>
        </div>
      </div>

      {/* Date Range Info */}
      <div className="px-5 pb-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            <span className="text-sm text-blue-700 font-['Roboto']">
              Showing transactions: <span className="font-semibold">{getDateRangeDisplayText()}</span>
            </span>
          </div>
          {selectedEntity && filteredDueTransactions.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[#008c09] font-['Roboto'] tabular-nums">Get: ৳{filteredDueSummary.totalWillGet.toLocaleString('en-IN')}</span>
              <span className="text-[#da0000] font-['Roboto'] tabular-nums">Give: ৳{filteredDueSummary.totalWillGive.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex" style={{ height: 'calc(100vh - 380px)', minHeight: '400px' }}>
        {/* Left Panel */}
        <div className="w-[400px] flex flex-col">
          {/* Entity Type Tabs */}
          <div className="flex gap-0 px-5 bg-white">
            {(['Customer', 'Supplier', 'Employee'] as EntityType[]).map(type => (
              <button
                key={type}
                onClick={() => handleDueTabChange(type)}
                className={`px-[22px] py-3 text-[16px] font-medium border-b-2 transition-colors ${
                  dueTabType === type
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] border-[#38bdf8]'
                    : 'text-slate-700 border-transparent hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-5 py-3">
            <div className="bg-[#f9f9f9] h-[34px] rounded-lg flex items-center px-2">
              <Search size={20} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search"
                value={dueSearch}
                onChange={(e) => setDueSearch(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-[12px] text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Entity List */}
          <div className="flex-1 overflow-auto px-5">
            {dueLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={24} className="animate-spin text-[#38bdf8]" />
              </div>
            ) : dueEntities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#888]">
                <Package size={40} className="mb-2 opacity-50" />
                <span className="text-[13px]">No {dueTabType.toLowerCase()}s found</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dueEntities.map(entity => (
                  <div
                    key={entity._id}
                    onClick={() => setSelectedEntityId(entity._id!)}
                    className={`flex items-center gap-[11px] py-2 cursor-pointer transition-colors border-b border-[#e5e5e5] ${
                      selectedEntityId === entity._id ? 'bg-[#f0f9ff]' : 'hover:bg-[#fafafa]'
                    }`}
                  >
                    <div className={`w-[2px] h-[46px] rounded-full ${entity.totalOwedToMe > entity.totalIOweThemNumber ? 'bg-[#008c09]' : 'bg-[#da0000]'}`} />
                    <div className="flex-1 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[16px] font-semibold text-slate-900 font-['Roboto']">{entity.name}</span>
                        <span className="text-[12px] text-slate-500 font-['Roboto']">{entity.phone || 'No phone'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-[2px] text-[12px]">
                        <p>
                          <span className="text-slate-500 font-['Roboto']">Give: </span>
                          <span className="font-semibold text-[#da0000] tabular-nums font-['Roboto']">৳{(entity.totalIOweThemNumber || 0).toLocaleString('en-IN')}</span>
                        </p>
                        <p>
                          <span className="text-slate-500 font-['Roboto']">Get: </span>
                          <span className="font-semibold text-[#008c09] tabular-nums font-['Roboto']">৳{(entity.totalOwedToMe || 0).toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-end gap-4 px-5 py-3">
            <button
              onClick={() => setShowDueHistoryModal(true)}
              className="flex items-center gap-2 bg-[#f9f9f9] text-slate-900 px-4 h-[48px] rounded-lg text-[15px] font-bold tracking-[-0.3px]"
            >
              <RefreshCw size={20} />
              Due History
            </button>
            <button
              onClick={() => setShowAddDueModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] text-white px-4 h-[48px] rounded-lg text-[15px] font-bold tracking-[-0.3px]"
            >
              <Plus size={20} />
              Add Due
            </button>
          </div>

          <div className="flex-1 mx-5 mb-5 bg-[#f9f9f9] rounded-lg overflow-auto">
            {selectedEntity ? (
              filteredDueTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#888]">
                  <Package size={40} className="mb-2 opacity-50" />
                  <span className="text-[13px]">No transactions in this date range</span>
                </div>
              ) : (
                <div className="p-4">
                  {filteredDueTransactions.map((tx, idx) => (
                    <div
                      key={tx._id}
                      className={`flex items-center justify-between py-3 ${idx !== filteredDueTransactions.length - 1 ? 'border-b border-[#e5e5e5]' : ''}`}
                    >
                      <div className="flex flex-col gap-[2px] w-[145px]">
                        <span className="text-[14px] font-medium text-slate-900 font-['Roboto']">
                          {tx.transactionType || tx.items || 'Product purchase'}
                        </span>
                        <span className="text-[12px] text-slate-500 font-['Roboto']">
                          {new Date(tx.transactionDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                        <p className="text-[10px] text-slate-400 leading-[12px] w-[277px] line-clamp-3 font-['Roboto']">
                        {tx.notes || 'No notes'}
                      </p>
                      <div className="flex items-center gap-4 justify-end w-[224px]">
                          <span className={`text-[16px] font-semibold w-[106px] tabular-nums font-['Roboto'] ${tx.direction === 'INCOME' ? 'text-[#008c09]' : 'text-[#da0000]'}`}>
                          {tx.direction === 'INCOME' ? '+ ' : '- '}৳{tx.amount.toLocaleString('en-IN')}
                        </span>
                        <span className={`px-[9px] py-[2px] rounded-[30px] text-[12px] font-medium w-[62px] text-center ${
                          tx.status === 'Paid' ? 'bg-[#d4f4d4] text-[#008c09]' : 'bg-[#fff2bc] text-[#2c2400]'
                        }`}>
                          {tx.status === 'Paid' ? 'Paid' : 'Pending'}
                        </span>
                        <button className="p-1 hover:bg-[#e5e5e5] rounded">
                          <MoreHorizontal size={20} className="text-[#888]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#888]">
                <Package size={48} className="mb-3 opacity-50" />
                <span className="text-[14px]">Select a {dueTabType.toLowerCase()} to view transactions</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Due Modal */}
      <AddNewDueModal
        isOpen={showAddDueModal}
        onClose={() => setShowAddDueModal(false)}
        onSave={handleAddDueSave}
      />

      {/* Due History Modal */}
      <DueHistoryModal
        isOpen={showDueHistoryModal}
        onClose={() => setShowDueHistoryModal(false)}
      />
    </div>
  );
};

export default DueBookTab;
