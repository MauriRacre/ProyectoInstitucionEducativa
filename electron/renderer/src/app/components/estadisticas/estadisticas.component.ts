import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    AfterViewInit,
    SimpleChanges,
    ViewChild,
    ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import jsPDF from 'jspdf';
import { OnDestroy } from '@angular/core';

Chart.register(...registerables);
Chart.register(ChartDataLabels);

@Component({
    selector: 'app-estadisticas',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './estadisticas.component.html'
})
export class EstadisticasComponent implements OnChanges, AfterViewInit, OnDestroy {

    // =============================
    // INPUTS
    // =============================
    @Input() totalEstudiantes!: number;
    @Input() totalTutores!: number;
    @Input() morosidad: any;
    @Input() inscritos: any[] = [];
    @Input() ingresosCursos: any[] = [];
    @Input() ingresosAnual: any;
    @Input() ranking: any[] = [];
    @Input() descuentos: any[] = [];
    @Input() selectedMonth!: number;
    @Input() selectedYear!: number;
    @Input() ingresosQrHoy!: number;
    @Input() ingresosEfectivoHoy!: number;
    @Input() ingresosHoy!: number;
    @Input() ingresosQrAnual!: number;
    @Input() ingresosEfectivoAnual!: number;

    @Output() monthChange = new EventEmitter<number>();

    // =============================
    // VIEWCHILDS
    // =============================
    @ViewChild('ingresosAnualCanvas') ingresosAnualCanvas!: ElementRef;
    @ViewChild('morosidadCanvas') morosidadCanvas!: ElementRef;
    @ViewChild('inscritosCanvas') inscritosCanvas!: ElementRef;
    @ViewChild('ingresosCursosCanvas') ingresosCursosCanvas!: ElementRef;
    @ViewChild('descuentosCanvas') descuentosCanvas!: ElementRef;

    // =============================
    // CHART INSTANCES
    // =============================
    private ingresosAnualChart?: Chart;
    private morosidadChart?: Chart;
    private inscritosChart?: Chart;
    private ingresosCursosChart?: Chart;
    private descuentosChart?: Chart;
    private viewReady = false;

    // =============================
    // MESES
    // =============================
    meses = [
        { id: 1, nombre: 'Enero' },
        { id: 2, nombre: 'Febrero' },
        { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' },
        { id: 5, nombre: 'Mayo' },
        { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' },
        { id: 8, nombre: 'Agosto' },
        { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' },
        { id: 11, nombre: 'Noviembre' },
        { id: 12, nombre: 'Diciembre' }
    ];

    // =============================
    // LIFECYCLE
    // =============================
    ngAfterViewInit(): void {
        this.viewReady = true;
        this.renderAllCharts();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.viewReady) return;
        setTimeout(() => {
            this.renderAllCharts();
        });
    }
    ngOnDestroy(): void {
        this.ingresosAnualChart?.destroy();
        this.morosidadChart?.destroy();
        this.inscritosChart?.destroy();
        this.ingresosCursosChart?.destroy();
        this.descuentosChart?.destroy();
    }
    // =============================
    // MONTH SELECT
    // =============================
    selectMonth(month: number) {
        this.monthChange.emit(month);
    }

    getMonthName(): string {
        return this.meses.find(m => m.id === this.selectedMonth)?.nombre || '';
    }

    // =============================
    // CENTRAL RENDER
    // =============================
    private renderAllCharts(): void {

        this.ingresosAnualChart?.destroy();
        this.morosidadChart?.destroy();
        this.inscritosChart?.destroy();
        this.ingresosCursosChart?.destroy();
        this.descuentosChart?.destroy();

        if (this.hasIngresosAnual) this.renderIngresosAnual();
        if (this.hasMorosidad) this.renderMorosidad();
        if (this.hasInscritos) this.renderInscritos();
        if (this.hasIngresosCursos) this.renderIngresosCursos();
        if (this.hasDescuentos) this.renderDescuentos();
    }

    // =============================
    // INGRESOS ANUAL
    // =============================
    private renderIngresosAnual(): void {

        if (!this.ingresosAnualCanvas) return;
        this.ingresosAnualChart?.destroy();
        const mesesOrden = this.meses.map(m => m.nombre);
        const dataMeses = mesesOrden.map(
            mes => Number(this.ingresosAnual?.[mes]) || 0
        );
        
        this.ingresosAnualChart = new Chart(
        this.ingresosAnualCanvas.nativeElement,
        {
            type: 'bar',
            data: {
            labels: mesesOrden,
            datasets: [{
                label: `Ingresos ${this.selectedYear}`,
                data: dataMeses
            }]
            },
            options: this.baseBarOptions
        }
        );
    }

    // =============================
    // MOROSIDAD
    // =============================
    private renderMorosidad(): void {

        if (!this.morosidadCanvas) return;
        this.morosidadChart?.destroy();

        this.morosidadChart = new Chart(
        this.morosidadCanvas.nativeElement,
        {
            type: 'doughnut',
            data: {
            labels: ['Pagados', 'Pendientes'],
            datasets: [{
                data: [
                this.morosidad.pagados,
                this.morosidad.pendientes
                ]
            }]
            }
        }
        );
    }

    // =============================
    // INSCRITOS
    // =============================
    private renderInscritos(): void {

        if (!this.hasInscritos) {
            this.inscritosChart?.destroy();
            return;
        }

        if (!this.inscritosCanvas?.nativeElement) return;

        this.inscritosChart?.destroy();

        const normalized = this.normalizeCursos(this.inscritos);

        this.inscritosChart = new Chart(
            this.inscritosCanvas.nativeElement,
            {
            type: 'bar',
            data: {
                labels: normalized.map(i => i.curso),
                datasets: [{
                label: `Inscritos - ${this.getMonthName()}`,
                data: normalized.map(i => i.total)
                }]
            }
            }
        );
        }

    // =============================
    // INGRESOS CURSOS
    // =============================
    private renderIngresosCursos(): void {

        if (!this.ingresosCursosCanvas) return;
        this.ingresosCursosChart?.destroy();

        this.ingresosCursosChart = new Chart(
        this.ingresosCursosCanvas.nativeElement,
        {
            type: 'bar',
            data: {
            labels: this.ingresosCursos.map(i => i.curso),
            datasets: [{
                label: `Ingresos - ${this.getMonthName()}`,
                data: this.ingresosCursos.map(i => i.total)
            }]
            }
        }
        );
    }

    // =============================
    // DESCUENTOS
    // =============================
    private renderDescuentos(): void {

        if (!this.descuentosCanvas) return;
        this.descuentosChart?.destroy();
        const mesesOrden = this.meses.map(m => m.nombre);
            console.log("this.descuentos ",this.descuentos)
        const dataMeses = mesesOrden.map((_, index) => {

            const mes = index + 1;

            const encontrado = this.descuentos.find(
                d => Number(d.mes) === mes
            );

            return encontrado ? Number(encontrado.total) : 0;
        });
        this.descuentosChart = new Chart(
        this.descuentosCanvas.nativeElement,
        {
            type: 'bar',
            data: {
                labels: mesesOrden,
                datasets: [{
                label: `Descuentos ${this.selectedYear}`,
                data: dataMeses
                }]
            },
            options: this.baseBarOptions
            }
        );
    }
    private baseBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
            top: 30
            }
        },
        plugins: {
            legend: {
            position: 'bottom' as const
            },
            datalabels: {
            color: '#111827',
            anchor: 'end' as const,
            align: 'top' as const,
            offset:4,
            font: {
                weight: 'bold' as const,
                size: 11
            }
            }
        },
        scales: {
            y: {
            beginAtZero: true
            }
        }
    };
    // =============================
    // NORMALIZADOR
    // =============================
    private normalizeCursos(data: any[]) {
        const map = new Map<string, number>();

        data.forEach(item => {
        const key = item.curso.toLowerCase().trim();
        map.set(key, (map.get(key) || 0) + Number(item.total));
        });

        return Array.from(map.entries()).map(([curso, total]) => ({
        curso,
        total
        }));
    }

    // =============================
    // RANKING
    // =============================
    getTopMorosos() {
        return [...this.ranking]
        .sort((a,b)=> b.pendientes - a.pendientes)
        .slice(0,5);
    }

    getTopPuntuales() {
        return [...this.ranking]
        .sort((a,b)=> b.pagados - a.pagados)
        .slice(0,5);
    }
    // =============================
    // ESTADOS VACÍOS
    // =============================

    get hasIngresosAnual(): boolean {
    if (!this.ingresosAnual) return false;
    return Object.values(this.ingresosAnual).some((v: any) => Number(v) > 0);
    }

    get hasInscritos(): boolean {
    return this.inscritos?.length > 0;
    }

    get hasIngresosCursos(): boolean {
    return this.ingresosCursos?.length > 0;
    }

    get hasMorosidad(): boolean {
    return this.morosidad &&
            (this.morosidad.pagados > 0 || this.morosidad.pendientes > 0);
    }

    get hasDescuentos(): boolean {
    return this.descuentos?.length > 0;
    }

    get hasRanking(): boolean {
    return this.ranking?.length > 0;
    }
    exportStatsPdf(): void {
        const doc = new jsPDF('portrait');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const marginX = 18;
        const contentWidth = pageWidth - marginX * 2;
        let currentY = 20;

        // ==============================
        // HEADER
        // ==============================

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('UNIDAD EDUCATIVA MARAVILLAS DEL SABER', pageWidth / 2, currentY, { align: 'center' });

        currentY += 10;

        doc.setFontSize(14);
        doc.text('Reporte Estadístico General', pageWidth / 2, currentY, { align: 'center' });

        currentY += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-BO')}`, 14, currentY);

        currentY += 6;
        doc.line(14, currentY, pageWidth - 14, currentY);

        currentY += 10;

        // ==============================
        // KPI GENERALES
        // ==============================

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen General', 14, currentY);

        currentY += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        doc.text(`Total Estudiantes: ${this.totalEstudiantes}`, 14, currentY);
        currentY += 6;

        doc.text(`Total Tutores: ${this.totalTutores}`, 14, currentY);
        currentY += 10;

        // ==============================
        // KPI INGRESOS (🔥 NUEVO)
        // ==============================

        const qrHoy = Number(this.ingresosQrHoy || 0);
        const efectivoHoy = Number(this.ingresosEfectivoHoy || 0);
        const totalHoy = Number(this.ingresosHoy || 0);

        const qrAnual = Number(this.ingresosQrAnual || 0);
        const efectivoAnual = Number(this.ingresosEfectivoAnual || 0);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Resumen de Ingresos', 14, currentY);

        currentY += 8;

        const col1 = 14;
        const col2 = pageWidth / 2;

        doc.setFont('helvetica', 'bold');
        doc.text('Hoy', col1, currentY);
        doc.text(`Año ${this.selectedYear}`, col2, currentY);

        currentY += 6;

        doc.setFont('helvetica', 'normal');

        // QR
        doc.setTextColor(16, 185, 129);
        doc.text(`QR: Bs. ${qrHoy.toFixed(2)}`, col1, currentY);
        doc.text(`QR: Bs. ${qrAnual.toFixed(2)}`, col2, currentY);

        currentY += 6;

        // EFECTIVO
        doc.setTextColor(37, 99, 235);
        doc.text(`Efectivo: Bs. ${efectivoHoy.toFixed(2)}`, col1, currentY);
        doc.text(`Efectivo: Bs. ${efectivoAnual.toFixed(2)}`, col2, currentY);

        currentY += 6;

        // TOTAL
        doc.setTextColor(0, 0, 0);
        doc.text(`Total: Bs. ${totalHoy.toFixed(2)}`, col1, currentY);

        currentY += 12;

        // ==============================
        // FUNCIÓN PARA AGREGAR GRÁFICOS
        // ==============================

        const addChartToPdf = (
            canvasRef: ElementRef | undefined,
            title: string
        ) => {

            if (!canvasRef?.nativeElement) return;

            const canvas = canvasRef.nativeElement as HTMLCanvasElement;
            const imgData = canvas.toDataURL('image/png', 1.0);

            const imgProps = doc.getImageProperties(imgData);

            const imgWidth = contentWidth;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            if (currentY + imgHeight + 20 > pageHeight - 20) {
            doc.addPage();
            currentY = 22;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0,0,0);
            doc.text(title, marginX, currentY);

            currentY += 6;

            doc.addImage(
            imgData,
            'PNG',
            marginX,
            currentY,
            imgWidth,
            imgHeight
            );

            currentY += imgHeight + 12;
        };

        // ==============================
        // GRÁFICOS
        // ==============================

        addChartToPdf(
            this.ingresosAnualCanvas,
            `Ingresos Anuales ${this.selectedYear}`
        );

        addChartToPdf(
            this.descuentosCanvas,
            `Descuentos Anuales ${this.selectedYear}`
        );

        addChartToPdf(
            this.inscritosCanvas,
            `Inscritos por Curso - ${this.getMonthName()}`
        );

        addChartToPdf(
            this.ingresosCursosCanvas,
            `Ingresos por Curso - ${this.getMonthName()}`
        );

        addChartToPdf(
            this.morosidadCanvas,
            `Morosidad - ${this.getMonthName()}`
        );

        // ==============================
        // FOOTER
        // ==============================

        const totalPages = doc.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);

            doc.text(
            `Sistema de Gestión Escolar`,
            14,
            pageHeight - 10
            );

            doc.text(
            `Página ${i} de ${totalPages}`,
            pageWidth - 14,
            pageHeight - 10,
            { align: 'right' }
            );
        }

        // ==============================
        // EXPORTAR
        // ==============================

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url);
        }
}