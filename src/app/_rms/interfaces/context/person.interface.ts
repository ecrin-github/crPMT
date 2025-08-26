import { CountryInterface } from "./country.interface";

export interface PersonInterface {
    id: number;
    country: CountryInterface;
    email: string;
    isEuco: boolean;
    fullName: string;
    position: string;
}