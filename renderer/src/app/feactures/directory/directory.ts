import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast/toast.service';
import { ModalService } from '../../core/swal/swal.service';
import { ModalRegister } from '../../components/register/modalRegister';
import { RouterLink } from "@angular/router";
import { TutorApiService, TutorStatusFilter, TutorListItem, TutorListResponse } from '../../core/services/tutor.service';
import { finalize } from 'rxjs';

type TabKey = 'all' | 'debt' | 'ok';

@Component({
    selector: 'app-directory',
    standalone: true,
    imports: [
    CommonModule,
    FormsModule,
    ModalRegister,
    RouterLink
],
    templateUrl: './directory.html',
})
export class Directory implements OnInit{
    constructor(
        private toast: ToastService,
        private modal: ModalService,
        private tutorapi: TutorApiService
    ){}
    query = '';
    selectedTab: TabKey = 'all';

    page = 1;
    pageSize = 10;

    tutors: TutorListItem[]=[];
    total= 0;
    isLoading = false;
    ngOnInit(): void {
        this.loadTutors();
    }
    private tabToStatus(tab:TabKey): TutorStatusFilter{
        if(tab === 'debt') return 'DEBT';
        if(tab === 'ok') return 'OK';
        return 'ALL';
    }
    loadTutors(): void {
        this.isLoading = true;

        this.tutorapi.list({
            q: this.query?.trim() ?? '',
            status: this.tabToStatus(this.selectedTab),
            page: this.page,
            pageSize: this.pageSize,
        })
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
            next: (res: TutorListResponse) => {

            this.tutors = res.items.map((x: any) => ({
                id: Number(x.id),
                name: x.name,
                email: x.email ?? '',
                phone: x.phone ?? '',
                students: x.students ?? [],
                balance: Number(x.balance ?? 0),
            }));

            this.total = res.total;
            if (this.selectedTab === 'all') {
                const debt = this.tutors.filter(t => t.balance < 0).length;
                const ok = this.tutors.filter(t => t.balance >= 0).length;

                this.counts = {
                    all: this.total,
                    debt,
                    ok
                };
            }
            },
            error: () => {
                this.toast.error('No se pudo cargar el directorio.');
                this.tutors = [];
                this.counts = { all: 0, debt: 0, ok: 0 };
                this.total = 0;
            },
            complete: () => {
                this.isLoading = false;
                console.log(this.tutors);
            }
        });
        }

    get pagedTutors(): TutorListItem[]{
        return this.tutors;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.total / this.pageSize));
    }

    get pageStart(): number {
        return (this.page - 1) * this.pageSize;
    }

    get pageEnd(): number {
        return Math.min(this.pageStart + this.pageSize, this.total);
    }

    counts = {all: 0, debt: 0, ok:0};


    setTab(tab: TabKey) {
        this.selectedTab = tab;
        this.page = 1;
        this.loadTutors();
    }

    onQueryChange() {
        this.page = 1;
        this.loadTutors();
    }

    nextPage() {
        this.page = Math.min(this.totalPages, this.page + 1);
    }

    prevPage() {
        this.page = Math.max(1, this.page - 1);
    }
    goToPage(p: number) {
        if (p < 1 || p > this.totalPages) return;
        this.page = p;
        this.loadTutors();
    }
    get visiblePages(): (number | '...')[] {
        const pages: (number | '...')[] = [];
        const total = this.totalPages;
        const current = this.page;
        const delta = 1; 

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
            return pages;
        }

        pages.push(1);

        if (current > 3) pages.push('...');

        const start = Math.max(2, current - delta);
        const end = Math.min(total - 1, current + delta);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (current < total - 2) pages.push('...');

        pages.push(total);

        return pages;
    }

    trackById = (_: number, item: TutorListItem) => item.id;
    openModal = false;
    saving = false;
    mode: 'create' | 'edit' = 'create';
    createValue: TutorListItem |null = null;
    onNewTutor() {
        this.mode = 'create';
        this.openModal = true;
    }
    async onRegister(event: { mode: 'create' | 'edit'; payload: any }) {
        this.saving = true;
        if (event.mode !== 'create') {
            await this.modal.alert({
                title: 'Error',
                message: 'Ocurrio un error inesperado, intente otra vez.',
                tone: 'danger'
            });
            return;
        }

        const req$ = this.tutorapi.create(event.payload);
        
        req$.subscribe({
            next: () => {
                this.toast.success('Tutor registrado exitosamente.');
                this.openModal = false;
                this.page = 1;
                this.loadTutors();
            },
            error: (err) => {
                this.openModal = false;
                console.error(err);
                this.toast.error('No se pudo guardar el tutor.');
            },
            complete: () => (this.saving = false),
        });
    }


    async onCharge(tutor: TutorListItem) {
        console.log('Cobrar a', tutor);
        const ok = await this.modal.confirm({
            title: 'Eliminar registro',
            message: 'Esta acción no se puede deshacer',
            tone: 'success',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });

        if (ok) {
            this.toast.success('Eliminado');
        }
    }
}
