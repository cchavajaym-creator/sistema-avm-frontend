export interface BeneficiarioDTO {
  primerNombre: string
  segundoNombre: string
  tercerNombre: string
  primerApellido: string
  segundoApellido: string
  fechaNacimiento: string
  genero: string
  tipoDocumento: string
  numeroDocumento: string
  direccionDetalle: string
  municipioId: number
  locacionId: string
  estadoId?: number
  telefono: string
  correoElectronico: string
  contrasena: string
  rolId: number
  latitud: string
  longitud: string,
}
