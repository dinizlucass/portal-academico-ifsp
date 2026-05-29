import { User, UserRole, Course, Subject, Boleto } from '../types';

export const ADS_COURSE: Course = {
  id: 'ads-01',
  name: 'Análise e Desenvolvimento de Sistemas',
  totalSemesters: 6,
  subjects: [
    { id: 's1-1', name: 'Lógica de Programação', semester: 1, status: 'concluded', grade: 8.5, attendance: 95 },
    { id: 's1-2', name: 'Algoritmos', semester: 1, status: 'concluded', grade: 7.8, attendance: 90 },
    { id: 's1-3', name: 'Matemática Básica', semester: 1, status: 'concluded', grade: 9.0, attendance: 100 },
    
    { id: 's2-1', name: 'Estrutura de Dados', semester: 2, status: 'concluded', grade: 7.5, attendance: 85 },
    { id: 's2-2', name: 'Banco de Dados', semester: 2, status: 'concluded', grade: 8.2, attendance: 92 },
    { id: 's2-3', name: 'Programação Orientada a Objetos', semester: 2, status: 'concluded', grade: 8.8, attendance: 88 },
    
    { id: 's3-1', name: 'Desenvolvimento Web', semester: 3, status: 'in_progress', grade: 0, attendance: 94 },
    { id: 's3-2', name: 'Engenharia de Software', semester: 3, status: 'in_progress', grade: 0, attendance: 90 },
    { id: 's3-3', name: 'Sistemas Operacionais', semester: 3, status: 'in_progress', grade: 0, attendance: 85 },
    
    { id: 's4-1', name: 'APIs e Integrações', semester: 4, status: 'pending' },
    { id: 's4-2', name: 'Segurança da Informação', semester: 4, status: 'pending' },
    { id: 's4-3', name: 'UX/UI', semester: 4, status: 'pending' },
    
    { id: 's5-1', name: 'Arquitetura de Software', semester: 5, status: 'pending' },
    { id: 's5-2', name: 'Cloud Computing', semester: 5, status: 'pending' },
    { id: 's5-3', name: 'DevOps', semester: 5, status: 'pending' },
    
    { id: 's6-1', name: 'Projeto Final', semester: 6, status: 'pending' },
    { id: 's6-2', name: 'Empreendedorismo', semester: 6, status: 'pending' },
    { id: 's6-3', name: 'Qualidade de Software', semester: 6, status: 'pending' },
  ]
};

export const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: 'Lucas Diniz',
    email: 'aluno@ifsp.edu.br',
    role: UserRole.STUDENT,
    courseId: 'ads-01',
    currentSemester: 3,
    status: 'active',
    registration: 'SP260001',
    cpf: '123.456.789-00',
    birthDate: '2000-01-01',
    phone: '(11) 98765-4321',
    avatar: 'https://picsum.photos/seed/student/200/200',
    boletos: [
      { id: 'b1', description: 'Mensalidade - Março', value: 0, dueDate: '2026-03-10', status: 'paid' },
      { id: 'b2', description: 'Mensalidade - Abril', value: 0, dueDate: '2026-04-10', status: 'pending' },
      { id: 'b3', description: 'Mensalidade - Maio', value: 0, dueDate: '2026-05-10', status: 'pending' },
    ]
  },
  {
    id: '2',
    name: 'Administrador IFSP',
    email: 'admin@ifsp.edu.br',
    role: UserRole.ADMIN,
    avatar: 'https://picsum.photos/seed/admin/200/200'
  }
];
