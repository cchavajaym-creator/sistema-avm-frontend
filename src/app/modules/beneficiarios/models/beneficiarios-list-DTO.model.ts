export interface ResponseBeneficiarioListDTO {
  total: number
  start?: number
  end?: number
  items: BeneficiarioListDTO[]
}

export interface BeneficiarioListDTO {
  beneficiarioId: number
  estadoId: number
  fechaInicio: string
  latitud: string
  longitud: string
  persona: Persona
}

export interface Persona {
  personaId: number
  primerNombre: string
  segundoNombre: string
  tercerNombre: string
  primerApellido: string
  segundoApellido: string
  tipoDocumento: string
  numeroDocumento: string
  telefono: string
  municipio: Municipio
  locacion: Locacion
}

export interface Municipio {
  municipioId: number
  nombreMunicipio: string
}

export interface Locacion {
  locacionId: number
  nombreLocacion: string
}
