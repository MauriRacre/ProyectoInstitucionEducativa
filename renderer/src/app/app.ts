import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { ToastComponent } from './core/toast/toast.component';
import { SwalComponent } from './core/swal/swal.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, ToastComponent, SwalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
