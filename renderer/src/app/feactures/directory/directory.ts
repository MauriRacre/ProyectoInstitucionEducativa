import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TabKey = 'all' | 'debt' | 'ok';

interface TutorRow {
    id: number | string;
    name: string;
    email: string;
    phone: string;
    students: string[];
    balance: number;
}

@Component({
    selector: 'app-directory',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './directory.html',
})
export class Directory {
    query = '';
    selectedTab: TabKey = 'all';

    page = 1;
    pageSize = 10;

    tutors: TutorRow[] = [
        {
        id: 1,
        name: 'Roberto Alvarado',
        email: 'roberto444@gmail.com',
        phone: '+591 65859748',
        students: ['Juana Alvarado Gomez', 'Lucas Alvarado Gomez', 'Lupita Alvarado Gomez'],
        balance: 450,
        },
        {
        id: 2,
        name: 'María Salvatierra',
        email: 'maria@gmail.com',
        phone: '+591 71234567',
        students: ['Matías Salvatierra'],
        balance: 0,
        },
    ];

    // Derived
    get filteredTutors(): TutorRow[] {
        const q = this.query.trim().toLowerCase();

        let list = this.tutors;

        // tab filter
        if (this.selectedTab === 'debt') list = list.filter(t => t.balance > 0);
        if (this.selectedTab === 'ok') list = list.filter(t => t.balance <= 0);

        // search filter
        if (q) {
        list = list.filter(t => {
            const haystack = [
            t.name,
            t.email,
            t.phone,
            ...(t.students ?? []),
            String(t.id),
            ]
            .join(' ')
            .toLowerCase();

            return haystack.includes(q);
        });
        }

        return list;
    }

    get totalPages(): number {
        const total = this.filteredTutors.length;
        return Math.max(1, Math.ceil(total / this.pageSize));
    }

    get pagedTutors(): TutorRow[] {
        // clamp page
        if (this.page > this.totalPages) this.page = this.totalPages;

        const start = (this.page - 1) * this.pageSize;
        return this.filteredTutors.slice(start, start + this.pageSize);
    }

    get pageStart(): number {
        return (this.page - 1) * this.pageSize;
    }

    get pageEnd(): number {
        return Math.min(this.pageStart + this.pageSize, this.filteredTutors.length);
    }

    get counts() {
        const all = this.tutors.length;
        const debt = this.tutors.filter(t => t.balance > 0).length;
        const ok = this.tutors.filter(t => t.balance <= 0).length;
        return { all, debt, ok };
    }

    setTab(tab: TabKey) {
        this.selectedTab = tab;
        this.page = 1;
    }

    onQueryChange() {
        this.page = 1;
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

    trackById = (_: number, item: TutorRow) => item.id;

    onNewTutor() {
        console.log('Nuevo tutor');
    }

    onCharge(tutor: TutorRow) {
        console.log('Cobrar a', tutor);
    }
}
