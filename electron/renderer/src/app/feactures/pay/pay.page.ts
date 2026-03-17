import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../core/swal/swal.service';
import { ToastService } from '../../core/toast/toast.service';
import { ModalAbono, DestinoPago } from '../../components/abono/modalAbono';
import { ModalRegister, Mode, Parent } from '../../components/register/modalRegister';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { TutorApiService } from '../../core/services/tutor.service';
import { CategoryService, CategoryDTO, CategoryType } from '../../core/services/categoria.service';
import { PaymentService } from '../../core/services/pay.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReciboService } from '../../core/services/recibo.service';
import { StudentService } from '../../core/services/estudiantes.service';
import { InscriptionService } from '../../core/services/inscription.service';
import { ModalMulta } from '../../components/multa/multa.component';

type Parallel = 'A' | 'B' | 'C';
type Grade =
  | 'Sala Cuna'
  | 'Maternal'
  | 'Preparatorio'
  | 'Taller Inicial'
  | 'Kinder'
  | 'Pre-Kinder'
  | '1er'
  | '2do'
  | '3ro'
  | '4to'
  | '5to'
  | '6to';

interface Tutor {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Child {
  id: number;
  name: string;
  grade: Grade;
  parallel: Parallel;
  monto?: number;
}

interface PaymentHistoryItem {
  id: number;
  dateISO: string;
  conceptLabel: string;
  paid: number;
  discount: number;
  appliedTotal: number;
  note?: string | null;
  staff?: string | null;
  movementId?: number | null;
  reversed?: boolean;     
  reverted?: boolean;
}

interface PaymentConcept {
  id: number;
  childId: number;
  concept: string;
  amountTotal: number;  
  pending: number;      
  history?: PaymentHistoryItem[];
}
interface PayViewApi {
  tutor: { id: number; name: string; phone: string; email: string };
  children: Array<{ id: number; name: string; grade: Grade; parallel: Parallel }>;
  paymentsByChild: Record<
    string,
    Array<{
      id: number;
      studentId: number;
      categoryId: string;
      concept: string;
      period?: { year: number; month: string | number };
      amountTotal: string | null;
      pending: number | string;
      history: Array<{
        id: number;
        dateISO: string;
        type: string;
        conceptLabel: string;
        paid: string | number;
        discount: string | number;
        appliedTotal: string | number;
        note: string | null;
        staff: string | null;
        movementId: number | null;
        reversed: boolean;
      }>;
    }>
  >;
}

@Component({
    selector: 'app-pay-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalAbono, ModalRegister, RouterModule, ModalMulta
    ],
    templateUrl: './pay.page.html'
})
export class PayPage implements OnInit{
  constructor(
    private modal: ModalService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private tutorapi: TutorApiService,
    private categoryapi: CategoryService,
    private paymentApi: PaymentService,
    private auth: AuthService,
    private reciboNum: ReciboService,
    private inscriptionService: InscriptionService,
    private estudianteService: StudentService,
    private router: Router
  ) {}
      goHome() {
      this.router.navigate(['/']);
    }

  isLoading = false;
  apiErrorMsg='';
  tutor: Tutor = {id:0, name:'', phone:'', email:''};
  children: Child[]=[];
  paymentsByChild: Record<number, PaymentConcept[]>={};
  selectedIds = new Set<number>();
  draftDiscount: Partial<Record<number, number>>={};
  draftPay: Partial<Record<number, number>>={};
  isProcessing = false;
  historyOpen = new Set<number>();
  pageSize = 6;
  childPage: Record<number, number>={};
  idTutor = 0;
  paymentMethod: 'EFECTIVO' | 'QR' = 'EFECTIVO';
  ngOnInit(): void {
    this.route.paramMap
    .subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) return;
      this.idTutor = id;
      this.fetchPayView(id);
    });
  }
  private get currentUserName(): string {
    const raw = this.auth.getUser();
    if (!raw) return 'SISTEMA';

    try {
      return raw?.nombre || raw?.username || 'SISTEMA';
    } catch {
      return 'SISTEMA';
    }
  }
  get currentUserRole(){
    const raw = this.auth.getUser();
    if(!raw) return '';
    try {
      return raw?.rol || '';
    } catch{
      console.error('Error al recuperar role.')
      return '';
    }
  }

  get isAdmin(): boolean{
    return this.currentUserRole === 'ADMIN';
  }
  private fetchPayView(tutorId:number){
    this.isLoading = true;
    this.apiErrorMsg = '';
    const year = new Date().getFullYear();
    const includeHistory = true;
    this.tutorapi.getPayView(tutorId, year, includeHistory).subscribe({
      next:(res:any) => {
        console.log(res);
        const api = res as PayViewApi;
        this.tutor = {
          id: Number(api.tutor?.id ?? 0),
          name: api.tutor?.name ?? '',
          phone: api.tutor?.phone ?? '',
          email: api.tutor?.email ?? '',
        };
        this.children = (api.children ?? []).map(c=>({
          id: Number(c.id),
          name: c.name,
          grade:c.grade,
          parallel: c.parallel,
        }));
        this.studentOptions = this.children.map(c => ({
          id: c.id,
          name: c.name
        }));

        const mapped : Record<number, PaymentConcept[]>={};
        const rawMap = api.paymentsByChild ?? {};
        for(const [childIdStr, list] of Object.entries(rawMap)){
          const childId = Number(childIdStr);
          mapped[childId]= (list ?? []).map(p=>{
            const history = (p.history ?? []).map(h => ({
              id: Number(h.id),
              dateISO: h.dateISO,
              conceptLabel: h.conceptLabel,
              paid: this.money(h.paid),
              discount: this.money(h.discount),
              appliedTotal: this.money(h.appliedTotal),
              note: h.note,
              staff: h.staff,
              movementId: h.movementId,
              reversed: !!h.reversed,
              reverted: !!h.reversed,
            }));
            const amountTotalNorm = Number(p.amountTotal ?? 0);
            const pendingNorm = Number(p.pending ?? 0);


            return {
              id: Number(p.id),
              childId: Number(p.studentId ?? childId),
              concept: p.concept ?? '',
              amountTotal: amountTotalNorm,
              pending: pendingNorm,
              history,
            };
          });
          if(!this.childPage[childId]) this.childPage[childId] = 1;
        }
        this.paymentsByChild = mapped;
        for (const c of this.children) {
          if (!this.paymentsByChild[c.id]) {
            this.paymentsByChild[c.id] = [];
          }
        }
        this.selectedIds.clear();
        this.draftDiscount = {};
        this.draftPay = {};
        this.historyOpen.clear();
        console.log('Res:', res);
      },
      error: (err) => {
        console.error(err);
        this.apiErrorMsg = 'No se pudo cargar la vista de cobro.';
        this.toast.error(this.apiErrorMsg);

        this.tutor = { id: 0, name: '', phone: '', email: '' };
        this.children = [];
        this.paymentsByChild = {};
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
  private money(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return this.round2(v);

    const s = String(v).trim();
    const cleaned = s.replace(/[^\d.,-]/g, '');

    const parts = cleaned.split('.');
    let normalized = cleaned;
    if (parts.length > 2) {
      const last = parts.pop()!;
      normalized = parts.join('') + '.' + last;
    }

    normalized = normalized.replace(',', '.');

    const n = Number(normalized);
    return Number.isFinite(n) ? this.round2(n) : 0;
  }

  private round2(n: number) {
    return Math.round(n * 100) / 100;
  }
  // ------------------ UI helpers ------------------
  trackByChildId = (_: number, c: Child) => c.id;
  trackByPaymentId = (_: number, p: PaymentConcept) => p.id;
  trackByHistoryId = (_: number, h: PaymentHistoryItem) => h.id;

  formatDate(dateISO: string): string {
    const d = new Date(dateISO);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'long' });
  }

  // ------------------ Progress ------------------
  paid(p: Pick<PaymentConcept, 'amountTotal' | 'pending'>): number {
    return Math.max(0, (p.amountTotal ?? 0) - (p.pending ?? 0));
  }

  progressPct(p: Pick<PaymentConcept, 'amountTotal' | 'pending'>): number {
    const total = Math.max(0, p.amountTotal ?? 0);
    if (total <= 0) return 0;
    const pct = (this.paid(p) / total) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  statusLabel(p: Pick<PaymentConcept, 'amountTotal' | 'pending'>): string {
    const total = Math.max(0, p.amountTotal ?? 0);
    const pend = Math.max(0, p.pending ?? 0);
    if (total > 0 && pend === 0) return 'Pagado';
    if (total > 0 && pend < total) return 'Parcial';
    return 'Pendiente';
  }

  statusClass(p: Pick<PaymentConcept, 'amountTotal' | 'pending'>): string {
    const label = this.statusLabel(p);
    if (label === 'Pagado') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (label === 'Parcial') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-red-200 bg-red-50 text-red-700';
  }

  // ------------------ History expand ------------------
  toggleHistory(paymentId: number) {
    if (this.historyOpen.has(paymentId)) this.historyOpen.delete(paymentId);
    else this.historyOpen.add(paymentId);
  }

  isHistoryOpen(paymentId: number) {
    return this.historyOpen.has(paymentId);
  }

  // ------------------ Pagination per child ------------------

  childTotalPages(childId: number): number {
    const total = this.paymentsByChild[childId]?.length ?? 0;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  childPageStart(childId: number): number {
    const page = this.childPage[childId] ?? 1;
    return (page - 1) * this.pageSize;
  }


  childPageEnd(childId: number): number {
    const total = this.paymentsByChild[childId]?.length ?? 0;
    return Math.min(this.childPageStart(childId) + this.pageSize, total);
  }

  pagedPayments(childId: number): PaymentConcept[] {
    const page = this.childPage[childId] ?? 1;
    const total = this.paymentsByChild[childId]?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    const safePage = Math.min(page, totalPages);

    const start = (safePage - 1) * this.pageSize;

    return (this.paymentsByChild[childId] ?? []).slice(start, start + this.pageSize);
  }


  goToChildPage(childId: number, p: number) {
    const total = this.childTotalPages(childId);
    if (p < 1 || p > total) return;
    this.childPage[childId] = p;
  }

  visiblePages(childId: number): (number | '...')[] {
    //this.ensureChildPage(childId);
    const total = this.childTotalPages(childId);
    const current = this.childPage[childId] ?? 1;
    const delta = 1;

    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');

    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push('...');
    pages.push(total);

    return pages;
  }

  // ------------------ Selection + drafts ------------------
  isSelected(paymentId: number) {
    return this.selectedIds.has(paymentId);
  }

  toggleSelected(p: PaymentConcept) {
    if (p.pending <= 0) return;

    if (this.selectedIds.has(p.id)) {
      this.selectedIds.delete(p.id);
    } else {
      this.selectedIds.add(p.id);

      // defaults: descuento 0, pagar todo lo que queda
      if (this.draftDiscount[p.id] == null) this.draftDiscount[p.id] = 0;
      if (this.draftPay[p.id] == null) this.draftPay[p.id] = this.maxPayFor(p);
    }
  }

  setDiscount(id: number, raw: any) {
    const v = this.money(raw);
    this.draftDiscount[id] = Math.max(0, v);

    const p = this.findPayment(id);
    if (!p) return;

    const max = this.maxPayFor(p);
    const currentPay = this.draftPay[id] ?? 0;
    if (currentPay > max) this.draftPay[id] = max;
  }

  setPay(id: number, raw: any) {
    const v = this.money(raw);
    const p = this.findPayment(id);
    if (!p) return;

    this.draftPay[id] = Math.min(Math.max(0, v), this.maxPayFor(p));
  }

  maxPayFor(p: PaymentConcept): number {
    const disc = Math.max(0, this.draftDiscount[p.id] ?? 0);
    return Math.max(0, p.pending - disc);
  }

  private findPayment(id: number): PaymentConcept | null {
    for (const childId of Object.keys(this.paymentsByChild)) {
      const list = this.paymentsByChild[Number(childId)] ?? [];
      const found = list.find(x => x.id === id);
      if (found) return found;
    }
    return null;
  }

  // ------------------ Totals ------------------
  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get totals() {
    const all = Object.values(this.paymentsByChild).flat();

    const pending = all.reduce((acc, p) => acc + (p.pending ?? 0), 0);

    let selectedTotal = 0;
    let selectedPending = 0;
    let discounts = 0;
    let toCharge = 0;

    for (const p of all) {
      if (!this.selectedIds.has(p.id)) continue;

      selectedTotal += p.amountTotal;
      selectedPending += p.pending;

      discounts += Math.max(0, this.draftDiscount[p.id] ?? 0);
      toCharge += Math.max(0, this.draftPay[p.id] ?? 0);
    }

    toCharge = Math.min(toCharge, Math.max(0, selectedPending - discounts));

    return {
      pending: this.round2(pending),
      selectedTotal: this.round2(selectedTotal),
      selectedPending: this.round2(selectedPending),
      discounts: this.round2(discounts),
      toCharge: this.round2(toCharge),
    };
  }

  // ------------------ Actions ------------------
  async confirmPayment() {
    if (this.selectedCount === 0 || this.totals.toCharge <= 0) {
      this.toast.warning('Selecciona al menos un concepto con monto válido.');
      return;
    }
    const metodoPago = this.paymentMethod;
    const movements = [];
    const recibosMap = new Map<number, {
      childId: number,
      conceptos: { concepto: string, monto: number }[],
      descuento: number
    }>();

    for (const id of this.selectedIds) {
      const payment = this.findPayment(id);
      if (!payment) continue;

      const paid = this.draftPay[id] ?? 0;
      const discount = this.draftDiscount[id] ?? 0;

      const firstWord = payment.concept?.trim().split(' ')[0]?.toLowerCase();
      const tipo = firstWord === 'mensualidad'
        ? 'MENSUALIDAD'
        : 'SERVICIO';

      movements.push({
        conceptId: id,
        tipo,
        dto: {
          paid,
          discount,
          responsible: this.currentUserName,
          paymentMethod: metodoPago
        }
      });

      if (!recibosMap.has(payment.childId)) {
        recibosMap.set(payment.childId, {
          childId: payment.childId,
          conceptos: [],
          descuento: 0,
        });
      }

      const recibo = recibosMap.get(payment.childId)!;
      recibo.conceptos.push({
        concepto: payment.concept,
        monto: paid
      });

      recibo.descuento += discount;
    }
    const recibos = Array.from(recibosMap.values());
    
    const ok = await this.modal.confirm({
      title: 'Confirmar pago',
      message: `Se registrará un cobro por Bs. ${this.totals.toCharge.toFixed(2)}. ¿Continuar?`,
      tone: 'success',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
    });

    if (!ok) return;
    this.isProcessing = true;
    this.paymentApi.registerMultipleMovements(movements)
      .subscribe({
        next: () => {
          this.facturaPdf(recibos, metodoPago);
          this.toast.success('Pago registrado correctamente');
          this.selectedIds.clear();
          this.draftDiscount = {};
          this.draftPay = {};
          this.fetchPayView(this.idTutor); 
        },
        error: err => {
          console.error(err);
          this.isProcessing = false
          this.toast.error('Error registrando pago');
        },
        complete: () =>{
          this.isProcessing = false 
        }
      });
  }

  async revertMovement(movementId: number) {
    console.log(movementId);
    const ok = await this.modal.confirm({
      title: 'Revertir último movimiento',
      message: '¿Deseas revertir el último pago?',
      tone: 'warning'
    });

    if (!ok) return;

    this.paymentApi.revertMovement(movementId, {
      reason: 'Reversión manual',
      responsible: this.currentUserName
    }).subscribe({
      next: () => {
        this.toast.success('Movimiento revertido');
        this.fetchPayView(this.idTutor);
      },
      error: err => {
        console.error(err);
        this.toast.error('No se pudo revertir');
      }
    });
  }
  /** PDF FACTURA */
  /*** CONVERTIR LOGO PARA PDF */
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
  /*** CONVERTIR NUM EN LETRAS */
  numeroALetras(num: number): string {

  const unidades = [
    '', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'
  ];

  const especiales = [
    'Diez', 'Once', 'Doce', 'Trece', 'Catorce',
    'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'
  ];

  const decenas = [
    '', '', 'Veinte', 'Treinta', 'Cuarenta',
    'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'
  ];

  const centenas = [
    '', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos',
    'Quinientos', 'Seiscientos', 'Setecientos',
    'Ochocientos', 'Novecientos'
  ];

  function convertirMenorMil(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'Cien';

    let texto = '';

    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) {
      texto += centenas[c] + ' ';
    }

    if (d === 1) {
      texto += especiales[u];
      return texto.trim();
    }

    if (d === 2 && u > 0) {
      texto += 'Veinti' + unidades[u].toLowerCase();
      return texto.trim();
    }

    if (d > 1) {
      texto += decenas[d];
      if (u > 0) {
        texto += ' y ' + unidades[u];
      }
      return texto.trim();
    }

    if (u > 0) {
      texto += unidades[u];
    }

    return texto.trim();
  }

  function convertir(n: number): string {

    if (n === 0) return 'Cero';

    let resultado = '';

    const millones = Math.floor(n / 1_000_000);
    const miles = Math.floor((n % 1_000_000) / 1000);
    const resto = n % 1000;

    if (millones > 0) {
      if (millones === 1) {
        resultado += 'Un millón ';
      } else {
        resultado += convertirMenorMil(millones) + ' millones ';
      }
    }

    if (miles > 0) {
      if (miles === 1) {
        resultado += 'Mil ';
      } else {
        resultado += convertirMenorMil(miles) + ' mil ';
      }
    }

    if (resto > 0) {
      resultado += convertirMenorMil(resto);
    }

    return resultado.trim();
  }

  const enteros = Math.floor(num);
  const centavos = Math.round((num - enteros) * 100);

  const letras = convertir(enteros);

  return `${letras} ${centavos.toString().padStart(2,'0')}/100`;
  }
  async facturaPdf(
    movimientos: {
      childId: number,
      conceptos: { concepto: string, monto: number }[],
      descuento: number,
    }[],
    paymentMethod: 'EFECTIVO' | 'QR'
  ) {
    console.log(movimientos, 'factura');
    if (!movimientos.length) {
      this.toast.error('No hay pagos para generar recibo');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [140,216]
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoBase64 = await this.loadImage('assets/images/logo.png');
    const metodoPagoTexto = paymentMethod === 'QR' ? 'QR' : 'EFECTIVO';
    for (let i = 0; i < movimientos.length; i++) {

      if (i > 0) doc.addPage();

      const mov = movimientos[i];
      const child = this.children.find(c => c.id === mov.childId);
      if (!child) continue;

      const subtotal = mov.conceptos.reduce((a,c)=>a+c.monto,0) + mov.descuento;
      const totalRecibido = subtotal - mov.descuento;
      const reciboNumero = this.reciboNum.getNextReciboNumero();

      //let y = 20;

      // ================= HEADER =================

      doc.addImage(logoBase64, 'PNG', 15, 5, 25, 25);

      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      doc.text('UNIDAD EDUCATIVA BILINGÜE MARAVILLAS DEL SABER', pageWidth/2, 15, {align:'center'});

      doc.setFontSize(8);
      doc.setFont('helvetica','normal');
      doc.text('Calle Soruco Nº 310 - Quillacollo, Cochabamba - Bolivia', pageWidth/2, 21, {align:'center'});
      doc.text('Cel. 74375897 - 70386170', pageWidth/2, 26, {align:'center'});

      doc.setDrawColor(180);
      doc.line(15, 32, pageWidth - 10, 32);

      let y = 42;

      // ================= BLOQUE DATOS =================

      const tableStartY = 55;
      const tableWidth = pageWidth * 0.70; 
      const leftTableMargin = (pageWidth - tableWidth) / 2;
      doc.setFontSize(9);
      doc.setFont('helvetica','normal');

      doc.text(
        `Tutor: ${this.tutor.name}   |   Cel: ${this.tutor.phone}`,
        pageWidth / 2,
        tableStartY - 18,
        { align: 'center' }
      );

      doc.text(
        `Estudiante: ${child.name}   |   Curso: ${child.grade} ${child.parallel}`,
        pageWidth / 2,
        tableStartY - 12,
        { align: 'center' }
      );

      doc.text(
        `Forma de pago: ${metodoPagoTexto}   |   Recibido por: ${this.currentUserName}`,
        pageWidth / 2,
        tableStartY - 6,
        { align: 'center' }
      );
      
      // ================= TABLA UNIFICADA =================

      const conceptosLength = mov.conceptos.length;
      const totalDeuda = this.totals.pending - totalRecibido;
      const body = [
        ...mov.conceptos.map(c => [
          c.concepto,
          `Bs. ${c.monto.toFixed(2)}`
        ]),

        ['Total deuda:', `Bs. ${totalDeuda.toFixed(2)}`],
        ['Descuento:', `Bs. ${mov.descuento.toFixed(2)}`],
        [
          { content: 'Total pagado:', styles: { fontStyle: 'bold' as const } },
          { content: `Bs. ${totalRecibido.toFixed(2)}`, styles: { fontStyle: 'bold' as const } }
        ]
      ];

      autoTable(doc,{
        startY: tableStartY,
        margin: { left: leftTableMargin  },
        tableWidth: tableWidth,
        head:[['Concepto','Monto']],
        body: body,
        theme:'grid',
        styles:{
          fontSize:8,
          cellPadding:1
        },
        headStyles:{
          fillColor:[58, 110, 165],
          textColor:255,
          halign:'center'
        },
        columnStyles:{
          0:{ cellWidth: tableWidth * 0.65, halign:'left' },
          1:{ cellWidth: tableWidth * 0.35, halign:'right' }
        },
        didParseCell: function (data) {
          const resumenStart = conceptosLength;

          if (data.row.index >= resumenStart) {
            data.cell.styles.halign = 'right';
          }

          if (data.row.index === resumenStart + 2) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'right';
          }
        }
      });

      y = (doc as any).lastAutoTable.finalY + 7;

      // ================= MONTO EN LETRAS =================

      doc.setFontSize(8);
      doc.setFont('helvetica','italic');
      doc.text(
        `Son: ${this.numeroALetras(totalRecibido)} Bolivianos.`,
        15,
        pageHeight - 25
      );

      // ================= FIRMAS =================

      doc.setLineWidth(0.25);
      doc.setDrawColor(120);

      
    doc.line(50,pageHeight-15,100,pageHeight-15);
    doc.line(pageWidth-100,pageHeight-15,pageWidth-50,pageHeight-15);

    doc.setFontSize(8);
    doc.text('RECIBÍ CONFORME',75,pageHeight-8,{align:'center'});
    doc.text('ENTREGUÉ CONFORME',pageWidth-75,pageHeight-8,{align:'center'});
    }

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url);
  }
  /** Modal Abono */
  studentOptions: { id: number; name: string }[] = [];
  categorias: string[] = [];
  mesesBloqueadosPorCategoria: Record<string, number[]> = {};
  serviciosMap: Record<string, number> = {};
  fetchCategorias(estudianteId: number) {
    const year = new Date().getFullYear();
    this.categorias = [];
    this.mesesBloqueadosPorCategoria = {};
    this.serviciosMap = {};
    forkJoin({
      cuotas: this.estudianteService.getCuotasCreadas(estudianteId, year),
      servicios: this.estudianteService.getServiciosCreados(estudianteId, year)
    }).subscribe({
      next: ({ cuotas, servicios }) => {
        const mapa: Record<string, number[]> = {};
        const mesesCuotas: number[] = Array.isArray(cuotas?.meses_creados)
          ? cuotas.meses_creados.map((m: any) => Number(m))
          : [];

        mapa['Mensualidad'] = mesesCuotas;

        const serviciosArray = Array.isArray(servicios?.servicios_creados)
          ? servicios.servicios_creados
          : [];

        serviciosArray.forEach((s: any) => {

          const nombre = s?.nombre_servicio;
          const mesNumero = Number(s?.mes);
          const servicioId = Number(s?.servicio_id);

          if (!nombre || !Number.isFinite(mesNumero)) return;

          if (!mapa[nombre]) {
            mapa[nombre] = [];
          }

          mapa[nombre].push(mesNumero);
          if(servicioId){
            this.serviciosMap[nombre] = servicioId;
          }
        });

        this.mesesBloqueadosPorCategoria = mapa;
        this.categorias = Object.keys(mapa);
        console.log(this.categorias, this.mesesBloqueadosPorCategoria);
      },
      error: err => console.error(err)
    });
  }
  showModalAbono = false; 
  openModalAbono(){
    this.showModalAbono = true;
  }
  closeModalAbono(){
    this.showModalAbono = false;
  }
  private getServicioIdByNombre(nombre: string): number | null {
    return this.serviciosMap[nombre] ?? null;
  }
  async onSaved(payload: {
    estudiante: number;  
    categoria: string;
    meses: string[];
    montoUnitario: number;
    descuento: number;
    subtotal: number;
    total: number;
    destino: DestinoPago;
    paymentMethod?: 'EFECTIVO' | 'QR';
  }) {

    const year = new Date().getFullYear();

    const monthMap: Record<string, number> = {
      Enero: 1, Febrero: 2, Marzo: 3, Abril: 4,
      Mayo: 5, Junio: 6, Julio: 7, Agosto: 8,
      Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12
    };
    const normalize = (text: string) =>
      text
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const isMensualidad =
    normalize(payload.categoria) === "mensualidad";

    const tipo = isMensualidad ? "MENSUALIDAD" : "SERVICIO";
    this.closeModalAbono();
    
    this.isProcessing = true;

    try {
      const cantidadMeses = payload.meses.length || 1;
      const descuentoPorMes = Math.round((payload.descuento / cantidadMeses) * 100) / 100;
      const movimientosFactura: {
        childId: number,
        conceptos: { concepto: string, monto: number }[],
        descuento: number,
      }[] = [];
      const conceptosFactura: { concepto: string, monto: number }[] = [];
      let descuentoTotal = 0;

      for (const mes of payload.meses) {
        const monthNumber = monthMap[mes];
        if (!monthNumber) continue;

        let created: any;
        if (isMensualidad) {

          created = await firstValueFrom(
            this.paymentApi.createMensualidad({
              estudiante_id: payload.estudiante,
              period: {
                year,
                month: monthNumber
              },
              base_amount: payload.montoUnitario,
              extra_amount: 0,
              discount_amount: descuentoPorMes,
              tipo: "MENSUALIDAD",
              nombre_servicio: null
            })
          );

        } else {

          const servicioId = this.getServicioIdByNombre(payload.categoria);

          if (!servicioId) {
            throw new Error('Servicio no encontrado');
          }

          created = await firstValueFrom(
            this.inscriptionService.enroll({
              estudiante_id: payload.estudiante,
              servicio_id: servicioId,
              period: {
                year,
                month: monthNumber
              },
              base_amount: payload.montoUnitario,
              extra_amount: 0,
              discount_amount: descuentoPorMes
            })
          );

        }
        if (payload.destino === 'PAGAR_AHORA') {

          const conceptId = created?.id;

          if (!conceptId) {
            throw new Error('No se pudo obtener el id del concepto');
          }

          await firstValueFrom(
            this.paymentApi.registerMovement(
              conceptId,
              tipo,
              {
                paid: payload.montoUnitario - descuentoPorMes,
                discount: descuentoPorMes,
                responsible: this.currentUserName,
                metodo_pago: payload.paymentMethod ?? 'EFECTIVO'
              }
            )
          );
          conceptosFactura.push({
            concepto: `${payload.categoria} - ${mes}`,
            monto: payload.montoUnitario - descuentoPorMes
          });

          descuentoTotal += descuentoPorMes;
        }
      }
    
    if (payload.destino === 'PAGAR_AHORA' && conceptosFactura.length) {
      movimientosFactura.push({
        childId: Number( payload.estudiante),
        conceptos: conceptosFactura,
        descuento: descuentoTotal
      });
      await this.facturaPdf(movimientosFactura, payload.paymentMethod ?? 'EFECTIVO');
    }
    this.toast.success('Cargo registrado correctamente');
    this.fetchPayView(this.idTutor);

    } catch (error) {
      this.toast.error('Error registrando cargo');
    } finally{ 
      this.isProcessing = false;
    }
  }
  /***Modal multa */
  showModalMulta = false;
  openModalMulta(){
    this.showModalMulta = true;
  }
  closeModalMulta(){
    this.showModalMulta = false;
  }
  async onSavedMulta(payload: {
    estudiante: number;  
    concepto: string;
    categoria: string;
    montoUnitario: number;
    total: number;
    destino: DestinoPago;
    paymentMethod?: 'EFECTIVO' | 'QR';
  }) {

    const today = new Date();
    const fecha = today.toISOString().split('T')[0]; 
    const month = today.getMonth() + 1;

    this.closeModalMulta();
    this.isProcessing = true;

    const movimientosFactura: {
      childId: number,
      conceptos: { concepto: string, monto: number }[],
      descuento: number,
    }[] = [];

    try {
      const created = await firstValueFrom(
      this.paymentApi.createGasto({
        estudiante_id: payload.estudiante,
        concepto: payload.concepto,
        descripcion: payload.categoria ?? null,
        fecha,
        base_amount: payload.montoUnitario,
        extra_amount: 0,
        discount_amount: 0,
        encargado: this.currentUserName ?? null
      })
    );

      if (payload.destino === 'PAGAR_AHORA') {

        const conceptId = created?.id;

        if (!conceptId) {
          throw new Error('No se pudo obtener el id del concepto');
        }

        await firstValueFrom(
          this.paymentApi.registerMovement(
            conceptId,
            'GASTO_OCASIONAL',
            {
              paid: payload.montoUnitario,
              discount: 0,
              responsible: this.currentUserName,
              metodo_pago: payload.paymentMethod ?? 'EFECTIVO'
            }
          )
        );

        movimientosFactura.push({
          childId: Number(payload.estudiante),
          conceptos: [{
            concepto: payload.concepto,
            monto: payload.montoUnitario
          }],
          descuento: 0,
        });
        await this.facturaPdf(
          movimientosFactura,
          payload.paymentMethod ?? 'EFECTIVO'
        );
      }

      this.toast.success('Cargo registrado correctamente');
      this.fetchPayView(this.idTutor);

    } catch (error) {
      console.error(error);
      this.toast.error('Error registrando cargo');
    } finally { 
      this.isProcessing = false;
    }
  }
  /** ModalEdit */
  showModalEdit = false;
  mode: 'create' | 'edit' = 'edit';
  editValue: Parent | null = null;
  openModalEdit(){
    this.mode = 'edit';
    const today = new Date();

    this.editValue = {
      parent: {
        name: this.tutor?.name ?? '',
        email: this.tutor?.email ?? '',
        phone: this.tutor?.phone ?? '',
      },

      period: {
        year: today.getFullYear(),
        month: today.getMonth() + 1
      },

      students: (this.children ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        parallel: c.parallel,
        monto: c.monto ?? 0
      })),
    };
    this.showModalEdit = true;
  }

  loadingEdit = false;
  closeModalEdit(){
    if(this.loadingEdit) return;
    this.showModalEdit = false;
  }
  async onSavedEdit(event: {mode: Mode, payload: Parent}){
    if (event.mode !== 'edit') {
      await this.modal.alert({
        title: 'Error',
        message: 'Ocurrio un error inesperado, intente otra vez.',
        tone: 'danger'
      });
      return;
    }
    this.loadingEdit = true;
    this.tutorapi.update(this.idTutor, event.payload).subscribe({
      next: () => {
        this.toast.success('Registro actualizado exitosamente.');
        this.loadingEdit = false;
        this.showModalEdit = false;
        this.fetchPayView(this.idTutor);
      },
      error: async (err) => {
        console.error(err);
        this.loadingEdit = false;

        await this.modal.alert({
          title: 'Error',
          message: 'No se pudo actualizar el registro.',
          tone: 'danger'
        });
      }
    });
  }
}
