import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TutorApiService} from '../../core/services/tutor.service';
import { StudentService } from '../../core/services/estudiantes.service';
import { InscriptionService } from '../../core/services/inscription.service';
import { CategoryService } from '../../core/services/categoria.service';
import { ToastService } from '../../core/toast/toast.service';
import { ModalService } from '../../core/swal/swal.service';

interface Course {
  inscripcionId: number;
  servicioId: number;
  nombre: string;
}

interface Child {
  id: number;
  name: string;
  grade: string;
  parallel: string;
  courses: Course[];
}

@Component({
    selector: 'app-course-register',
    imports: [CommonModule, FormsModule],
    templateUrl: './register.page.html'
})
export class RegisterPage implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private tutorService: TutorApiService,
        private studentService: StudentService,
        private incriptionService: InscriptionService,
        private categoryService: CategoryService,
        private toast: ToastService,
        private modal: ModalService
    ){}
    tutor = {
        id: 0,
        name: '',
        phone: '',
        email: ''
    };

    children: Child[] = [];

    ngOnInit(): void {
        const tutorId = Number(this.route.snapshot.paramMap.get('id'));
        if (!tutorId) return;

        this.loadTutor(tutorId);
    }

    private loadTutor(tutorId: number) {

        this.tutorService.getById(tutorId)
            .subscribe({
            next: (res: any) => {

                const tutorData = res.parent ?? res;

                this.tutor = {
                id: tutorData.id,
                name: tutorData.name,
                phone: tutorData.phone,
                email: tutorData.email
                };

                const students = res.students ?? [];
                this.children = [];

                students.forEach((s: any) => {
                this.loadStudentCourses(s.id);
                });

            },
            error: (err) => {
                console.error(err);
                this.toast.error('No se pudo cargar el tutor');
            }
            });

        }
    private loadStudentCourses(studentId: number) {

    this.incriptionService.getByStudentId(studentId)
        .subscribe({
        next: (res: any) => {

            const child: Child = {
            id: res.estudiante.id,
            name: res.estudiante.nombre,
            grade: res.estudiante.grado,
            parallel: res.estudiante.paralelo,
            courses: (res.cursos_extra ?? []).map((c: any) => ({
                inscripcionId: c.inscripcion_id,
                servicioId: c.servicio_id,
                nombre: c.nombre
            }))
            };

            const index = this.children.findIndex(c => c.id === studentId);

            if (index >= 0) {
            this.children[index] = child;
            } else {
            this.children.push(child);
            }

        },
        error: (err) => {
            console.error(err);
            this.toast.error('No se pudieron cargar los cursos del estudiante');
        }
        });

    }
    loadingEnroll = false;
    loadingDelete = false;
    async deleteCourse(childId: number, inscripcionId: number) {

    const ok = await this.modal.confirm({
        title: 'Eliminar inscripción',
        message: 'Esta acción no se puede deshacer',
        tone: 'warning',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
    });

    if (!ok) return;

    this.loadingDelete = true;

    this.incriptionService.unsubscribe(inscripcionId)
        .subscribe({
        next: () => {

            const child = this.children.find(c => c.id === childId);
            if (child) {
            child.courses = child.courses
                .filter(c => c.inscripcionId !== inscripcionId);
            }

            this.toast.success('Curso eliminado correctamente');
            this.loadingDelete = false;
        },
        error: (err) => {
            console.error(err);
            this.toast.error('No se pudo eliminar el curso');
            this.loadingDelete = false;
        }
        });

    }
    showModal = false;
    selectedChildId: number | null = null;
    availableCourses: any[] = [];
    selectedServicioId: number | null = null;
    baseAmount: number | null = null;
    discountAmount: number | null = null;
    modalError = '';
    openEnrollModal(childId: number) {

        this.selectedChildId = childId;
        this.showModal = true;

        this.categoryService.getAllTwo()
            .subscribe(cursos => {
            this.availableCourses = cursos;
            });

    }
    closeModal() {
    this.showModal = false;
    this.selectedServicioId = null;
    this.baseAmount = null;
    this.discountAmount = null;
    this.modalError = '';
    }
    async enrollStudent() {

        if (!this.selectedChildId) return;

        if (!this.validateEnroll()) return;

        const ok = await this.modal.confirm({
            title: 'Confirmar inscripción',
            message: '¿Desea inscribir al estudiante en este curso?',
            tone: 'success',
            confirmText: 'Inscribir',
            cancelText: 'Cancelar'
        });

        if (!ok) return;

        this.loadingEnroll = true;

        const year = new Date().getFullYear();

        this.incriptionService.enroll({
            estudiante_id: this.selectedChildId,
            servicio_id: this.selectedServicioId!,
            period: { year },
            base_amount: this.baseAmount!,
            discount_amount: this.discountAmount ?? 0
        })
        .subscribe({
            next: () => {

            this.toast.success('Estudiante inscrito correctamente');

            this.loadStudentCourses(this.selectedChildId!);

            this.closeModal();
            this.loadingEnroll = false;
            },
            error: (err) => {
            console.error(err);
            this.toast.error('No se pudo inscribir al estudiante');
            this.loadingEnroll = false;
            }
        });

        }
    private validateEnroll(): boolean {

  if (!this.selectedServicioId) {
    this.modalError = 'Seleccione un curso.';
    return false;
  }

  if (this.baseAmount == null || this.baseAmount <= 0) {
    this.modalError = 'El monto base debe ser mayor a 0.';
    return false;
  }

  if (this.discountAmount != null && this.discountAmount < 0) {
    this.modalError = 'El descuento no puede ser negativo.';
    return false;
  }

  if ((this.discountAmount ?? 0) > this.baseAmount) {
    this.modalError = 'El descuento no puede superar el monto base.';
    return false;
  }

  this.modalError = '';
  return true;
}
}