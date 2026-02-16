"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/components/Dashboard").then((m) => m.Dashboard), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#9147ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#adadb8] text-sm">Loading dashboard...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <Dashboard />;
}
