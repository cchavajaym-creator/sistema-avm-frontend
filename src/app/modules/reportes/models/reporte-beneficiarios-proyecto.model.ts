export interface BeneficiarioProyectoItem {
  beneficiarioId: number;
  personaId: number;
  nombreCompleto: string;
  genero: string;
  fechaNacimiento?: string;
  municipioId: number;
  nombreMunicipio: string;
  departamentoId: number;
  nombreDepartamento: string;
  estadoBeneficiario: number;
  fechaInicio: string;
  latitud: string;
  longitud: string;
  proyectoId: number;
  nombreProyecto: string;
  fechaIncorporacionProyecto: string;
  estadoEnProyecto: number;
  edad?: number; // normalizada a number
  esMayorEdad: boolean; // normalizada segun >=18
}

export interface BeneficiariosProyectoFilters {
  proyectoId?: number;
  estadoEnProyecto?: number;
  municipioId?: number;
  departamentoId?: number;
  estadoBeneficiario?: number;
  mayorEdad?: boolean | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
  start?: number;
  end?: number;
}

