import { PersonInterface } from "./person.interface";
import { CountryInterface } from "./country.interface";

export interface CTUInterface {
    id: number;
    sharepointItemId?: string;
    source?: string;
    name: string;
    shortName: string;
    addressInfo: string;
    sasVerification: boolean;
    country: CountryInterface;
    contact: PersonInterface;
}