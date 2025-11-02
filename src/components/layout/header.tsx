
"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const pageTitles: { [key: string]: string } = {
    "/": "Día",
    "/schedule": "Horario",
    "/calendar": "Calendario",
    "/analytics": "Analíticas",
    "/ai-assistant": "Asistente IA",
    "/settings": "Ajustes",
}

export function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Día";

  // Get current date and format it
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex items-baseline gap-2 overflow-hidden">
        <h1 className="text-lg font-semibold md:text-xl truncate">{title}</h1>
        {pathname === '/' && (
            <span className="text-sm font-normal text-muted-foreground hidden md:inline whitespace-nowrap">
                • {capitalizedDate}
            </span>
        )}
      </div>
    </header>
  );
}
