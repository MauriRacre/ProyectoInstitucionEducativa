import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../components/header/header';
@Component({
    selector: 'app-private-layout',
    standalone: true,
    imports: [RouterOutlet, Header],
    template: `
        <app-header></app-header>
        <main class="min-h-screen">
        <router-outlet></router-outlet>
        </main>
    `
})
export class PrivateLayoutComponent {}
