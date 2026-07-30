import { useState } from "react";
import { BookOpen, Coins, QrCode, ScanLine } from "lucide-react";
import { AppShell, type HelpTopic } from "../../components/DashboardShell";
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

const HELP_TOPICS: HelpTopic[] = [
  {
    question: "How do I check a book in or out?",
    answer:
      "Go to Circulation Desk, choose Check out or Check in, then enter the barcode (and the borrower's student number for checkouts).",
  },
  {
    question: "How do I see who has what checked out?",
    answer: "Go to Loans for the full list of active and past checkouts, including due dates and overdue status.",
  },
  {
    question: "How do I manage reservations and pickups?",
    answer:
      "Go to Reservations to see the queue, cancel a hold, or scan a patron's QR code under \"Collect a pickup\" to complete it.",
  },
  {
    question: "How do I look up or issue a fine?",
    answer: "Go to Fines, search by student number to see their balance, or use \"Issue a fine\" to add a new one.",
  },
];

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
      helpTopics={HELP_TOPICS}
    >
      {tab === "scan" && <CirculationScan />}
      {tab === "loans" && <LoansList />}
      {tab === "reservations" && <ReservationsQueue />}
      {tab === "books" && <BookOversight />}
      {tab === "fines" && <FinesLookup />}
    </AppShell>
  );
}
