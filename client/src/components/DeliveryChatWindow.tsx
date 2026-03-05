import { useState, useEffect, useRef } from "react";
import { Send, X, Loader2, Bike, User, Minus, MessageSquare } from "lucide-react";
import { useDeliveryChatMessages, useCreateDeliveryChatMessage } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";

interface DeliveryChatWindowProps {
  deliveryId: number;
  receiverName: string;
  userRole: "customer" | "courier";
  onClose: () => void;
}

export default function DeliveryChatWindow({ deliveryId, receiverName, userRole, onClose }: DeliveryChatWindowProps) {
  const [message, setMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const { data: messages = [], isLoading } = useDeliveryChatMessages(deliveryId);
  const createMessage = useCreateDeliveryChatMessage();
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
        window.dispatchEvent(new CustomEvent('new-delivery-message', { 
          detail: { deliveryId, sender: lastMsg.sender } 
        }));
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages, isMinimized, userRole, deliveryId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    createMessage.mutate(
      {
        deliveryId,
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

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 w-64 bg-[#252529] rounded-xl border border-[#00a335]/30 shadow-2xl flex items-center justify-between p-3 z-50 cursor-pointer hover:bg-[#2a2a2e] transition-all animate-in slide-in-from-bottom-4"
      >
        <div className="flex items-center gap-2">
          <div className="bg-[#00a335] p-1.5 rounded-lg text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-white text-sm font-bold">Chat com {receiverName}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[#00a335] rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-[500px] bg-[#1e1e21] rounded-2xl border border-white/10 shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden" style={{ bottom: '1rem', right: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#252529]">
        <div className="flex items-center gap-3">
          <div className="bg-[#00a335]/20 p-2 rounded-lg text-[#00a335]">
            {userRole === "customer" ? <Bike className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Chat com {receiverName}</h3>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
            title="Minimizar"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121214]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#00a335]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-6">
            <div className="bg-white/5 p-4 rounded-full mb-3">
              <Send className="w-6 h-6 opacity-20" />
            </div>
            <p className="text-xs">Combine os detalhes da entrega aqui.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === userRole ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.sender === userRole
                    ? "bg-[#00a335] text-white rounded-br-none"
                    : "bg-[#1e1e21] text-white border border-white/5 rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>
                <p className="text-[10px] opacity-50 mt-1 text-right">
                  {new Date(msg.createdAt!).toLocaleTimeString("pt-BR", {
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
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#1e1e21] flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-2 rounded-xl bg-[#121214] border border-white/5 focus:border-[#00a335]/50 outline-none text-sm text-white transition-all"
          disabled={createMessage.isPending}
        />
        <button
          type="submit"
          disabled={createMessage.isPending || !message.trim()}
          className="p-2 bg-[#00a335] text-white rounded-xl hover:bg-[#008a2d] transition-colors disabled:opacity-50 shadow-lg shadow-[#00a335]/20"
        >
          {createMessage.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
