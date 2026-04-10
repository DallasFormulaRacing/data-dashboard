import Sidebar from "../../components/ui/30c4e3/Sidebar"
import { NotificationProvider } from "@/components/ui/9dab3a/Notification";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />

      <main className="flex-1 p-4 pl-0 min-h-0">
        <div className="bg-white rounded-lg h-full w-full overflow-hidden">
          <NotificationProvider>
            <div className="h-full overflow-y-auto p-6 pb-10">
              {children}
            </div>
          </NotificationProvider>
        </div>
      </main>
    </div>
  );
}