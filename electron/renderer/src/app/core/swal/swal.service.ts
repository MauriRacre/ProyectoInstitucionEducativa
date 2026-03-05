import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ModalKind = 'alert' | 'confirm';
export type ModalTone = 'default' | 'danger' | 'success' | 'warning' | 'info';

export interface ModalState {
  open: boolean;
  kind: ModalKind;
  tone: ModalTone;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  resolver?: (v: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly _state$ = new BehaviorSubject<ModalState>({
    open: false,
    kind: 'alert',
    tone: 'default',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
  });

  readonly state$ = this._state$.asObservable();

  alert(opts: { title: string; message: string; tone?: ModalTone; confirmText?: string }): Promise<void> {
    return new Promise<void>((resolve) => {
      this._state$.next({
        open: true,
        kind: 'alert',
        tone: opts.tone ?? 'default',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText ?? 'Aceptar',
        cancelText: undefined,
        resolver: (v) => { resolve(); }
      });
    });
  }

  confirm(opts: {
    title: string;
    message: string;
    tone?: ModalTone;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._state$.next({
        open: true,
        kind: 'confirm',
        tone: opts.tone ?? 'default',
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText ?? 'Confirmar',
        cancelText: opts.cancelText ?? 'Cancelar',
        resolver: resolve,
      });
    });
  }

  close(result: boolean) {
    const current = this._state$.value;
    current.resolver?.(result);
    this._state$.next({ ...current, open: false, resolver: undefined });
  }
}
