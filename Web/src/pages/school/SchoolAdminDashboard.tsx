import { useState } from "react";
import { BarChart3, BookOpen, KeyRound, UserCog, Users } from "lucide-react";
import { AppShell } from "../../components/DashboardShell";
import InviteCoAdmin from "./InviteCoAdmin";
import LibrarianManagement from "./LibrarianManagement";
import UserOversight from "./UserOversight";
import BookOversight from "./BookOversight";
import Reports from "./Reports";

type Tab = "invite" | "librarians" | "users" | "books" | "reports";

const NAV: { key: Tab; label: string; icon: typeof KeyRound }[] = [
  { key: "invite", label: "Invite & Codes", icon: KeyRound },
  { key: "librarians", label: "Librarians", icon: UserCog },
  { key: "users", label: "Staff & Students", icon: Users },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

const TITLES: Record<Tab, { title: string; subtitle: string }> = {
  invite: { title: "Invite & Codes", subtitle: "Bring on another School Admin" },
  librarians: { title: "Librarian Management", subtitle: "Manage staff access to the library catalog" },
  users: { title: "Staff & Students", subtitle: "Look up accounts and grant roles" },
  books: { title: "Book Oversight", subtitle: "Manage the central repository of school library assets" },
  reports: { title: "Reports Dashboard", subtitle: "Monitor library performance and circulation health" },
};

export default function SchoolAdminDashboard() {
  const [tab, setTab] = useState<Tab>("books");

  return (
    <AppShell
      portalLabel="School Admin"
      nav={NAV}
      activeKey={tab}
      onNavigate={(key) => setTab(key as Tab)}
      pageTitle={TITLES[tab].title}
      pageSubtitle={TITLES[tab].subtitle}
    >
      {tab === "invite" && <InviteCoAdmin />}
      {tab === "librarians" && <LibrarianManagement />}
      {tab === "users" && <UserOversight />}
      {tab === "books" && <BookOversight />}
      {tab === "reports" && <Reports />}
    </AppShell>
  );
}
