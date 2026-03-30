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
import { GastoModal, ExpenseMode, ExpenseFormValue } from '../../components/gasto/modalGasto';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { forkJoin } from 'rxjs';
import { EstadisticasComponent } from '../../components/estadisticas/estadisticas.component';
type TxType = 'PAYMENT' | 'EXPENSE' | 'REVERSAL';
type TabKey = 'transacciones' | 'estadisticas' | 'nomina';


interface Filters {
  q: string;
  from: string;
  to: string;
  paymentMethod?: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, GastoModal, EstadisticasComponent],
  templateUrl: './history.page.html',
})
export class HistoryPage implements OnInit {
  /**VARIABLES ESTADISTICAS */
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;

  totalEstudiantes = 0;
  totalTutores = 0;
  morosidad: any;
  inscritos: any[] = [];
  ingresosCursos: any[] = [];
  ingresosAnual: any;
  ranking: any[] = [];
  descuentos: any[] = [];
  ingresosQrHoy = 0;
  ingresosEfectivoHoy = 0;
  ingresosHoy = 0;

  ingresosQrAnual = 0;
  ingresosEfectivoAnual = 0;
  ingresoTotal = 0;
  descuentoTotal = 0;
  /** TABS VARIABLES */
  selectedTab: TabKey = 'transacciones';
  isLoading = false;
  apiError = '';
  /** TRANSACCIONES VARIABLES */
  transacciones: TransactionItem[] = [];
  paged: TransactionItem[] = [];
  concepts: string[] = [];
  filters: Filters = { q: '', from: '', to: '', paymentMethod: '' };
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
    private modal: ModalService,
    private estadisticasService: EstadisticasService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadConcepts();
    this.loadStatistics();
  }
  onMonthChange(month: number){
    this.month = month;
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

    this.txService.getTransactions({
      q: this.filters.q,
      from: this.filters.from,
      to: this.filters.to,
      paymentMethod: this.filters.paymentMethod,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({

      next: (res) => {

        this.transacciones = res.data.map(x => ({
          id: x.id,
          dateISO: x.dateISO ?? null,
          time: x.time ?? '',
          type: x.type,
          staff: x.staff ?? x.responsable ?? '',
          tutor: x.tutor,
          student: x.student,
          grade: x.grade ?? '',
          parallel: x.parallel ?? '',
          concept: x.concept ?? '',
          note: x.note ?? '',
          paymentMethod: x.paymentMethod ?? null,
          amount: this.round2(x.amount),
        }));

        this.totalFromApi = res.total;
        this.refreshPagination();
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
    const today = new Date().toISOString().split('T')[0];
    forkJoin({
      estudiantes: this.estadisticasService.getTotalEstudiantes(),
      tutores: this.estadisticasService.getTotalTutores(),
      ingresosAnual: this.estadisticasService.getIngresosPorMes(this.year),
      morosidad: this.estadisticasService.getMorosidad(this.month, this.year),
      inscritos: this.estadisticasService.getInscritosCursos(this.month, this.year),
      ingresosCursos: this.estadisticasService.getIngresosCursos(this.month, this.year),
      ranking: this.estadisticasService.getRankingEstudiantes(this.month, this.year),
      descuentos: this.estadisticasService.getDescuentosAnual(this.year),
      cajaHoy: this.estadisticasService.getCajaHoy(today),
      cajaTotal: this.estadisticasService.getCajaTotal(),
    }).subscribe(res => {
      this.totalEstudiantes = res.estudiantes.total;
      this.totalTutores = res.tutores.total;
      this.ingresosAnual = res.ingresosAnual;
      this.morosidad = res.morosidad;
      this.inscritos = res.inscritos;
      this.ingresosCursos = res.ingresosCursos;
      this.ranking = res.ranking;
      this.descuentos = res.descuentos;
      this.ingresosQrHoy = Number(res.cajaHoy.qr || 0);
      this.ingresosEfectivoHoy = Number(res.cajaHoy.efectivo || 0);
      this.ingresosHoy = Number(res.cajaHoy.total || 0);
      this.ingresosQrAnual = Number(res.cajaTotal.qr || 0);
      this.ingresosEfectivoAnual = Number(res.cajaTotal.efectivo || 0);
      this.ingresoTotal = Number(res.cajaTotal.total || 0);
      this.descuentoTotal = Number(res.cajaTotal.descuentos || 0);
      console.log(res);
    });
  }
  /** TRANSACCIONES */
  applyFilters() {
    this.loadTransactions();
  }

  resetFilters() {
    this.filters = { q: '', from: '', to: '', paymentMethod: '' };
    this.applyFilters();
  }
  /** PDF */
  

  exportPdf(): void {
    this.txService.getTransactions({
      q: this.filters.q,
      from: this.filters.from,
      to: this.filters.to,
      paymentMethod: this.filters.paymentMethod,
      page: 1,
      pageSize: 10000   
    }).subscribe({
      next: res => {
        console.log(res);
        this.generatePdf(res.data, res.summary);
      }
    });
  }

  async generatePdf(data: any[], summary: any) {
    if (!data.length) {
      this.toast.error('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const logoBase64 = await this.loadImage('assets/images/logo.png');
    doc.addImage(logoBase64, 'PNG', 14, 10, 40, 40);
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('UNIDAD EDUCATIVA BILINGÜE', pageWidth / 2, 18, { align: 'center' });
    doc.text('MARAVILLAS DEL SABER', pageWidth / 2, 26, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `Fecha de emisión: ${new Date().toLocaleDateString('es-BO')}`,
      pageWidth - 14,
      16,
      { align: 'right' }
    );  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Calle Soruco Nº 310', pageWidth / 2, 34, { align: 'center' });
    doc.text('Cel. 74375897 - 70386170', pageWidth / 2, 39, { align: 'center' });
    doc.text('Quillacollo, Cochabamba - Bolivia', pageWidth / 2, 44, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('HISTORIAL DE TRANSACCIONES', pageWidth / 2, 60, { align: 'center' });

    /* =========================
      CAJA DE RESUMEN
    ========================= */

    doc.setDrawColor(220);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, 68, pageWidth - 28, 20, 3, 3, 'FD');

    const col1 = 25;
    const col2 = pageWidth * 0.35;
    const col3 = pageWidth * 0.60;
    const col4 = pageWidth * 0.82;

    const yTitle = 77;
    const yValue = 84;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);

    doc.text('Total Pagos', col1, yTitle);
    doc.text('Pagos QR', col2, yTitle);
    doc.text('Pagos Efectivo', col3, yTitle);
    doc.text('Total Descuentos', col4, yTitle);

    doc.setFont('helvetica', 'normal');

    doc.text(`Bs. ${summary.totalPayments.toFixed(2)}`, col1, yValue);
    doc.text(`Bs. ${summary.totalQR.toFixed(2)}`, col2, yValue);
    doc.text(`Bs. ${summary.totalCash.toFixed(2)}`, col3, yValue);
    doc.text(`Bs. ${summary.totalDiscounts.toFixed(2)}`, col4, yValue);

    const rows: string[][] = data.map(x => {
      const amount = Number(x.amount ?? 0);

      return [
        this.formatDate(x.dateISO),
        this.typeLabel(x.type) ?? '',
        x.staff ?? '',
        x.tutor ?? '',
        x.student ?? '',
        x.concept ?? '',
        x.metodo_pago || x.paymentMethod,
        `${this.amountPrefix(x.type) ?? ''} Bs. ${amount.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 95,
      head: [[
        'Fecha',
        'Tipo',
        'Encargado',
        'Tutor',
        'Alumno',
        'Concepto',
        'Método de Pago',
        'Monto'
      ]],
      body: rows,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [30, 64, 175], 
        textColor: 255,
        halign: 'center',
        lineWidth: 0.4,
        lineColor: [200, 200, 200]
      },
      columnStyles: {
        5: { cellWidth: 60 },
        7: {
          halign: 'right',
          cellWidth: 25
        }
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
        `Sistema de Gestión Escolar`,
        14,
        pageHeight - 10
      );

      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: 'right' }
      );
    }
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url);

  }
  exportNomina():void{
    if (!this.nominaSelectedCourse) {
      this.toast.error('Error inesperado.')
      return;
    };
    this.studentService.getNominaStudents({
      grade: this.nominaSelectedCourse.grade,
      parallel: this.nominaSelectedCourse.parallel,
      q: this.nominaQ,
      page: 1,
      pageSize: 10000,
    }).subscribe({
      next: (res) => {
        this.pdfNomina(res.items);
      },
      error: (err) => {
        this.toast.error('Error al cargar la nomina para imprimir.')
        console.error(err)
      },
    });
  }
  async pdfNomina(data: any[]){
    if (!data.length) {
      this.toast.error('No hay datos para exportar');
      return;
    }
    const doc = new jsPDF('portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const logoBase64 = await this.loadImage('assets/images/logo.png');
    doc.addImage(logoBase64, 'PNG', 14, 10, 40, 40);
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('UNIDAD EDUCATIVA BILINGÜE', pageWidth / 2, 25, { align: 'center' });
    doc.text('MARAVILLAS DEL SABER', pageWidth / 2, 33, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `Fecha de emisión: ${new Date().toLocaleDateString('es-BO')}`,
      pageWidth - 14,
      16,
      { align: 'right' }
    );  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Calle Soruco Nº 310', pageWidth / 2, 41, { align: 'center' });
    doc.text('Cel. 74375897 - 70386170', pageWidth / 2, 46, { align: 'center' });
    doc.text('Quillacollo, Cochabamba - Bolivia', pageWidth / 2, 51, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NOMINA DE ESTUDIANTES', pageWidth / 2, 65, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Curso: ${this.nominaCourseKey}`, 7, 73);
    
    const rows: string[][] = data.map((x, index) => {
      return [
        (index + 1).toString(),
        x.name ?? '',
        x.tutorName ?? '',
        x.tutorPhone ?? '',
        x.tutorEmail ?? '',
      ];
    });

    autoTable(doc, {
      startY: 79,
      head: [[
        '#',
        'Alumno',
        'Tutor',
        'Cel',
        'Email',
        '',
      ]],
      body: rows,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: 'middle',
        textColor: 0,
        fillColor: false,
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
      fillColor: [255, 255, 255], 
      textColor: 0, 
        halign: 'center',
        lineWidth: 0.2,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }               
      },
      alternateRowStyles: {
        fillColor: false
      },
      tableLineWidth: 0.2,
      tableLineColor: [0, 0, 0],
      margin: { left: 7, right:7 }
    });

    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setFontSize(9);
      doc.setTextColor(150);

      doc.text(
        `Sistema de Gestión Escolar`,
        14,
        pageHeight - 10
      );

      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: 'right' }
      );
    }
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url);
  }
  /** CONVERTIR LOGO PARA PDF */
  private loadImage(path: string): Promise<string>{
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = path;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
    });
  }
  /** PAGINACION - TRANSACCIONES */
  get pageStart() {
    return (this.page - 1) * this.pageSize;
  }

  get pageEnd() {
    return Math.min(this.pageStart + this.pageSize, this.totalFromApi);
  }
  
  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
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
      case 'EXPENSE': return 'Gasto';
      case 'REVERSAL': return 'Reverso';
    }
  }
  amountPrefix(t: TxType): string {
    return t === 'PAYMENT' ? '+' : '-';
  }

  formatDate(dateISO: string | null | undefined): string {
  if (!dateISO) return '';

  const date = new Date(dateISO);

  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}


  typePillClass(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'EXPENSE': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'REVERSAL': return 'border-red-200 bg-red-50 text-red-700';
    }
  }

  amountClass(t: TxType): string {
    switch (t) {
      case 'PAYMENT': return 'text-emerald-700';
      case 'EXPENSE': return 'text-amber-700';
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
  /** MODAL GASTO */
  private get currentUserName(): string {
    const raw = localStorage.getItem('user');
    if (!raw) return 'SISTEMA';

    try {
      const user = JSON.parse(raw);
      return user?.nombre || user?.username || 'SISTEMA';
    } catch {
      return 'SISTEMA';
    }
  }
  showGastoModal = false;

  gastoMode: ExpenseMode = 'create';

  gastoEditData?: ExpenseFormValue;

  gastos: ExpenseFormValue[] = [];
  openCreateGasto() {
    this.gastoMode = 'create';
    this.gastoEditData = undefined;
    this.showGastoModal = true;
  }
  openEditGasto(gasto: ExpenseFormValue) {
    this.gastoMode = 'edit';
    this.gastoEditData = { ...gasto };
    this.showGastoModal = true;
  }
  async onSaveGasto(data: ExpenseFormValue) {

    const payload = {
      encargado: this.currentUserName,
      concepto: data.concept,
      monto: data.monto,
      metodo_pago: data.paymentMethod,
    };

    this.txService.createGasto(payload).subscribe({
      next: () => {
        this.toast.success('Gasto registrado correctamente');
        this.showGastoModal = false;
        this.loadTransactions();
      },
      error: (err) => {
        this.showGastoModal = false;
        console.error(err);
        this.toast.error(
          err?.error?.message || 'Error registrando gasto'
        );
      }
    });
  }
  onCancelGasto() {
    this.showGastoModal = false;
  }

}
