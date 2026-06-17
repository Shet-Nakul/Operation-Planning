export type ContractType = 'DYNAMIC' | 'STATIC';
export type ContractStatus = 'Active' | 'Draft' | 'Archived';

export interface Contract {
  id: string;
  contractId: string;
  name: string;
  type: ContractType;
  status: ContractStatus;
  staffTags: string[];
  updatedAt: string;
  createdAt: string;
}

export type ViewState = 'LIBRARY' | 'CREATE_STATIC' | 'CREATE_DYNAMIC';
