import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { authEnabled } from "@/lib/supabase/config";
import { getAuth } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in – Marketcap" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!authEnabled) redirect("/");
  const { user } = await getAuth();
  if (user) redirect("/");
  const { error } = await searchParams;
  return (
    <div className="app auth-page">
      <AuthForm initialError={error?.slice(0, 200)} />
    </div>
  );
}
