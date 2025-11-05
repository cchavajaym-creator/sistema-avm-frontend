export interface ProyectoUsuarioPersona {
    personaId: number;
    primerNombre: string;
    primerApellido: string;
}

export interface ProyectoUsuario {
    usuarioId: number;
    nombreUsuario: string;
    correoElectronico: string;
    estadoId: number;
    persona: ProyectoUsuarioPersona;
}

