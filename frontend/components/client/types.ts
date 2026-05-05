export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  birthDate?: string;
  registrationDate: string;
  status: 'active' | 'inactive';
}

export interface PolicyInfo {
  id: string;
  planName: string;
  type: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  startDate: string;
  expirationDate: string;
  monthlyPremium: number;
  coverage: string;
  deductible: number;
  beneficiaries: number;
  lastPayment?: string;
}