import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { UserButton } from "@clerk/react";
import FileExplorer from "../explorer/FileExplorer";
import { Menu } from "lucide-react";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-screen bg-neutral-950 text-white overflow-hidden flex relative">
      <div className="absolute top-4 right-4 z-50">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>

      {/* Open Explorer Button */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-50 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-gray-400 hover:text-white transition-colors border border-neutral-700 shadow-lg"
          title="Open Explorer"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-64 border-r border-neutral-800 flex flex-col shrink-0">
          <FileExplorer onClose={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 h-full min-h-0 overflow-y-auto relative">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
