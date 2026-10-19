"use client";

import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/shell/Sidebar";
import { WizardBar } from "@/components/shell/WizardBar";
import { UploadScreen } from "@/components/screens/UploadScreen";
import { AnalysisScreen } from "@/components/screens/AnalysisScreen";
import { ReportScreen } from "@/components/screens/ReportScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { AdminScreen } from "@/components/screens/AdminScreen";
import { LexiconModal } from "@/components/screens/LexiconModal";

export default function Home() {
  const { screen } = useStore();

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--canvas)" }}>
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <WizardBar />
        {screen === "upload" && <UploadScreen />}
        {screen === "analysis" && <AnalysisScreen />}
        {screen === "report" && <ReportScreen />}
        {screen === "history" && <HistoryScreen />}
        {screen === "admin" && <AdminScreen />}
      </main>
      <LexiconModal />
    </div>
  );
}
