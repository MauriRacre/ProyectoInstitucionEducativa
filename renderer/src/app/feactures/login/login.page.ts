import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    imports:[ CommonModule, ReactiveFormsModule],
    templateUrl: './login.page.html'
})
export class LoginPage {

    @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

    form!: FormGroup;
    loading = false;

    pinControls: FormControl[] = [];

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        for (let i = 0; i < 4; i++) {
            const control = new FormControl('', [
                Validators.required,
                Validators.pattern('[0-9]')
            ]);
            this.pinControls.push(control);
        }

        this.form = this.fb.group({
            username: ['', Validators.required],
            pin: this.fb.array(this.pinControls)
        });
    }

    onPinInput(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;

        if (!/^[0-9]$/.test(input.value)) {
        input.value = '';
        this.pinControls[index].setValue('');
        return;
        }
        if (index < 3) {
        this.pinInputs.toArray()[index + 1].nativeElement.focus();
        }
    }

    onPinKeyDown(event: KeyboardEvent, index: number): void {

        if (event.key === 'Backspace' && !this.pinControls[index].value && index > 0) {
        this.pinInputs.toArray()[index - 1].nativeElement.focus();
        }
    }

    login(): void {
        if (this.form.invalid) return;

        this.loading = true;

        const username = this.form.value.username;
        const ping = this.pinControls.map(c => c.value).join('');

        this.authService.login({ username, ping }).subscribe({
            next: (user) => {
            this.loading = false;
            console.log('Login exitoso', user);

            if (user.rol === 'ADMIN') {
                this.router.navigate(['/']);
            } else {
                this.router.navigate(['/']);
            }
            },
            error: (err) => {
                this.loading = false;
                alert(err.message);
            }
        });
    }
}
