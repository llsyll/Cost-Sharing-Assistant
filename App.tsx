
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, Copy, Info, CheckCircle2, Check, ExternalLink } from 'lucide-react';
import { ExpenseItem } from './types';

const App: React.FC = () => {
  const [title, setTitle] = useState('2025年季度印刷费用报销分摊表');
  const [totalAmount, setTotalAmount] = useState<number>(1222.95);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 智能分摊算法
  const calculateBalancedItems = (currentItems: ExpenseItem[], targetTotal: number): ExpenseItem[] => {
    const lockedItems = currentItems.filter(item => item.isLocked);
    const unlockedItems = currentItems.filter(item => !item.isLocked);

    // 如果全部被锁定，无法调整，直接返回
    if (unlockedItems.length === 0) return currentItems;

    const lockedTotal = lockedItems.reduce((sum, item) => sum + item.amount, 0);
    const remainingAmount = Math.max(0, targetTotal - lockedTotal);
    
    // 平摊剩余金额
    const baseShare = Math.floor((remainingAmount / unlockedItems.length) * 100) / 100;
    const remainder = Math.round((remainingAmount - (baseShare * unlockedItems.length)) * 100) / 100;

    return currentItems.map(item => {
      if (item.isLocked) return item;
      // 最后一个未锁定的项吸收余数误差
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
      { id: '2', description: '销售小单', department: '商品部', amount: 240.00, isLocked: false },
      { id: '3', description: '活动物料', department: '门店A', amount: 163.00, isLocked: false },
      { id: '4', description: '活动物料', department: '门店B', amount: 162.00, isLocked: false },
    ];
    return calculateBalancedItems(initial, 1222.95);
  });

  // 处理总金额变更
  const handleTotalChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setTotalAmount(num);
    setItems(prev => calculateBalancedItems(prev, num));
  };

  // 处理单行修改
  const handleItemChange = (id: string, field: keyof ExpenseItem, value: any) => {
    setItems(prev => {
      const nextItems = prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'amount') updated.isLocked = true; // 修改金额即触发锁定
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
        description: '新增项目',
        department: '待分配',
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus:ring-0 text-slate-800 w-full"
            />
            <p className="text-slate-500 text-sm mt-1">自动计算平摊比例，修改单行金额后自动锁定</p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetAll} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <RotateCcw className="w-4 h-4" />
              全部重置
            </button>
            <button onClick={copyToClipboard} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
              {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copySuccess ? '复制成功' : '复制整表'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex gap-3 text-amber-800">
          <Info className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <span className="font-bold underline cursor-help" title="删除行或修改总价时，橙色数值不会变动">锁定保护机制</span>：
            修改某行金额后，该行将变更为橙色锁定状态。删除其他行时，系统会优先调整蓝色（未锁定）行的金额以补足差额。
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">用途说明</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">归属部门</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">金额 (元)</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-700 font-medium" />
                  </td>
                  <td className="px-6 py-4">
                    <input type="text" value={item.department} onChange={e => handleItemChange(item.id, 'department', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-500" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {item.isLocked && (
                        <button onClick={() => unlockItem(item.id)} className="text-amber-500 hover:scale-110 transition-transform p-1" title="解锁并恢复自动分摊">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          step="0.01" 
                          value={item.amount || ''} 
                          onChange={e => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          className={`w-24 text-right bg-transparent border-none focus:ring-2 focus:ring-indigo-100 rounded px-1 text-base font-bold transition-colors ${item.isLocked ? 'text-amber-600' : 'text-indigo-600'}`}
                        />
                        <button onClick={() => copySingleAmount(item.id, item.amount)} className={`p-1.5 rounded-md transition-all ${copiedId === item.id ? 'bg-green-100 text-green-600 scale-110' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400'}`}>
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white">
                <td colSpan={2} className="px-6 py-5 font-bold text-lg">报销总金额 (锁定)</td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-2 group/total">
                    <span className="text-slate-400 font-normal">¥</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={totalAmount || ''} 
                      onChange={e => handleTotalChange(e.target.value)}
                      className="w-32 text-right bg-white/10 border-none focus:ring-2 focus:ring-indigo-500 rounded py-1 px-2 text-xl font-black text-white"
                    />
                    <button onClick={() => copySingleAmount('total', totalAmount)} className={`p-1.5 rounded transition-all ${copiedId === 'total' ? 'text-green-400 bg-white/10' : 'text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover/total:opacity-100'}`}>
                       {copiedId === 'total' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div className="p-4 bg-slate-50/50">
            <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition-all font-medium">
              <Plus className="w-5 h-5" />
              添加报销项目
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between text-sm gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isBalanced ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-semibold">实时合计: ¥{currentSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            {!isBalanced && <span className="text-xs ml-1">(全部项被锁定，无法平衡误差)</span>}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-default">
              <ExternalLink className="w-3.5 h-3.5" />
              导出为 CSV
            </span>
            <span>申请人：许可</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
