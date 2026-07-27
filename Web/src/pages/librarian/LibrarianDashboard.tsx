import { useState } from "react";
import { DashboardShell, TabButton } from "../../components/DashboardShell";
import CirculationScan from "./CirculationScan";
import LoansList from "./LoansList";
import FinesLookup from "./FinesLookup";
import BookOversight from "../school/BookOversight";

type Tab = "scan" | "loans" | "books" | "fines";

export default function LibrarianDashboard() {
  const [tab, setTab] = useState<Tab>("scan");

  return (
    <DashboardShell
      title="Librarian"
      subtitle="Circulation, loans and the catalog"
      tabs={
        <>
          <TabButton active={tab === "scan"} onClick={() => setTab("scan")}>
            Scan
          </TabButton>
          <TabButton active={tab === "loans"} onClick={() => setTab("loans")}>
            Loans
          </TabButton>
          <TabButton active={tab === "books"} onClick={() => setTab("books")}>
            Books
          </TabButton>
          <TabButton active={tab === "fines"} onClick={() => setTab("fines")}>
            Fines
          </TabButton>
        </>
      }
    >
      {tab === "scan" && <CirculationScan />}
      {tab === "loans" && <LoansList />}
      {tab === "books" && <BookOversight />}
      {tab === "fines" && <FinesLookup />}
    </DashboardShell>
  );
}
