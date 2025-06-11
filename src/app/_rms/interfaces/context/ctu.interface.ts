import { ContactInterface } from "../contact.interface";
import { CountryInterface } from "./country.interface";

export interface CTUInterface {
    id: number;
    name: string;
    shortName: string;
    addressInfo: string;
    sasVerification: boolean;
    country: CountryInterface;
    contact: ContactInterface;
}