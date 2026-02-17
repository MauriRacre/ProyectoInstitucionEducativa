import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { CategoryService, CategoryDTO } from '../../core/services/categoria.service';
import { EventoService } from '../../core/services/event.service';
import { UserService, User } from '../../core/services/user.service';

import { ModalService } from '../../core/swal/swal.service';
import { ToastService } from '../../core/toast/toast.service';

import { ModalCourseComponent } from '../../components/course/modalCourse';
import { ModalEventComponent } from '../../components/evento/modalEvent';
import { ModalUser } from '../../components/user/modalUser';

type TabKey = 'eventos' | 'cursos' | 'usuarios';

interface EventRow {
  id: number;
  nombre: string;
  concepto: string;
  destino: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCourseComponent, ModalEventComponent, ModalUser],
  templateUrl: './settings.page.html',
})
export class SettingsComponent implements OnInit{
  constructor(
    private  categoriaService: CategoryService,
    private eventService: EventoService,
    private userService: UserService,
    private modal: ModalService,
    private toast: ToastService
  ){}
  
  courses: CategoryDTO[] = [];
  events: EventRow[] = [];
  users: User[] = [];
  categories: string[] = [];
  loading = false;

  ngOnInit() {this.loadAll();}

  loadAll(){
    this.loadUser();
    this.loadCourses();
    this.loadEvent();
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
  loadEvent(){
    this.eventService.list().subscribe({
      next: (res) => {
        this.events = res.items.map(x =>({
          id: x.id,
          nombre: x.evento,
          concepto: x.concepto,
          destino: x.destino,
        }));
        console.log(this.events);
      },
      error: (err) =>{
        console.log(err);
      }
    })
  }
  
  loadCategories(): void {
    this.categoriaService.getCoursesAll().subscribe({
      next: (res: string[]) => {
        this.categories = res;
        console.log(this.categories);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  loadUser() {
    this.loading = true;
    this.userService.list()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.users = res.items;
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  /* Tabs */
  readonly selectedTab = signal<TabKey>('usuarios');
  readonly search = signal<string>('');

  setTab(tab: TabKey) {
    if (this.selectedTab() === tab) return;
    this.selectedTab.set(tab);
    this.search.set('');
  }

  readonly activeCount = computed(() => {
    switch (this.selectedTab()) {
      case 'usuarios': return this.users.length;
      case 'eventos': return this.events.length;
      case 'cursos': return this.courses.length;
    }
  });

  trackById = (_: number, item: { id: number }) => item.id;
  /** Users */
  openModalUser = false;
  modeUser: 'create' | 'edit' = 'create';
  selectedUser: User | null = null;
  createUser(): void{
    this.modeUser = 'create';
    this.selectedUser = null;
    this.openModalUser = true;
    this.loadUser();
  }
  editUser(user: User): void {
    this.modeUser = 'edit';
    this.selectedUser = user;
    this.openModalUser = true;
    this.loadUser();
  }
  onSubmitUser(event:{mode: 'create'| 'edit'; payload: any}):void{
    const req$ = 
      event.mode === 'create'
      ? this.userService.create(event.payload)
      : this.userService.update(this.selectedUser!.id, event.payload);
      req$.subscribe({
        next:()=>{
          this.openModalUser = false;
          event.mode === 'create'
          ? this.toast.success('Usuario creado exitosamente.')
          : this.toast.success('Usuario editado exitosamente.');
          this.loadUser();
        }
      });
  }
  /**Evento */
  openModalEvent = false;
  modeEvent: 'create' | 'edit'= 'create';
  selectedEvent: EventRow| null = null;
  createEvent():void{
    this.modeEvent = 'create';
    this.selectedEvent = null;
    this.openModalEvent= true;
    this.loadCategories();
  }
  editEvent(evento: EventRow): void{
    this.modeEvent = 'edit';
    this.selectedEvent = evento;
    this.openModalEvent = true;
    this.loadCategories();
  }
  onSubmitEvent(event:{mode: 'create'| 'edit'; payload: any}):void{
    const req$ = 
      event.mode === 'create'
      ? this.eventService.create(event.payload)
      : this.eventService.update(this.selectedEvent!.id, event.payload);
      req$.subscribe({
        next:()=>{
          this.openModalEvent = false;
          event.mode === 'create'
          ? this.toast.success('Evento creado exitosamente.')
          : this.toast.success('Evento editado exitosamente.');
          this.loadEvent();
        }
      });
  }
  async deleteEvent(id:number){
    try {
        const res = await this.modal.confirm({
          title: 'Eliminar',
          message: '¿Esta seguro de eliminar este evento?',
          tone: 'warning'
        })
        if(!res) return;
        this.eventService.delete(id).subscribe({
          next: ()=> {
            this.toast.success('Evento eliminado correctamente.');
            this.loadEvent();
          },
          error: (err) => console.error('Error', err)
        });
        
      } catch (error) {
        this.modal.confirm({
          title:'Error',
          message: 'Error al eliminar un evento, vuelve a intentarlo.',
          tone: 'danger'
        });
      }
  }
  /** Course */
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
  async deleteCourse(id:number){
    try {
        const res = await this.modal.confirm({
          title: 'Eliminar',
          message: '¿Esta seguro de eliminar este curso?',
          tone: 'warning'
        })
        if(!res) return;
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
}
