import { Municipio } from "app/modules/admin/models/municipio.model"

export interface LocacionDTO {
    municipioId:number
    nombreLocacion:string
}

export interface LocacionesDTO{
    locacionId:number,
    nombreLocacion: string,
    municipio: Municipio
}
