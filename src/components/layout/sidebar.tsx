"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/icons";
import {
  Home,
  Settings,
  PieChart,
  Clock,
  Bot,
  Calendar,
} from "lucide-react";

/**
 * @component AppSidebar
 * @description La barra de navegación principal de la aplicación.
 * Muestra los enlaces a las diferentes secciones: Día, Horario, Calendario, etc.
 * Resalta el enlace de la página activa.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <AppLogo className="text-primary w-8 h-8" />
          <span className="text-xl font-semibold">PlanSmart AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {/* Elemento de menú para la página principal (Día/Dashboard) */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Día">
              <Link href="/">
                <Home />
                Día
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Elemento de menú para la página de Horario */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/schedule'} tooltip="Horario">
              <Link href="/schedule">
                <Clock />
                Horario
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Elemento de menú para la página de Calendario */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/calendar'} tooltip="Calendario">
              <Link href="/calendar">
                <Calendar />
                Calendario
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Elemento de menú para la página de Analíticas */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/analytics'} tooltip="Analytics">
              <Link href="/analytics">
                <PieChart />
                Analíticas
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Elemento de menú para la página de Asistente IA */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/ai-assistant'} tooltip="Asistente IA">
              <Link href="/ai-assistant">
                <Bot />
                Asistente IA
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Elemento de menú para la página de Ajustes */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Settings">
              <Link href="/settings">
                <Settings />
                Ajustes
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
