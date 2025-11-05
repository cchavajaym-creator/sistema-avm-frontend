export class EstadosDTO {
    estadoId: number = 0
    descripcion: string = ''
    // Mantener compatibilidad con respuestas antiguas
    tipoEstados: string = ''
    // Nuevos posibles campos del backend
    tipoEstado?: string
    descripcionTipo?: string
}
