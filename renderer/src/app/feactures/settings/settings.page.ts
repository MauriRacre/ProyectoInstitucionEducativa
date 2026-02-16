import { CommonModule } from '@angular/common';
import { afterNextRender, Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService, CategoryDTO } from '../../core/services/categoria.service';
import { ModalService } from '../../core/swal/swal.service';
import { ToastService } from '../../core/toast/toast.service';
import { ModalCourseComponent } from '../../components/course/modalCourse';
import { finalize } from 'rxjs';

type TabKey = 'eventos' | 'cursos' | 'usuarios';

interface UserRow {
  id: number;
  nombre: string;
  usuario: string;
  email: string;
  ping: number; 
}

interface EventRow {
  id: number;
  nombre: string;
  concepto: string;
  destino: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCourseComponent],
  templateUrl: './settings.page.html',
})
export class SettingsComponent implements OnInit{
  constructor(
    private  categoriaService: CategoryService,
    private modal: ModalService,
    private toast: ToastService
  ){}
  courses: CategoryDTO[] = [];
  ngOnInit() {
    this.loadCourses();
  }
  loadCourses(){
    
    this.categoriaService.getAllTwo()
      .subscribe({
        next: (res) => {
          this.courses = res.map(x => ({
            id : x.id,
            name: x.name,
            type: x.type,
            active: x.active,
          }));
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => {
          console.log(this.courses);
        }
      });
  }
  /* Tabs */
  readonly selectedTab = signal<TabKey>('usuarios');
  setTab(tab: TabKey) {
    if (this.selectedTab() === tab) return;
    this.selectedTab.set(tab);
    this.search.set('');
  }
  readonly search = signal<string>('');

  // ===== Data (simulado; reemplaza por tu service) =====
  readonly users = signal<UserRow[]>([
    { id: 1, nombre: 'Juan Pérez', usuario: 'juanp', email: 'juan@mail.com', ping: 42 },
    { id: 2, nombre: 'María Gómez', usuario: 'mariag', email: 'maria@mail.com', ping: 85 },
  ]);

  readonly events = signal<EventRow[]>([
    { id: 1, nombre: 'Kermesse', concepto: 'Entrada', destino: 'Caja' },
    { id: 2, nombre: 'Graduación', concepto: 'Ticket', destino: 'Banco' },
  ]);


  // ===== Helpers =====
  private normalize(input: unknown): string {
    return String(input ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private includes(haystack: unknown, needle: string): boolean {
    if (!needle) return true;
    return this.normalize(haystack).includes(needle);
  }

  // ===== Computed filtered (sin recomputar de más) =====
  readonly q = computed(() => this.normalize(this.search()));

  readonly filteredUsers = computed(() => {
    const q = this.q();
    const rows = this.users();
    if (!q) return rows;
    return rows.filter(r =>
      this.includes(r.nombre, q) ||
      this.includes(r.usuario, q) ||
      this.includes(r.email, q) ||
      this.includes(r.ping, q)
    );
  });

  readonly filteredEvents = computed(() => {
    const q = this.q();
    const rows = this.events();
    if (!q) return rows;
    return rows.filter(r =>
      this.includes(r.nombre, q) ||
      this.includes(r.concepto, q) ||
      this.includes(r.destino, q)
    );
  });

  // Útil para tu "No se encontraron resultados" sin variable "filtered"
  readonly activeCount = computed(() => {
    switch (this.selectedTab()) {
      case 'usuarios': return this.filteredUsers().length;
      case 'eventos': return this.filteredEvents().length;
      case 'cursos': return this.courses.length;
    }
  });

  // ===== TrackBy =====
  trackById = (_: number, item: { id: number }) => item.id;

  // ===== Actions (conecta a modales/services) =====
  onCreate() {
    switch (this.selectedTab()) {
      case 'usuarios':
        // abre modal crear usuario
        break;
      case 'eventos':
        // abre modal crear evento
        break;
      case 'cursos':
        // abre modal crear curso
        break;
    }
  }

  onEdit(row: UserRow | EventRow | CategoryDTO) {
    // abre modal edit con row
    console.log('edit', row);
  }

  async onDelete(row: UserRow | EventRow | CategoryDTO) {
    if (this.selectedTab() === 'usuarios') {
      this.users.set(this.users().filter(x => x.id !== row.id));
    } else if (this.selectedTab() === 'eventos') {
      this.events.set(this.events().filter(x => x.id !== row.id));
    }
  }

  async deleteCourse(id:number){
    try {
        const res = await this.modal.confirm({
          title: 'Eliminar',
          message: '¿Esta seguro de eliminar este curso?',
          tone: 'warning'
        })
        if(!res) this.toast.error('Error inesperado');
        this.categoriaService.delete(id).subscribe({
          next: ()=> {
            this.toast.success('Curso eliminado correctamente.');
            this.loadCourses();
          },
          error: (err) => console.error('Error', err)
        });
        
      } catch (error) {
        this.modal.confirm({
          title:'Error',
          message: 'Error al eliminar un curso, vuelve a intentarlo.',
          tone: 'danger'
        });
      }
  }
  openModalCurso= false;
  mode: 'create' | 'edit'= 'create';
  selected: CategoryDTO | null = null;
  
  createCourse():void{
    this.mode = 'create';
    this.selected = null;
    this.openModalCurso= true;
  }
  
  editCourse(cat: CategoryDTO): void{
    this.mode = 'edit';
    this.selected = cat;
    this.openModalCurso = true;
  }

  onSubmitCourse(event:{mode: 'create'| 'edit'; payload: any}):void{
    const req$ = 
      event.mode === 'create'
      ? this.categoriaService.create(event.payload)
      : this.categoriaService.update(this.selected!.id, event.payload);
      req$.subscribe({
        next:()=>{
          this.openModalCurso = false;
          event.mode === 'create'
          ? this.toast.success('Curso creado exitosamente.')
          : this.toast.success('Curso editado exitosamente.');
          this.loadCourses();
        }
      });
  }

}
