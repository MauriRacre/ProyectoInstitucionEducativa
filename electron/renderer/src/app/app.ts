import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './core/toast/toast.component';
import { SwalComponent } from './core/swal/swal.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, SwalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
