"use client";

import UserView from "@/components/dashboard/UserView";

export default function DashboardPage() {
  // UserView handles its own authentication and data fetching.
  // We pass an empty object as initial profile since UserView will fetch the real data.
  return <UserView profile={{}} />;
}