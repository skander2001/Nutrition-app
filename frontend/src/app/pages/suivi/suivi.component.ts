import {
  Component, HostBinding, OnDestroy, OnInit, AfterViewInit,
  ViewChild, ElementRef, ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { ChatbotComponent } from '../../shared/chatbot/chatbot.component';
import { ConsultationService, Consultation } from '../../services/consultation.service';
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
  Tooltip, Legend, Filler, ChartArea, Scale
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

interface Status { label: string; cls: string; }

interface ConsultationRow {
  num: number;
  date: string;
  poids: number | null;
  poidsVar: { txt: string; dir: 'down' | 'up' | 'flat' };
  imc: number | null;
  imcStatus: Status;
  glycemie: number | null;
  glyStatus: Status;
  tension: string | null;
  diagnostic: string | null;
  remarque: string | null;
}

interface Zone { from: number; to: number; color: string; }

@Component({
  selector: 'app-suivi',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, ChatbotComponent],
  templateUrl: './suivi.component.html',
  styleUrl: './suivi.component.css'
})
export class SuiviComponent implements OnInit, OnDestroy, AfterViewInit {
  @HostBinding('class.suivi-host') hostClass = true;

  @ViewChild('poidsCanvas') poidsRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('imcCanvas') imcRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('glycemieCanvas') glycemieRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tensionCanvas') tensionRef!: ElementRef<HTMLCanvasElement>;

  consultations: Consultation[] = [];
  rows: ConsultationRow[] = [];
  loading = true;
  error = '';

  private charts: Chart[] = [];
  private viewReady = false;
  private dataReady = false;

  constructor(
    private svc: ConsultationService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    document.body.classList.add('has-shell');
    this.svc.list().subscribe({
      next: (res) => {
        this.consultations = res.consultations;
        this.rows = this.buildRows();
        this.loading = false;
        this.dataReady = true;
        this.cdr.detectChanges();
        if (this.viewReady) this.buildCharts();
      },
      error: () => {
        this.error = 'Impossible de charger les données.';
        this.loading = false;
      }
    });
  }

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.dataReady) this.buildCharts();
  }

  ngOnDestroy() {
    document.body.classList.remove('has-shell');
    this.charts.forEach(c => c.destroy());
  }

  get latest(): Consultation | null {
    return this.consultations.length ? this.consultations[this.consultations.length - 1] : null;
  }

  get first(): Consultation | null {
    return this.consultations.length ? this.consultations[0] : null;
  }

  delta(field: 'poids' | 'imc' | 'glycemie'): { val: string; dir: 'down' | 'up' | 'flat' } {
    if (!this.latest || !this.first || this.consultations.length < 2) return { val: '—', dir: 'flat' };
    const diff = (this.latest[field] ?? 0) - (this.first[field] ?? 0);
    const sign = diff < 0 ? '−' : diff > 0 ? '+' : '';
    return { val: `${sign}${Math.abs(diff).toFixed(1)}`, dir: diff < 0 ? 'down' : diff > 0 ? 'up' : 'flat' };
  }

  private buildRows(): ConsultationRow[] {
    return this.consultations
      .map((c, i) => {
        const prev = i > 0 ? this.consultations[i - 1] : null;
        return {
          num: i + 1,
          date: c.date,
          poids: c.poids,
          poidsVar: this.variation(c.poids, prev?.poids ?? null),
          imc: c.imc,
          imcStatus: this.imcStatus(c.imc),
          glycemie: c.glycemie,
          glyStatus: this.glyStatus(c.glycemie),
          tension: c.tension,
          diagnostic: c.diagnostic,
          remarque: c.remarque,
        } as ConsultationRow;
      })
      .reverse();
  }

  private variation(curr: number | null, prev: number | null): { txt: string; dir: 'down' | 'up' | 'flat' } {
    if (curr == null || prev == null) return { txt: '—', dir: 'flat' };
    const d = curr - prev;
    if (Math.abs(d) < 0.05) return { txt: '=', dir: 'flat' };
    const sign = d < 0 ? '−' : '+';
    return { txt: `${sign}${Math.abs(d).toFixed(1)}`, dir: d < 0 ? 'down' : 'up' };
  }

  private imcStatus(imc: number | null): Status {
    if (imc == null) return { label: '—', cls: '' };
    if (imc < 18.5) return { label: 'Insuffisant', cls: 'info' };
    if (imc < 25)   return { label: 'Normal', cls: 'ok' };
    if (imc < 30)   return { label: 'Surpoids', cls: 'warn' };
    return { label: 'Obésité', cls: 'danger' };
  }

  private glyStatus(g: number | null): Status {
    if (g == null) return { label: '—', cls: '' };
    if (g < 1.10) return { label: 'Normale', cls: 'ok' };
    if (g < 1.26) return { label: 'Limite', cls: 'warn' };
    return { label: 'Élevée', cls: 'danger' };
  }

  buildCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    if (!this.consultations.length) return;

    this.zone.runOutsideAngular(() => {
      const labels = this.consultations.map(c => {
        const [, m, d] = c.date.split('-');
        return `${d}/${m}`;
      });

      const brand = '#4f46e5';
      const ok = '#10b981';
      const warn = '#f59e0b';
      const danger = '#ef4444';

      const ds = (color: string, label: string, data: (number | null)[]) => ({
        label,
        data,
        borderColor: color,
        backgroundColor: (ctx: { chart: Chart }) => {
          const c = ctx.chart.ctx;
          const g = c.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, color + '40');
          g.addColorStop(1, color + '00');
          return g;
        },
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true,
      });

      const opts = (unit: string, yMin?: number, yMax?: number): any => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 10,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y}${unit ? ' ' + unit : ''}` }
          }
        },
        scales: {
          x: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: '#94a3b8' } },
          y: {
            suggestedMin: yMin, suggestedMax: yMax,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: '#94a3b8' }
          }
        }
      });

      this.charts.push(new Chart(this.poidsRef.nativeElement, {
        type: 'line',
        data: { labels, datasets: [ds(brand, 'Poids (kg)', this.consultations.map(c => c.poids))] },
        options: opts('kg')
      }));

      this.charts.push(new Chart(this.imcRef.nativeElement, {
        type: 'line',
        data: { labels, datasets: [ds(warn, 'IMC', this.consultations.map(c => c.imc))] },
        options: opts('', 22, 31),
        plugins: [this.zonesPlugin('imcZones', [
          { from: 0,    to: 18.5, color: '#06b6d418' },
          { from: 18.5, to: 25,   color: '#10b98120' },
          { from: 25,   to: 30,   color: '#f59e0b1f' },
          { from: 30,   to: 100,  color: '#ef44441c' },
        ])]
      }));

      this.charts.push(new Chart(this.glycemieRef.nativeElement, {
        type: 'line',
        data: { labels, datasets: [ds(ok, 'Glycémie (g/L)', this.consultations.map(c => c.glycemie))] },
        options: opts('g/L', 0.9, 1.4),
        plugins: [this.zonesPlugin('glyZones', [
          { from: 0,    to: 1.10, color: '#10b98120' },
          { from: 1.10, to: 1.26, color: '#f59e0b1f' },
          { from: 1.26, to: 5,    color: '#ef44441c' },
        ])]
      }));

      this.charts.push(new Chart(this.tensionRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            ds(danger, 'Systolique', this.consultations.map(c => c.tension_systolique)),
            ds(brand,  'Diastolique', this.consultations.map(c => c.tension_diastolique)),
          ]
        },
        options: {
          ...opts('cmHg'),
          plugins: {
            legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 12 }, color: '#64748b' } },
            tooltip: {
              backgroundColor: '#1e293b', padding: 10,
              callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y} cmHg` }
            }
          }
        }
      }));
    });
  }

  private zonesPlugin(id: string, zones: Zone[]) {
    return {
      id,
      beforeDatasetsDraw(chart: Chart) {
        const ctx = chart.ctx;
        const area = chart.chartArea as ChartArea;
        const y = chart.scales['y'] as Scale;
        if (!y || !area) return;
        ctx.save();
        for (const z of zones) {
          let top = y.getPixelForValue(z.to);
          let bot = y.getPixelForValue(z.from);
          top = Math.min(Math.max(top, area.top), area.bottom);
          bot = Math.min(Math.max(bot, area.top), area.bottom);
          if (bot <= top) continue;
          ctx.fillStyle = z.color;
          ctx.fillRect(area.left, top, area.right - area.left, bot - top);
        }
        ctx.restore();
      }
    };
  }
}
