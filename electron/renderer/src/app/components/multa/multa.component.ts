import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';

export type DestinoPago = 'PAGAR_AHORA' | 'AGREGAR_DEUDA';

@Component({
  selector: 'app-modal-multa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './multa.component.html',
})
export class ModalMulta {

  /* =======================
  Inputs / Outputs
  ======================= */

  @Input() open = false;
  @Input() estudiantes: { id: number; name: string }[] = [];

  @Output() estudianteChange = new EventEmitter<number>();
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  /* =======================
  Estado
  ======================= */

  loading = false;
  errorMsg = '';

  paymentMethod: 'cash' | 'qr' = 'cash';

  form!: FormGroup;

  meses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(private fb: FormBuilder) {

    this.form = this.fb.nonNullable.group({
        estudiante: ['', Validators.required],
        concepto: [
            '',
            [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(100)
            ]
        ],
        meses: [<string[]>[], Validators.required],
        monto: [0, [Validators.required, Validators.min(0)]],
        destino: ['PAGAR_AHORA' as DestinoPago, Validators.required],
        categoria: ['MULTA']
    });

  }

  /* =======================
  Reset cuando se cierra
  ======================= */

  ngOnChanges(changes: SimpleChanges) {

    if (changes['open'] && !changes['open'].currentValue) {

      this.form.reset({
        estudiante: '',
        concepto: '',
        meses: [],
        monto: 0,
        destino: 'PAGAR_AHORA',
        categoria: 'MULTA'
      });

    }

  }

  /* =======================
  Helpers UI
  ======================= */

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

  get subtotal(): number {
    return this.countMeses * this.montoUnitario;
  }

  get total(): number {
    return this.subtotal;
  }

  get descuentoExcedeSubtotal(): boolean {
    return false;
  }

  get estudianteNombre(): string {

    const id = Number(this.form.get('estudiante')?.value);
    const encontrado = this.estudiantes.find(e => e.id === id);

    return encontrado?.name ?? '';

  }

  /* =======================
  Meses
  ======================= */

  isMesSelected(mes: string): boolean {
    return this.selectedMeses.includes(mes);
  }

  isMesBloqueado(mes: string): boolean {
    return false;
  }

  toggleMes(mes: string): void {

    const current = new Set(this.selectedMeses);

    if (current.has(mes)) current.delete(mes);
    else current.add(mes);

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

  /* =======================
  Eventos
  ======================= */

  onEstudianteChange(): void {

    const value = this.form.get('estudiante')?.value;
    const id = Number(value);

    if (Number.isFinite(id)) {
      this.estudianteChange.emit(id);
    }

  }

  /* =======================
  Modal
  ======================= */

  onBackdrop(): void {
    if (this.loading) return;
    this.onCancel();
  }

  onCancel(): void {

    if (this.loading) return;

    this.errorMsg = '';

    this.form.reset({
      estudiante: '',
      concepto: '',
      meses: [],
      monto: 0,
      destino: 'PAGAR_AHORA',
      categoria: 'MULTA'
    });

    this.closed.emit();

  }

  /* =======================
  Submit
  ======================= */

  async onSubmit(): Promise<void> {

    this.errorMsg = '';

    if (this.loading) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const v = this.form.getRawValue() as {
      estudiante: number;
      concepto: string;
      meses: string[];
      monto: number;
      destino: DestinoPago;
      categoria: string;
    };

    this.saved.emit({
      estudiante: v.estudiante,
      concepto: v.concepto,
      categoria: v.categoria,
      meses: v.meses,
      montoUnitario: Number(v.monto),
      subtotal: this.subtotal,
      total: this.total,
      destino: v.destino,
      paymentMethod: this.paymentMethod
    });

    this.closed.emit();

  }

}