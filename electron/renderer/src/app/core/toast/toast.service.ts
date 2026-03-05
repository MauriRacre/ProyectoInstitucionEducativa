import { Injectable } from "@angular/core";
import { isNotFound } from "@angular/core/primitives/di";
import { BehaviorSubject } from "rxjs";

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem{
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    durationMs: number;
    createdAt:number;
}

@Injectable({ providedIn: 'root'})
export class ToastService{
    private readonly _toasts$ = new BehaviorSubject<ToastItem[]>([]);
    readonly toasts$ = this._toasts$.asObservable();

    show(opts: {message: string; type?: ToastType; title?: string; durationMs?: number}){
        const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
        const toast: ToastItem = {
            id,
            type: opts.type ?? 'info',
            title: opts.title,
            message: opts.message,
            durationMs: opts.durationMs ?? 2800,
            createdAt: Date.now(),
        };
        this._toasts$.next([toast, ...this._toasts$.value].slice(0, 5));
        window.setTimeout(()=> this.dismiss(id), toast.durationMs);
        return id;
    }
    
    success(message: string, title?: string, durationMs?: number){
        return this.show({type:'success', message, title, durationMs});
    }
    
    error(message: string, title?: string, durationMs?: number){
        return this.show({type:'error', message, title, durationMs});
    }

    warning(message: string, title?: string, durationMs?: number){
        return this.show({type:'warning', message, title, durationMs});
    }

    info(message: string, title?: string, durationMs?: number){
        return this.show({type:'info', message, title, durationMs});
    }
    dismiss(id:string){
        this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
    }
    clear(){
        this._toasts$.next([]);
    }
}