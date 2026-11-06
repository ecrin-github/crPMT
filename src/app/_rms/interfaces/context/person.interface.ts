import { CountryInterface } from "./country.interface";

export interface PersonInterface {
    id: string;
    country: CountryInterface;
    email: string;
    isEuco: boolean;
    fullName: string;
    position: string;
}