"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminSessionToken,
  checkAdminPassword,
} from "@/lib/admin/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const token = adminSessionToken();
  if (!token) {
    return { error: "서버에 ADMIN_PASSWORD가 설정되어 있지 않아" };
  }

  if (!checkAdminPassword(formData.get("password"))) {
    // 무제한 대입을 조금이라도 느리게 (서버리스라 카운터는 신뢰할 수 없음)
    await new Promise((r) => setTimeout(r, 600));
    return { error: "비밀번호가 틀렸어" };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });

  revalidatePath("/admin", "layout");
  return {};
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  revalidatePath("/admin", "layout");
  redirect("/admin");
}
