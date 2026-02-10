import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../core/swal/swal.service';
import { ToastService } from '../../core/toast/toast.service';
import { ModalAbono, DestinoPago } from '../../components/abono/modalAbono';
import { ModalRegister, Mode, Parent } from '../../components/register/modalRegister';
type Parallel = 'A' | 'B' | 'C';
type Grade = 'Kinder' | 'Pre-Kinder' | '1er' | '2do' | '3ro' | '4to' | '5to' | '6to';

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
}

interface PaymentHistoryItem {
  id: number;
  dateISO: string;        
  conceptLabel: string;   
  paid: number;           
  discount: number;   
  appliedTotal: number;    
  note?: string;
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

@Component({
    selector: 'app-pay-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalAbono, ModalRegister
    ],
    templateUrl: './pay.page.html'
})
export class PayPage {
  constructor(
    private modal: ModalService,
    private toast: ToastService
  ) {}

  tutor: Tutor = {
    id: 1,
    name: 'Roberto Alvarado',
    phone: '+591 65859748',
    email: 'roberto444@gmail.com',
  };

  children: Child[] = [
    { id: 101, name: 'Juana Alvarado Gomez', grade: '3ro', parallel: 'A' },
    { id: 102, name: 'Lucas Alvarado Gomez', grade: '1er', parallel: 'B' },
  ];

  paymentsByChild: Record<number, PaymentConcept[]> = {
    101: [
      {
        id: 1001,
        childId: 101,
        concept: 'Mensualidad Febrero',
        amountTotal: 450,
        pending: 150, // ya pagó 300
        history: [
          { id: 1, dateISO: '2026-02-16', conceptLabel: 'Mensualidad Febrero', paid: 200, discount: 10, appliedTotal: 0 },
          { id: 2, dateISO: '2026-02-01', conceptLabel: 'Mensualidad Febrero', paid: 110, discount: 0, appliedTotal: 0 },
        ],
      },
      {
        id: 1002,
        childId: 101,
        concept: 'Materiales',
        amountTotal: 120,
        pending: 60,
        history: [{ id: 3, dateISO: '2026-01-25', conceptLabel: 'Materiales', paid: 60, discount: 0, appliedTotal: 0 }],
      },
    ],
    102: [
      {
        id: 2001,
        childId: 102,
        concept: 'Mensualidad Febrero',
        amountTotal: 450,
        pending: 450,
        history: [],
      },
      {
        id: 2002,
        childId: 102,
        concept: 'Transporte',
        amountTotal: 80,
        pending: 0,
        history: [{ id: 4, dateISO: '2026-02-03', conceptLabel: 'Transporte', paid: 80, discount: 0, appliedTotal: 0 }],
      },
    ],
  };

  
  selectedIds = new Set<number>();

  draftDiscount: Partial<Record<number, number>> = {};
  draftPay: Partial<Record<number, number>> = {};

  
  historyOpen = new Set<number>();

 
  pageSize = 6;
  childPage: Record<number, number> = {};

  // ------------------ UI helpers ------------------
  trackByChildId = (_: number, c: Child) => c.id;
  trackByPaymentId = (_: number, p: PaymentConcept) => p.id;
  trackByHistoryId = (_: number, h: PaymentHistoryItem) => h.id;

  formatDate(dateISO: string): string {
    const d = new Date(dateISO + 'T00:00:00');
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
  private ensureChildPage(childId: number) {
    if (!this.childPage[childId]) this.childPage[childId] = 1;
  }

  childTotalPages(childId: number): number {
    const total = this.paymentsByChild[childId]?.length ?? 0;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  childPageStart(childId: number): number {
    this.ensureChildPage(childId);
    return (this.childPage[childId] - 1) * this.pageSize;
  }

  childPageEnd(childId: number): number {
    const total = this.paymentsByChild[childId]?.length ?? 0;
    return Math.min(this.childPageStart(childId) + this.pageSize, total);
  }

  pagedPayments(childId: number): PaymentConcept[] {
    this.ensureChildPage(childId);
    const totalPages = this.childTotalPages(childId);
    if (this.childPage[childId] > totalPages) this.childPage[childId] = totalPages;

    const start = this.childPageStart(childId);
    return (this.paymentsByChild[childId] ?? []).slice(start, start + this.pageSize);
  }

  goToChildPage(childId: number, p: number) {
    const total = this.childTotalPages(childId);
    if (p < 1 || p > total) return;
    this.childPage[childId] = p;
  }

  visiblePages(childId: number): (number | '...')[] {
    this.ensureChildPage(childId);
    const total = this.childTotalPages(childId);
    const current = this.childPage[childId];
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
    const v = this.toMoney(raw);
    this.draftDiscount[id] = Math.max(0, v);

    const p = this.findPayment(id);
    if (!p) return;

    const max = this.maxPayFor(p);
    const currentPay = this.draftPay[id] ?? 0;
    if (currentPay > max) this.draftPay[id] = max;
  }

  setPay(id: number, raw: any) {
    const v = this.toMoney(raw);
    const p = this.findPayment(id);
    if (!p) return;

    this.draftPay[id] = Math.min(Math.max(0, v), this.maxPayFor(p));
  }

  maxPayFor(p: PaymentConcept): number {
    const disc = Math.max(0, this.draftDiscount[p.id] ?? 0);
    return Math.max(0, p.pending - disc);
  }

  private toMoney(v: any): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
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

    // clamp
    toCharge = Math.min(toCharge, Math.max(0, selectedPending - discounts));

    return {
      pending: this.round2(pending),
      selectedTotal: this.round2(selectedTotal),
      selectedPending: this.round2(selectedPending),
      discounts: this.round2(discounts),
      toCharge: this.round2(toCharge),
    };
  }

  private round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  // ------------------ Actions ------------------
  async confirmPayment() {
    if (this.selectedCount === 0 || this.totals.toCharge <= 0) {
      this.toast.warning('Selecciona al menos un concepto con monto válido.');
      return;
    }

    const ok = await this.modal.confirm({
      title: 'Confirmar pago',
      message: `Se registrará un cobro por Bs. ${this.totals.toCharge.toFixed(2)}. ¿Continuar?`,
      tone: 'success',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
    });

    if (!ok) return;

    // Aplica pago + descuento y registra en historial (demo)
    const all = Object.values(this.paymentsByChild).flat();
    const todayISO = new Date().toISOString().slice(0, 10);

    for (const p of all) {
      if (!this.selectedIds.has(p.id)) continue;

      const disc = Math.max(0, this.draftDiscount[p.id] ?? 0);
      const pay = Math.max(0, this.draftPay[p.id] ?? 0);

      const prevPending = p.pending;
      const appliedTotal = this.round2(Math.min(pay + disc, prevPending));
      p.pending = this.round2(Math.max(0, prevPending - appliedTotal));

      const movement: PaymentHistoryItem = {
        id: Date.now() + p.id,
        dateISO: todayISO,
        conceptLabel: p.concept,
        paid: this.round2(pay),
        discount: this.round2(disc),
        appliedTotal,
        note: 'Registro desde pantalla de cobro',
      };

      p.history = [movement, ...(p.history ?? [])];
    }

    // Limpieza
    this.selectedIds.clear();
    this.draftDiscount = {};
    this.draftPay = {};

    this.toast.success('Pago registrado correctamente');
  }

  async revertLastMovement(p: PaymentConcept) {
    const last = (p.history ?? [])[0];
    if (!last) {
      this.toast.warning('No hay movimientos para revertir.');
      return;
    }
    if (last.reverted) {
      this.toast.warning('El último movimiento ya fue revertido.');
      return;
    }

    const ok = await this.modal.confirm({
      title: 'Revertir último movimiento',
      message: `Se revertirá el último pago: +Bs. ${last.paid.toFixed(2)} y descuento Bs. ${last.discount.toFixed(2)}. ¿Continuar?`,
      tone: 'warning',
      confirmText: 'Revertir',
      cancelText: 'Cancelar',
    });

    if (!ok) return;

    // ✅ Revertir: devolvemos al pendiente lo que se aplicó
    p.pending = this.round2((p.pending ?? 0) + (last.appliedTotal ?? (last.paid + last.discount)));

    // Opción A: eliminar el movimiento
    //p.history = p.history.slice(1);

    // Opción B (auditoría): marcar como revertido y mantenerlo
    last.reverted = true;

    this.toast.success('Último movimiento revertido');
  }
  /** Modal Abono */
  showModalAbono = false; 
  openModalAbono(){
    this.showModalAbono = true;
  }
  closeModalAbono(){
    this.showModalAbono = false;
  }
  onSaved( payload: {
    estudiante: string;
    categoria: string;
    mes: string;
    monto: number;
    destino: DestinoPago;
  }){
    this.toast.success('Abono guardado correctamente');
    this.closeModalAbono();
  }
  /** ModalEdit */
  showModalEdit = false;
  mode: 'create' | 'edit' = 'edit';
  editValue: Parent | null = null;
  openModalEdit(){
    this.mode = 'edit';
    this.editValue = null;
    this.showModalEdit = true;
  }
  closeModalEdit(){
    this.showModalEdit = false;
  }
  onSavedEdit(event: {mode: Mode, payload: Parent}):void{
    this.showModalEdit = false;
    const { mode, payload } = event;

    if (mode === 'edit') {
      // update
    } else {
      // create
    }

  }
}
