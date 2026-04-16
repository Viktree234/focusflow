import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { LayoutDashboard, ListTodo, Calendar, FileText, LogOut } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-white/5 bg-[#0c0c0d] fixed h-full">
        <div className="p-6">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Focus<span className="text-[var(--accent)]">Flow</span>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/dashboard/tasks"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ListTodo size={18} />
            <span>Tasks</span>
          </Link>
          <Link
            href="/dashboard/planner"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Calendar size={18} />
            <span>Planner</span>
          </Link>
          <Link
            href="/dashboard/notes"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <FileText size={18} />
            <span>Notes</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            {user.image ? (
              <Image src={user.image} alt="" width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-black font-medium text-sm">
                {user.name?.[0] || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || "User"}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}