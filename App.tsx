
import React, { useState, useCallback } from 'react';
import { Plus, Trash2, RotateCcw, Copy, Info, CheckCircle2, Check } from 'lucide-react';
import { ExpenseItem } from './types';

const App: React.FC = () => {
  const [title, setTitle] = useState('2025年11月-2026年1月-印刷费用分摊表');
  const [totalAmount, setTotalAmount] = useState<number>(1222.95);
  
  // 核心平摊算法：传入当前项列表和目标总价，返回计算后的新列表
  const calculateBalancedItems = (currentItems: ExpenseItem[], targetTotal: number): ExpenseItem[] => {
    const lockedItems = currentItems.filter(item => item.isLocked);
    const unlockedItems = currentItems.filter(item => !item.isLocked);

    // 如果没有未锁定的项，则无法自动调整，直接返回（此时合计会与总价不符，由界面提示）
    if (unlockedItems.length === 0) return currentItems;

    const lockedTotal = lockedItems.reduce((sum, item) => sum + item.amount, 0);
    const remainingAmount = Math.max(0, targetTotal - lockedTotal);
    
    // 平摊剩余金额（保留两位小数）
    const baseShare = Math.floor((remainingAmount / unlockedItems.length) * 100) / 100;
    // 计算舍入误差
    const remainder = Math.round((remainingAmount - (baseShare * unlockedItems.length)) * 100) / 100;

    return currentItems.map(item => {
      if (item.isLocked) return item;
      
      // 最后一个未锁定的项目吸收所有误差余数，确保总和精确等于 targetTotal
      const isLastUnlocked = item.id === unlockedItems[unlockedItems.length - 1].id;
      return {
        ...item,
        amount: isLastUnlocked ? Math.round((baseShare + remainder) * 100) / 100 : baseShare
      };
    });
  };

  const [items, setItems] = useState<ExpenseItem[]>(() => {
    const initialItems: ExpenseItem[] = [
      { id: '1', description: 'pvc卡', department: '怡泰祥商品部', amount: 7.00, isLocked: false },
      { id: '2', description: '销售小单印刷1000张', department: '怡泰祥商品部', amount: 240.00, isLocked: false },
      { id: '3', description: '活动物料 8-10月份', department: '昆明一店', amount: 163.00, isLocked: false },
      { id: '4', description: '活动物料 8-10月份', department: '昆明三店', amount: 162.00, isLocked: false },
      { id: '5', description: '活动物料 8-10月份', department: '昆明五店', amount: 162.00, isLocked: false },
      { id: '6', description: '活动物料 8-10月份', department: '大理店4家', amount: 171.95, isLocked: false },
      { id: '7', description: '活动物料 8-10月份', department: '版纳店2家', amount: 162.00, isLocked: false },
      { id: '8', description: '活动物料 8-10月份', department: '丽江店3家', amount: 162.00, isLocked: false },
    ];
    return calculateBalancedItems(initialItems, 1222.95);
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 操作：修改总金额
  const handleTotalChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setTotalAmount(num);
    setItems(prev => calculateBalancedItems(prev, num));
  };

  // 操作：修改单项内容或金额
  const handleItemChange = (id: string, field: keyof ExpenseItem, value: any) => {
    setItems(prev => {
      const nextItems = prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'amount') updated.isLocked = true; // 手动改钱即锁定
          return updated;
        }
        return item;
      });
      return calculateBalancedItems(nextItems, totalAmount);
    });
  };

  // 操作：添加新项目
  const addItem = () => {
    setItems(prev => {
      const newItem: ExpenseItem = {
        id: Date.now().toString(),
        description: '新物料项目',
        department: '新部门',
        amount: 0,
        isLocked: false,
      };
      return calculateBalancedItems([...prev, newItem], totalAmount);
    });
  };

  // 操作：删除项目（核心：删除后立即重新分摊差额给未锁定项）
  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return calculateBalancedItems(filtered, totalAmount);
    });
  };

  // 操作：解锁单行
  const unlockItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, isLocked: false } : item);
      return calculateBalancedItems(updated, totalAmount);
    });
  };

  // 操作：全部重置平摊
  const resetAll = () => {
    setItems(prev => {
      const allUnlocked = prev.map(item => ({ ...item, isLocked: false }));
      return calculateBalancedItems(allUnlocked, totalAmount);
    });
  };

  const copyToClipboard = () => {
    const text = items.map(i => `${i.description}\t${i.department}\t${i.amount.toFixed(2)}`).join('\n');
    const header = `物料用途\t门店/部门\t金额\n`;
    navigator.clipboard.writeText(header + text + `\n合计\t\t${totalAmount.toFixed(2)}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const copySingleAmount = (id: string, amount: number) => {
    navigator.clipboard.writeText(amount.toFixed(2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const currentSum = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">费用分摊助手</h1>
          </div>
          <div className="flex gap-2">
             <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-sm font-medium">
              {copySuccess ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copySuccess ? '已复制' : '复制表格'}
            </button>
            <button onClick={resetAll} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors text-sm font-medium">
              <RotateCcw className="w-4 h-4" />
              全部重置
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="mb-8">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 text-center text-slate-800 placeholder:text-slate-300" placeholder="输入报销单标题..." />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3 items-start">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">智能计算模式已启用：</p>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              <li>手动修改过金额的行会显示为<span className="text-amber-600 font-bold">橙色锁定状态</span>。</li>
              <li>删除任何行或修改总价时，<strong>锁定状态的数字将保持不变</strong>。</li>
              <li>系统会自动调整“非锁定”行的金额，确保总计永远等于底部红色的总额。</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">物料用途</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">门店/部门</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">金额 (元)</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-3">
                    <input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-700" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="text" value={item.department} onChange={(e) => handleItemChange(item.id, 'department', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-600" />
                  </td>
                  <td className="px-6 py-3 relative">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.isLocked && (
                        <button onClick={() => unlockItem(item.id)} className="text-amber-500 hover:text-amber-600 p-1 rounded-full hover:bg-amber-50 transition-colors" title="点击恢复自动分摊">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="relative flex items-center group/amount">
                        <input 
                          type="number" 
                          step="0.01" 
                          value={item.amount || ''} 
                          onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)} 
                          className={`w-24 text-right bg-transparent border-none focus:ring-2 focus:ring-indigo-500 rounded px-1 transition-all font-medium ${item.isLocked ? 'text-amber-600' : 'text-slate-900'}`} 
                        />
                        <button onClick={() => copySingleAmount(item.id, item.amount)} className={`ml-1 p-1 rounded transition-all ${copiedId === item.id ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'}`}>
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-1.5 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-600 text-white font-bold">
                <td colSpan={2} className="px-6 py-4 text-lg">合计总额 (固定)</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2 group/total">
                    <span className="text-sm opacity-80 font-normal">¥</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={totalAmount || ''} 
                      onChange={(e) => handleTotalChange(e.target.value)} 
                      className="w-32 text-right bg-white/10 hover:bg-white/20 border-none focus:ring-2 focus:ring-white rounded py-1 px-2 text-xl placeholder:text-white/50" 
                    />
                    <button onClick={() => copySingleAmount('total', totalAmount)} className={`p-1.5 rounded transition-all ${copiedId === 'total' ? 'text-green-300 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover/total:opacity-100'}`}>
                      {copiedId === 'total' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          </table>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all font-medium">
              <Plus className="w-5 h-5" />
              添加新项目
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center px-2">
           <div className="text-sm">
             <span className="text-slate-500">当前实算合计：</span>
             <span className={`font-bold ${Math.abs(currentSum - totalAmount) < 0.001 ? 'text-green-600' : 'text-red-600'}`}>
               ¥ {currentSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
             {Math.abs(currentSum - totalAmount) >= 0.001 && (
               <span className="ml-2 text-red-500 font-medium">(由于所有项都被锁定，总额无法自动平衡)</span>
             )}
           </div>
           <p className="text-xs text-slate-400 italic">申请人：许可</p>
        </div>
      </main>

      <footer className="mt-20 py-8 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2024 报销分摊助手 - 极简财务管理工具</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
