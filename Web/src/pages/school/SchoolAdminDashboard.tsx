import { useState } from "react";
import { BarChart3, BookOpen, KeyRound, UserCog, Users } from "lucide-react";
import { AppShell, type HelpTopic } from "../../components/DashboardShell";
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

const HELP_TOPICS: HelpTopic[] = [
  {
    question: "How do I add a librarian?",
    answer:
      "Go to Librarians, then click \"Issue librarian code\". Share the one-time code with them — they register at the Librarian sign-up page using it.",
  },
  {
    question: "How do I bring on another School Admin?",
    answer:
      "Go to Invite & Codes, enter their email, and send an invite code. They join using \"Join with your OTP\" on the sign-in page.",
  },
  {
    question: "How do I find a student or grant them a role?",
    answer:
      "Go to Staff & Students. Use \"Find a student\" to look someone up by student number, or grant a role directly from the Staff table.",
  },
  {
    question: "How do I add or edit a book?",
    answer: "Go to Books, then \"+ Add book\" — or click Edit / Edit text on any existing title.",
  },
  {
    question: "Where do I see overdue loans, or run the nightly check early?",
    answer:
      "Go to Reports — the stat cards show overdue loans live, and \"Overdue check\" lets you trigger the nightly job on demand.",
  },
];

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
      helpTopics={HELP_TOPICS}
    >
      {tab === "invite" && <InviteCoAdmin />}
      {tab === "librarians" && <LibrarianManagement />}
      {tab === "users" && <UserOversight />}
      {tab === "books" && <BookOversight />}
      {tab === "reports" && <Reports />}
    </AppShell>
  );
}
