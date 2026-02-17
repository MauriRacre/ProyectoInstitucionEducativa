import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
  roles?: string[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './header.html',
})

export class Header implements OnInit {
  mobileMenuOpen = false;
  userMenuOpen = false;

  userRole: string | null = null;
  userName= '';
  username= '';

  navItems: NavItem[]= [];
  constructor(
    private authService: AuthService,
    private router: Router
  ){}

  ngOnInit():void{
    const user = this.authService.getUser();
    this.userRole = user?.rol ?? null;
    this.userName = user?.nombre ?? '';
    this.username = user?.username ?? '';
    this.buildNav();
    console.log('Nombre:', user);
  }

  private buildNav(): void{
    const allItems: NavItem[] = [
      { label: 'Directorio', href: '/', exact: true, roles: ['ADMIN', 'USER'] },
      { label: 'Dashboard', href: '/history', roles: ['ADMIN', 'USER'] },
      { label: 'Configuración', href: '/settings', roles: ['ADMIN'] }
    ];

    this.navItems = allItems.filter(item =>
      item.roles?.includes(this.userRole ?? '')
    );
  }
  
  get initials(): string {
    if (!this.userName) return '';

    const names = this.userName.split(' ');
    return names.length === 1
      ? names[0].charAt(0).toUpperCase()
      : (names[0][0] + names[1][0]).toUpperCase();
  }
  
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) this.userMenuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    //if (this.userMenuOpen) this.mobileMenuOpen = false;
  }

  closeMenus() {
    this.mobileMenuOpen = false;
    this.userMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (!target.closest('.user-menu-container')) {
      this.userMenuOpen = false;
    }
  }
}
