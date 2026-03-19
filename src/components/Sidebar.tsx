"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Daily Dashboard", icon: "📊" },
  { href: "/weekly", label: "Weekly Report", icon: "📅" },
  { href: "/monthly", label: "Monthly Report", icon: "📈" },
  { href: "/log", label: "Log Entry", icon: "⏱️" },
  { href: "/master", label: "Master Data", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-cyan-400">AquaLog</h1>
        <p className="text-xs text-slate-400 mt-1">Pump Operation Manager</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyan-600 text-white"
                      : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">West Bengal Water Pumps</p>
      </div>
    </aside>
  );
}
