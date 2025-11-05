export interface EntregaBeneficio {
  entregaId: number;
  proyectoId: number;
  beneficioId: number;
  beneficiarioId: number;
  eventoId: number;
  fechaEntrega: string; // ISO datetime string
  cantidad: number;
  estadoId: number; // 1=entregado, 2=no entregado (según backend)
  observaciones: string | null;
  entregadoPor: number | null;
  createdAt: string;
}

