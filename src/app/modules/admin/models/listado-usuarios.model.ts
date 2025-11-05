export interface UsuarioDTO {
  usuarioId: number
  nombreUsuario: string
  correoElectronico: string
  fechaRegistro: string
  estado: Estado
  rol: Rol
}

export interface Estado {
  estadoId: number
  nombre: string
  tipoEstado: string
}

export interface Rol {
  rolId: number
  nombreRol: string
}
