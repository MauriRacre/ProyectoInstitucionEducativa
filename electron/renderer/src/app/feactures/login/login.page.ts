import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.page.html'
})
export class LoginPage {

    @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

    form!: FormGroup;
    loading = false;
    errorMessage = '';

    pinControls: FormControl[] = [];

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.initForm();
    }

    private initForm(): void {
        for (let i = 0; i < 4; i++) {
        this.pinControls.push(
            new FormControl('', [
            Validators.required,
            Validators.pattern('^[0-9]$')
            ])
        );
        }

        this.form = this.fb.group({
        username: ['', Validators.required],
        pin: this.fb.array(this.pinControls)
        });
    }

    get pinArray(): FormArray {
        return this.form.get('pin') as FormArray;
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

    private clearPin(): void {
        this.pinArray.reset();
        this.pinInputs.first?.nativeElement.focus();
    }

    private clearForm(): void {
        this.form.reset();
        this.clearPin();
    }

    login(): void {
        if (this.form.invalid || this.loading) return;

        this.loading = true;
        this.errorMessage = '';

        const username = this.form.value.username;
        const ping = this.pinControls.map(c => c.value).join('');

        this.authService.login({ username, ping }).subscribe({
            next: (user) => {
                this.loading = false;

                // Redirección según rol
                if (user.rol === 'ADMIN') {
                    this.router.navigate(['/']);
                    } else {
                    this.router.navigate(['/']);
                    }
            },
            error: (err) => {
                this.loading = false;

                if (err.status === 401) {
                    this.errorMessage = 'Usuario o PIN incorrectos';
                    this.clearForm();
                } else {
                    this.errorMessage = 'Error del servidor. Intente nuevamente.';
                }
            }
        });
    }
}
