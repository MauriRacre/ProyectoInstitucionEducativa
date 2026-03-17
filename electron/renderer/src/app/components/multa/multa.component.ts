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

  paymentMethod: 'EFECTIVO' | 'QR' = 'EFECTIVO';

  form!: FormGroup;

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

  private toNumber(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  get montoUnitario(): number {
    return this.toNumber(this.form.get('monto')?.value);
  }

  get total(): number {
    return this.montoUnitario;
  }

  get estudianteNombre(): string {

    const id = Number(this.form.get('estudiante')?.value);
    const encontrado = this.estudiantes.find(e => e.id === id);

    return encontrado?.name ?? '';

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
      monto: number;
      destino: DestinoPago;
      categoria: string;
    };

    this.saved.emit({
      estudiante: v.estudiante,
      concepto: v.concepto,
      categoria: v.categoria,
      montoUnitario: Number(v.monto),
      total: this.total,
      destino: v.destino,
      paymentMethod: this.paymentMethod
    });

    this.closed.emit();

  }

}