import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganisationDataService } from './organisation-data.service';
import { DirectoryState, Organisation, OrganisationStatus, SortKey, StatusFilter } from './organisation.model';

type Messages = Record<string, string>;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly dataService = inject(OrganisationDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly messages = signal<Messages>({});
  readonly organisations = signal<Organisation[]>([]);
  readonly state = signal<DirectoryState>('loading');
  readonly query = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly showCreateForm = signal(false);
  readonly formError = signal('');
  readonly notice = signal('');
  readonly isSaving = signal(false);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  readonly statuses: OrganisationStatus[] = ['active', 'inactive', 'suspended', 'unknown'];
  readonly activeCount = computed(() => this.organisations().filter(item => item.status === 'active').length);
  readonly filteredOrganisations = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const filter = this.statusFilter();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    return this.organisations()
      .filter(item => item.name.toLocaleLowerCase().includes(q))
      .filter(item => filter === 'all' || item.status === filter)
      .sort((a, b) => {
        const result = this.sortKey() === 'name'
          ? a.name.localeCompare(b.name)
          : (a.createdAt?.getTime() ?? -Infinity) - (b.createdAt?.getTime() ?? -Infinity);
        return result * direction;
      });
  });

  readonly createForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(80)]
    }),
    status: new FormControl<OrganisationStatus>('active', {
      nonNullable: true, validators: [Validators.required]
    }),
    ownerEmail: new FormControl('', {
      nonNullable: true, validators: [Validators.required, Validators.email]
    }),
    memberCount: new FormControl<number | null>(null, {
      validators: [Validators.min(0), Validators.pattern(/^\d+$/)]
    })
  });

  constructor() {
    void this.loadMessages();
    this.route.queryParamMap.subscribe(params => {
      this.query.set(params.get('q') ?? '');
      const status = params.get('status') ?? 'all';
      this.statusFilter.set(this.isStatusFilter(status) ? status : 'all');
      const sort = params.get('sort');
      if (sort === 'name' || sort === 'createdAt') this.sortKey.set(sort);
      this.sortDirection.set(params.get('dir') === 'desc' ? 'desc' : 'asc');
    });
    void this.load();
  }

  t(key: string): string {
    return this.messages()[key] ?? key;
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.organisations.set(await this.dataService.loadOrganisations());
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }

  updateQuery(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    // Debounce both the visible result update and URL update while the user is typing.
    this.searchTimer = setTimeout(() => {
      this.query.set(value);
      this.updateUrl({ q: value.trim() || null });
    }, 300);
  }

  updateStatus(value: string): void {
    const status = this.isStatusFilter(value) ? value : 'all';
    this.statusFilter.set(status);
    this.updateUrl({ status: status === 'all' ? null : status });
  }

  setSort(value: SortKey): void {
    const direction = this.sortKey() === value && this.sortDirection() === 'asc' ? 'desc' : 'asc';
    this.sortKey.set(value);
    this.sortDirection.set(direction);
    this.updateUrl({ sort: value, dir: direction });
  }

  isInvalid(controlName: 'name' | 'status' | 'ownerEmail' | 'memberCount'): boolean {
    const control = this.createForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  fieldError(controlName: 'name' | 'status' | 'ownerEmail' | 'memberCount'): string {
    const control = this.createForm.controls[controlName];
    if (control.hasError('required')) return this.t(controlName === 'name' ? 'nameRequired' : controlName === 'ownerEmail' ? 'emailRequired' : 'statusRequired');
    if (control.hasError('minlength') || control.hasError('maxlength')) return this.t('nameLength');
    if (control.hasError('email')) return this.t('emailInvalid');
    if (control.hasError('min') || control.hasError('pattern')) return this.t('membersInvalid');
    if (control.hasError('duplicate')) return this.t('nameDuplicate');
    return '';
  }

  async createOrganisation(): Promise<void> {
    this.formError.set('');
    this.notice.set('');
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) {
      this.formError.set(this.t('formError'));
      return;
    }

    const value = this.createForm.getRawValue();
    const name = value.name.trim();
    const duplicate = this.organisations().some(item => item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    if (duplicate) {
      this.createForm.controls.name.setErrors({ ...this.createForm.controls.name.errors, duplicate: true });
      this.formError.set(this.t('formError'));
      return;
    }

    this.isSaving.set(true);
    try {
      const newItem: Organisation = {
        id: Math.max(0, ...this.organisations().map(item => item.id)) + 1,
        name,
        status: value.status,
        ownerEmail: value.ownerEmail.trim(),
        memberCount: value.memberCount === null || value.memberCount === undefined ? null : Number(value.memberCount),
        createdAt: new Date()
      };
      this.organisations.update(items => [newItem, ...items]);
      this.createForm.reset({ name: '', status: 'active', ownerEmail: '', memberCount: null });
      this.showCreateForm.set(false);
      this.notice.set(this.t('createSuccess'));
      this.query.set('');
      this.statusFilter.set('all');
      await this.router.navigate([], { queryParams: { q: null, status: null }, queryParamsHandling: 'merge' });
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadMessages(): Promise<void> {
    try {
      const response = await fetch('assets/en.json');
      if (!response.ok) throw new Error('Translation file unavailable');
      this.messages.set(await response.json() as Messages);
    } catch {
      this.messages.set({ appTitle: 'Organisation Directory', loadErrorTitle: 'Unable to load translations' });
    }
  }

  private updateUrl(params: Record<string, string | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private isStatusFilter(value: string): value is StatusFilter {
    return ['all', 'active', 'inactive', 'suspended', 'unknown'].includes(value);
  }
}