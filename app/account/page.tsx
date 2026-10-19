import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { AccountForm } from "@/components/auth/AccountForm";
import { getAuth } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account – Marketcap" };

export default async function AccountPage() {
  const { user, profile } = await getAuth();
  if (!user) redirect("/login");
  return (
    <div className="app">
      <Header />
      <AccountForm email={user.email} name={profile?.name ?? ""} baseCurrency={profile?.baseCurrency ?? "USD"} />
    </div>
  );
}
