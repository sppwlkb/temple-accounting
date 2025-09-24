
export enum Page {
  Dashboard = 'Dashboard',
  Accounting = 'Accounting',
  Devotees = 'Devotees',
  Services = 'Services',
}

export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  devoteeId?: string;
  category: string;
}

export interface Devotee {
  id: string;
  name: string;
  phone: string;
  address: string;
  registrationDate: string;
}

export enum LampType {
  Guangming = '光明燈',
  Taisui = '太歲燈',
}

export interface LampRegistration {
  id: string;
  devoteeId: string;
  lampType: LampType;
  year: number;
  amount: number;
  paymentDate: string;
}

export interface PuduRegistration {
  id: string;
  devoteeId: string;
  year: number;
  package: string;
  amount: number;
  paymentDate: string;
}

export interface ReceiptData {
    transaction: Transaction;
    devotee: Devotee | null;
}
