import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Organisation, OrganisationStatus, RawOrganisation } from './organisation.model';

@Injectable({ providedIn: 'root' })
export class OrganisationDataService {
  private readonly http = inject(HttpClient);

  async loadOrganisations(): Promise<Organisation[]> {
    // Assessment requirement: delay the local fixture and simulate intermittent API errors.
    await new Promise(resolve => setTimeout(resolve, 400 + Math.floor(Math.random() * 501)));
    if (Math.random() < 0.15) {
      throw new Error('Simulated service failure');
    }
    const raw = await firstValueFrom(
     this.http.get<RawOrganisation[]>('assets/organisations.json')
    );
    return raw.map((item, index) => this.normalise(item, index));
  }

  private normalise(raw: RawOrganisation, index: number): Organisation {
    const name = typeof raw.name === 'string' ? raw.name.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim() : '';
    const statusValue = typeof raw.status === 'string' ? raw.status.trim().toLowerCase() : '';
    const status: OrganisationStatus =
      statusValue === 'active' ? 'active' :
      statusValue === 'inactive' ? 'inactive' :
      statusValue === 'suspended' ? 'suspended' : 'unknown';

    const numericMembers = typeof raw.memberCount === 'number'
      ? raw.memberCount
      : typeof raw.memberCount === 'string' && raw.memberCount.trim() !== ''
        ? Number(raw.memberCount) : NaN;
    const memberCount = Number.isFinite(numericMembers) && numericMembers >= 0
      ? Math.floor(numericMembers) : null;

    const dateCandidate = typeof raw.createdAt === 'number' || typeof raw.createdAt === 'string'
      ? new Date(raw.createdAt) : null;
    const createdAt = dateCandidate && !Number.isNaN(dateCandidate.getTime()) ? dateCandidate : null;
    const ownerEmail = typeof raw.owner?.email === 'string' && raw.owner.email.includes('@')
      ? raw.owner.email.trim() : '';

    return {
      id: typeof raw.id === 'number' ? raw.id : index + 1,
      name: name || 'Unnamed organisation',
      status,
      memberCount,
      ownerEmail,
      createdAt
    };
  }
}