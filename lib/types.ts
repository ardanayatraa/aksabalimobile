export type Role = "siswa" | "pengajar" | "admin";
export type Tier = "free" | "lite" | "premium";

export type User = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  tier: Tier;
  email_verified_at: string | null;
};

export type ApiOk<T> = { success: true; data: T };
export type ApiErr = { success: false; error: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type AuthPayload = {
  user: User;
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
};
