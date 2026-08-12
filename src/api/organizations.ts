import http from "@/utils/request";

export interface OrganizationListOutput {
  id: string;
  code: string;
  name: string;
  enable: boolean;
  parentId: string | null;
  sortOrder: number;
  version: string;
}

export interface OrganizationMutationInput {
  code: string;
  name: string;
  enable: boolean;
  parentId: string | null;
  sortOrder: number;
}

export interface UpdateOrganizationInput extends OrganizationMutationInput {
  id: string;
  version: string;
}

export function getOrganizationList() {
  return http.get<OrganizationListOutput[]>("/api/organizations/list");
}

export function createOrganization(input: OrganizationMutationInput) {
  return http.post<OrganizationListOutput>("/api/organizations/create", { json: input });
}

export function updateOrganization(input: UpdateOrganizationInput) {
  return http.post<void>("/api/organizations/update", { json: input });
}

export function deleteOrganization(id: string) {
  return http.post<void>("/api/organizations/delete", { json: { id } });
}
