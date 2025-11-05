import { Municipio } from "app/modules/admin/models/municipio.model";

export interface ProyectoBeneficiario {
  beneficiarioId: number;
  beneficiarioEstadoId: number;
  persona: Persona
  fechaIncorporacion: string;
  estadoId: number;
}

export interface Persona {
    personaId: number;
    primerNombre: string;
    segundoNombre: string | null;
    tercerNombre: string | null
    primerApellido: string;
    segundoApellido: string | null;
    municipio: Municipio | null;
}
