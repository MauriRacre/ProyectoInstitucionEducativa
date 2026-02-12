import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TabKey = 'eventos' | 'cursos' | 'usuarios';

interface UserRow {
  id: number;
  nombre: string;
  usuario: string;
  email: string;
  ping: number; // ms o valor que manejes
}

interface EventRow {
  id: number;
  nombre: string;
  concepto: string;
  destino: string;
}

interface CourseRow {
  id: number;
  grado: string;
  parallel: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.page.html',
})
export class SettingsComponent {
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

  readonly courses = signal<CourseRow[]>([
    { id: 1, grado: '1er', parallel: 'A' },
    { id: 2, grado: '2do', parallel: 'B' },
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

  readonly filteredCourses = computed(() => {
    const q = this.q();
    const rows = this.courses();
    if (!q) return rows;
    return rows.filter(r =>
      this.includes(r.grado, q) ||
      this.includes(r.parallel, q)
    );
  });

  // Útil para tu "No se encontraron resultados" sin variable "filtered"
  readonly activeCount = computed(() => {
    switch (this.selectedTab()) {
      case 'usuarios': return this.filteredUsers().length;
      case 'eventos': return this.filteredEvents().length;
      case 'cursos': return this.filteredCourses().length;
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

  onEdit(row: UserRow | EventRow | CourseRow) {
    // abre modal edit con row
    console.log('edit', row);
  }

  onDelete(row: UserRow | EventRow | CourseRow) {
    if (this.selectedTab() === 'usuarios') {
      this.users.set(this.users().filter(x => x.id !== row.id));
    } else if (this.selectedTab() === 'eventos') {
      this.events.set(this.events().filter(x => x.id !== row.id));
    } else {
      this.courses.set(this.courses().filter(x => x.id !== row.id));
    }
  }
}
