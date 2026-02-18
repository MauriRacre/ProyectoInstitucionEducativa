import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule
} from '@angular/forms';

export type ExpenseMode = 'create' | 'edit';

export interface ExpenseFormValue {
    concept: string;
    monto: number;
}

@Component({
    selector: 'app-gasto-modal',
    imports: [ CommonModule, ReactiveFormsModule],
    templateUrl: './modalGasto.html'
})
export class GastoModal implements  OnChanges {

    @Input() open = false;
    @Input() mode: ExpenseMode = 'create';
    @Input() initialData?: ExpenseFormValue;

    @Output() save = new EventEmitter<ExpenseFormValue>();
    @Output() cancel = new EventEmitter<void>();

    loading = false;

    form!: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            concept: ['', [Validators.required, Validators.minLength(5)]],
            monto: [0, [Validators.required, Validators.min(0.01)]],
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialData'] && this.initialData) {
        this.form.patchValue(this.initialData);
        }

        if (changes['open'] && !this.open) {
        this.form.reset({
            concept: '',
            monto: 0
        });
        this.loading = false;
        }
    }

    touchedInvalid(controlName: keyof ExpenseFormValue): boolean {
        const control = this.form.get(controlName);
        return !!control && control.touched && control.invalid;
    }

    markAllAsTouched(): void {
        this.form.markAllAsTouched();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.markAllAsTouched();
            return;
        }

        const value: ExpenseFormValue = {
            concept: this.form.value.concept!,
            monto: Number(this.form.value.monto)
        };

        this.save.emit(value);
    }


    onCancel(): void {
        if (this.loading) return;
        this.cancel.emit();
    }

    onBackdrop(): void {
        if (this.loading) return;
        this.onCancel();
    }
}
