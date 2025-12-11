import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Onboarding from "@/components/dashboard/Onboarding";
import AgentView from "@/components/dashboard/AgentView";
import UserView from "@/components/dashboard/UserView";

// Initialize Supabase for Server Side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function DashboardPage() {
  const user = await currentUser();

  // 1. Protect the route: If not signed in, force sign in
  if (!user) {
    redirect("/sign-in");
  }

  // 2. Check if Profile exists in Supabase
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 3. Logic: Show Onboarding if no profile, otherwise show correct dashboard
  if (!profile) {
    return <Onboarding />;
  }

  if (profile.role === "agent" || profile.role === "admin") {
    return <AgentView profile={profile} />;
  }

  return <UserView profile={profile} />;
}