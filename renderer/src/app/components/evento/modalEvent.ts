import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import {
    FormBuilder,
    Validators,
    ReactiveFormsModule,
    FormGroup
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-modal-event',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './modalEvent.html'
})
export class ModalEventComponent implements OnChanges {

    @Input() open = false;
    @Input() mode: 'create' | 'edit' = 'create';
    @Input() value: any | null = null;
    @Input() loading = false;
    @Input() categories: string[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() submitForm = new EventEmitter<{
        mode: 'create' | 'edit';
        payload: any;
    }>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
        event: ['', [Validators.required, Validators.minLength(5)]],
        concept: ['', [Validators.required, Validators.minLength(5)]],
        category: ['', Validators.required]
        });
    }

    ngOnChanges(changes: SimpleChanges): void {

        if (this.mode === 'edit' && this.value) {
            this.form.patchValue({
                event: this.value.nombre,
                concept: this.value.concepto,
                category: this.value.destino
            });
        }


        if (this.mode === 'create') {
            this.form.reset({
                event: '',
                concept: '',
                category: ''
            });
        }
    }

    c(control: string) {
        return this.form.get(control);
    }

    onSubmit(): void {
    if (this.loading) return;

    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
    }

    const formValue = this.form.value;

    this.submitForm.emit({
        mode: this.mode,
        payload: {
        evento: formValue.event,
        concepto: formValue.concept,
        destino: formValue.category
        }
    });
    }


    onCancel(): void {
        if (this.loading) return;
        this.close.emit();
    }

    onBackdrop(): void {
        this.onCancel();
    }
}
