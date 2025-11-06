import { CountryInterface } from "./country.interface";

export interface HospitalInterface {
    id: string;
    name: string;
    city: string;
    country: CountryInterface;
}