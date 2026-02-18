import {
    Component,
    EventEmitter,
    Input,
    Output,
    SimpleChanges,
    OnChanges,
    HostListener
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ModalService } from "../../core/swal/swal.service";

export type Mode = 'create' | 'edit';

@Component({
    selector: 'app-modal-user',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './modalUser.html',
})
export class ModalUser implements OnChanges {

    @Input() open = false;
    @Input() loading = false;
    @Input() mode: Mode = 'create';
    @Input() value: any | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() submitForm = new EventEmitter<{ mode: Mode; payload: any }>();

    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private modal: ModalService
    ) {
        this.form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(80)]],
        username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        const openedNow = changes['open']?.currentValue === true;

        if ((openedNow || changes['value']) && this.open) {
        if (this.mode === 'edit' && this.value) {
            this.setFormFromValue(this.value);
        } else {
            this.resetForm();
        }
        }
    }

    private setFormFromValue(v: any): void {
        this.form.patchValue({
            name: v.name ?? '',
            username: v.username ?? '',
            email: v.email ?? '',
        });

        this.form.markAsPristine();
        this.form.markAsUntouched();
    }

    private resetForm(): void {
        this.form.reset({
        name: '',
        username: '',
        email: '',
        });

        this.form.markAsPristine();
        this.form.markAsUntouched();
    }

    touchedInvalid(ctrlName: string): boolean {
        const control = this.form.get(ctrlName);
        return !!control && control.touched && control.invalid;
    }

    onBackdrop() {
        if (!this.loading) this.close.emit();
    }

    async onCancel() {
        if (this.loading) return;

        if (!this.form.dirty) {
        this.close.emit();
        return;
        }

        const ok = await this.modal.confirm({
        title: "¿Descartar cambios?",
        message: "Si sales ahora, no se guardarán los datos ingresados.",
        tone: "warning",
        confirmText: "Descartar",
        cancelText: "Cancelar"
        });

        if (ok) this.close.emit();
    }

    @HostListener('document:keydown.escape')
    onEsc() {
        if (this.open && !this.loading) {
        this.close.emit();
        }
    }

    onSubmit() {
        if (this.loading) return;

        if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
        }

        const payload = {
            nombre: this.form.value.name.trim(),
            username: this.form.value.username.trim(),
            email: this.form.value.email.trim(),
        };

        this.submitForm.emit({ mode: this.mode, payload });
    }
}
