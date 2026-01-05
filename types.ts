
export interface ExpenseItem {
  id: string;
  description: string;
  department: string;
  amount: number;
  isLocked: boolean; // 如果用户手动修改了，则为锁定状态，不参与自动平摊
}

export interface ExpenseState {
  title: string;
  totalAmount: number;
  items: ExpenseItem[];
}
