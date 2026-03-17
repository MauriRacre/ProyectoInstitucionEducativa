import { Component, EventEmitter, HostListener, Input,Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ModalService } from '../../core/swal/swal.service';
import { AuthService } from '../../core/services/auth.service';

type Grade = 'Sala Cuna' | 'Maternal' | 'Preparatorio'| 'Taller Inicial' |'Kinder' | 'Pre-Kinder' | '1er' | '2do' | '3ro' | '4to' | '5to' | '6to' ;
type Parallel = 'A' | 'B' | 'C';

export interface Parent{
    parent:{
        name: string;
        email: string;
        phone: string;
    };
    period:{
      year?: number;
      month?: number;
    }
    students: Array<{
        id?: number;
        name: string;
        grade: Grade;
        parallel: Parallel;
        monto: number;
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

  grades: Grade[] = ['Sala Cuna','Maternal', 'Preparatorio', 'Taller Inicial' ,'Pre-Kinder', 'Kinder','1er', '2do', '3ro', '4to', '5to', '6to'];
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
      id:[seed?.id ?? null],
      name: [seed?.name ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      grade: [((seed?.grade ?? 'Sala Cuna') as Grade), [Validators.required]],
      parallel: [((seed?.parallel ?? 'A') as Parallel), [Validators.required]],
      monto: [seed?.monto ?? 0, [Validators.required, Validators.min(0)]]
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

    this.clearStudents();
    const arr = (v.students ?? []).length ? v.students : [{ name: '', grade: 'Sala Cuna', parallel: 'A' } as any];
    for (const s of arr) this.students.push(this.createStudentGroup(s));
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

  touchedInvalid(ctrlName: string): boolean {
    const c = this.form.get(ctrlName);
    return !!c && c.touched && c.invalid;
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
    const today = new Date();
    const payload: Parent = {
      parent: {
        name: this.form.value.parent!.name!.trim(),
        email: this.form.value.parent!.email!.trim() || '',
        phone: this.form.value.parent!.phone!.trim(),
      },
      period:{
        year: today.getFullYear(),
        month: today.getMonth()+1,
      },
      students: (this.form.value.students ?? []).map((s: any) => {
          const student: any = {
            name: (s.name ?? '').trim(),
            grade: s.grade,
            parallel: s.parallel,
            monto: Number(s.monto ?? 0)
          };

          if (s.id) student.id = s.id;

          return student;
        })
      
    };
    console.log(payload);
    this.submitForm.emit({mode: this.mode, payload});
  }

  c(path: string) {
    return this.form.get(path);
  }

  studentAt(i: number) {
    return this.students.at(i);
  }
}