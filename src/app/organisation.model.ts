export type OrganisationStatus = 'active' | 'inactive' | 'suspended' | 'unknown';

export interface Organisation {
  id: number;
  name: string;
  status: OrganisationStatus;
  memberCount: number | null;
  ownerEmail: string;
  createdAt: Date | null;
}

export interface RawOrganisation {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  memberCount?: unknown;
  owner?: { email?: unknown } | null;
  createdAt?: unknown;
}

export type DirectoryState = 'loading' | 'ready' | 'error';
export type SortKey = 'name' | 'createdAt';
export type StatusFilter = 'all' | OrganisationStatus;
