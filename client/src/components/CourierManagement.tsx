
import { Courier, Delivery } from "@shared/schema";
import { useUpdateCourierBalance, useBlockCourier } from "@/hooks/use-couriers";
import { useReassignDelivery } from "@/hooks/use-deliveries";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bike, Ban, DollarSign, ArrowRightLeft, Loader2, Check, X, ShieldAlert, TrendingUp } from "lucide-react";
import { format, addHours, addDays } from "date-fns";

interface CourierManagementProps {
  couriers: Courier[];
  deliveries: Delivery[];
}

export default function CourierManagement({ couriers, deliveries }: CourierManagementProps) {
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [blockDuration, setBlockDuration] = useState("1h");
  const [reassignDeliveryId, setReassignDeliveryId] = useState<number | null>(null);
  const [targetCourierId, setTargetCourierId] = useState<number | null>(null);

  const updateBalance = useUpdateCourierBalance();
  const blockCourier = useBlockCourier();
  const reassignDelivery = useReassignDelivery();
  const { toast } = useToast();

  const selectedCourier = couriers.find(c => c.id === selectedCourierId);
  const courierDeliveries = deliveries.filter(d => d.courierId === selectedCourierId && d.status !== 'delivered' && d.status !== 'cancelled');

  const handleDiscount = () => {
    if (!selectedCourier || !discountAmount) return;
    const currentBalance = parseFloat(selectedCourier.balance || "0");
    const discount = parseFloat(discountAmount);
    const newBalance = (currentBalance - discount).toFixed(2);

    updateBalance.mutate({ id: selectedCourier.id, balance: newBalance }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: `Desconto de R$ ${discount.toFixed(2)} aplicado.` });
        setDiscountAmount("");
      }
    });
  };

  const handleBlock = (isBlocked: boolean) => {
    if (!selectedCourier) return;
    
    let blockedUntil = null;
    if (isBlocked) {
      const now = new Date();
      if (blockDuration === "1h") blockedUntil = addHours(now, 1).toISOString();
      else if (blockDuration === "24h") addDays(now, 1).toISOString();
      else if (blockDuration === "7d") addDays(now, 7).toISOString();
      else if (blockDuration === "permanent") blockedUntil = addDays(now, 3650).toISOString(); // 10 years
    }

    blockCourier.mutate({ id: selectedCourier.id, isBlocked, blockedUntil }, {
      onSuccess: () => {
        toast({ 
          title: "Sucesso", 
          description: isBlocked ? `Motoboy bloqueado até ${blockedUntil ? format(new Date(blockedUntil), 'dd/MM HH:mm') : 'sempre'}` : "Motoboy desbloqueado." 
        });
      }
    });
  };

  const handleReassign = (deliveryId: number) => {
    if (!targetCourierId) return;
    reassignDelivery.mutate({ id: deliveryId, courierId: targetCourierId }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Pedido deslocado com sucesso!" });
        setReassignDeliveryId(null);
        setTargetCourierId(null);
      }
    });
  };

  // Cálculos de Lucro
  const totalRevenue = deliveries.filter(d => d.status === 'delivered').reduce((acc, curr) => acc + parseFloat(curr.price || "0"), 0);
  const adminProfit = totalRevenue * 0.2;
  const couriersTotalEarnings = totalRevenue * 0.8;

  return (
    <div className="space-y-6">
      {/* Painel de Lucros */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-primary/5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Relatório de Lucros (80/20)</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-muted/30 rounded-xl border border-border">
            <p className="text-sm font-medium text-muted-foreground">Lucro Total do Painel (20%)</p>
            <p className="text-2xl font-bold text-primary mt-1">R$ {adminProfit.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl border border-border">
            <p className="text-sm font-medium text-muted-foreground">Total Ganho pelos Boys (80%)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">R$ {couriersTotalEarnings.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl border border-border">
            <p className="text-sm font-medium text-muted-foreground">Volume Total de Entregas</p>
            <p className="text-2xl font-bold text-foreground mt-1">R$ {totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lista de Motoboys */}
        <div className="lg:col-span-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-muted/20">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bike className="w-5 h-5 text-primary" /> Motoboys Ativos
            </h2>
          </div>
          <div className="divide-y border-border max-h-[600px] overflow-y-auto">
            {couriers.map(courier => (
              <div 
                key={courier.id} 
                onClick={() => setSelectedCourierId(courier.id)}
                className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${selectedCourierId === courier.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted/10'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${courier.isBlocked ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                    {courier.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{courier.name}</p>
                    <p className="text-xs text-muted-foreground">Saldo: R$ {parseFloat(courier.balance || "0").toFixed(2)}</p>
                  </div>
                </div>
                {courier.isBlocked && <ShieldAlert className="w-4 h-4 text-red-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Ações do Motoboy Selecionado */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCourier ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-8 animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{selectedCourier.name}</h3>
                  <p className="text-muted-foreground">ID: #{selectedCourier.id} • Status: {selectedCourier.isBlocked ? 'Bloqueado' : 'Ativo'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                  <p className="text-3xl font-bold text-primary font-display">R$ {parseFloat(selectedCourier.balance || "0").toFixed(2)}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Penalização / Bloqueio */}
                <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-red-600">
                    <Ban className="w-4 h-4" /> Penalização / Bloqueio
                  </h4>
                  {selectedCourier.isBlocked ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Bloqueado até: {selectedCourier.blockedUntil ? format(new Date(selectedCourier.blockedUntil), 'dd/MM/yyyy HH:mm') : 'Permanente'}
                      </p>
                      <button 
                        onClick={() => handleBlock(false)}
                        className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors"
                      >
                        Desbloquear Conta
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <select 
                        value={blockDuration}
                        onChange={(e) => setBlockDuration(e.target.value)}
                        className="w-full p-2 rounded-lg bg-background border border-border text-sm"
                      >
                        <option value="1h">Bloquear por 1 Hora</option>
                        <option value="24h">Bloquear por 24 Horas</option>
                        <option value="7d">Bloquear por 7 Dias</option>
                        <option value="permanent">Bloqueio Permanente</option>
                      </select>
                      <button 
                        onClick={() => handleBlock(true)}
                        className="w-full py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
                      >
                        Aplicar Bloqueio
                      </button>
                    </div>
                  )}
                </div>

                {/* Desconto de Saldo */}
                <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-orange-600">
                    <DollarSign className="w-4 h-4" /> Descontar Saldo
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      placeholder="Valor R$"
                      className="flex-1 p-2 rounded-lg bg-background border border-border text-sm"
                    />
                    <button 
                      onClick={handleDiscount}
                      disabled={!discountAmount || updateBalance.isPending}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      Descontar
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">O valor será subtraído do saldo atual do motoboy.</p>
                </div>
              </div>

              {/* Deslocamento de Pedidos */}
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-blue-600">
                  <ArrowRightLeft className="w-4 h-4" /> Deslocar Pedidos Atuais
                </h4>
                {courierDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed border-border rounded-xl">
                    Nenhum pedido em andamento com este motoboy.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {courierDeliveries.map(delivery => (
                      <div key={delivery.id} className="p-4 bg-muted/10 rounded-xl border border-border flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">Pedido #{delivery.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{delivery.pickupAddress} ➔ {delivery.deliveryAddress}</p>
                        </div>
                        {reassignDeliveryId === delivery.id ? (
                          <div className="flex items-center gap-2">
                            <select 
                              onChange={(e) => setTargetCourierId(Number(e.target.value))}
                              className="p-1.5 rounded bg-background border border-border text-xs"
                            >
                              <option value="">Selecionar Boy...</option>
                              {couriers.filter(c => c.id !== selectedCourierId && !c.isBlocked).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button onClick={() => handleReassign(delivery.id)} className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setReassignDeliveryId(null)} className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setReassignDeliveryId(delivery.id)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3 h-3" /> Deslocar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-muted/10 border-2 border-dashed border-border rounded-2xl p-12 text-center">
              <Bike className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">Selecione um motoboy para gerenciar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
