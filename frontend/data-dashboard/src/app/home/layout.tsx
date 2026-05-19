import Sidebar from "../../components/ui/30c4e3/Sidebar"
import { NotificationProvider } from "@/components/ui/9dab3a/Notification";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Sidebar />
      <main className="flex-1 p-2 pl-0 min-h-0 bg-[#0a0a0a] overflow-hidden flex flex-col w-full relative">
        <div className="bg-white rounded-[2rem] shadow-2xl h-full w-full overflow-hidden border border-white/10 relative">
          <NotificationProvider>
            <div className="h-full overflow-y-auto p-6 pb-10">
              {children}
            </div>
          </NotificationProvider>
        </div>
      </main>
    </SidebarProvider>
  );
}