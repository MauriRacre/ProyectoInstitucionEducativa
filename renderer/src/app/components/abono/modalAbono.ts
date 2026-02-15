import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';

export type DestinoPago = 'PAGAR_AHORA' | 'AGREGAR_DEUDA';

@Component({
  selector: 'app-modal-abono',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modalAbono.html',
})
export class ModalAbono {
  @Input() open = false;
  @Input() estudiantes: string[] = [];
  @Input() categorias : string[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  loading = false;
  errorMsg = '';

  form!: FormGroup;

  meses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  constructor(private fb: FormBuilder) {
    // ✅ OJO: el control se llama "meses" (no "mes") y es string[]
    this.form = this.fb.nonNullable.group({
      estudiante: ['', Validators.required],
      categoria: ['', Validators.required],
      meses: [<string[]>[], Validators.required], // ✅ multi
      monto: [0, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0)]],
      destino: ['PAGAR_AHORA' as DestinoPago, Validators.required],
    });
  }

  // =====================
  // Helpers UI
  // =====================
  touchedInvalid(ctrlName: string): boolean {
    const c = this.form.get(ctrlName);
    return !!c && c.touched && c.invalid;
  }

  get selectedMeses(): string[] {
    return (this.form.get('meses')?.value ?? []) as string[];
  }

  get countMeses(): number {
    return this.selectedMeses.length;
  }

  private toNumber(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  get montoUnitario(): number {
    return this.toNumber(this.form.get('monto')?.value);
  }

  get descuento(): number {
    return this.toNumber(this.form.get('descuento')?.value);
  }

  get subtotal(): number {
    return this.countMeses * this.montoUnitario;
  }

  get total(): number {
    const t = this.subtotal - this.descuento;
    return t < 0 ? 0 : t;
  }

  get descuentoExcedeSubtotal(): boolean {
    return this.descuento > this.subtotal;
  }

  // =====================
  // Meses (chips)
  // =====================
  isMesSelected(mes: string): boolean {
    return this.selectedMeses.includes(mes);
  }

  toggleMes(mes: string): void {
    const current = new Set(this.selectedMeses);
    if (current.has(mes)) current.delete(mes);
    else current.add(mes);

    // ✅ mantener orden según this.meses
    const ordered = this.meses.filter(m => current.has(m));

    this.form.patchValue({ meses: ordered });
    this.form.get('meses')?.markAsTouched();
    this.form.get('meses')?.updateValueAndValidity();
  }

  selectAllMeses(): void {
    this.form.patchValue({ meses: [...this.meses] });
    this.form.get('meses')?.markAsTouched();
    this.form.get('meses')?.updateValueAndValidity();
  }

  clearMeses(): void {
    this.form.patchValue({ meses: [] });
    this.form.get('meses')?.markAsTouched();
    this.form.get('meses')?.updateValueAndValidity();
  }

  // =====================
  // Modal actions
  // =====================
  onBackdrop(): void {
    if (this.loading) return;
    this.onCancel();
  }

  onCancel(): void {
    if (this.loading) return;

    this.errorMsg = '';
    this.form.reset({
      estudiante: '',
      categoria: '',
      meses: [],          
      monto: 0,
      descuento: 0,       
      destino: 'PAGAR_AHORA',
    });

    this.closed.emit();
  }

  async onSubmit(): Promise<void> {
    this.errorMsg = '';

    if (this.loading) return;

    this.form.markAllAsTouched();

    // ✅ bloquear si descuento invalida el total
    if (this.form.invalid || this.descuentoExcedeSubtotal) {
      return;
    }

    const v = this.form.getRawValue() as {
      estudiante: string;
      categoria: string;
      meses: string[];
      monto: number;
      descuento: number;
      destino: DestinoPago;
    };

    this.loading = true;
    try {
      await new Promise(res => setTimeout(res, 600));

      // ✅ emite meses + totales (por si lo usas en backend)
      this.saved.emit({
        estudiante: v.estudiante,
        categoria: v.categoria,
        meses: v.meses,
        montoUnitario: Number(v.monto),
        descuento: Number(v.descuento),
        subtotal: this.subtotal,
        total: this.total,
        destino: v.destino,
      });

      this.onCancel();
    } catch (e) {
      this.errorMsg = 'No se pudo guardar el cargo. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }
}
