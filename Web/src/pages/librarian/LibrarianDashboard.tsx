import { useState } from "react";
import { BookOpen, Coins, QrCode, ScanLine } from "lucide-react";
import { AppShell } from "../../components/DashboardShell";
import CirculationScan from "./CirculationScan";
import LoansList from "./LoansList";
import FinesLookup from "./FinesLookup";
import ReservationsQueue from "./ReservationsQueue";
import BookOversight from "../school/BookOversight";

type Tab = "scan" | "loans" | "reservations" | "books" | "fines";

const NAV: { key: Tab; label: string; icon: typeof ScanLine }[] = [
  { key: "scan", label: "Circulation Desk", icon: ScanLine },
  { key: "loans", label: "Loans", icon: BookOpen },
  { key: "reservations", label: "Reservations", icon: QrCode },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "fines", label: "Fines", icon: Coins },
];

const TITLES: Record<Tab, { title: string; subtitle: string }> = {
  scan: { title: "Circulation Desk", subtitle: "Manage checkouts and returns" },
  loans: { title: "Loans", subtitle: "Every active and past checkout" },
  reservations: { title: "Reservations", subtitle: "Queue and scheduled pickups" },
  books: { title: "Book Oversight", subtitle: "Manage the central repository of school library assets" },
  fines: { title: "Fines", subtitle: "Look up and issue student fines" },
};

export default function LibrarianDashboard() {
  const [tab, setTab] = useState<Tab>("scan");

  return (
    <AppShell
      portalLabel="Librarian"
      nav={NAV}
      activeKey={tab}
      onNavigate={(key) => setTab(key as Tab)}
      pageTitle={TITLES[tab].title}
      pageSubtitle={TITLES[tab].subtitle}
    >
      {tab === "scan" && <CirculationScan />}
      {tab === "loans" && <LoansList />}
      {tab === "reservations" && <ReservationsQueue />}
      {tab === "books" && <BookOversight />}
      {tab === "fines" && <FinesLookup />}
    </AppShell>
  );
}
