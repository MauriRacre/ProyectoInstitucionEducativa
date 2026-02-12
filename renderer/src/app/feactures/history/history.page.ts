import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TxType = 'PAYMENT' | 'DISCOUNT' | 'REVERSAL';
type TabKey = 'transacciones' | 'estadisticas' | 'nomina';

type Grade = '1er' | '2do' | '3ro' | '4to';
type Parallel = 'A' | 'B' | 'C';

export interface StudentRow {
  id: number;
  name: string;
  tutorName: string;
  tutorPhone: string;
  tutorEmail: string;
  grade: Grade;
  parallel: Parallel;
}

interface TransactionRow {
  id: number;
  dateISO: string;
  time: string;
  type: TxType;
  staff: string;
  tutor: string;
  student: string;
  grade: string;
  parallel: string;
  concept: string;
  note?: string;
  amount: number;
}

interface Filters {
  q: string;
  from: string;
  to: string;
  concept: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history.page.html',
})
export class HistoryPage {
  // =========================
  // TABS
  // =========================
  selectedTab: TabKey = 'transacciones';

  setTab(tab: TabKey) {
    this.selectedTab = tab;

    // reset paginación de transacciones al cambiar tab
    this.page = 1;

    // si entran a nómina, recalcula sus páginas visibles
    if (tab === 'nomina') this.refreshNominaPagination();
  }

  // =========================
  // TRANSACCIONES: DATA
  // =========================
  transacciones: TransactionRow[] = [
    {
      id: 1,
      dateISO: '2026-02-16',
      time: '10:25',
      type: 'PAYMENT',
      staff: 'Admin 1',
      tutor: 'Roberto Alvarado',
      student: 'Juana Alvarado',
      grade: '3ro',
      parallel: 'A',
      concept: 'Mensualidad Febrero',
      note: 'Pago parcial',
      amount: 200,
    },
    {
      id: 2,
      dateISO: '2026-02-16',
      time: '10:25',
      type: 'DISCOUNT',
      staff: 'Admin 1',
      tutor: 'Roberto Alvarado',
      student: 'Juana Alvarado',
      grade: '3ro',
      parallel: 'A',
      concept: 'Mensualidad Febrero',
      note: 'Descuento aplicado',
      amount: 10,
    },
    {
      id: 3,
      dateISO: '2026-02-05',
      time: '09:12',
      type: 'PAYMENT',
      staff: 'Caja',
      tutor: 'Roberto Alvarado',
      student: 'Lucas Alvarado',
      grade: '1er',
      parallel: 'B',
      concept: 'Transporte',
      amount: 80,
    },
    {
      id: 4,
      dateISO: '2026-02-06',
      time: '11:40',
      type: 'REVERSAL',
      staff: 'Admin 2',
      tutor: 'María Perez',
      student: 'Sofia Perez',
      grade: '2do',
      parallel: 'C',
      concept: 'Mensualidad Febrero',
      note: 'Reverso por error',
      amount: 120,
    },
  ];

  concepts: string[] = [];

  // =========================
  // TRANSACCIONES: FILTROS + LISTAS
  // =========================
  filters: Filters = { q: '', from: '', to: '', concept: '' };

  filtered: TransactionRow[] = [];
  paged: TransactionRow[] = [];

  // =========================
  // TRANSACCIONES: PAGINACIÓN
  // =========================
  page = 1;
  pageSize = 10;
  totalPages = 1;
  visiblePages: (number | '...')[] = [];

  get pageStart() {
    return (this.page - 1) * this.pageSize;
  }

  get pageEnd() {
    return Math.min(this.pageStart + this.pageSize, this.filtered.length);
  }

  // =========================
  // KPIs
  // =========================
  kpis = {
    totalIncome: 0,
    monthIncome: 0,
    totalDiscounts: 0,
    totalReversals: 0,
  };

  // =========================
  // INIT
  // =========================
  constructor() {
    this.concepts = this.buildConcepts();
    this.applyFilters();
    this.refreshNominaPagination(); // por si abren directo nómina luego
  }

  // =========================
  // TRANSACCIONES: UI HELPERS
  // =========================
  trackById = (_: number, x: TransactionRow) => x.id;

  formatDate(dateISO: string): string {
    const d = new Date(dateISO + 'T00:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  typeLabel(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'Pago';
      case 'DISCOUNT': return 'Descuento';
      case 'REVERSAL': return 'Reverso';
    }
  }

  typePillClass(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'DISCOUNT': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'REVERSAL': return 'border-red-200 bg-red-50 text-red-700';
    }
  }

  amountPrefix(t: TxType): string {
    return t === 'PAYMENT' ? '+' : '-';
  }

  amountClass(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'text-emerald-700';
      case 'DISCOUNT': return 'text-amber-700';
      case 'REVERSAL': return 'text-red-700';
    }
  }

  // =========================
  // TRANSACCIONES: FILTRADO
  // =========================
  applyFilters() {
    const q = this.norm(this.filters.q);
    const from = this.filters.from ? new Date(this.filters.from + 'T00:00:00').getTime() : null;
    const to = this.filters.to ? new Date(this.filters.to + 'T23:59:59').getTime() : null;
    const concept = this.filters.concept;

    this.filtered = (this.transacciones ?? []).filter(t => {
      if (concept && t.concept !== concept) return false;

      const time = new Date(t.dateISO + 'T00:00:00').getTime();
      if (from != null && time < from) return false;
      if (to != null && time > to) return false;

      if (!q) return true;

      const hay =
        this.norm(t.staff).includes(q) ||
        this.norm(t.tutor).includes(q) ||
        this.norm(t.student).includes(q) ||
        this.norm(t.concept).includes(q) ||
        this.norm(t.note ?? '').includes(q);

      return hay;
    });

    // orden: más reciente primero
    this.filtered.sort((a, b) => (b.dateISO + ' ' + b.time).localeCompare(a.dateISO + ' ' + a.time));

    this.computeKpis();
    this.page = 1;
    this.refreshPagination();
  }

  resetFilters() {
    this.filters = { q: '', from: '', to: '', concept: '' };
    this.applyFilters();
  }

  private norm(v: any): string {
    return (v ?? '').toString().trim().toUpperCase();
  }

  private buildConcepts(): string[] {
    const set = new Set<string>();
    for (const t of this.transacciones) set.add(t.concept);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  // =========================
  // TRANSACCIONES: KPIs
  // =========================
  private computeKpis() {
    const all = this.filtered.length ? this.filtered : this.transacciones;

    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();

    let totalIncome = 0;
    let monthIncome = 0;
    let totalDiscounts = 0;
    let totalReversals = 0;

    for (const t of all) {
      const d = new Date(t.dateISO + 'T00:00:00');
      const isThisMonth = d.getMonth() === m && d.getFullYear() === y;

      if (t.type === 'PAYMENT') {
        totalIncome += t.amount;
        if (isThisMonth) monthIncome += t.amount;
      }
      if (t.type === 'DISCOUNT') totalDiscounts += t.amount;
      if (t.type === 'REVERSAL') totalReversals += 1;
    }

    this.kpis.totalIncome = this.round2(totalIncome);
    this.kpis.monthIncome = this.round2(monthIncome);
    this.kpis.totalDiscounts = this.round2(totalDiscounts);
    this.kpis.totalReversals = totalReversals;
  }

  private round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  // =========================
  // TRANSACCIONES: PAGINACIÓN
  // =========================
  private refreshPagination() {
    const total = this.filtered.length;

    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;

    const start = (this.page - 1) * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);

    this.visiblePages = this.buildVisiblePages(this.page, this.totalPages);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.refreshPagination();
  }

  private buildVisiblePages(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];

    if (current > 3) pages.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push('...');
    pages.push(total);

    return pages;
  }

  // =========================
  // TRANSACCIONES: ACTIONS (stubs)
  // =========================
  exportPdf() {
    console.log('Export PDF', { filters: this.filters, rows: this.filtered.length });
  }

  newTransaction() {
    console.log('New transaction');
  }

  // ==========================================================
  // NÓMINA (aislada) — sin signals, sin choques de nombres
  // ==========================================================
  nominaGrades: Grade[] = ['1er', '2do', '3ro', '4to'];
  nominaParallels: Parallel[] = ['A', 'B', 'C'];

  nominaStudents: StudentRow[] = this.mockStudents(108);

  nominaOpenGrade: Grade | null = '1er';
  nominaSelectedCourse: { grade: Grade; parallel: Parallel } = { grade: '1er', parallel: 'A' };

  nominaQ = '';
  nominaPage = 1;
  nominaPageSize = 10;

  nominaVisiblePages: (number | '...')[] = [];

  // ===== Nómina: getters =====
  get nominaCourseKey(): string {
    return `${this.nominaSelectedCourse.grade} ${this.nominaSelectedCourse.parallel}`;
  }

  get nominaCountByCourse(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const g of this.nominaGrades) for (const p of this.nominaParallels) map[`${g} ${p}`] = 0;

    for (const s of this.nominaStudents) {
      const k = `${s.grade} ${s.parallel}`;
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }

  get nominaFiltered(): StudentRow[] {
    const { grade, parallel } = this.nominaSelectedCourse;
    const q = this.nominaNorm(this.nominaQ);

    const base = this.nominaStudents.filter(s => s.grade === grade && s.parallel === parallel);
    if (!q) return base;

    return base.filter(s => {
      const hay = this.nominaNorm(`${s.name} ${s.tutorName} ${s.tutorPhone} ${s.tutorEmail}`);
      return hay.includes(q);
    });
  }

  get nominaTotal(): number {
    return this.nominaFiltered.length;
  }

  get nominaTotalPages(): number {
    return Math.max(1, Math.ceil(this.nominaTotal / this.nominaPageSize));
  }

  get nominaPaged(): StudentRow[] {
    const tp = this.nominaTotalPages;
    if (this.nominaPage > tp) {
      this.nominaPage = tp;
      this.refreshNominaPagination();
    }

    const start = (this.nominaPage - 1) * this.nominaPageSize;
    return this.nominaFiltered.slice(start, start + this.nominaPageSize);
  }

  get nominaPageStart(): number {
    if (this.nominaTotal === 0) return 0;
    return (this.nominaPage - 1) * this.nominaPageSize + 1;
  }

  get nominaPageEnd(): number {
    return Math.min(this.nominaPage * this.nominaPageSize, this.nominaTotal);
  }

  // ===== Nómina: actions =====
  toggleNominaGrade(g: Grade): void {
    this.nominaOpenGrade = this.nominaOpenGrade === g ? null : g;
  }

  selectCourse(grade: Grade, parallel: Parallel): void {
    this.nominaSelectedCourse = { grade, parallel };
    this.nominaPage = 1;
    this.nominaQ = '';
    this.refreshNominaPagination();
  }

  setNominaQuery(v: string): void {
    this.nominaQ = v;
    this.nominaPage = 1;
    this.refreshNominaPagination();
  }

  setNominaPageSize(v: number): void {
    this.nominaPageSize = Number(v) || 10;
    this.nominaPage = 1;
    this.refreshNominaPagination();
  }

  // paginación con números
  goToNominaPage(p: number): void {
    if (p < 1 || p > this.nominaTotalPages) return;
    this.nominaPage = p;
    this.refreshNominaPagination();
  }

  private refreshNominaPagination(): void {
    this.nominaVisiblePages = this.buildVisiblePages(this.nominaPage, this.nominaTotalPages);
  }

  private nominaNorm(v: any): string {
    return (v ?? '').toString().trim().toLowerCase();
  }

  // ===== Mock Nómina =====
  private mockStudents(n: number): StudentRow[] {
    const names = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofía', 'Jorge', 'Valeria', 'Diego', 'Lucía'];
    const last = ['Pérez', 'Gómez', 'Rojas', 'Flores', 'Vargas', 'Mamani', 'Quispe', 'Torrez', 'López', 'Rivera'];

    const grades: Grade[] = ['1er', '2do', '3ro', '4to'];
    const parallels: Parallel[] = ['A', 'B', 'C'];

    const out: StudentRow[] = [];
    for (let i = 1; i <= n; i++) {
      const grade = grades[(i - 1) % grades.length];
      const parallel = parallels[(i - 1) % parallels.length];

      out.push({
        id: i,
        name: `${names[i % names.length]} ${last[i % last.length]}`,
        tutorName: `${names[(i + 3) % names.length]} ${last[(i + 5) % last.length]}`,
        tutorPhone: `7${(1000000 + i).toString().slice(0, 7)}`,
        tutorEmail: `tutor${i}@mail.com`,
        grade,
        parallel,
      });
    }
    return out;
  }
}
