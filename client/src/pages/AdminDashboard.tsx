import { useDeliveries, useUpdateDeliveryStatus } from "@/hooks/use-deliveries";
import { useMerchants } from "@/hooks/use-merchants";
import { useCouriers } from "@/hooks/use-couriers";
import { Store, Bike, Package, Clock, CheckCircle2, MoreHorizontal, MessageSquare, AlertTriangle, Send, Check, Loader2, XCircle } from "lucide-react";
import { useSupportTickets, useUpdateSupportTicket } from "@/hooks/use-support";
import { useCreateActiveSession } from "@/hooks/use-chat";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import ChatWindow from "@/components/ChatWindow";
import CourierManagement from "@/components/CourierManagement";

export default function AdminDashboard() {
  const { data: deliveries = [], isLoading: isLoadingDeliveries } = useDeliveries();
  const { data: merchants = [], isLoading: isLoadingMerchants } = useMerchants();
  const { data: couriers = [], isLoading: isLoadingCouriers } = useCouriers();
  const updateStatus = useUpdateDeliveryStatus();
  const { toast } = useToast();

  const handleUpdateStatus = (id: number, status: "delivered" | "cancelled") => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast({ 
          title: "Sucesso", 
          description: `Pedido ${status === 'delivered' ? 'finalizado' : 'cancelado'} com sucesso!` 
        });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao atualizar status do pedido" });
      }
    });
  };

  const totalRevenue = deliveries.filter(d => d.status === 'delivered').reduce((acc, curr) => acc + parseFloat(curr.price || "0"), 0);
  const adminProfit = totalRevenue * 0.2;
  const pendingCount = deliveries.filter(d => d.status === "pending").length;
  const completedCount = deliveries.filter(d => d.status === "delivered").length;

  const { data: tickets = [], isLoading: isLoadingTickets } = useSupportTickets();
  const openTicketsCount = tickets.filter(t => t.status === "open").length;

  const stats = [
    { label: "Meu Lucro (20%)", value: `R$ ${adminProfit.toFixed(2)}`, icon: Package, color: "text-primary" },
    { label: "Lojistas Ativos", value: merchants.length, icon: Store, color: "text-blue-500" },
    { label: "Suporte em Aberto", value: openTicketsCount, icon: MessageSquare, color: "text-purple-500" },
    { label: "Entregas Pendentes", value: pendingCount, icon: Clock, color: "text-red-500" },
  ];

  if (isLoadingDeliveries || isLoadingMerchants || isLoadingCouriers) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel do Administrador</h1>
        <p className="text-muted-foreground mt-2">Visão geral da plataforma e estatísticas gerais.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-2 text-foreground font-display">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-full bg-muted ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <CourierManagement couriers={couriers} deliveries={deliveries} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SupportManagement tickets={tickets} merchants={merchants} couriers={couriers} />
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/20">
              <h2 className="text-lg font-semibold text-foreground">Entregas Recentes</h2>
            </div>
            <div className="divide-y border-border">
              {deliveries.slice(0, 8).map(delivery => (
                <div key={delivery.id} className="p-6 hover:bg-muted/10 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Pedido #{delivery.orderNumber} - {delivery.customerName}</p>
                    {delivery.customerWhatsapp && (
                      <p className="text-xs text-[#00a335] font-bold">WhatsApp: {delivery.customerWhatsapp}</p>
                    )}
                    <p className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {(delivery.pickupAddress?.split(',').slice(0, 4).join(', ') || '')} ➔ {(delivery.deliveryAddress?.split(',').slice(0, 4).join(', ') || '')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleUpdateStatus(delivery.id, 'delivered')}
                          disabled={updateStatus.isPending}
                          className="p-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-lg transition-all"
                          title="Finalizar"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(delivery.id, 'cancelled')}
                          disabled={updateStatus.isPending}
                          className="p-2 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="font-semibold text-foreground">R$ {parseFloat(delivery.price).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{delivery.distanceKm} km</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                      ${delivery.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                      ${delivery.status === 'accepted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                      ${delivery.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                      ${delivery.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                    `}>
                      {delivery.status === 'pending' ? 'pendente' : 
                       delivery.status === 'accepted' ? 'aceito' : 
                       delivery.status === 'delivered' ? 'entregue' : 
                       delivery.status === 'cancelled' ? 'cancelado' : delivery.status}
                    </span>
                  </div>
                </div>
              ))}
              {deliveries.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma entrega ainda.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/20">
              <h2 className="text-lg font-semibold text-foreground">Lojistas Registrados</h2>
            </div>
            <div className="divide-y border-border">
              {merchants.slice(0, 5).map(merchant => (
                <div key={merchant.id} className="p-4 hover:bg-muted/10 transition-colors flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {merchant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{merchant.name}</p>
                    <p className="text-xs text-muted-foreground">{merchant.category}</p>
                  </div>
                </div>
              ))}
              {merchants.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum lojista registrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportManagement({ tickets, merchants, couriers }: { tickets: any[], merchants: any[], couriers: any[] }) {
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [response, setResponse] = useState("");
  const [activeChatTicketId, setActiveChatTicketId] = useState<number | null>(null);
  const updateTicket = useUpdateSupportTicket();
  const createSession = useCreateActiveSession();
  const { toast } = useToast();

  const openTickets = tickets.filter(t => t.status === 'open');

  const handleRespond = (id: number) => {
    if (!response) return;
    updateTicket.mutate({ id, response }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Resposta enviada com sucesso!" });
        setRespondingTo(null);
        setResponse("");
      }
    });
  };

  const handleStartChat = (ticketId: number, merchantId?: number, courierId?: number) => {
    createSession.mutate({
      ticketId,
      merchantId,
      courierId,
      status: "active"
    }, {
      onSuccess: () => {
        setActiveChatTicketId(ticketId);
        toast({ title: "Sucesso", description: "Chat iniciado!" });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao iniciar chat" });
      }
    });
  };

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-muted/20 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Solicitações de Suporte
          </h2>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
            {tickets.filter(t => t.status === 'open').length} Pendentes
          </span>
        </div>
            <div className="divide-y border-border">
              {openTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma solicitação de suporte pendente.
                </div>
              ) : (
                openTickets.map(ticket => {
                  const merchant = merchants.find(m => m.id === ticket.merchantId);
                  const courier = couriers.find(c => c.id === ticket.courierId);
                  const senderName = ticket.senderRole === 'courier' ? (courier?.name || "Motoboy") : (merchant?.name || "Lojista");
                  const createdAt = new Date(ticket.createdAt);
              const now = new Date();
              const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
              
              return (
                <div key={ticket.id} className="p-6 hover:bg-muted/5 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-xl ${
                        ticket.type === 'chat' ? 'bg-green-100 text-green-600' :
                        ticket.type === 'feedback' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {ticket.type === 'chat' ? <MessageSquare className="w-5 h-5" /> :
                         ticket.type === 'feedback' ? <Send className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground">{ticket.subject || "Sem assunto"}</h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                            {ticket.senderRole === 'courier' ? 'Motoboy' : 'Lojista'}
                          </span>
                          <span className="text-xs text-muted-foreground">• {senderName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ticket.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-medium text-orange-600 mb-1">
                        <Clock className="w-3 h-3" /> {diffMinutes} min atrás
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ticket.status === 'open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {ticket.status === 'open' ? 'Aberto' : 'Respondido'}
                      </span>
                    </div>
                  </div>

                  {ticket.status === 'open' ? (
                    respondingTo === ticket.id ? (
                      <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <textarea 
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Escreva sua resposta..."
                          className="w-full p-3 rounded-xl bg-muted/50 border border-border focus:border-primary outline-none text-sm resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setRespondingTo(null)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => handleRespond(ticket.id)}
                            disabled={updateTicket.isPending}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2"
                          >
                            {updateTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Enviar Resposta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => setRespondingTo(ticket.id)}
                          className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                          Responder
                        </button>
                        {ticket.type === 'chat' && (
                          <button 
                            onClick={() => handleStartChat(ticket.id, ticket.merchantId, ticket.courierId)}
                            disabled={createSession.isPending}
                            className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white transition-all rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                          >
                            {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            Iniciar Chat Online
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Sua Resposta:</p>
                      <p className="text-sm text-foreground">{ticket.response}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

          {activeChatTicketId && (
            <ChatWindow
              ticketId={activeChatTicketId}
              merchantName={
                tickets.find(t => t.id === activeChatTicketId)?.senderRole === 'courier'
                  ? (couriers.find(c => c.id === tickets.find(t => t.id === activeChatTicketId)?.courierId)?.name || "Motoboy")
                  : (merchants.find(m => m.id === tickets.find(t => t.id === activeChatTicketId)?.merchantId)?.name || "Lojista")
              }
              userRole="admin"
              onClose={() => setActiveChatTicketId(null)}
            />
          )}
    </>
  );
}
