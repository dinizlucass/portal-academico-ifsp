export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface Subject {
  id: string;
  name: string;
  semester: number;
  grade?: number;
  attendance?: number;
  status: 'concluded' | 'in_progress' | 'pending';
}

export interface Course {
  id: string;
  name: string;
  totalSemesters: number;
  subjects: Subject[];
}

export interface Boleto {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  status: 'paid' | 'pending';
}

export interface Document {
  id: string;
  type: 'carteirinha' | 'historico' | 'declaracao' | 'outros';
  name: string;
  storagePath: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  previewUrl?: string;
}

export interface StudentSettings {
  notifyBoletos: boolean;
  notifyGrades: boolean;
  notifyAnnouncements: boolean;
  emailDigest: boolean;
  language: string;
  accessibilityFont: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  courseId?: string;
  currentSemester?: number;
  status?: 'active' | 'locked' | 'graduated';
  boletos?: Boleto[];
  avatar?: string;
  cpf?: string;
  birthDate?: string;
  registration?: string;
  phone?: string;
  documents?: Document[];
  settings?: StudentSettings;
}
