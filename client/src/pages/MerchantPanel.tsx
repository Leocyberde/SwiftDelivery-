import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { useMerchants, useCreateMerchant, useUpdateMerchant } from "@/hooks/use-merchants";
import { useDeliveries, useCreateDelivery, useUpdateDeliveryStatus } from "@/hooks/use-deliveries";
import { Store, MapPin, Search, History, Package, Loader2, MessageSquare, AlertTriangle, Send, Share2, Copy } from "lucide-react";
import { useMerchantSupportTickets, useCreateSupportTicket } from "@/hooks/use-support";
import { useActiveSessions } from "@/hooks/use-chat";
import { geocodeAddress, calculateHaversineDistance, calculateDeliveryPrice } from "@/lib/geo";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import ChatWindow from "@/components/ChatWindow";
import AddressAutocomplete from "@/components/AddressAutocomplete";

export default function MerchantPanel() {
  const [activeTab, setActiveTab] = useState<"new" | "history" | "profile" | "support">("new");
  const { data: merchants, isLoading: isLoadingMerchants } = useMerchants();
  const merchant = merchants?.[0]; // Simulate logged-in merchant

  if (isLoadingMerchants) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">Painel do Lojista</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas entregas e perfil.</p>
        </div>
        
          <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
            {(["new", "history", "profile", "support"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? "bg-background text-foreground shadow-sm border border-border" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab === "new" ? "Nova Entrega" : 
                 tab === "history" ? "Histórico" : 
                 tab === "profile" ? "Perfil" : "Ajuda"}
              </button>
            ))}
          </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm p-6 lg:p-8">
        {activeTab === "profile" && <MerchantProfile merchant={merchant} />}
        {activeTab === "new" && (
          <div className="space-y-8">
            <NewDelivery merchant={merchant} />
            <div className="border-t border-border pt-8">
              <ActiveDeliveries merchantId={merchant?.id} />
            </div>
          </div>
        )}
        {activeTab === "history" && <DeliveryHistory merchantId={merchant?.id} />}
        {activeTab === "support" && <SupportSection merchant={merchant} />}
      </div>
    </div>
  );
}

function SupportSection({ merchant }: { merchant: any }) {
  const [supportType, setSupportType] = useState<"chat" | "feedback" | null>(null);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const { data: tickets = [] } = useMerchantSupportTickets(merchant?.id);
  const openTickets = tickets.filter(t => t.status === "open");
  const { data: activeSessions = [] } = useActiveSessions();
  const createTicket = useCreateSupportTicket();
  const { toast } = useToast();

  // Find if merchant has an active chat session
  const activeChatSession = activeSessions.find(s => s.merchantId === merchant?.id && s.status === "active");

  useEffect(() => {
    const handleNewMessage = (e: any) => {
      if (e.detail.ticketId === activeChatSession?.ticketId) {
        // O componente ChatWindow já lida com a auto-abertura (setIsMinimized(false))
        // Mas podemos garantir que a aba de suporte esteja visível se necessário
      }
    };
    window.addEventListener('new-support-message', handleNewMessage);
    return () => window.removeEventListener('new-support-message', handleNewMessage);
  }, [activeChatSession?.ticketId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportType || !message) return;

    createTicket.mutate({
      merchantId: merchant.id,
      type: supportType,
      subject: supportType === "chat" ? "Solicitação de Chat" : subject,
      message: message,
      status: "open",
      response: null
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Sua solicitação foi enviada. Te atenderemos em breve!" });
        setMessage("");
        setSubject("");
        setSupportType(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
        <div className="p-4 bg-primary/10 rounded-full text-primary">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suporte ao Lojista</h2>
          <p className="text-sm text-muted-foreground">Como podemos te ajudar hoje?</p>
        </div>
      </div>

      {!supportType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setSupportType("chat")}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left group"
            >
              <div className="p-3 rounded-xl bg-green-100 text-green-600 w-fit mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Chat Online</h3>
              <p className="text-sm text-muted-foreground">Fale com nossa equipe agora. Te atendemos em até 10 minutos.</p>
            </button>

            <button 
              onClick={() => setSupportType("feedback")}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md transition-all text-left group"
            >
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600 w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Enviar Feedback</h3>
              <p className="text-sm text-muted-foreground">Sugestões ou elogios para melhorarmos nossa plataforma.</p>
            </button>
          </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-muted/30 p-8 rounded-3xl border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">
              {supportType === "chat" ? "Iniciar Chat Online" : 
               supportType === "feedback" ? "Enviar Feedback" : "Relatar um Erro"}
            </h3>
            <button onClick={() => setSupportType(null)} className="text-sm text-muted-foreground hover:text-foreground underline">Voltar</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {supportType !== "chat" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assunto</label>
                <input 
                  required 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sobre o que se trata?" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" 
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {supportType === "chat" ? "Como podemos ajudar? (Iniciaremos o chat em breve)" : "Mensagem"}
              </label>
              <textarea 
                required 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4} 
                placeholder="Descreva aqui..." 
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
              />
            </div>
            <button 
              type="submit" 
              disabled={createTicket.isPending}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {createTicket.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {supportType === "chat" ? "Solicitar Atendimento" : "Enviar Mensagem"}
            </button>
            {supportType === "chat" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Tempo estimado de espera: <strong>10 minutos</strong>
              </p>
            )}
          </form>
        </div>
      )}

      {activeChatSession && (
        <ChatWindow
          ticketId={activeChatSession.ticketId}
          merchantName="Suporte"
          userRole="merchant"
          onClose={() => {}}
        />
      )}

      <div className="mt-12">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <History className="w-5 h-5" /> Seus Chamados Pendentes
        </h3>
        <div className="space-y-4">
          {openTickets.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-2xl text-muted-foreground">
              Você não possui chamados pendentes no momento.
            </div>
          ) : (
            openTickets.map(ticket => (
              <div key={ticket.id} className="p-6 bg-card border border-border rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ticket.type === 'chat' ? 'bg-green-100 text-green-700' :
                        ticket.type === 'feedback' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ticket.type}
                      </span>
                      <h4 className="font-bold text-foreground">{ticket.subject || "Sem assunto"}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(ticket.createdAt!), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ticket.status === 'open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {ticket.status === 'open' ? 'Em aberto' : 'Respondido'}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-4 bg-muted/30 p-3 rounded-lg italic">"{ticket.message}"</p>
                {ticket.response && (
                  <div className="mt-4 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                    <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Resposta do Suporte:</p>
                    <p className="text-sm text-foreground">{ticket.response}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MerchantProfile({ merchant }: { merchant: any }) {
  const createMutation = useCreateMerchant();
  const updateMutation = useUpdateMerchant();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      whatsapp: formData.get("whatsapp") as string,
      category: formData.get("category") as string,
      street: formData.get("street") as string,
      number: formData.get("number") as string,
      neighborhood: formData.get("neighborhood") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
    };

    if (merchant?.id) {
      updateMutation.mutate({ id: merchant.id, ...data }, {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Perfil criado com sucesso!" });
        }
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Perfil da Loja</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome da Loja</label>
            <input 
              type="text" 
              name="name"
              defaultValue={merchant?.name || ""}
              required 
              className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp</label>
            <input 
              type="tel" 
              name="whatsapp"
              defaultValue={merchant?.whatsapp || ""}
              required 
              className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Categoria</label>
          <select 
            name="category"
            defaultValue={merchant?.category || ""}
            required 
            className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
          >
            <option value="">Selecione uma categoria</option>
            <option value="restaurante">Restaurante</option>
            <option value="mercado">Mercado</option>
            <option value="farmacia">Farmácia</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rua</label>
            <input 
              type="text" 
              name="street"
              defaultValue={merchant?.street || ""}
              required 
              className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Número</label>
            <input 
              type="text" 
              name="number"
              defaultValue={merchant?.number || ""}
              required 
              className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bairro</label>
            <input 
              type="text" 
              name="neighborhood"
              defaultValue={merchant?.neighborhood || ""}
              required 
              className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cidade</label>
            <input 
              type="text" 
              name="city"
              defaultValue={merchant?.city || ""}
              required 
              className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Estado</label>
          <input 
            type="text" 
            name="state"
            defaultValue={merchant?.state || ""}
            required 
            maxLength={2}
            className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none" 
          />
        </div>

        <button 
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar Perfil"}
        </button>
      </form>
    </div>
  );
}

function NewDelivery({ merchant }: { merchant: any }) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [observation, setObservation] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const createDelivery = useCreateDelivery();
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!pickupAddress || !deliveryAddress) {
      toast({ title: "Atenção", description: "Por favor, preencha os endereços de coleta e entrega." });
      return;
    }

    setIsCalculating(true);
    try {
      const [pickupCoords, deliveryCoords] = await Promise.all([
        geocodeAddress(pickupAddress),
        geocodeAddress(deliveryAddress)
      ]);
      
      if (pickupCoords && deliveryCoords) {
        const dist = calculateHaversineDistance(
          pickupCoords[0],
          pickupCoords[1],
          deliveryCoords[0],
          deliveryCoords[1]
        );
        setDistance(dist);
        setPrice(calculateDeliveryPrice(dist));
        toast({ title: "Sucesso", description: "Rota calculada com sucesso!" });
      } else {
        toast({ 
          title: "Erro na Busca", 
          description: "Não conseguimos localizar um dos endereços. Tente ser mais específico (Rua, Número, Cidade).",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Calculation error:", error);
      toast({ title: "Erro", description: "Ocorreu uma falha ao calcular a rota. Verifique sua conexão.", variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distance || !price) {
      toast({ title: "Erro", description: "Calcule a distância primeiro" });
      return;
    }

    createDelivery.mutate({
      merchantId: merchant.id,
      pickupAddress,
      deliveryAddress,
      customerName,
      customerWhatsapp,
      observation,
      distanceKm: distance.toFixed(2),
      price: price.toFixed(2),
      status: "pending",
      pickupCode: Math.floor(1000 + Math.random() * 9000).toString(),
      orderNumber: Math.floor(10000 + Math.random() * 90000).toString()
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Entrega criada com sucesso!" });
        setPickupAddress("");
        setDeliveryAddress("");
        setCustomerName("");
        setCustomerWhatsapp("");
        setObservation("");
        setDistance(null);
        setPrice(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Nova Entrega</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AddressAutocomplete
          label="Endereço de Coleta"
          value={pickupAddress}
          onChange={setPickupAddress}
          placeholder="Rua, número, bairro, cidade"
          required
        />

        <AddressAutocomplete
          label="Endereço de Entrega"
          value={deliveryAddress}
          onChange={setDeliveryAddress}
          placeholder="Rua, número, bairro, cidade"
          required
        />

        <button
          type="button"
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full py-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
        >
          {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Calcular Rota e Preço
        </button>

        {distance && price && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm"><strong>Distância:</strong> {distance.toFixed(2)} km</p>
            <p className="text-sm"><strong>Preço:</strong> R$ {price.toFixed(2)}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Nome do Cliente</label>
          <input 
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">WhatsApp do Cliente</label>
          <input 
            type="tel"
            value={customerWhatsapp}
            onChange={(e) => setCustomerWhatsapp(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Observações</label>
          <textarea 
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none resize-none"
          />
        </div>

        <button 
          type="submit"
          disabled={createDelivery.isPending}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createDelivery.isPending ? "Criando..." : "Criar Entrega"}
        </button>
      </form>
    </div>
  );
}

function ActiveDeliveries({ merchantId }: { merchantId?: number }) {
  const { data: deliveries = [] } = useDeliveries();
  const updateStatus = useUpdateDeliveryStatus();
  const { toast } = useToast();
  const [showSecondRouteModal, setShowSecondRouteModal] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [secondDeliveryAddress, setSecondDeliveryAddress] = useState("");
  const [secondCustomerName, setSecondCustomerName] = useState("");
  const [secondCustomerWhatsapp, setSecondCustomerWhatsapp] = useState("");
  const [secondObservation, setSecondObservation] = useState("");
  const [isCreatingSecondRoute, setIsCreatingSecondRoute] = useState(false);

  const active = deliveries.filter(d => d.merchantId === merchantId && d.status !== "delivered" && d.status !== "cancelled");

  const handleAddSecondRoute = async (deliveryId: number) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    // Check if can add second route
    if (delivery.status !== "accepted") {
      toast({ 
        title: "Erro", 
        description: "Só é possível adicionar segunda rota quando o motoboy aceita a primeira.",
        variant: "destructive"
      });
      return;
    }

    setSelectedDeliveryId(deliveryId);
    setShowSecondRouteModal(true);
  };

  const handleCreateSecondRoute = async () => {
    if (!selectedDeliveryId || !secondDeliveryAddress || !secondCustomerName) {
      toast({ 
        title: "Erro", 
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingSecondRoute(true);
    try {
      const response = await fetch(`/api/deliveries/${selectedDeliveryId}/second-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstDeliveryId: selectedDeliveryId,
          deliveryAddress: secondDeliveryAddress,
          customerName: secondCustomerName,
          customerWhatsapp: secondCustomerWhatsapp,
          observation: secondObservation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar segunda rota");
      }

      const result = await response.json();
      toast({ 
        title: "Sucesso", 
        description: `Segunda rota criada! Distância total: ${result.totalDistance.toFixed(2)} km | Preço total: R$ ${result.totalPrice.toFixed(2)}` 
      });

      // Reset form
      setSecondDeliveryAddress("");
      setSecondCustomerName("");
      setSecondCustomerWhatsapp("");
      setSecondObservation("");
      setSelectedDeliveryId(null);
      setShowSecondRouteModal(false);
    } catch (error) {
      console.error("Error creating second route:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao criar segunda rota",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSecondRoute(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Aguardando motoboy", color: "bg-orange-100 text-orange-700" };
      case "accepted":
        return { label: "Rota aceita", color: "bg-blue-100 text-blue-700" };
      case "picked_up":
        return { label: "Indo entregar", color: "bg-purple-100 text-purple-700" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700" };
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Entregas Ativas</h3>
      {active.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma entrega ativa</p>
      ) : (
        active.map(delivery => {
          const statusInfo = getStatusDisplay(delivery.status);
          return (
            <div key={delivery.id} className="p-4 border border-border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">Pedido #{delivery.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{delivery.customerName}</p>
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {(delivery.pickupAddress?.split(',').slice(0, 4).join(', ') || '')} → {(delivery.deliveryAddress?.split(',').slice(0, 4).join(', ') || '')}
              </p>
              <div className="flex flex-wrap gap-4 text-sm mb-3">
                <p>
                  <strong>R$ {parseFloat(delivery.price).toFixed(2)}</strong> • {delivery.distanceKm} km
                </p>
                {delivery.pickupCode && (
                  <p className="text-primary font-bold">
                    Código de Coleta: {delivery.pickupCode}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/order/${delivery.id}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "Link Copiado", description: "O link de rastreio foi copiado para o seu clipboard." });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Link de Rastreio
                </button>
                <a
                  href={`/order/${delivery.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-bold hover:bg-muted/80 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Ver Relatório
                </a>
                {delivery.status === "accepted" && !delivery.linkedDeliveryId && (
                  <button
                    onClick={() => handleAddSecondRoute(delivery.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200 transition-all"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Adicionar Rota 2
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Modal para adicionar segunda rota */}
      {showSecondRouteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold">Adicionar Segunda Rota</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Endereço de Entrega</label>
              <input 
                type="text"
                value={secondDeliveryAddress}
                onChange={(e) => setSecondDeliveryAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nome do Cliente</label>
              <input 
                type="text"
                value={secondCustomerName}
                onChange={(e) => setSecondCustomerName(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp do Cliente</label>
              <input 
                type="tel"
                value={secondCustomerWhatsapp}
                onChange={(e) => setSecondCustomerWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <textarea 
                value={secondObservation}
                onChange={(e) => setSecondObservation(e.target.value)}
                placeholder="Observações adicionais"
                rows={2}
                className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowSecondRouteModal(false)}
                className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg font-bold hover:bg-muted/80 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSecondRoute}
                disabled={isCreatingSecondRoute}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreatingSecondRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Rota"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryHistory({ merchantId }: { merchantId?: number }) {
  const { data: deliveries = [] } = useDeliveries();
  const completed = deliveries.filter(d => d.merchantId === merchantId && (d.status === "delivered" || d.status === "cancelled"));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Histórico de Entregas</h2>
      {completed.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma entrega concluída</p>
      ) : (
        completed.map(delivery => (
          <div key={delivery.id} className="p-4 border border-border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">Pedido #{delivery.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{delivery.customerName}</p>
              </div>
              <span className={`text-sm font-bold px-2 py-1 rounded ${
                delivery.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {delivery.status === 'delivered' ? 'Entregue' : 'Cancelado'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {(delivery.pickupAddress?.split(',').slice(0, 4).join(', ') || '')} → {(delivery.deliveryAddress?.split(',').slice(0, 4).join(', ') || '')}
            </p>
            <p className="text-sm">
              <strong>R$ {parseFloat(delivery.price).toFixed(2)}</strong> • {delivery.distanceKm} km
            </p>
          </div>
        ))
      )}


    </div>
  );
}
