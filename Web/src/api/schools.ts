import { api } from "./client";

// Matches Backend dto/SchoolResponse.java. Never carries a plaintext code.
export interface SchoolResponse {
  id: number;
  name: string;
  shortName: string | null;
  status: string;
  schoolCodePending: boolean;
  userCount: number;
  bookCount: number;
  schoolAdminCount: number;
  emailDomain: string | null;
}

// Matches Backend dto/SchoolCodeResponse.java - returned once, at creation or
// regeneration, since the raw code is never retrievable again afterward.
export interface SchoolCodeResponse {
  schoolId: number;
  name: string;
  shortName: string | null;
  status: string;
  schoolCode: string;
}

export interface CreateSchoolPayload {
  name: string;
  shortName?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  emailDomain?: string;
}

export interface UpdateSchoolPayload {
  status?: "ACTIVE" | "SUSPENDED";
  regenerateCode?: boolean;
  // Gates student self-registration to this domain. Omit to leave unchanged; send "" to
  // clear/disable the restriction (matches Backend dto/UpdateSchoolRequest.java's contract).
  emailDomain?: string;
}

export const schoolsApi = {
  list: () => api.get<SchoolResponse[]>("/api/schools"),

  create: (payload: CreateSchoolPayload) => api.post<SchoolCodeResponse>("/api/schools", payload),

  update: (id: number, payload: UpdateSchoolPayload) =>
    api.patch<SchoolResponse | SchoolCodeResponse>(`/api/schools/${id}`, payload),
};
