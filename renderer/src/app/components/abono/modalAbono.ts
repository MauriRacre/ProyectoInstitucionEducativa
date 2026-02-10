import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';

export type DestinoPago='PAGAR_AHORA' | 'AGREGAR_DEUDA';

@Component({
    selector: 'app-modal-abono',
    standalone: true,
    imports: [
        CommonModule, 
        ReactiveFormsModule
    ],
    templateUrl: './modalAbono.html',
})
export class ModalAbono {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{
    estudiante: string;
    categoria: string;
    mes: string;
    monto: number;
    destino: DestinoPago;
  }>();

  loading = false;
  errorMsg = '';
  form!: FormGroup;
  estudiantes: string[] = ['Juan Pérez', 'María Gómez', 'Carlos Rojas'];
  categorias: string[] = ['Inscripción', 'Mensualidad', 'Materiales', 'Multa'];
  meses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      estudiante: ['', Validators.required],
      categoria: ['', Validators.required],
      mes: ['', Validators.required],
      monto: [0, [Validators.required, Validators.min(0)]],
      destino: ['PAGAR_AHORA' as DestinoPago, Validators.required],
    });
  }

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
      mes: '',
      monto: 0,
      destino: 'PAGAR_AHORA',
    });
    this.closed.emit();
  }

  touchedInvalid(ctrlName: string): boolean {
    const c = this.form.get(ctrlName);
    return !!c && c.touched && c.invalid;
  }

  async onSubmit(): Promise<void> {
    this.errorMsg = '';

    if (this.loading) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    this.loading = true;
    try {
      // Simula request (reemplaza con tu service)
      await new Promise(res => setTimeout(res, 600));

      this.saved.emit({
        estudiante: v.estudiante,
        categoria: v.categoria,
        mes: v.mes,
        monto: Number(v.monto),
        destino: v.destino,
      });

      // cerrar y reset
      this.onCancel();
    } catch (e) {
      this.errorMsg = 'No se pudo guardar el cargo. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }
}