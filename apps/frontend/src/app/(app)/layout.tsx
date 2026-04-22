import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NotificationProvider from "@/components/layout/NotificationProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="h-full flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden p-1">
          <div className="h-full w-full rounded-xl border overflow-hidden">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </NotificationProvider>
  );
}