import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
@Component({
    selector: 'app-modal-course',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './modalCourse.html',
})
export class ModalCourseComponent implements OnChanges {

    @Input() open = false;
    @Input() mode: 'create' | 'edit' = 'create';
    @Input() value: any | null = null;
    @Input() loading = false;

    @Output() close = new EventEmitter<void>();
    @Output() submitForm = new EventEmitter<{
        mode: 'create' | 'edit';
        payload: any;
    }>();

    form: FormGroup;

    types = ['MONTHLY' , 'SERVICE' , 'FEE' , 'FINE' , 'OTHER'];

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(5)]],
        type: ['', Validators.required],
        active: [true]
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value'] && this.value && this.mode === 'edit') {
        this.form.patchValue({
            name: this.value.name,
            type: this.value.type,
            active: this.value.active
        });
        }

        if (this.mode === 'create') {
        this.form.reset({
            name: '',
            type: '',
            active: true
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

        this.submitForm.emit({
        mode: this.mode,
        payload: this.form.value
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
