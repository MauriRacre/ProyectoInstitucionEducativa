import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { SimpleChanges } from '@angular/core';
export type DestinoPago = 'PAGAR_AHORA' | 'AGREGAR_DEUDA';

@Component({
  selector: 'app-modal-abono',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modalAbono.html',
})
export class ModalAbono {
  @Input() open = false;
  @Input() estudiantes:{ id: number; name: string }[] = [];
  @Input() categorias : string[] = [];
  @Input() mesesBloqueadosPorCategoria: Record<string, number[]> = {};
  @Output() estudianteChange = new EventEmitter<number>();
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  loading = false;
  errorMsg = '';

  form!: FormGroup;

  meses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && !changes['open'].currentValue) {
      this.form.reset({
        estudiante: '',
        categoria: '',
        meses: [],
        monto: 0,
        descuento: 0,
        destino: 'PAGAR_AHORA',
      });
    }
  }
  constructor(private fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      estudiante: ['', Validators.required],
      categoria: ['', Validators.required],
      meses: [<string[]>[], Validators.required], 
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

  get estudianteNombre(): string {
    const id = Number(this.form.get('estudiante')?.value);
    const encontrado = this.estudiantes.find(e => e.id === id);
    return encontrado?.name ?? '';
  }

  get mesesBloqueadosActual(): number[] {
    const categoria = this.form.get('categoria')?.value;
    return this.mesesBloqueadosPorCategoria[categoria] || [];
  }
  // =====================
  // Meses (chips)
  // =====================
  isMesSelected(mes: string): boolean {
    return this.selectedMeses.includes(mes);
  }
  private mesToNumber: Record<string, number> = {
    Enero: 1,
    Febrero: 2,
    Marzo: 3,
    Abril: 4,
    Mayo: 5,
    Junio: 6,
    Julio: 7,
    Agosto: 8,
    Septiembre: 9,
    Octubre: 10,
    Noviembre: 11,
    Diciembre: 12
  };
  isMesBloqueado(mes: string): boolean {
    const numero = this.mesToNumber[mes];
    return this.mesesBloqueadosActual.includes(numero);
  }
  onEstudianteChange(): void {
    const value = this.form.get('estudiante')?.value;
    const id = Number(value);
    if (Number.isFinite(id)) {
      this.estudianteChange.emit(id);
    }
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

    if (this.form.invalid || this.descuentoExcedeSubtotal) {
      return;
    }
    const v = this.form.getRawValue() as {
      estudiante: number;
      categoria: string;
      meses: string[];
      monto: number;
      descuento: number;
      destino: DestinoPago;
    };

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
    this.closed.emit();
      
  }
  private setFormDisabled(disabled: boolean) {
    if (disabled) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }

}
