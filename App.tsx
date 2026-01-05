
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, Copy, Info, CheckCircle2, Check, ExternalLink, Calculator, User } from 'lucide-react';
import { ExpenseItem } from './types';

const App: React.FC = () => {
  const [title, setTitle] = useState('2025年季度印刷费用报销分摊表');
  const [totalAmount, setTotalAmount] = useState<number>(1222.95);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const calculateBalancedItems = (currentItems: ExpenseItem[], targetTotal: number): ExpenseItem[] => {
    const lockedItems = currentItems.filter(item => item.isLocked);
    const unlockedItems = currentItems.filter(item => !item.isLocked);

    if (unlockedItems.length === 0) return currentItems;

    const lockedTotal = lockedItems.reduce((sum, item) => sum + item.amount, 0);
    const remainingAmount = Math.max(0, targetTotal - lockedTotal);
    
    const baseShare = Math.floor((remainingAmount / unlockedItems.length) * 100) / 100;
    const remainder = Math.round((remainingAmount - (baseShare * unlockedItems.length)) * 100) / 100;

    return currentItems.map(item => {
      if (item.isLocked) return item;
      const isLastUnlocked = item.id === unlockedItems[unlockedItems.length - 1].id;
      return {
        ...item,
        amount: isLastUnlocked ? Math.round((baseShare + remainder) * 100) / 100 : baseShare
      };
    });
  };

  const [items, setItems] = useState<ExpenseItem[]>(() => {
    const initial: ExpenseItem[] = [
      { id: '1', description: 'PVC卡', department: '商品部', amount: 7.00, isLocked: false },
      { id: '2', description: '销售小单印刷', department: '商品部', amount: 240.00, isLocked: false },
      { id: '3', description: '活动物料-昆明', department: '昆明门店', amount: 163.00, isLocked: false },
      { id: '4', description: '活动物料-大理', department: '大理门店', amount: 162.00, isLocked: false },
    ];
    return calculateBalancedItems(initial, 1222.95);
  });

  const handleTotalChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setTotalAmount(num);
    setItems(prev => calculateBalancedItems(prev, num));
  };

  const handleItemChange = (id: string, field: keyof ExpenseItem, value: any) => {
    setItems(prev => {
      const nextItems = prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'amount') updated.isLocked = true;
          return updated;
        }
        return item;
      });
      return calculateBalancedItems(nextItems, totalAmount);
    });
  };

  const addItem = () => {
    setItems(prev => {
      const newItem: ExpenseItem = {
        id: Date.now().toString(),
        description: '新增费用项目',
        department: '待定',
        amount: 0,
        isLocked: false,
      };
      return calculateBalancedItems([...prev, newItem], totalAmount);
    });
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return calculateBalancedItems(filtered, totalAmount);
    });
  };

  const unlockItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, isLocked: false } : item);
      return calculateBalancedItems(updated, totalAmount);
    });
  };

  const resetAll = () => {
    setItems(prev => {
      const allUnlocked = prev.map(item => ({ ...item, isLocked: false }));
      return calculateBalancedItems(allUnlocked, totalAmount);
    });
  };

  const copyToClipboard = () => {
    const text = items.map(i => `${i.description}\t${i.department}\t${i.amount.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`项目\t部门\t金额\n${text}\n合计\t\t${totalAmount.toFixed(2)}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const copySingleAmount = (id: string, amount: number) => {
    navigator.clipboard.writeText(amount.toFixed(2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const currentSum = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const isBalanced = Math.abs(currentSum - totalAmount) < 0.01;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Financial Helper</span>
            </div>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="text-4xl font-extrabold bg-transparent border-none focus:ring-0 text-slate-900 w-full p-0 tracking-tight"
            />
            <div className="flex items-center gap-4 mt-2">
               <p className="text-slate-500 text-sm flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> 自动平摊计算器 • 修改即锁定
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={resetAll} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              全部重置
            </button>
            <button 
              onClick={copyToClipboard} 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 rounded-xl text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95 group"
            >
              {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />}
              {copySuccess ? '复制成功' : '复制表格内容'}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-600 rounded-2xl p-6 mb-8 text-white shadow-xl shadow-indigo-200 flex flex-col sm:flex-row gap-6 items-center">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-0.5">智能平摊机制已启用</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              修改任意项金额后，系统会自动将其变更为 <span className="text-amber-300 font-bold italic">锁定状态</span>。
              删除项目或修改总金额时，仅未锁定的项目参与分摊，锁定金额保持静止。
            </p>
          </div>
          <div className="hidden lg:block border-l border-white/20 pl-6">
            <div className="text-xs text-indigo-200 uppercase font-bold tracking-widest mb-1">系统状态</div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
               <span className="font-mono text-sm">Engine v1.2 Active</span>
            </div>
          </div>
        </div>

        {/* Desktop Table Wrapper */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="pl-8 pr-4 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">用途用途与说明</th>
                  <th className="px-4 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">分摊部门/门店</th>
                  <th className="px-4 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">金额 (RMB)</th>
                  <th className="pl-4 pr-8 py-5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item, idx) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                    <td className="pl-8 pr-4 py-5">
                      <input 
                        type="text" 
                        value={item.description} 
                        onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-800 font-semibold text-lg placeholder:text-slate-300"
                        placeholder="输入项目说明..."
                      />
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors"></div>
                        <input 
                          type="text" 
                          value={item.department} 
                          onChange={e => handleItemChange(item.id, 'department', e.target.value)} 
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500 text-sm font-medium" 
                          placeholder="归属部门..."
                        />
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center justify-end gap-3">
                        {item.isLocked && (
                          <button 
                            onClick={() => unlockItem(item.id)} 
                            className="bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors p-1.5 rounded-lg" 
                            title="点击解锁并恢复自动分摊"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="flex items-center bg-slate-50 group-hover:bg-white rounded-xl border border-transparent group-hover:border-slate-100 transition-all px-2 py-1">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={item.amount || ''} 
                            onChange={e => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                            className={`w-24 text-right bg-transparent border-none focus:ring-0 p-1 text-base font-black transition-colors ${item.isLocked ? 'text-amber-600' : 'text-indigo-600'}`}
                          />
                          <button 
                            onClick={() => copySingleAmount(item.id, item.amount)} 
                            className={`p-1.5 rounded-lg transition-all ${copiedId === item.id ? 'bg-emerald-100 text-emerald-600 scale-110' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400'}`}
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="pl-4 pr-8 py-5 text-right">
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="text-slate-300 hover:text-red-500 transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 group/total">
                  <td colSpan={2} className="pl-8 py-7">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-6 h-6 text-indigo-400" />
                      <span className="font-black text-xl text-white tracking-tight">报销结算总额 (已锁定)</span>
                    </div>
                  </td>
                  <td className="px-4 py-7">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-slate-500 font-bold text-lg italic">¥</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={totalAmount || ''} 
                        onChange={e => handleTotalChange(e.target.value)}
                        className="w-40 text-right bg-white/5 border border-white/10 focus:border-indigo-500 focus:bg-white/10 focus:ring-0 rounded-2xl py-2 px-3 text-2xl font-black text-white transition-all"
                      />
                      <button 
                        onClick={() => copySingleAmount('total', totalAmount)} 
                        className={`p-2 rounded-xl transition-all ${copiedId === 'total' ? 'text-emerald-400 bg-white/10 scale-110' : 'text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover/total:opacity-100'}`}
                      >
                         {copiedId === 'total' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                  <td className="pr-8"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100">
            <button 
              onClick={addItem} 
              className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all font-bold group"
            >
              <div className="bg-slate-100 group-hover:bg-indigo-100 p-1 rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              新增一条报销项目记录
            </button>
          </div>
        </div>

        {/* Footer & Status Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl shadow-sm border ${isBalanced ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            <span className="font-black font-mono tracking-tight">
              REAL-TIME SUM: ¥{currentSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            {!isBalanced && (
              <span className="text-xs font-bold opacity-80 uppercase tracking-wider border-l border-rose-200 pl-3 ml-1">
                Amount Mismatch (Manual Lock Conflict)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-6 text-slate-400">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:text-indigo-600 transition-all cursor-pointer group shadow-sm">
              <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-bold">导出 CSV 报表</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 uppercase tracking-tighter">申请人: 许可</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
            <p className="text-slate-300 text-xs font-bold uppercase tracking-[0.3em]">&copy; 2025 Financial Automation Tool • Built for Efficiency</p>
        </div>
      </div>
    </div>
  );
};

export default App;
