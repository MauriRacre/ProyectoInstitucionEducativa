import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TransactionsService, TransactionItem } from '../../core/services/transaccion.service';
import { StudentService, StudentRow } from '../../core/services/estudiantes.service';
import { StatsService } from '../../core/services/stats.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../core/toast/toast.service';
import { ModalService } from '../../core/swal/swal.service';

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
  /** TABS VARIABLES */
  selectedTab: TabKey = 'transacciones';
  isLoading = false;
  apiError = '';
  /** TRANSACCIONES VARIABLES */
  transacciones: TransactionItem[] = [];
  
  paged: TransactionItem[] = [];
  concepts: string[] = [];
  filters: Filters = { q: '', from: '', to: '', concept: '' };
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalFromApi= 0;
  visiblePages: (number | '...')[] = [];
  /** ESTADISTICA VARIABLES */
  kpis = {
    totalIncome: 0,
    monthIncome: 0,
    totalDiscounts: 0,
    totalReversals: 0,
  };
  /** NOMINA VARIABLES */
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

  constructor(
    private txService: TransactionsService,
    private studentService: StudentService,
    private statsService: StatsService,
    private toast: ToastService,
    private modal: ModalService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadConcepts();
    this.loadStatistics();
  }

  setTab(tab: TabKey) {
    this.selectedTab = tab;
    this.page = 1;
    if (tab === 'nomina') {
      this.loadNominaCourses();
      if (this.nominaSelectedCourse) {
        this.loadNominaStudents();
      }
    }else if(tab=== 'estadisticas'){
      this.loadStatistics();
    }
  }
  /** LOADING APIS */
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
  loadStatistics(): void {
    this.statsService.list().subscribe({
      next: (res) => {
        this.kpis = {
          totalIncome: Number(res.totalIngresos),
          monthIncome: Number(res.ingresosMes),
          totalDiscounts: Number(res.descuentos),
          totalReversals: Number(res.reversiones)
        };
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  /** TRANSACCIONES */
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
  /** PDF */
  exportStatsPdf(): void {
    const doc = new jsPDF('portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('UNIDAD EDUCATIVA MARAVILLAS DEL SABER', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Reporte Estadístico Financiero', pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-BO')}`, 14, 38);

    doc.setDrawColor(200);
    doc.line(14, 42, pageWidth - 14, 42);

    const startY = 60;

    const drawCard = (title: string, value: string, y: number) => {
      doc.setDrawColor(230);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, y, pageWidth - 40, 28, 4, 4, 'FD');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(title, 26, y + 10);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(value, pageWidth - 26, y + 18, { align: 'right' });
    };

    drawCard(
      'Ingresos Totales',
      `Bs. ${this.kpis.totalIncome.toFixed(2)}`,
      startY
    );

    drawCard(
      'Ingresos del Mes',
      `Bs. ${this.kpis.monthIncome.toFixed(2)}`,
      startY + 38
    );

    drawCard(
      'Descuentos Registrados',
      `Bs. ${this.kpis.totalDiscounts.toFixed(2)}`,
      startY + 76
    );

    drawCard(
      'Cantidad de Reversiones',
      `${this.kpis.totalReversals}`,
      startY + 114
    );

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen General', 14, 190);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const balance =
      this.kpis.totalIncome -
      this.kpis.totalDiscounts;

    doc.text(
      `Balance Neto Actual: Bs. ${balance.toFixed(2)}`,
      14,
      200
    );

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      'Sistema de Gestión Escolar',
      14,
      pageHeight - 10
    );

    doc.text(
      `Página 1`,
      pageWidth - 14,
      pageHeight - 10,
      { align: 'right' }
    );
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url);
  }

  exportPdf(): void {
    this.txService.searchTransactions({
      tutor: this.filters.q,
      from: this.filters.from,
      to: this.filters.to,
      concept: this.filters.concept,
      page: 1,
      pageSize: 10000   
    }).subscribe({
      next: res => {
        this.generatePdf(res.items);
      }
    });
  }

  generatePdf(data: any[]) {
    if (!data.length) {
      this.toast.error('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIDAD EDUCATIVA MARAVILLAS DEL SABER', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Reporte de Transacciones', pageWidth / 2, 23, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-BO')}`, 14, 30);

    doc.setDrawColor(200);
    doc.line(14, 33, pageWidth - 14, 33);

    const totalPagos = data
      .filter(x => x.type === 'PAYMENT')
      .reduce((sum, x) => sum + Number(x.amount ?? 0), 0);

    const totalDescuentos = data
      .filter(x => x.type === 'DISCOUNT')
      .reduce((sum, x) => sum + Number(x.amount ?? 0), 0);

    const totalReversiones = data
      .filter(x => x.type === 'REVERSAL')
      .length;

    doc.setFontSize(11);
    doc.text(`Total Pagos: Bs. ${totalPagos.toFixed(2)}`, 14, 42);
    doc.text(`Total Descuentos: Bs. ${totalDescuentos.toFixed(2)}`, 14, 48);
    doc.text(`Total Reversiones: ${totalReversiones}`, 14, 54);

    const rows: string[][] = data.map(x => {

      const date = x.fecha ? new Date(x.fecha) : null;

      const formattedDate =
        date && !isNaN(date.getTime())
          ? date.toLocaleDateString('es-BO')
          : '';

      const amount = Number(x.amount ?? 0);

      return [
        formattedDate,
        this.typeLabel(x.type) ?? '',
        x.staff ?? '',
        x.tutor ?? '',
        x.student ?? '',
        x.concept ?? '',
        `${this.amountPrefix(x.type) ?? ''} Bs. ${amount.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 62,
      head: [[
        'Fecha',
        'Tipo',
        'Encargado',
        'Tutor',
        'Alumno',
        'Concepto',
        'Monto'
      ]],
      body: rows,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 64, 175], 
        textColor: 255,
        halign: 'center'
      },
      columnStyles: {
        6: { halign: 'right' } 
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 14, right: 14 }
    });

    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );

      doc.text(
        'Sistema de Gestión Escolar',
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url);

  }

  /** PAGINACION - TRANSACCIONES */
  get pageStart() {
    return (this.page - 1) * this.pageSize;
  }

  get pageEnd() {
    return Math.min(this.pageStart + this.pageSize, this.totalFromApi);
  }
  
  goToPage(p: number) {
    if (p < 1) return;
    this.page = p;
    this.loadTransactions();
  }

  private refreshPagination() {
    this.totalPages = Math.max(1, Math.ceil(this.totalFromApi / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;
    this.paged = this.transacciones;
    this.visiblePages = this.buildVisiblePages(this.page, this.totalPages);
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
  /** HELPERS  - TRANSACCIONES */
  private round2(n: number) {
    return Math.round(n * 100) / 100;
  }
  trackById = (_: number, x: TransactionItem) => x.id;

  typeLabel(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'Pago';
      case 'DISCOUNT': return 'Descuento';
      case 'REVERSAL': return 'Reverso';
    }
  }
  amountPrefix(t: TxType): string {
    return t === 'PAYMENT' ? '+' : '-';
  }

  formatDate(dateISO: string): string {
    const d = new Date(dateISO + 'T00:00:00');
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  typePillClass(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'DISCOUNT': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'REVERSAL': return 'border-red-200 bg-red-50 text-red-700';
    }
  }

  amountClass(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'text-emerald-700';
      case 'DISCOUNT': return 'text-amber-700';
      case 'REVERSAL': return 'text-red-700';
    }
  }

  newTransaction() {
    console.log('New transaction');
  }
  /** NOMINA - GETTERS */
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
  /** NOMINA - ACTIONS */
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
}
