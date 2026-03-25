import React from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "../navigation/AppSidebar";

const AppLayout = () => {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#05070b] text-white">
      <AppSidebar />

      <main className="relative min-h-0 flex-1 overflow-y-auto bg-[#070b12]">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
