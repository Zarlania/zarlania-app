/** Frontend mirrors of the backend identity DTOs (POST /accounts response). */

export interface User {
  id: string;
  email: string;
  username: string;
}

export type OrganizationType = 'PERSONAL' | 'GENERAL';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
}

export interface Account {
  user: User;
  personalOrganization: Organization;
}

export interface CreateAccountRequest {
  email: string;
  username: string;
}
