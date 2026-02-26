import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InscriptionService } from '../../core/services/inscription.service';

interface Tutor {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Child {
  id: number;
  name: string;
  grade: string;
  parallel: string;
  courses: any[];
}

@Component({
  selector: 'app-course-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.page.html'
})
export class RegisterPage implements OnInit {

  tutor!: Tutor;
  children: Child[] = [];

  private tutorId!: number;
  private year = new Date().getFullYear();

  loading = false;

  constructor(
    private route: ActivatedRoute,
    private inscriptionService: InscriptionService
  ) {}

  // ================================
  // INIT
  // ================================
  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = Number(params.get('id'));
      if (!id) {
        console.error('TutorId inválido');
        return;
      }

      this.tutorId = id;
      this.loadData();
    });
  }

  // ================================
  // LOAD DATA
  // ================================
  private loadData(): void {

    this.loading = true;

    this.inscriptionService
      .getInscriptionView(this.tutorId, this.year, true)
      .subscribe({
        next: (res) => {

          this.tutor = res.tutor;

          this.children = res.children.map(child => ({
            id: child.id,
            name: child.name,
            grade: child.grade,
            parallel: child.parallel,
            courses: res.paymentsByChild[child.id] || []
          }));

          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  // ================================
  // INSCRIBIR
  // ================================
  addCourse(childId: number): void {

    const servicioId = Number(prompt('ID del servicio:'));
    if (!servicioId) return;

    const base = Number(prompt('Monto base:'));
    if (!base || base <= 0) return;

    const month = new Date().getMonth() + 1;

    this.inscriptionService.enroll({
      estudiante_id: childId,
      servicio_id: servicioId,
      period: { year: this.year, month },
      base_amount: base
    }).subscribe({
      next: () => {
        alert('Inscripción exitosa');
        this.loadData(); 
      },
      error: err => console.error(err)
    });
  }

  // ================================
  // DESINSCRIBIR
  // ================================
  deleteCourse(registroId: number): void {

    if (!confirm('¿Desinscribir?')) return;

    this.inscriptionService
      .unsubscribe(registroId)
      .subscribe({
        next: () => {
          alert('Desinscrito correctamente');
          this.loadData(); 
        },
        error: err => console.error(err)
      });
  }
}