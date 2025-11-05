import { Departamento } from "./departamentos.model";

export interface Municipio{
    municipioId: number,
    nombreMunicipio: string,
    departamento: Departamento
}
