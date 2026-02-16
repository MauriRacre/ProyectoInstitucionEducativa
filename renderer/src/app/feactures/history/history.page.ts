import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TransactionsService, TransactionItem } from '../../core/services/transaccion.service';
import { StudentService, StudentRow } from '../../core/services/estudiantes.service';
type TxType = 'PAYMENT' | 'DISCOUNT' | 'REVERSAL';
type TabKey = 'transacciones' | 'estadisticas' | 'nomina';


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
export class HistoryPage implements OnInit {
  // =========================
  // TABS
  // =========================
  selectedTab: TabKey = 'transacciones';

  setTab(tab: TabKey) {
    this.selectedTab = tab;
    this.page = 1;
    if (tab === 'nomina') {
      this.loadNominaCourses();
      if (this.nominaSelectedCourse) {
        this.loadNominaStudents();
      }
    }
  }

  // =========================
  // TRANSACCIONES: DATA
  // =========================
  transacciones: TransactionItem[] = [];
  isLoading = false;
  apiError = '';
  totalFromApi= 0;

  concepts: string[] = [];
  loadTransactions() {
    this.isLoading = true;
    this.apiError = '';

    this.txService.getTransactions(this.page, this.pageSize)
      .subscribe({
        next: (res) => {
          this.transacciones = res.items.map(x => ({
            id: x.id,
            dateISO: x.dateISO,
            time: x.time ?? '',
            type: x.type,
            staff: x.staff ?? x.responsable ?? '',
            tutor: x.tutor,
            student: x.student,
            grade: x.grade ?? '',
            parallel: x.parallel ?? '',
            concept: x.concept ?? '',
            note: x.note ?? '',
            amount: this.round2(x.amount),
          }));

          this.totalFromApi = res.total;
          this.applyFilters();
        },
        error: (err) => {
          console.error(err);
          this.apiError = 'No se pudo cargar historial.';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }
  loadConcepts(){
    this.txService.getConcepts().subscribe({
      next: (res) => this.concepts = res,
      error: (err) => console.error(err)
    });
  }
  loadNominaCourses() {
    this.nominaLoading = true;

    this.studentService.getNominaCourses().subscribe({
      next: (res) => {
        this.nominaCourses = res;
      },
      error: (err) => console.error(err),
      complete: () => this.nominaLoading = false
    });
  }
  loadNominaStudents() {
    if (!this.nominaSelectedCourse) return;
    this.nominaLoading = true;
    this.studentService.getNominaStudents({
      grade: this.nominaSelectedCourse.grade,
      parallel: this.nominaSelectedCourse.parallel,
      q: this.nominaQ,
      page: this.nominaPage,
      pageSize: this.nominaPageSize
    }).subscribe({
      next: (res) => {
        this.nominaStudents = res.items;
        this.nominaTotal = res.total;
        this.nominaTotalPages = Math.max(1, Math.ceil(res.total / this.nominaPageSize));
        this.nominaVisiblePages = this.buildVisiblePages(this.nominaPage, this.nominaTotalPages);
      },
      error: (err) => console.error(err),
      complete: () => this.nominaLoading = false
    });
  }

  // =========================
  // TRANSACCIONES: FILTROS + LISTAS
  // =========================
  filters: Filters = { q: '', from: '', to: '', concept: '' };

  paged: TransactionItem[] = [];

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
    return Math.min(this.pageStart + this.pageSize, this.totalFromApi);
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
  constructor(
    private txService: TransactionsService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadConcepts();
  }
  // =========================
  // TRANSACCIONES: UI HELPERS
  // =========================
  trackById = (_: number, x: TransactionItem) => x.id;

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
    this.isLoading = true;

    this.txService.searchTransactions({
      tutor: this.filters.q,
      from: this.filters.from,
      to: this.filters.to,
      concept: this.filters.concept, 
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.transacciones = res.items.map(x => {
          const fecha = x.dateISO ?? (x.fecha ? x.fecha.split('T')[0] : '');
          const hora = x.time ?? (x.fecha ? x.fecha.split('T')[1]?.substring(0,5) : '');

          return {
            id: x.id,
            dateISO: fecha,
            time: hora,
            type: x.type,
            staff: x.staff ?? x.responsable ?? '',
            tutor: x.tutor,
            student: x.student,
            grade: x.grade ?? '',
            parallel: x.parallel ?? '',
            concept: x.concept ?? '',
            note: x.note ?? '',
            amount: this.round2(x.amount),
          };
        });

        this.totalFromApi = res.total;
        this.refreshPagination();
      },
      error: err => {
        console.error(err);
      },
      complete: () => this.isLoading = false
    });
  }

  resetFilters() {
    this.filters = { q: '', from: '', to: '', concept: '' };
    this.applyFilters();
  }

  // =========================
  // TRANSACCIONES: KPIs
  // =========================
  private round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  // =========================
  // TRANSACCIONES: PAGINACIÓN
  // =========================
  private refreshPagination() {
    this.totalPages = Math.max(1, Math.ceil(this.totalFromApi / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;
    this.paged = this.transacciones;
    this.visiblePages = this.buildVisiblePages(this.page, this.totalPages);
  }

  goToPage(p: number) {
    if (p < 1) return;
    this.page = p;
    this.loadTransactions();
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
  // TRANSACCIONES: ACTIONS
  // =========================
  exportPdf() {
    console.log('Export PDF');
  }

  newTransaction() {
    console.log('New transaction');
  }

  // =========================
  // NÓMINA (API REAL)
  // =========================

  nominaCourses: { grade: string; parallel: string; count: number }[] = [];
  nominaStudents: StudentRow[] = [];

  nominaOpenGrade: string | null = null;
  nominaSelectedCourse: { grade: string; parallel: string } | null = null;

  nominaQ = '';
  nominaPage = 1;
  nominaPageSize = 10;
  nominaTotal = 0;
  nominaTotalPages = 1;

  nominaVisiblePages: (number | '...')[] = [];
  nominaLoading = false;

  // ===== Nómina: getters =====
  get nominaCourseKey(): string {
    if (!this.nominaSelectedCourse) return '';
    return `${this.nominaSelectedCourse.grade} ${this.nominaSelectedCourse.parallel}`;
  }

  get nominaPageStart(): number {
    if (this.nominaTotal === 0) return 0;
    return (this.nominaPage - 1) * this.nominaPageSize + 1;
  }

  get nominaPageEnd(): number {
    return Math.min(this.nominaPage * this.nominaPageSize, this.nominaTotal);
  }

  get nominaGroupedCourses() {
    const map: Record<string, any[]> = {};

    for (const c of this.nominaCourses) {
      if (!map[c.grade]) {
        map[c.grade] = [];
      }
      map[c.grade].push(c);
    }

    return Object.entries(map).map(([grade, courses]) => ({
      grade,
      courses
    }));
  }

  // ===== Nómina: actions =====
  toggleNominaGrade(g: string): void {
    this.nominaOpenGrade = this.nominaOpenGrade === g ? null : g;
  }

  selectCourse(grade: string, parallel: string): void {
    this.nominaSelectedCourse = { grade, parallel };
    this.nominaStudents = [];
    this.nominaPage = 1;
    this.nominaQ = '';
    this.loadNominaStudents();
  }


  setNominaQuery(v: string): void {
    this.nominaQ = v;
    this.nominaPage = 1;
    this.loadNominaStudents();
  }


  setNominaPageSize(v: number): void {
    this.nominaPageSize = Number(v) || 10;
    this.nominaPage = 1;
    this.loadNominaStudents();
  }

  goToNominaPage(p: number): void {
    if (p < 1 || p > this.nominaTotalPages) return;
    this.nominaPage = p;
    this.loadNominaStudents();
  }


  private refreshNominaPagination(): void {
    this.nominaVisiblePages = this.buildVisiblePages(this.nominaPage, this.nominaTotalPages);
  }
}
