import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  User as UserIcon,
  LogOut,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  Upload,
  FolderOpen,
  Settings,
  Trash2,
  Bell,
  Globe,
  Shield,
  IdCard,
  FileCheck,
  FilePlus,
  Lock,
  TrendingUp,
  Calendar,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, Document, StudentSettings, Boleto } from './types';
import { INITIAL_USERS, ADS_COURSE } from './data/mockData';
import { supabase, supabaseConfigured, supabaseIsolated } from './lib/supabase';
import { generateStudentSubjects, generateBoletos } from './lib/random';

// ─── Helpers ────────────────────────────────────────────────

const DEFAULT_SETTINGS: StudentSettings = {
  notifyBoletos: true,
  notifyGrades: true,
  notifyAnnouncements: true,
  emailDigest: false,
  language: 'pt-BR',
  accessibilityFont: false,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── UI Components ───────────────────────────────────────────

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all border-l-4 ${
      active
        ? 'border-ifsp-green bg-ifsp-green/5 text-ifsp-green'
        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <span className="flex items-center gap-3">
      <Icon size={16} />
      {label}
    </span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
        {badge}
      </span>
    )}
  </button>
);

const Card = ({
  children,
  title,
  icon: Icon,
  action,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: any;
  action?: React.ReactNode;
  key?: React.Key;
}) => (
  <div className="bg-white border border-gray-200 overflow-hidden mb-6 shadow-sm">
    {title && (
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-ifsp-green" />}
          <h3 className="font-bold text-xs uppercase tracking-widest text-gray-600">{title}</h3>
        </div>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const Badge = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) => {
  const styles = {
    default: 'bg-gray-100 text-gray-600 border-gray-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = 'green',
  sub,
}: {
  label: string;
  value: string | number;
  icon: any;
  color?: 'green' | 'red' | 'blue' | 'amber';
  sub?: string;
}) => {
  const iconColors = {
    green: 'text-ifsp-green bg-ifsp-green/10',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
  };
  return (
    <div className="bg-white border border-gray-200 p-5 shadow-sm flex items-center gap-4">
      <div className={`p-3 ${iconColors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-5 transition-colors ${checked ? 'bg-ifsp-green' : 'bg-gray-300'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white max-w-sm w-full p-6 shadow-xl"
        >
          <h3 className="font-black text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-5">{message}</p>
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button onClick={onConfirm} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">
              Excluir
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Document type labels ─────────────────────────────────────
const DOC_TYPES: Record<Document['type'], { label: string; icon: any; color: string }> = {
  carteirinha: { label: 'Carteirinha', icon: IdCard, color: 'text-blue-600' },
  historico: { label: 'Histórico Escolar', icon: FileCheck, color: 'text-green-600' },
  declaracao: { label: 'Declaração', icon: FileText, color: 'text-amber-600' },
  outros: { label: 'Outros', icon: FilePlus, color: 'text-gray-500' },
};

// ─── Main App ────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allUsers, setAllUsers] = useState<User[]>(supabaseConfigured ? [] : INITIAL_USERS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [newStudent, setNewStudent] = useState({ name: '', email: '', semester: 1 });
  const [adminMessage, setAdminMessage] = useState('');
  const [docError, setDocError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Documents state (visão do próprio aluno)
  const [documents, setDocuments] = useState<Document[]>([]);

  // Documents state (gestão pelo admin)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentDocs, setStudentDocs] = useState<Document[]>([]);
  const [adminDocType, setAdminDocType] = useState<Document['type']>('carteirinha');
  const [adminDocUploading, setAdminDocUploading] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  // Settings state
  const [settings, setSettings] = useState<StudentSettings>(DEFAULT_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    document.title = 'Portal Acadêmico - IFSP';
  }, []);

  // Populate settings when user logs in
  useEffect(() => {
    if (user?.settings) setSettings(user.settings);
  }, [user]);

  // ─── Auth ───────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (supabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginError('Email ou senha incorretos.');
        setLoginLoading(false);
        return;
      }
      if (data.user) {
        const meta = data.user.user_metadata ?? {};

        // Busca perfil — ignora erro de RLS, usa metadados como fallback
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        // Role vem do perfil ou dos metadados do Auth
        const role = (profile?.role ?? meta.role ?? 'STUDENT') as UserRole;

        setUser({
          id: data.user.id,
          name: profile?.name || meta.name || data.user.email!,
          email: data.user.email!,
          role,
          registration: profile?.registration,
          cpf: profile?.cpf,
          birthDate: profile?.birth_date,
          phone: profile?.phone,
          avatar: profile?.avatar_url,
          courseId: profile?.course_id,
          currentSemester: profile?.current_semester ?? 1,
          status: profile?.status ?? 'active',
        });
        if (role === UserRole.ADMIN) {
          loadAllStudents();
        } else {
          loadDocuments(data.user.id);
          loadSettings(data.user.id);
          loadBoletos(data.user.id);
        }
      }
    } else {
      // Mock fallback
      const foundUser = allUsers.find(u => u.email === email);
      if (foundUser) {
        setUser({ ...foundUser, settings: DEFAULT_SETTINGS });
        setDocuments(getMockDocuments());
      } else {
        setLoginError('Usuário não encontrado. Tente aluno@ifsp.edu.br ou admin@ifsp.edu.br');
      }
    }
    setLoginLoading(false);
  };

  const getMockDocuments = (): Document[] => [
    {
      id: 'doc-1',
      type: 'carteirinha',
      name: 'Carteirinha_Estudantil_2026.pdf',
      storagePath: '',
      fileSize: 204800,
      mimeType: 'application/pdf',
      createdAt: '2026-03-01T10:00:00Z',
    },
  ];

  const fetchDocumentsFor = async (studentId: string): Promise<Document[]> => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(d => ({
      id: d.id,
      type: d.type,
      name: d.name,
      storagePath: d.storage_path,
      fileSize: d.file_size,
      mimeType: d.mime_type,
      createdAt: d.created_at,
    }));
  };

  const loadDocuments = async (userId: string) => {
    if (!supabaseConfigured) return;
    setDocuments(await fetchDocumentsFor(userId));
  };

  const loadSettings = async (userId: string) => {
    if (!supabaseConfigured) return;
    const { data } = await supabase.from('settings').select('*').eq('student_id', userId).maybeSingle();
    if (data) {
      setSettings({
        notifyBoletos: data.notify_boletos,
        notifyGrades: data.notify_grades,
        notifyAnnouncements: data.notify_announcements,
        emailDigest: data.email_digest,
        language: data.language,
        accessibilityFont: data.accessibility_font,
      });
    }
  };

  const loadBoletos = async (studentId: string) => {
    if (!supabaseConfigured) return;
    const { data } = await supabase.from('boletos').select('*').eq('student_id', studentId).order('due_date');
    if (data) {
      const boletos: Boleto[] = data.map(b => ({
        id: b.id,
        description: b.description,
        value: Number(b.value),
        dueDate: b.due_date,
        status: b.status,
      }));
      setUser(prev => (prev ? { ...prev, boletos } : prev));
    }
  };

  const loadAllStudents = async () => {
    if (!supabaseConfigured) return;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'STUDENT')
      .order('created_at', { ascending: false });
    if (!profiles) return;

    const ids = profiles.map(p => p.id);
    let boletosByStudent: Record<string, Boleto[]> = {};
    if (ids.length) {
      const { data: boletosData } = await supabase.from('boletos').select('*').in('student_id', ids);
      if (boletosData) {
        boletosByStudent = boletosData.reduce((acc: Record<string, Boleto[]>, b) => {
          (acc[b.student_id] ||= []).push({
            id: b.id,
            description: b.description,
            value: Number(b.value),
            dueDate: b.due_date,
            status: b.status,
          });
          return acc;
        }, {});
      }
    }

    setAllUsers(
      profiles.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email ?? '',
        role: UserRole.STUDENT,
        registration: p.registration,
        cpf: p.cpf,
        birthDate: p.birth_date,
        phone: p.phone,
        avatar: p.avatar_url,
        courseId: p.course_id,
        currentSemester: p.current_semester ?? 1,
        status: p.status ?? 'active',
        boletos: boletosByStudent[p.id] ?? [],
      }))
    );
  };

  const handleLogout = async () => {
    if (supabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    setEmail('');
    setPassword('');
    setActiveTab('dashboard');
    setIsEditingProfile(false);
    setDocuments([]);
    setAllUsers(supabaseConfigured ? [] : INITIAL_USERS);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleForgotPassword = async (targetEmail: string) => {
    if (!targetEmail) {
      setResetMessage('Informe seu e-mail no campo acima para receber o link de redefinição.');
      return;
    }
    if (!supabaseConfigured) {
      setResetMessage('Redefinição de senha indisponível no modo demonstração.');
      return;
    }
    await supabase.auth.resetPasswordForEmail(targetEmail);
    setResetMessage('Se o e-mail informado existir em nossa base, enviaremos um link de redefinição.');
  };

  const handleBoletoReceipt = (boleto: Boleto) => {
    const w = window.open('', '_blank', 'width=650,height=800');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Comprovante - ${boleto.description}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#1f2937}
        .header{border-bottom:3px solid #006b3f;padding-bottom:12px;margin-bottom:24px}
        .header h1{font-size:16px;margin:0;color:#006b3f}
        .header p{font-size:11px;color:#6b7280;margin:2px 0 0}
        .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:13px}
        .label{color:#6b7280;font-weight:bold;text-transform:uppercase;font-size:10px}
        .value{font-weight:bold}
        .total{font-size:22px;color:#006b3f;font-weight:900;margin-top:16px}
        .status{display:inline-block;padding:4px 10px;font-size:10px;font-weight:bold;text-transform:uppercase;background:${boleto.status === 'paid' ? '#d1fae5' : '#fee2e2'};color:${boleto.status === 'paid' ? '#065f46' : '#991b1b'}}
      </style></head><body>
        <div class="header"><h1>INSTITUTO FEDERAL DE SÃO PAULO</h1><p>Comprovante Financeiro · Uso interno</p></div>
        <div class="row"><span class="label">Aluno</span><span class="value">${user?.name ?? ''}</span></div>
        <div class="row"><span class="label">Matrícula</span><span class="value">${user?.registration ?? '—'}</span></div>
        <div class="row"><span class="label">Descrição</span><span class="value">${boleto.description}</span></div>
        <div class="row"><span class="label">Vencimento</span><span class="value">${new Date(boleto.dueDate).toLocaleDateString('pt-BR')}</span></div>
        <div class="row"><span class="label">Situação</span><span class="status">${boleto.status === 'paid' ? 'Pago' : 'Pendente'}</span></div>
        <p class="total">R$ ${boleto.value.toFixed(2)}</p>
        <script>window.onload = () => window.print();</script>
      </body></html>`);
    w.document.close();
  };

  // ─── Profile ─────────────────────────────────────────────────

  const startEditing = () => {
    if (user) {
      setEditForm({ ...user });
      setIsEditingProfile(true);
    }
  };

  const saveProfile = async () => {
    if (!user || !editForm) return;
    const updatedUser = { ...user, ...editForm } as User;
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));
    if (supabaseConfigured) {
      await supabase.from('profiles').update({
        name: editForm.name,
        phone: editForm.phone,
        cpf: editForm.cpf,
        birth_date: editForm.birthDate,
        avatar_url: editForm.avatar,
      }).eq('id', user.id);
    }
    setIsEditingProfile(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  // ─── Admin ───────────────────────────────────────────────────

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseConfigured) {
      const { data, error } = await supabaseIsolated.auth.signUp({
        email: newStudent.email,
        password: 'Aluno@IFSP2026',
        options: { data: { name: newStudent.name, role: 'STUDENT' } },
      });
      if (error) { setAdminMessage('Erro: ' + error.message); return; }
      if (data.user) {
        // A sessão do cliente isolado passa a ser a do aluno recém-criado,
        // então a atualização do próprio perfil (curso/semestre) é feita por ele mesmo.
        await supabaseIsolated.from('profiles').update({
          current_semester: newStudent.semester,
          course_id: ADS_COURSE.id,
        }).eq('id', data.user.id);

        // Boletos são inseridos pelo cliente principal (sessão do admin),
        // que é quem tem permissão de escrita na tabela de boletos.
        const boletoRows = generateBoletos(data.user.id).map(b => ({
          student_id: data.user.id,
          description: b.description,
          value: b.value,
          due_date: b.dueDate,
          status: b.status,
        }));
        const { error: boletosError } = await supabase.from('boletos').insert(boletoRows);

        if (boletosError) {
          setAdminMessage(`Aluno criado, mas houve um erro ao gerar os boletos: ${boletosError.message}`);
        } else {
          setAdminMessage(`Aluno criado! Email: ${newStudent.email} · Senha provisória: Aluno@IFSP2026`);
        }
        await loadAllStudents();
      }
    } else {
      const student: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: newStudent.name,
        email: newStudent.email,
        role: UserRole.STUDENT,
        courseId: ADS_COURSE.id,
        currentSemester: newStudent.semester,
        status: 'active',
        boletos: [
          { id: 'b-new-1', description: 'Matrícula', value: 0, dueDate: '2026-04-10', status: 'pending' },
          { id: 'b-new-2', description: 'Mensalidade - Maio', value: 0, dueDate: '2026-05-10', status: 'pending' },
        ],
      };
      setAllUsers(prev => [...prev, student]);
      setAdminMessage(`Aluno ${newStudent.name} cadastrado com sucesso!`);
    }
    setNewStudent({ name: '', email: '', semester: 1 });
  };

  const toggleBoletoStatus = async (studentId: string, boletoId: string) => {
    const source = user?.id === studentId ? user.boletos : allUsers.find(u => u.id === studentId)?.boletos;
    const current = source?.find(b => b.id === boletoId);
    if (!current) return;
    const newStatus: 'paid' | 'pending' = current.status === 'paid' ? 'pending' : 'paid';

    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === studentId && u.boletos) {
          return { ...u, boletos: u.boletos.map(b => (b.id === boletoId ? { ...b, status: newStatus } : b)) };
        }
        return u;
      })
    );
    if (user?.id === studentId) {
      setUser(prev => {
        if (!prev?.boletos) return prev;
        return { ...prev, boletos: prev.boletos.map(b => (b.id === boletoId ? { ...b, status: newStatus } : b)) };
      });
    }
    if (supabaseConfigured) {
      await supabase
        .from('boletos')
        .update({ status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null })
        .eq('id', boletoId);
    }
  };

  // ─── Documents ──────────────────────────────────────────────
  // Apenas o admin envia/exclui documentos. O aluno só visualiza e baixa os seus.

  const uploadDocumentFor = async (studentId: string, type: Document['type'], file: File): Promise<Document> => {
    const path = `${studentId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documentos').upload(path, file);
    if (uploadError) throw uploadError;
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert({
        student_id: studentId,
        type,
        name: file.name,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();
    if (dbError) throw dbError;
    return {
      id: dbData.id,
      type: dbData.type,
      name: dbData.name,
      storagePath: dbData.storage_path,
      fileSize: dbData.file_size,
      mimeType: dbData.mime_type,
      createdAt: dbData.created_at,
    };
  };

  const deleteDocumentRecord = async (doc: Document) => {
    await supabase.storage.from('documentos').remove([doc.storagePath]);
    await supabase.from('documents').delete().eq('id', doc.id);
  };

  const handleSelectStudentForDocs = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setStudentDocs(studentId && supabaseConfigured ? await fetchDocumentsFor(studentId) : []);
  };

  const handleAdminDocUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedStudentId) return;
      setAdminDocUploading(true);
      try {
        if (supabaseConfigured) {
          const doc = await uploadDocumentFor(selectedStudentId, adminDocType, file);
          setStudentDocs(prev => [doc, ...prev]);
          setAdminMessage(`Documento "${file.name}" enviado com sucesso.`);
        }
      } catch (err: any) {
        setAdminMessage('Erro ao enviar documento: ' + err.message);
      }
      setAdminDocUploading(false);
      e.target.value = '';
    },
    [selectedStudentId, adminDocType]
  );

  const handleAdminDocDelete = async () => {
    if (!docToDelete) return;
    if (supabaseConfigured) await deleteDocumentRecord(docToDelete);
    setStudentDocs(prev => prev.filter(d => d.id !== docToDelete.id));
    setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
    setDocToDelete(null);
  };

  const handleDocDownload = async (doc: Document) => {
    if (doc.previewUrl) {
      const a = document.createElement('a');
      a.href = doc.previewUrl;
      a.download = doc.name;
      a.click();
      return;
    }
    if (!supabaseConfigured) return;
    setDocError('');
    const { data, error } = await supabase.storage.from('documentos').createSignedUrl(doc.storagePath, 60);
    if (error || !data?.signedUrl) {
      setDocError('Erro ao baixar documento: ' + (error?.message ?? 'link indisponível.'));
      return;
    }
    // Usar um <a> clicado programaticamente em vez de window.open — o navegador
    // bloqueia popups abertos depois de um await, mesmo vindo de um clique real.
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = doc.name;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── Settings ────────────────────────────────────────────────

  const saveSettings = async () => {
    if (!user) return;
    if (supabaseConfigured) {
      await supabase.from('settings').upsert({
        student_id: user.id,
        notify_boletos: settings.notifyBoletos,
        notify_grades: settings.notifyGrades,
        notify_announcements: settings.notifyAnnouncements,
        email_digest: settings.emailDigest,
        language: settings.language,
        accessibility_font: settings.accessibilityFont,
      });
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // ─── Computed ────────────────────────────────────────────────

  const studentSubjects = useMemo(() => {
    if (!user || user.role !== UserRole.STUDENT) return [];
    return generateStudentSubjects(ADS_COURSE, user.currentSemester ?? 1, user.id);
  }, [user?.id, user?.role, user?.currentSemester]);

  const currentSemesterSubjects = studentSubjects.filter(s => s.semester === user?.currentSemester);
  const concludedSubjects = studentSubjects.filter(s => s.status === 'concluded');
  const progress = studentSubjects.length > 0 ? (concludedSubjects.length / studentSubjects.length) * 100 : 0;
  const pendingBoletos = user?.boletos?.filter(b => b.status === 'pending').length ?? 0;

  // ─── Navigation ──────────────────────────────────────────────

  const nav = (tab: string) => { setActiveTab(tab); setIsSidebarOpen(false); };

  // ─── Login Screen ────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f0f0]">
        <div className="gov-top-bar px-4 py-1 flex justify-between items-center text-[11px]">
          <div className="flex gap-4">
            <span className="font-black">BRASIL</span>
            <span className="opacity-70">Simplifique!</span>
          </div>
          <div className="flex gap-4">
            <span>Acesso à informação</span>
            <span>Legislação</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Card */}
            <div className="bg-white shadow-lg border-t-4 border-ifsp-green">
              <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
                <div className="flex justify-center mb-4">
                  <img src="/ifsp-logo.svg" alt="IFSP" className="h-20 w-auto" />
                </div>
                <h1 className="text-lg font-black text-gray-800 uppercase tracking-wide">Portal de Sistemas</h1>
                <p className="text-gray-500 text-sm mt-1">Instituto Federal de São Paulo</p>
              </div>

              <form onSubmit={handleLogin} className="px-8 py-6 space-y-4">
                {!supabaseConfigured && (
                  <div className="bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex gap-2 items-start">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Modo demonstração — sem banco de dados.{' '}
                      <strong>aluno@ifsp.edu.br</strong> ou <strong>admin@ifsp.edu.br</strong> (qualquer senha).
                    </span>
                  </div>
                )}
                {loginError && (
                  <div className="bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {loginError}
                  </div>
                )}
                {resetMessage && (
                  <div className="bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                    {resetMessage}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-ifsp-green outline-none text-sm"
                    placeholder="seu.email@ifsp.edu.br"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Senha</label>
                    <button
                      type="button"
                      onClick={() => handleForgotPassword(email)}
                      className="text-[11px] font-bold text-ifsp-green hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:border-ifsp-green outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-ifsp-green text-white font-bold py-2.5 hover:bg-ifsp-green-dark transition-colors disabled:opacity-60 text-sm uppercase tracking-wider"
                >
                  {loginLoading ? 'Autenticando...' : 'Entrar'}
                </button>
              </form>
            </div>

            <p className="text-center text-[11px] text-gray-400 mt-4">
              Portal Acadêmico IFSP · {new Date().getFullYear()} · Uso exclusivo institucional
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── App Shell ───────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Gov Top Bar */}
      <div className="gov-top-bar px-4 py-1 flex justify-between items-center shrink-0 text-[10px] sm:text-[11px]">
        <div className="flex gap-2 sm:gap-4">
          <span className="font-black">BRASIL</span>
          <span className="opacity-70 hidden xs:block">Simplifique!</span>
          <span className="opacity-70 hidden sm:block">Comunica BR</span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <span className="hidden xs:block">ACESSO À INFORMAÇÃO</span>
          <span className="hidden sm:block">LEGISLAÇÃO</span>
          <span>CANAIS</span>
        </div>
      </div>

      {/* Institutional Header */}
      <header className="institutional-header text-white px-4 py-4 md:px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 hover:bg-white/10 border border-white/20"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="bg-white p-1.5 md:p-2 shrink-0">
              <img src="/ifsp-logo.svg" alt="IFSP" className="h-8 md:h-11 w-auto" />
            </div>
            <div>
              <p className="text-[10px] opacity-80 hidden sm:block">
                Instituto Federal de Educação, Ciência e Tecnologia de São Paulo
              </p>
              <h1 className="text-base md:text-2xl font-black leading-tight">Instituto Federal de São Paulo</h1>
              <p className="text-[10px] font-bold opacity-80">MINISTÉRIO DA EDUCAÇÃO</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold">{user.name}</span>
              <span className="text-[10px] opacity-75 uppercase tracking-wider">
                {user.role === UserRole.ADMIN ? 'Administrador' : `Matrícula: ${user.registration ?? '—'}`}
              </span>
            </div>
            {user.avatar && (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-8 h-8 object-cover border-2 border-white/30 hidden sm:block"
              />
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 border border-white/20 transition-colors text-xs font-bold"
              title="Sair"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">SAIR</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-menu */}
      <div className="bg-[#004d2e] text-white text-[11px] font-bold uppercase shrink-0">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {['Cursos', 'Unidades', 'Estude Aqui', 'Contatos', 'IFSP na Mídia', 'Internacional', 'Comunicação'].map(
            item => (
              <span key={item} className="px-4 py-2 hover:bg-white/10 cursor-pointer whitespace-nowrap">
                {item}
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 w-60 border-r border-gray-200 bg-white z-40 shrink-0 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* User mini card */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between lg:hidden mb-3">
              <span className="font-bold text-ifsp-green text-xs uppercase tracking-wider">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=006b3f&color=fff&size=64`}
                alt="avatar"
                className="w-10 h-10 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {user.role === UserRole.ADMIN ? 'Admin' : `${user.currentSemester}º Semestre`}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-2 overflow-y-auto">
            <p className="px-4 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Principal</p>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => nav('dashboard')} />

            {user.role === UserRole.STUDENT ? (
              <>
                <SidebarItem icon={BookOpen} label="Disciplinas" active={activeTab === 'subjects'} onClick={() => nav('subjects')} />
                <SidebarItem icon={CreditCard} label="Financeiro" active={activeTab === 'financial'} onClick={() => nav('financial')} badge={pendingBoletos} />
                <SidebarItem icon={FolderOpen} label="Meus Documentos" active={activeTab === 'documents'} onClick={() => nav('documents')} />
              </>
            ) : (
              <SidebarItem icon={Users} label="Gestão de Alunos" active={activeTab === 'admin'} onClick={() => nav('admin')} />
            )}

            <div className="my-2 border-t border-gray-100" />
            <p className="px-4 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Conta</p>
            <SidebarItem icon={UserIcon} label="Meu Perfil" active={activeTab === 'profile'} onClick={() => nav('profile')} />
            {user.role === UserRole.STUDENT && (
              <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => nav('settings')} />
            )}

            <div className="my-2 border-t border-gray-100" />
            <p className="px-4 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">IFSP</p>
            {['Campi', 'Reitoria', 'Administração', 'Ensino e Políticas', 'Extensão e Cultura'].map(item => (
              <div key={item} className="px-4 py-1.5 text-xs text-gray-500 hover:text-ifsp-green cursor-pointer border-l-4 border-transparent hover:border-gray-200 transition-all">
                {item}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors border border-red-100"
            >
              <LogOut size={14} />
              SAIR DO SISTEMA
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-5 md:p-6">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Portal</span>
              <ChevronRight size={12} />
              <span className="font-bold text-gray-700 uppercase">
                {activeTab === 'dashboard' && 'Página Inicial'}
                {activeTab === 'subjects' && 'Disciplinas'}
                {activeTab === 'financial' && 'Financeiro'}
                {activeTab === 'documents' && 'Meus Documentos'}
                {activeTab === 'admin' && 'Administração'}
                {activeTab === 'profile' && 'Meu Perfil'}
                {activeTab === 'settings' && 'Configurações'}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-800">Bem-vindo, {user.name.split(' ')[0]}!</h2>
                    <p className="text-gray-400 text-sm">Confira o resumo das suas atividades acadêmicas.</p>
                  </div>
                  {user.role === UserRole.STUDENT && (
                    <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                      {user.status === 'active' ? 'Matrícula Ativa' : 'Inativo'}
                    </Badge>
                  )}
                </div>

                {user.role === UserRole.STUDENT ? (
                  <>
                    {/* Stat row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard label="Semestre Atual" value={`${user.currentSemester}º`} icon={Calendar} color="green" />
                      <StatCard label="Progresso" value={`${Math.round(progress)}%`} icon={TrendingUp} color="blue" />
                      <StatCard label="Disciplinas" value={studentSubjects.length} icon={BookOpen} color="amber" sub="no currículo" />
                      <StatCard label="Boletos Pendentes" value={pendingBoletos} icon={CreditCard} color={pendingBoletos > 0 ? 'red' : 'green'} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <Card title="Curso Atual" icon={GraduationCap}>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Curso</p>
                            <p className="font-bold text-gray-800 text-sm">{ADS_COURSE.name}</p>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Progresso do Curso</p>
                              <span className="text-xs font-black text-ifsp-green">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="bg-ifsp-green h-full"
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{concludedSubjects.length} de {studentSubjects.length} disciplinas concluídas</p>
                          </div>
                        </div>
                      </Card>

                      <Card title="Disciplinas do Semestre" icon={BookOpen}>
                        <div className="space-y-2">
                          {currentSemesterSubjects.map(s => (
                            <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                              <span className="text-sm text-gray-700">{s.name}</span>
                              <Badge variant={s.status === 'concluded' ? 'success' : 'warning'}>
                                {s.status === 'concluded' ? 'Concluída' : 'Em Curso'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card title="Situação Financeira" icon={CreditCard}>
                        <div className="space-y-3">
                          {user.boletos?.slice(0, 3).map(b => (
                            <div key={b.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{b.description}</p>
                                <p className="text-[10px] text-gray-400">Vence: {new Date(b.dueDate).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <Badge variant={b.status === 'paid' ? 'success' : 'danger'}>
                                {b.status === 'paid' ? 'Pago' : 'Pendente'}
                              </Badge>
                            </div>
                          ))}
                          <button onClick={() => nav('financial')} className="w-full text-center text-xs text-ifsp-green font-bold hover:underline pt-1">
                            Ver todos →
                          </button>
                        </div>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <Card title="Últimas Notas" icon={CheckCircle2}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase">Disciplina</th>
                                <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase">Nota</th>
                                <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase">Freq.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {concludedSubjects.slice(-5).map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                  <td className="py-2.5 text-gray-700 font-medium">{s.name}</td>
                                  <td className="py-2.5">
                                    <span className={`font-black text-base ${s.grade! >= 6 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {s.grade?.toFixed(1)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-gray-500 text-xs">{s.attendance}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>

                      <Card title="Avisos Institucionais" icon={Bell}>
                        <div className="space-y-3">
                          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100">
                            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                            <div>
                              <p className="text-sm font-bold text-blue-800">Renovação de Matrícula</p>
                              <p className="text-xs text-blue-600 mt-0.5">Prazo para renovação inicia em 15/05. Acesse o setor acadêmico.</p>
                            </div>
                          </div>
                          <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100">
                            <Clock className="text-amber-600 shrink-0 mt-0.5" size={16} />
                            <div>
                              <p className="text-sm font-bold text-amber-800">Horário de Atendimento</p>
                              <p className="text-xs text-amber-600 mt-0.5">Secretaria em horário especial durante o feriado de 01/06.</p>
                            </div>
                          </div>
                          <div className="flex gap-3 p-3 bg-emerald-50 border border-emerald-100">
                            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                            <div>
                              <p className="text-sm font-bold text-emerald-800">Carteirinha Digital</p>
                              <p className="text-xs text-emerald-600 mt-0.5">Sua carteirinha estudantil já está disponível em Meus Documentos.</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </>
                ) : (
                  // Admin dashboard
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard label="Total de Alunos" value={allUsers.filter(u => u.role === UserRole.STUDENT).length} icon={Users} color="green" sub="matriculados" />
                    <StatCard label="Cursos Ativos" value={1} icon={GraduationCap} color="blue" sub="ADS" />
                    <StatCard
                      label="Boletos Pendentes"
                      value={allUsers.reduce((acc, u) => acc + (u.boletos?.filter(b => b.status === 'pending').length ?? 0), 0)}
                      icon={CreditCard}
                      color="red"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* ── DISCIPLINAS ── */}
            {activeTab === 'subjects' && (
              <motion.div key="subjects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Grade Curricular</h2>
                  <p className="text-sm text-gray-400">{ADS_COURSE.name} · {ADS_COURSE.totalSemesters} semestres</p>
                </div>
                {[1, 2, 3, 4, 5, 6].map(sem => (
                  <Card key={sem} title={`${sem}º Semestre`} icon={BookOpen}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase">Disciplina</th>
                            <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                            <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase">Nota</th>
                            <th className="pb-2.5 text-[10px] font-bold text-gray-400 uppercase">Freq.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {studentSubjects.filter(s => s.semester === sem).map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="py-3 font-medium text-gray-700">{s.name}</td>
                              <td className="py-3">
                                <Badge variant={s.status === 'concluded' ? 'success' : s.status === 'in_progress' ? 'warning' : 'default'}>
                                  {s.status === 'concluded' ? 'Concluída' : s.status === 'in_progress' ? 'Em Curso' : 'Pendente'}
                                </Badge>
                              </td>
                              <td className="py-3">
                                {s.status === 'concluded' ? (
                                  <span className={`font-black ${s.grade! >= 6 ? 'text-emerald-600' : 'text-red-500'}`}>{s.grade?.toFixed(1)}</span>
                                ) : '—'}
                              </td>
                              <td className="py-3 text-gray-500 text-xs">{s.status === 'concluded' ? `${s.attendance}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* ── FINANCEIRO ── */}
            {activeTab === 'financial' && (
              <motion.div key="financial" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <h2 className="text-xl font-black text-gray-800">Financeiro</h2>
                <Card title="Boletos e Pagamentos" icon={CreditCard}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Descrição</th>
                          <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Vencimento</th>
                          <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Valor</th>
                          <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                          <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {user.boletos?.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="py-3.5 font-medium text-gray-700">{b.description}</td>
                            <td className="py-3.5 text-gray-500 text-xs">{new Date(b.dueDate).toLocaleDateString('pt-BR')}</td>
                            <td className="py-3.5 font-bold text-gray-800">R$ {b.value.toFixed(2)}</td>
                            <td className="py-3.5">
                              <Badge variant={b.status === 'paid' ? 'success' : 'danger'}>
                                {b.status === 'paid' ? 'Pago' : 'Pendente'}
                              </Badge>
                            </td>
                            <td className="py-3.5 text-right space-x-2">
                              {b.status === 'pending' && (
                                <button
                                  onClick={() => toggleBoletoStatus(user.id, b.id)}
                                  className="text-xs bg-ifsp-green text-white px-3 py-1.5 font-bold hover:bg-ifsp-green-dark transition-colors"
                                >
                                  Pagar
                                </button>
                              )}
                              <button
                                onClick={() => handleBoletoReceipt(b)}
                                className="text-gray-400 hover:text-ifsp-green p-1 hover:bg-gray-100 transition-all inline-flex"
                                title="Baixar comprovante"
                              >
                                <Download size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div className="bg-blue-50 border border-blue-100 p-4 flex gap-3">
                  <FileText className="text-blue-400 shrink-0" size={18} />
                  <p className="text-sm text-blue-700">
                    Os boletos são gerados mensalmente. Em caso de divergência, contate{' '}
                    <strong>financeiro@ifsp.edu.br</strong>.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── DOCUMENTOS ── */}
            {activeTab === 'documents' && user.role === UserRole.STUDENT && (
              <motion.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Meus Documentos</h2>
                  <p className="text-sm text-gray-400">Documentos disponibilizados pela secretaria acadêmica.</p>
                </div>

                {docError && (
                  <div className="bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start justify-between gap-2">
                    <span>{docError}</span>
                    <button onClick={() => setDocError('')} className="shrink-0 opacity-60 hover:opacity-100"><X size={12} /></button>
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 bg-white">
                    <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-bold text-sm">Nenhum documento disponível</p>
                    <p className="text-xs mt-1">Sua carteirinha, histórico e declarações aparecerão aqui assim que a secretaria os disponibilizar.</p>
                  </div>
                ) : (
                  <Card title={`Documentos Disponíveis (${documents.length})`} icon={FolderOpen}>
                    <div className="space-y-3">
                      {documents.map(doc => {
                        const meta = DOC_TYPES[doc.type];
                        const Icon = meta.icon;
                        return (
                          <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                            <div className={`p-2 bg-gray-50 ${meta.color}`}>
                              <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{doc.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {meta.label} · {doc.fileSize ? formatBytes(doc.fileSize) : '—'} ·{' '}
                                {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDocDownload(doc)}
                              className="p-1.5 text-gray-400 hover:text-ifsp-green hover:bg-green-50 transition-colors shrink-0"
                              title="Baixar"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <div className="bg-gray-50 border border-gray-200 p-4 flex gap-3">
                  <Shield className="text-gray-400 shrink-0" size={16} />
                  <p className="text-xs text-gray-500">
                    Documentos oficiais como carteirinha, histórico escolar e declarações são emitidos e enviados exclusivamente pela secretaria acadêmica. Só você tem acesso aos seus arquivos.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── CONFIGURAÇÕES ── */}
            {activeTab === 'settings' && user.role === UserRole.STUDENT && (
              <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5 max-w-2xl">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Configurações</h2>
                  <p className="text-sm text-gray-400">Personalize sua experiência no portal.</p>
                </div>

                <Card title="Notificações" icon={Bell}>
                  <div className="space-y-4">
                    {[
                      { key: 'notifyBoletos', label: 'Boletos e Pagamentos', desc: 'Receba alertas sobre vencimentos e confirmações de pagamento' },
                      { key: 'notifyGrades', label: 'Notas e Resultados', desc: 'Seja notificado quando novas notas forem lançadas' },
                      { key: 'notifyAnnouncements', label: 'Avisos Institucionais', desc: 'Comunicados, eventos e prazos importantes' },
                      { key: 'emailDigest', label: 'Resumo por E-mail', desc: 'Receba um resumo semanal das suas atividades' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-gray-700">{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                        <Toggle
                          checked={settings[key as keyof StudentSettings] as boolean}
                          onChange={v => setSettings(prev => ({ ...prev, [key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Idioma e Acessibilidade" icon={Globe}>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Idioma do Portal</label>
                      <select
                        value={settings.language}
                        onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full sm:w-64 px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green bg-white text-sm"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <div>
                        <p className="text-sm font-bold text-gray-700">Fonte Acessível</p>
                        <p className="text-xs text-gray-400">Aumenta o espaçamento e legibilidade do texto</p>
                      </div>
                      <Toggle
                        checked={settings.accessibilityFont}
                        onChange={v => setSettings(prev => ({ ...prev, accessibilityFont: v }))}
                      />
                    </div>
                  </div>
                </Card>

                <Card title="Segurança" icon={Lock}>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Enviaremos um link de redefinição de senha para o seu e-mail institucional.</p>
                    <button
                      onClick={() => handleForgotPassword(user.email)}
                      className="text-sm font-bold text-ifsp-green hover:underline"
                    >
                      Solicitar redefinição de senha →
                    </button>
                    {resetMessage && <p className="text-xs text-emerald-600 font-bold">{resetMessage}</p>}
                  </div>
                </Card>

                <div className="flex items-center gap-3">
                  <button
                    onClick={saveSettings}
                    className="px-6 py-2.5 bg-ifsp-green text-white font-bold text-sm hover:bg-ifsp-green-dark transition-colors"
                  >
                    Salvar Configurações
                  </button>
                  <AnimatePresence>
                    {settingsSaved && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-emerald-600 font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={16} /> Salvo!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── ADMIN ── */}
            {activeTab === 'admin' && user.role === UserRole.ADMIN && (
              <motion.div key="admin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Administração</h2>
                  <p className="text-sm text-gray-400">Gerencie alunos e dados do sistema.</p>
                </div>

                {supabaseConfigured && (
                  <div className="bg-amber-50 border border-amber-200 p-4 flex gap-3 text-sm">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800">Senha provisória</p>
                      <p className="text-amber-700 text-xs mt-0.5">
                        Alunos cadastrados recebem a senha provisória <strong>Aluno@IFSP2026</strong> e devem alterá-la no primeiro acesso.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-1">
                    <Card title="Cadastrar Novo Aluno" icon={PlusCircle}>
                      <form onSubmit={handleAddStudent} className="space-y-4">
                        {[
                          { label: 'Nome Completo', type: 'text', key: 'name', value: newStudent.name },
                          { label: 'E-mail Institucional', type: 'email', key: 'email', value: newStudent.email },
                        ].map(({ label, type, key, value }) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
                            <input
                              type={type}
                              required
                              value={value}
                              onChange={e => setNewStudent({ ...newStudent, [key]: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green text-sm"
                            />
                          </div>
                        ))}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Curso</label>
                          <select className="w-full px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green bg-white text-sm">
                            <option>{ADS_COURSE.name}</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Semestre</label>
                          <input
                            type="number" min="1" max="6"
                            value={newStudent.semester}
                            onChange={e => setNewStudent({ ...newStudent, semester: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green text-sm"
                          />
                        </div>
                        <button type="submit" className="w-full bg-ifsp-green text-white font-bold py-2.5 hover:bg-ifsp-green-dark transition-colors text-sm">
                          Cadastrar Aluno
                        </button>
                      </form>
                      <AnimatePresence>
                        {adminMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mt-3 p-3 text-xs font-bold border ${adminMessage.startsWith('Erro') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} flex items-start gap-2`}
                          >
                            {adminMessage.startsWith('Erro') ? <AlertCircle size={14} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
                            <span>{adminMessage}</span>
                            <button onClick={() => setAdminMessage('')} className="ml-auto shrink-0 opacity-60 hover:opacity-100"><X size={12} /></button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </div>

                  <div className="lg:col-span-2">
                    <Card
                      title={`Lista de Alunos (${allUsers.filter(u => u.role === UserRole.STUDENT).length})`}
                      icon={Users}
                      action={
                        supabaseConfigured && (
                          <button
                            onClick={() => loadAllStudents()}
                            className="text-[10px] font-bold text-gray-400 hover:text-ifsp-green uppercase tracking-wider"
                          >
                            Atualizar
                          </button>
                        )
                      }
                    >
                      {allUsers.filter(u => u.role === UserRole.STUDENT).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Nenhum aluno cadastrado ainda.</p>
                      ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Aluno</th>
                              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Semestre</th>
                              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                              <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase">Financeiro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {allUsers.filter(u => u.role === UserRole.STUDENT).map(u => (
                              <tr key={u.id} className="hover:bg-gray-50">
                                <td className="py-3.5">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=32&background=e5e7eb&color=374151`}
                                      className="w-7 h-7 object-cover shrink-0"
                                      alt=""
                                    />
                                    <div>
                                      <p className="font-bold text-gray-800 text-xs">{u.name}</p>
                                      <p className="text-[10px] text-gray-400">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 text-gray-600 text-xs">{u.currentSemester}º</td>
                                <td className="py-3.5">
                                  <Badge variant={u.status === 'active' ? 'success' : 'danger'}>
                                    {u.status === 'active' ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </td>
                                <td className="py-3.5">
                                  <div className="flex gap-1">
                                    {u.boletos?.map(b => (
                                      <div
                                        key={b.id}
                                        onClick={() => toggleBoletoStatus(u.id, b.id)}
                                        className={`w-2.5 h-2.5 cursor-pointer title-fix ${b.status === 'paid' ? 'bg-emerald-400' : 'bg-red-400'}`}
                                        title={`${b.description}: ${b.status === 'paid' ? 'Pago' : 'Pendente'}`}
                                      />
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </Card>
                  </div>
                </div>

                <Card title="Documentos dos Alunos" icon={FolderOpen}>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end mb-5">
                    <div className="space-y-1 flex-1 w-full">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Aluno</label>
                      <select
                        value={selectedStudentId}
                        onChange={e => handleSelectStudentForDocs(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green bg-white text-sm"
                      >
                        <option value="">Selecione um aluno...</option>
                        {allUsers.filter(u => u.role === UserRole.STUDENT).map(u => (
                          <option key={u.id} value={u.id}>{u.name} {u.registration ? `— ${u.registration}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tipo</label>
                      <select
                        value={adminDocType}
                        onChange={e => setAdminDocType(e.target.value as Document['type'])}
                        disabled={!selectedStudentId}
                        className="w-full px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green bg-white text-sm disabled:opacity-50"
                      >
                        <option value="carteirinha">Carteirinha Estudantil</option>
                        <option value="historico">Histórico Escolar</option>
                        <option value="declaracao">Declaração de Matrícula</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    <label className={`cursor-pointer flex items-center gap-2 px-5 py-2 font-bold text-sm border transition-colors shrink-0 ${
                      !selectedStudentId || adminDocUploading
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-ifsp-green text-white border-ifsp-green hover:bg-ifsp-green-dark'
                    }`}>
                      {adminDocUploading ? (
                        <><Clock size={15} className="animate-spin" /> Enviando...</>
                      ) : (
                        <><Upload size={15} /> Enviar Arquivo</>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                        onChange={handleAdminDocUpload}
                        disabled={!selectedStudentId || adminDocUploading}
                      />
                    </label>
                  </div>

                  {!selectedStudentId ? (
                    <p className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200">
                      Selecione um aluno para visualizar e gerenciar seus documentos.
                    </p>
                  ) : studentDocs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200">
                      Nenhum documento enviado para este aluno ainda.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {studentDocs.map(doc => {
                        const meta = DOC_TYPES[doc.type];
                        const Icon = meta.icon;
                        return (
                          <div key={doc.id} className="flex items-center gap-4 p-3 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                            <div className={`p-2 bg-gray-50 ${meta.color}`}>
                              <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{doc.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {meta.label} · {doc.fileSize ? formatBytes(doc.fileSize) : '—'} ·{' '}
                                {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => handleDocDownload(doc)}
                                className="p-1.5 text-gray-400 hover:text-ifsp-green hover:bg-green-50 transition-colors"
                                title="Baixar"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() => setDocToDelete(doc)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── PERFIL ── */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl space-y-5">
                <h2 className="text-xl font-black text-gray-800">Meu Perfil</h2>

                <Card title="Dados do Usuário" icon={UserIcon}>
                  {!isEditingProfile ? (
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex flex-col items-center gap-3 shrink-0">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=128&background=006b3f&color=fff`}
                          alt="Avatar"
                          className="w-28 h-28 object-cover border-4 border-gray-100"
                        />
                        <div className="text-center">
                          <p className="text-xs font-black text-gray-800">{user.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase">{user.role === UserRole.ADMIN ? 'Administrador' : 'Aluno'}</p>
                        </div>
                        <button onClick={startEditing} className="text-xs bg-ifsp-green text-white px-4 py-1.5 font-bold hover:bg-ifsp-green-dark">
                          EDITAR PERFIL
                        </button>
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Nome Completo', value: user.name },
                          { label: 'E-mail', value: user.email },
                          { label: 'Matrícula', value: user.registration || '—' },
                          { label: 'CPF', value: user.cpf || '—' },
                          { label: 'Nascimento', value: user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : '—' },
                          { label: 'Telefone', value: user.phone || '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="border-b border-gray-50 pb-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-sm font-bold text-gray-800">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row gap-5 items-start">
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <img
                            src={editForm.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(editForm.name || 'U')}&size=128&background=006b3f&color=fff`}
                            alt="Preview"
                            className="w-24 h-24 object-cover border-4 border-gray-100"
                          />
                          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 flex items-center gap-1.5 border border-gray-200">
                            <Upload size={12} />
                            CARREGAR FOTO
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                        </div>
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-[11px] font-bold text-gray-500 uppercase">URL da Foto</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={editForm.avatar || ''}
                            onChange={e => setEditForm({ ...editForm, avatar: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Nome Completo', key: 'name', type: 'text' },
                          { label: 'E-mail', key: 'email', type: 'email' },
                          { label: 'Matrícula', key: 'registration', type: 'text' },
                          { label: 'CPF', key: 'cpf', type: 'text' },
                          { label: 'Nascimento', key: 'birthDate', type: 'date' },
                          { label: 'Telefone', key: 'phone', type: 'text' },
                        ].map(({ label, key, type }) => (
                          <div key={key} className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
                            <input
                              type={type}
                              value={(editForm as any)[key] || ''}
                              onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 outline-none focus:border-ifsp-green text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                        <button onClick={() => setIsEditingProfile(false)} className="px-5 py-2 border border-gray-300 font-bold text-sm text-gray-600 hover:bg-gray-50">
                          CANCELAR
                        </button>
                        <button onClick={saveProfile} className="px-5 py-2 bg-ifsp-green text-white font-bold text-sm hover:bg-ifsp-green-dark">
                          SALVAR
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <ConfirmDialog
        open={!!docToDelete}
        title="Excluir documento"
        message={docToDelete ? `Tem certeza que deseja excluir "${docToDelete.name}"? Esta ação não pode ser desfeita.` : ''}
        onConfirm={handleAdminDocDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
}
