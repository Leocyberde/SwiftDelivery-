import { useState, useEffect, useRef } from "react";
import { Send, X, Loader2, Minus, MessageSquare } from "lucide-react";
import { useChatMessages, useCreateChatMessage, useCloseActiveSession } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";

interface ChatWindowProps {
  ticketId: number;
  merchantName: string;
  userRole: "admin" | "merchant";
  onClose: () => void;
}

export default function ChatWindow({ ticketId, merchantName, userRole, onClose }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const { data: messages = [], isLoading } = useChatMessages(ticketId);
  const createMessage = useCreateChatMessage();
  const closeSession = useCloseActiveSession();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }

    // Detectar novas mensagens para abrir o chat se estiver minimizado
    if (messages.length > lastMessageCount.current) {
      const lastMsg = messages[messages.length - 1];
      // Se a última mensagem não for do usuário atual, abre o chat
      if (lastMsg.sender !== userRole) {
        setIsMinimized(false);
        // Disparar evento global para caso o componente pai precise saber
        window.dispatchEvent(new CustomEvent('new-support-message', { 
          detail: { ticketId, sender: lastMsg.sender } 
        }));
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages, isMinimized, userRole, ticketId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    createMessage.mutate(
      {
        ticketId,
        sender: userRole,
        message: message.trim(),
      },
      {
        onSuccess: () => {
          setMessage("");
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao enviar mensagem" });
        },
      }
    );
  };

  const handleCloseChat = () => {
    closeSession.mutate(ticketId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [api.support.list.path] });
        queryClient.invalidateQueries({ queryKey: [api.support.listByMerchant.path] });
        queryClient.invalidateQueries({ queryKey: [api.support.listByCourier.path] });
        toast({ title: "Sucesso", description: "Chat finalizado com sucesso!" });
        onClose();
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao finalizar chat" });
      },
    });
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 w-64 bg-card rounded-xl border border-primary/30 shadow-2xl flex items-center justify-between p-3 z-50 cursor-pointer hover:bg-muted transition-all animate-in slide-in-from-bottom-4"
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-foreground text-sm font-bold">Suporte: {merchantName}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-card rounded-2xl border border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
        <div>
          <h3 className="font-bold text-foreground">Chat com {merchantName}</h3>
          <p className="text-xs text-muted-foreground">Conversa em tempo real</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
            title="Minimizar"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Nenhuma mensagem ainda. Comece a conversa!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === userRole ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === userRole
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none text-sm"
          disabled={createMessage.isPending}
        />
        <button
          type="submit"
          disabled={createMessage.isPending || !message.trim()}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createMessage.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Close Button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleCloseChat}
          disabled={closeSession.isPending}
          className="w-full py-2 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
        >
          {closeSession.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Finalizando...
            </span>
          ) : (
            "Finalizar Chat"
          )}
        </button>
      </div>
    </div>
  );
}
