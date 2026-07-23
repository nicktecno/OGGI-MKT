/**
 * Custom Hooks para Beach Marketplace
 * Estado e lógica reutilizáveis
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { GeoLocation, Order, Ambulante } from "@/lib/beach-marketplace/types";
import {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  findNearestAmbulantes,
} from "@/lib/beach-marketplace/geolocation";

/**
 * Hook para obter localização do cliente
 */
export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao obter localização"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const startWatching = useCallback(() => {
    try {
      const watchId = watchLocation(
        (loc) => setLocation(loc),
        (err) => setError(err.message)
      );
      return watchId;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao monitorar localização"
      );
      return null;
    }
  }, []);

  return {
    location,
    error,
    loading,
    getLocation,
    startWatching,
    stopWatching: stopWatchingLocation,
  };
}

/**
 * Hook para encontrar ambulantes mais próximos
 */
export function useNearestAmbulantes(
  clienteLat: number | null,
  clienteLon: number | null,
  ambulantes: Ambulante[]
) {
  const [nearest, setNearest] = useState<Ambulante[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clienteLat === null || clienteLon === null || ambulantes.length === 0) {
      return;
    }

    setLoading(true);
    // Simula delay de cálculo
    const timer = setTimeout(() => {
      const results = findNearestAmbulantes(clienteLat, clienteLon, ambulantes, 3);
      setNearest(results.map((r) => r.ambulante));
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [clienteLat, clienteLon, ambulantes]);

  return { nearest, loading };
}

/**
 * Hook para simular notificação de pedido ao ambulante (Fase 1 - Mockado)
 */
export function useOrderNotificationSimulation(
  order: Order | null,
  onAmbulantesResponded?: (ambulante: Ambulante | null) => void
) {
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [notificationStage, setNotificationStage] = useState<
    "enviando" | "aguardando" | "aceito" | "rejeitado" | "ninguem_aceitou" | null
  >(null);

  useEffect(() => {
    if (!order || order.status !== "PENDENTE") {
      setNotificationStage(null);
      setCurrentAttempt(0);
      return;
    }

    // Simula envio de notificação
    setNotificationStage("enviando");

    const envioTimer = setTimeout(() => {
      setNotificationStage("aguardando");
    }, 1000);

    // Simula resposta do ambulante (aleatória entre 2-5 segundos)
    const respostaDelay = 2000 + Math.random() * 3000;
    const respostaTimer = setTimeout(() => {
      // 70% chance de aceitar
      const aceita = Math.random() < 0.7;

      if (aceita) {
        setNotificationStage("aceito");
        if (onAmbulantesResponded) {
          onAmbulantesResponded(order.ambulante || null);
        }
      } else {
        setNotificationStage("rejeitado");
        // Simula tentativa com próximo ambulante
        setCurrentAttempt((prev) => prev + 1);

        // Se há próximo ambulante, faz nova tentativa
        if (currentAttempt < 2) {
          setTimeout(() => {
            setNotificationStage("enviando");
          }, 1000);
        } else {
          setNotificationStage("ninguem_aceitou");
        }
      }
    }, respostaDelay);

    return () => {
      clearTimeout(envioTimer);
      clearTimeout(respostaTimer);
    };
  }, [order, currentAttempt, onAmbulantesResponded]);

  return {
    notificationStage,
    currentAttempt: currentAttempt + 1,
  };
}

/**
 * Hook para simular delay de resposta (mockado)
 * Simula tempo de resposta realista de servidor
 */
export function useSimulatedDelay(
  action: () => void,
  delay: number = 1000
): [() => void, boolean] {
  const [loading, setLoading] = useState(false);

  const executeWithDelay = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      action();
      setLoading(false);
    }, delay);
  }, [action, delay]);

  return [executeWithDelay, loading];
}

/**
 * Hook para gerenciar estado do carrinho
 */
export function useBeachCart() {
  const [items, setItems] = useState<Array<{ productId: string; quantity: number }>>([]);

  const addItem = useCallback(
    (productId: string, quantity: number = 1) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (existing) {
          return prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { productId, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    isEmpty: items.length === 0,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
