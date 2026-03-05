import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Store, Package, Clock, CheckCircle, Navigation, MessageSquare } from "lucide-react";
import { Delivery, Merchant } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import DeliveryChatWindow from "@/components/DeliveryChatWindow";
import { Button } from "@/components/ui/button";

export default function OrderTracking() {
  const { id } = useParams();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const { data: delivery, isLoading: isLoadingDelivery } = useQuery<Delivery>({
    queryKey: [`/api/deliveries/${id}`],
  });

  const { data: merchant, isLoading: isLoadingMerchant } = useQuery<Merchant>({
    queryKey: [`/api/merchants/${delivery?.merchantId}`],
    enabled: !!delivery?.merchantId,
  });

  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const handleNewMessage = (e: any) => {
      if (e.detail.deliveryId === delivery?.id) {
        setShowChat(true);
      }
    };
    window.addEventListener('new-delivery-message', handleNewMessage);
    return () => window.removeEventListener('new-delivery-message', handleNewMessage);
  }, [delivery?.id]);

  useEffect(() => {
    if (delivery?.status === "delivered" && delivery.deliveredAt) {
      const timer = setInterval(() => {
        const deliveredAt = new Date(delivery.deliveredAt!).getTime();
        const now = new Date().getTime();
        const diff = 1 * 1000 - (now - deliveredAt); // Expire almost immediately for "indisponivel"
        
        if (diff <= 0) {
          setTimeLeft("Expirado");
          clearInterval(timer);
        } else {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [delivery]);

  if (isLoadingDelivery || isLoadingMerchant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-6">
        <Package className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-xl font-bold">Pedido não encontrado</h1>
      </div>
    );
  }

  if (timeLeft === "Expirado" || delivery.status === "delivered") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-6 text-center">
        <Clock className="w-16 h-16 text-red-600 mb-4" />
        <h1 className="text-xl font-bold">Este link está indisponível</h1>
        <p className="text-gray-600 mt-2">Links de acompanhamento ficam indisponíveis após a conclusão da entrega.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6 pt-8">
        {/* Status Header */}
        <div className="text-center space-y-2">
          <Badge className={`
            px-4 py-1.5 rounded-full font-bold uppercase tracking-wider
            ${delivery.status === 'pending' ? 'bg-orange-100 text-orange-700 border-2 border-orange-500' : ''}
            ${delivery.status === 'accepted' ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : ''}
            ${delivery.status === 'picked_up' ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' : ''}
            ${delivery.status === 'delivered' ? 'bg-green-100 text-green-700 border-2 border-green-500' : ''}
          `}>
            {delivery.status === 'pending' ? 'Buscando Entregador' : 
             delivery.status === 'accepted' ? 'Entregador a caminho da loja' : 
             delivery.status === 'picked_up' ? 'Pedido em rota de entrega' : 
             delivery.status === 'delivered' ? 'Entregue' : delivery.status}
          </Badge>
          <h1 className="text-2xl font-black text-black">Pedido #{delivery.orderNumber}</h1>
          {timeLeft && <p className="text-sm text-gray-700">Link expira em: <span className="text-red-600 font-bold">{timeLeft}</span></p>}
        </div>

        {/* Store Card */}
        <Card className="bg-white border-2 border-orange-500 p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-black">{merchant?.name}</h3>
              <p className="text-sm text-gray-700">{merchant?.category}</p>
            </div>
          </div>
        </Card>

        {/* Security Code Card */}
        <Card className="bg-white border-4 border-orange-500 p-8 rounded-3xl text-center space-y-4 shadow-[0_0_30px_rgba(255,140,0,0.2)]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Código de Entrega</h4>
            <p className="text-xs text-gray-600">Informe este código ao entregador</p>
          </div>
          <div className="text-5xl font-black tracking-[0.2em] text-orange-600">
            {delivery.pickupCode}
          </div>
        </Card>

        {/* Journey Card */}
        <Card className="bg-white border-2 border-gray-300 p-6 rounded-3xl space-y-6 shadow-md">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <div className="w-0.5 h-12 bg-gray-400" />
              <div className="w-4 h-4 rounded-full bg-black" />
            </div>
            <div className="flex-1 space-y-8">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Origem (Loja)</h4>
                <p className="text-sm font-medium text-black">{(delivery.pickupAddress?.split(',').slice(0, 4).join(', ') || '')}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Destino (Você)</h4>
                <p className="text-sm font-medium text-black">{(delivery.deliveryAddress?.split(',').slice(0, 4).join(', ') || '')}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-300 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <Navigation className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-700">
            Distância total: <span className="text-black font-bold">{delivery.distanceKm} km</span>
          </p>
        </div>

        {/* Chat Button - Only visible during route */}
        {delivery.status === "picked_up" && (
          <Button 
            onClick={() => setShowChat(true)}
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold gap-3 shadow-lg shadow-orange-500/30"
          >
            <MessageSquare className="w-5 h-5" />
            Falar com o Motoboy
          </Button>
        )}
      </div>

      {showChat && delivery.status === "picked_up" && (
        <DeliveryChatWindow 
          deliveryId={delivery.id}
          receiverName="Motoboy"
          userRole="customer"
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}