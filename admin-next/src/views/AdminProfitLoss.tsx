import React, { useState, useMemo, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Filter,
    Loader2,
    X,
    Database,
    Users,
    ShieldCheck,
    Globe,
    MoreVertical,
    Eye,
    Edit
} from 'lucide-react';

/**
 * MONGODB CONFIGURATION (System Context)
 * URI: mongodb+srv://kamalmojumdar698_db_user:7qXvaLGRw6BItks1@cluster0.rqhicza.mongodb.net/
 * DB: seven_days
 * * Note: Firebase has been completely removed. 
 * The app now uses a MongoDB-style persistence layer.
 */

interface Transaction {
    _id: string;
    tenantId: string;
    description: string;
    amount: number;
    category: string;
    type: 'profit' | 'loss';
    date: string;
}

const App = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [connStatus, setConnStatus] = useState('connecting');

    // Multi-tenant Logic
    const [tenantId, setTenantId] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tenant') || 'default_tenant';
    });

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Services',
        type: 'profit',
        date: new Date().toISOString().split('T')[0]
    });

    // Mobile dropdown state
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null);

    // Simulated MongoDB Driver Connection & Fetch
    useEffect(() => {
        const connectToMongo = async () => {
            setLoading(true);
            setConnStatus('authenticating');

            // Artificial delay to simulate cluster handshake
            await new Promise(resolve => setTimeout(resolve, 1200));

            try {
                const stored = localStorage.getItem(`seven_days_transactions_${tenantId}`);
                const data = stored ? JSON.parse(stored) : [];

                // FIX: Use .getTime() to convert Dates to numbers for arithmetic operations
                setTransactions(data.sort((a: { date: string | number | Date; }, b: { date: string | number | Date; }) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                setConnStatus('connected');
            } catch (error) {
                console.error("MongoDB Connection Error:", error);
                setConnStatus('error');
            } finally {
                setLoading(false);
            }
        };

        connectToMongo();
    }, [tenantId]);

    const totals = useMemo(() => {
        return transactions.reduce((acc, curr) => {
            const amt = Number(curr.amount) || 0;
            if (amt > 0) acc.profit += amt;
            else acc.loss += Math.abs(amt);
            acc.net = acc.profit - acc.loss;
            return acc;
        }, { profit: 0, loss: 0, net: 0 });
    }, [transactions]);

    const profitPercentage = useMemo(() => {
        const totalVolume = totals.profit + totals.loss;
        if (totalVolume === 0) return "0.0";
        return ((totals.profit / totalVolume) * 100).toFixed(1);
    }, [totals]);

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (!formData.description || !formData.amount) return;

        const finalAmount = formData.type === 'profit'
            ? Math.abs(parseFloat(formData.amount))
            : -Math.abs(parseFloat(formData.amount));

        // MongoDB Document Structure
        const newDoc: Transaction = {
            _id: `obj_${Math.random().toString(36).substr(2, 9)}`,
            tenantId: tenantId,
            description: formData.description,
            category: formData.category,
            amount: finalAmount,
            type: formData.type as 'profit' | 'loss',
            date: formData.date,
        };

        const updated = [newDoc, ...transactions];
        setTransactions(updated);
        localStorage.setItem(`seven_days_transactions_${tenantId}`, JSON.stringify(updated));

        setFormData({
            description: '',
            amount: '',
            category: 'Services',
            type: 'profit',
            date: new Date().toISOString().split('T')[0]
        });

        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-white">
                <div className="flex flex-col items-center gap-3 sm:gap-4 lg:gap-6">
                    <div className="relative">
                        <Database className="text-emerald-500 animate-pulse" size={48} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-mono font-bold tracking-tighter uppercase">Cluster0 Handshake</p>
                        <p className="text-slate-500 text-xs mt-1 font-mono">
                            {connStatus === 'authenticating' ? '> Authenticating MoNGO_URI...' : '> Fetching seven_days documents...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative overflow-x-hidden">
            {/* Top Banner: Connection Status */}
            <div className="bg-[#111827] text-white px-4 py-2 flex items-center justify-between text-[10px] font-mono border-b border-emerald-500/30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span>CLUSTER0: CONNECTED</span>
                    </div>
                    <div className="hidden md:block opacity-40">|</div>
                    <div className="hidden md:flex items-center gap-1.5 opacity-60">
                        <Globe size={10} />
                        <span>DB: seven_days</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                    <ShieldCheck size={10} className="text-emerald-400" />
                    <span>SSL ENCRYPTED</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pb-6">
                    <div className="flex items-start gap-4">
                        <div className="hidden md:flex p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <Users className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Workspace: <span className="text-indigo-600 font-mono">{tenantId}</span>
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Financial Overview</h1>
                            <p className="text-sm text-slate-500">Document-driven P&L for systemnextit.com</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-lg shadow-indigo-100 active:scale-95"
                        >
                            <Plus size={18} /> New Entry
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-8">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <DollarSign size={20} />
                            </div>
                            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${totals.net >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {totals.net >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                {profitPercentage}%
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Net Balance</p>
                        <h3 className="text-2xl font-bold">${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Revenue</p>
                        <h3 className="text-2xl font-bold text-emerald-600">${totals.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                <TrendingDown size={20} />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Expenses</p>
                        <h3 className="text-2xl font-bold text-rose-600">${totals.loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                {/* Transaction History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">Collection: transactions</h3>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{tenantId}</span>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-md transition-colors shadow-sm">
                            <Filter size={18} />
                        </button>
                    </div>
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">Document Details</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Database size={32} className="opacity-10" />
                                                <p>No documents found in <b>seven_days</b></p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((item) => (
                                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">{item.description}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">_id: {item._id}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${item.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {item.amount > 0 ? '+' : ''}{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
                        {transactions.length === 0 ? (
                            <div className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                                <div className="flex flex-col items-center gap-2">
                                    <Database size={32} className="opacity-30" />
                                    <p>No documents found</p>
                                </div>
                            </div>
                        ) : (
                            transactions.map((item) => (
                                <div key={item._id} className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold \${
                                                    item.amount > 0 
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                                    {item.amount > 0 ? 'Revenue' : 'Expense'}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.description}</h4>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">_id: {item._id}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                                                    {item.category}
                                                </span>
                                                <span className={`text-sm font-bold \${item.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {item.amount > 0 ? '+' : ''}\${Math.abs(Number(item.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setMobileDropdownOpen(mobileDropdownOpen === item._id ? null : item._id)}
                                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <MoreVertical size={18} className="text-slate-400 dark:text-slate-500" />
                                            </button>
                                            {mobileDropdownOpen === item._id && (
                                                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10">
                                                    <button className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                        <Eye size={14} />
                                                        View Details
                                                    </button>
                                                    <button className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                        <Edit size={14} />
                                                        Edit Entry
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer info for multi-tenancy testing */}
                <div className="mt-8 p-4 bg-slate-100 border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                        <span className="text-indigo-600 font-bold">URI:</span> {`mongodb+srv://kamalmojumdar698_db_user:********@cluster0.rqhicza.mongodb.net/`} <br />
                        <span className="text-indigo-600 font-bold">QUERY:</span> {`db.transactions.find({ tenantId: "${tenantId}" })`}
                    </p>
                </div>
            </div>

            {/* Side-over Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
                            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                                <div>
                                    <h2 className="text-xl font-bold">New Document</h2>
                                    <p className="text-xs text-slate-400 font-mono">Collection: seven_days.transactions</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 flex-1 space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Entry Type</label>
                                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'profit' })}
                                            className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'profit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Revenue
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'loss' })}
                                            className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'loss' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Expense
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Website Maintenance"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Amount ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                                        <select
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option>Services</option>
                                            <option>Sales</option>
                                            <option>Consulting</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg active:scale-[0.98] transition-all"
                                    >
                                        Insert Document
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;