import { useState } from "react";
import { DashboardShell, TabButton } from "../../components/DashboardShell";
import InviteCoAdmin from "./InviteCoAdmin";
import LibrarianManagement from "./LibrarianManagement";
import UserOversight from "./UserOversight";
import BookOversight from "./BookOversight";
import Reports from "./Reports";

type Tab = "invite" | "librarians" | "users" | "books" | "reports";

export default function SchoolAdminDashboard() {
  const [tab, setTab] = useState<Tab>("invite");

  return (
    <DashboardShell
      title="School Admin"
      subtitle="Manage your school's staff, users and catalog"
      tabs={
        <>
          <TabButton active={tab === "invite"} onClick={() => setTab("invite")}>
            Invite &amp; Codes
          </TabButton>
          <TabButton active={tab === "librarians"} onClick={() => setTab("librarians")}>
            Librarians
          </TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>
            Staff
          </TabButton>
          <TabButton active={tab === "books"} onClick={() => setTab("books")}>
            Books
          </TabButton>
          <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>
            Reports
          </TabButton>
        </>
      }
    >
      {tab === "invite" && <InviteCoAdmin />}
      {tab === "librarians" && <LibrarianManagement />}
      {tab === "users" && <UserOversight />}
      {tab === "books" && <BookOversight />}
      {tab === "reports" && <Reports />}
    </DashboardShell>
  );
}
