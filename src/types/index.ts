export interface User {
  id: string;
  name: string;
  email: string;
  role: 'GESTOR' | 'ADMIN';
  active: boolean;
  companyId?: string;
  company?: Company;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  projectType?: 'RESIDENCIAL' | 'COMERCIAL' | 'INDUSTRIAL' | 'OUTRO';
  deadline?: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  companyId?: string;
  files?: ProjectFile[];
  rooms?: Room[];
  budgets?: Budget[];
  _count?: { files: number; rooms: number; budgets: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  processed: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  projectId: string;
  fileId?: string;
  name: string;
  area: number;
  perimeter: number;
  notes?: string;
  isManual: boolean;
  budgetItems?: BudgetItem[];
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  type: 'MARBLE' | 'GRANITE' | 'QUARTZITE' | 'OTHER';
  color?: string;
  finish?: 'POLISHED' | 'BRUSHED' | 'HONED' | 'NATURAL';
  thickness?: number;
  pricePerM2: number;
  stock: number;
  unit: string;
  active: boolean;
  description?: string;
  supplier?: string;
  createdAt: string;
}

export interface Seller {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commission: number;
  active: boolean;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetAdjustment {
  id: string;
  budgetId: string;
  description: string;
  type: 'COST' | 'DISCOUNT';
  valueType: 'FIXED' | 'PERCENT';
  value: number;
  createdAt: string;
}

export interface Budget {
  id: string;
  projectId: string;
  project?: { id: string; name: string; clientName?: string; clientEmail?: string };
  userId: string;
  user?: { id: string; name: string; email: string };
  sellerId?: string;
  seller?: Seller;
  name: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  totalArea: number;
  totalCost: number;
  laborCost: number;
  extraCost: number;
  discount: number;
  notes?: string;
  validUntil?: string;
  approvedAt?: string;
  items?: BudgetItem[];
  adjustments?: BudgetAdjustment[];
  sale?: Sale;
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  roomId: string;
  room?: Room;
  materialId: string;
  material?: Material;
  area: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface SalePayment {
  id: string;
  saleId: string;
  method: 'CARD' | 'PIX' | 'CASH';
  amount: number;
  paidAt?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  budgetId: string;
  budget?: Budget & {
    project?: { id: string; name: string; clientName?: string };
    seller?: Seller;
  };
  userId: string;
  companyId?: string;
  clientName?: string;
  totalAmount: number;
  paymentMethod: 'CARD' | 'PIX' | 'CASH' | 'MIXED';
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
  notes?: string;
  paidAt?: string;
  payments?: SalePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancialEntry {
  id: string;
  userId: string;
  companyId?: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  description: string;
  amount: number;
  dueDate?: string;
  paidAt?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  category?: string;
  saleId?: string;
  sale?: Sale;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  price: number;
  maxUsers: number;
  maxProjects: number;
  maxStorage: number;
  features: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: { id: string; name: string; email: string };
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalBudgets: number;
  totalMaterials: number;
  totalRevenue: number;
  totalArea: number;
  avgBudget: number;
  recentProjects: Project[];
  recentBudgets: Budget[];
  statusCounts: { status: string; _count: number }[];
}

export interface KPIRecord {
  id: string;
  userId: string;
  type: 'PRODUTIVIDADE' | 'OEE';
  period: string;
  unidadesProduzidas?: number;
  horasTrabalhadas?: number;
  numOperadores?: number;
  disponibilidade?: number;
  desempenho?: number;
  qualidade?: number;
  resultado: number;
  notes?: string;
  createdAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  type: string;
  color?: string;
  finish?: string;
  supplier?: string;
  pricePerM2: number;
  stock: number;
  consumedArea: number;
  consumedRev: number;
  quotedArea: number;
  remaining: number;
  stockPct: number | null;
  status: 'NO_STOCK' | 'OUT' | 'CRITICAL' | 'LOW' | 'OK';
  active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { total: number; page: number; limit: number; pages: number };
}
