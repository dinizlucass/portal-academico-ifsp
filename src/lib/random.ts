import { Boleto, Course, Subject } from '../types';

// PRNG determinístico (mulberry32) — mesma seed sempre gera a mesma sequência,
// então os dados "aleatórios" de um aluno permanecem estáveis entre recarregamentos.
export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function generateStudentSubjects(course: Course, currentSemester: number, seed: string): Subject[] {
  const rand = seededRandom(seed);
  return course.subjects.map(s => {
    if (s.semester < currentSemester) {
      const grade = Math.round((5 + rand() * 5) * 10) / 10;
      const attendance = Math.round(70 + rand() * 30);
      return { ...s, status: 'concluded' as const, grade, attendance };
    }
    if (s.semester === currentSemester) {
      const attendance = Math.round(75 + rand() * 25);
      return { ...s, status: 'in_progress' as const, grade: undefined, attendance };
    }
    return { ...s, status: 'pending' as const, grade: undefined, attendance: undefined };
  });
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function generateBoletos(seed: string): Omit<Boleto, 'id'>[] {
  const rand = seededRandom(seed);
  const now = new Date();
  const items: Omit<Boleto, 'id'>[] = [
    {
      description: 'Taxa de Matrícula',
      value: 0,
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString().slice(0, 10),
      status: 'paid',
    },
  ];
  for (let i = -2; i <= 2; i++) {
    const due = new Date(now.getFullYear(), now.getMonth() + i, 10);
    const value = Math.round((110 + rand() * 90) * 100) / 100;
    const isPast = due < now;
    const status: 'paid' | 'pending' = isPast ? (rand() > 0.12 ? 'paid' : 'pending') : 'pending';
    items.push({
      description: `Mensalidade - ${MONTHS[due.getMonth()]}`,
      value,
      dueDate: due.toISOString().slice(0, 10),
      status,
    });
  }
  return items;
}
