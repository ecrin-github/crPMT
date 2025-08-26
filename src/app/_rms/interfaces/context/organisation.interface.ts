import { CountryInterface } from "./country.interface";

export interface OrganisationInterface {
    id: string;
    shortName: string;
    name: string;
    country: CountryInterface;
}