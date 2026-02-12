import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './header.html',
})
export class Header {
  mobileMenuOpen = false;
  userMenuOpen = false;

  search = '';

  navItems = [
    { label: 'Directorio', href: '/' , exact: true },
    { label: 'Dashboard', href: '/history' },
    { label: 'Configuración', href: '/settings' }
  ];

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) this.userMenuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) this.mobileMenuOpen = false;
  }

  closeMenus() {
    this.mobileMenuOpen = false;
    this.userMenuOpen = false;
  }
}
