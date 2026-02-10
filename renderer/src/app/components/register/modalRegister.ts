import { Component, EventEmitter, HostListener, Input,Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ModalService } from '../../core/swal/swal.service';

type Grade = 'Kinder' | 'Pre-Kinder' | '1er' | '2do' | '3ro' | '4to' | '5to' | '6to' 
type Parallel = 'A' | 'B' | 'C';

export interface Parent{
    parent:{
        name: string;
        email: string;
        phone: string;
    };
    students: Array<{
        name: string;
        grade: Grade;
        parallel: Parallel;
    }>;
}

export type Mode = 'create' | 'edit';
@Component({
    selector: 'app-modal-register',
    standalone: true,
    imports: [
        CommonModule, 
        ReactiveFormsModule
    ],
    templateUrl: './modalRegister.html',
})
export class ModalRegister {
  @Input() open = false;
  @Input() loading = false;
  @Input() mode :Mode = 'create';
  @Input() value : Parent | null = null; 
  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<{ mode: Mode; payload: Parent}>();

  grades: Grade[] = ['Pre-Kinder', 'Kinder','1er', '2do', '3ro', '4to', '5to'];
  parallels: Parallel[] = ['A', 'B', 'C'];
  form!: FormGroup;
  constructor(private fb: FormBuilder, private modal: ModalService) {
      this.form = this.fb.group({
          parent: this.fb.group({
            name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(80)]],
            email: ['', [Validators.email, Validators.maxLength(120)]],
            phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
          }),
          students: this.fb.array([] as any[]),
      });
      this.ensureAtLeastOneStudent();
  }

    ngOnChanges(changes: SimpleChanges): void {
    // Cuando se abre el modal en modo editar o cambia el value → precargar
    const openedNow = changes['open']?.currentValue === true;

    if ((openedNow || changes['value']) && this.open) {
      if (this.mode === 'edit' && this.value) {
        this.setFormFromValue(this.value);
      } else if (this.mode === 'create') {
        this.resetToCreateDefaults();
      }
    }
  }

  get students(): FormArray {
    return this.form.get('students') as FormArray;
  }

  private createStudentGroup(seed?: Partial<Parent['students'][number]>): FormGroup {
    return this.fb.group({
      name: [seed?.name ?? '', [Validators.required, Validators.minLength(5), Validators.maxLength(80)]],
      grade: [((seed?.grade ?? '1er') as Grade), [Validators.required]],
      parallel: [((seed?.parallel ?? 'A') as Parallel), [Validators.required]],
    });
  }

  private ensureAtLeastOneStudent(): void {
    if (this.students.length === 0) {
      this.students.push(this.createStudentGroup());
    }
  }

  private clearStudents(): void {
    while (this.students.length) this.students.removeAt(0);
  }

  private setFormFromValue(v: Parent): void {
    // parent
    this.form.patchValue({
      parent: {
        name: v.parent?.name ?? '',
        email: v.parent?.email ?? '',
        phone: v.parent?.phone ?? '',
      },
    });

    // students (reconstruir FormArray)
    this.clearStudents();
    const arr = (v.students ?? []).length ? v.students : [{ name: '', grade: '1er', parallel: 'A' } as any];
    for (const s of arr) this.students.push(this.createStudentGroup(s));

    // estado
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private resetToCreateDefaults(): void {
    this.form.reset({
      parent: { name: '', email: '', phone: '' },
    });
    this.clearStudents();
    this.ensureAtLeastOneStudent();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  addStudent() {
    this.students.push(this.createStudentGroup());
  }

  removeStudent(i: number) {
    if (this.students.length <= 1) return; 
    this.students.removeAt(i);
  }

  onBackdrop() {
    if (this.loading) return;
    this.close.emit();
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
      cancelText:  "Cancelar"
    }) 
    if (ok) this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (!this.open || this.loading) return;
    this.close.emit();
  }

  markAllTouched() {
    this.form.markAllAsTouched();
  }

  onSubmit() {
    if (this.loading) return;

    if (this.form.invalid) {
      this.markAllTouched();
      return;
    }

    const payload: Parent = {
      parent: {
        name: this.form.value.parent!.name!.trim(),
        email: this.form.value.parent!.email!.trim(),
        phone: this.form.value.parent!.phone!.trim(),
      },
      students: (this.form.value.students ?? []).map((s: any) => ({
        name: (s.name ?? '').trim(),
        grade: s.grade,
        parallel: s.parallel,
      })),
    };

    this.submitForm.emit({mode: this.mode, payload});
  }

  c(path: string) {
    return this.form.get(path);
  }

  studentAt(i: number) {
    return this.students.at(i);
  }
}