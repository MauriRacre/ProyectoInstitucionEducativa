import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Tutor {
    id: number;
    name: string;
    phone: string;
    email: string;
}

interface Child {
    id: number;
    name: string;
    grade: string;
    parallel: string;
    courses: string[];
}

@Component({
    selector: 'app-course-register',
    imports: [CommonModule, FormsModule],
    templateUrl: './register.page.html'
})
export class RegisterPage implements OnInit {

    tutor: Tutor = {
        id: 1,
        name: 'Juan Pérez',
        phone: '70000000',
        email: 'juan@email.com'
    };

    children: Child[] = [];

    ngOnInit(): void {
        this.children = [
        {
            id: 1,
            name: 'Carlos Pérez',
            grade: '4to',
            parallel: 'A',
            courses: ['Inglés', 'Robótica']
        },
        {
            id: 2,
            name: 'Ana Pérez',
            grade: '2do',
            parallel: 'B',
            courses: []
        }
        ];
    }

    addCourse(childId: number) {

        const courseName = prompt('Nombre del curso:');
        if (!courseName) return;

        const child = this.children.find(c => c.id === childId);
        if (!child) return;

        child.courses.push(courseName);
    }

    deleteCourse(childId: number, courseName: string) {

        const child = this.children.find(c => c.id === childId);
        if (!child) return;

        child.courses = child.courses.filter(c => c !== courseName);
    }
}