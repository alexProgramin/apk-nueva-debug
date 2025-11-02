
"use client";

import * as React from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/types";
import { askAIAssistant } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function AIAssistantPage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedTasks = localStorage.getItem("tasks");
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
        setMessages([
          { sender: 'ai', text: '¡Hola! Soy tu asistente de productividad. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre tus tareas o pedirme consejos.' }
        ]);
      } catch (error) {
        console.error("Error loading data from localStorage", error);
      }
    }
  }, []);
  
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponseText = await askAIAssistant(inputValue, tasks);
      const aiMessage: Message = { sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error de comunicación",
        description: "No se pudo obtener una respuesta de la IA. Inténtalo de nuevo.",
      });
       // Si hay un error, elimina el último mensaje del usuario para que pueda volver a intentarlo
       setMessages(prev => prev.filter(m => m !== userMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background min-h-screen">
        <AppHeader />
        <main className="p-4 md:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-2xl mx-auto h-[calc(100vh-theme(spacing.32))]">
            <Card className="h-full flex flex-col">
                <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto" ref={scrollAreaRef}>
                    {messages.map((message, index) => (
                        <div key={index} className={cn("flex items-start gap-3", message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                            {message.sender === 'ai' && (
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                    <AvatarFallback>
                                        <Bot className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("max-w-[75%] rounded-lg p-3 text-sm", message.sender === 'user' ? 'bg-muted' : 'bg-card-foreground/5')}>
                                <p style={{whiteSpace: 'pre-wrap'}}>{message.text}</p>
                            </div>
                            {message.sender === 'user' && (
                                <Avatar className="h-8 w-8 bg-accent text-accent-foreground">
                                    <AvatarFallback>
                                        <User className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                             <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                <AvatarFallback>
                                    <Bot className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="bg-card-foreground/5 rounded-lg p-3 text-sm flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                            </div>
                        </div>
                     )}
                </CardContent>
                <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        disabled={isLoading}
                        autoComplete="off"
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Enviar</span>
                        </Button>
                    </form>
                </div>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
