import { Injectable } from '@angular/core';
import { CountryInterface } from 'src/app/_rms/interfaces/context/country.interface';

@Injectable({
  providedIn: 'root'
})
export class CtuMapperService {

  /**
   * Normalize free text for robust comparison.
   * - lowercase
   * - remove accents
   * - remove punctuation
   * - collapse spaces
   */
  normalizeText(value: string): string {
    if (!value) {
      return '';
    }

    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Canonicalize a CTU name by normalizing it and sorting words alphabetically.
   * This allows matching values such as:
   * - "CHU ALPES GRENOBLE"
   * - "CHU GRENOBLE ALPES"
   */
  canonicalizeName(value: string): string {
    const normalized = this.normalizeText(value);

    return normalized
      .split(' ')
      .filter(Boolean)
      .sort()
      .join(' ');
  }

  /**
   * Normalize a country code/name to ISO2 when possible.
   *
   * SharePoint sometimes returns ISO3 values such as:
   * - FRA
   * - ESP
   * while DB CTUs usually store ISO2 values such as:
   * - FR
   * - ES
   *
   * This helper ensures country comparison is done on a consistent format.
   * uses dynamic lookup from countries data instead of hardcoded map.
   */
  private normalizeCountryCode(value: string, countries?: CountryInterface[]): string {
    const raw = this.normalizeText(value).toUpperCase();

    if (!raw) {
      return '';
    }

    // If already ISO2 format, return as-is
    if (raw.length === 2) {
      return raw;
    }

    // If countries array is available, use it for dynamic lookup
    if (countries && countries.length > 0) {
      const match = countries.find((country) => {
        const iso3 = this.normalizeText(country?.iso3).toUpperCase();
        return iso3 === raw;
      });

      if (match?.iso2) {
        return match.iso2;
      }
    }

    // Fallback: return as-is if not found
    return raw;
  }

  /**
   * Compare two CTU countries in a robust way by normalizing ISO2 / ISO3 codes.
   */
  private sameCountry(a: any, b: any, countries?: CountryInterface[]): boolean {
    const aCountryRaw = a?.country?.iso2 || a?.country?.name || '';
    const bCountryRaw = b?.country?.iso2 || b?.country?.name || '';

    const aCountry = this.normalizeCountryCode(aCountryRaw, countries);
    const bCountry = this.normalizeCountryCode(bCountryRaw, countries);

    return !!aCountry && !!bCountry && aCountry === bCountry;
  }

  /**
   * Compare two names after canonicalization.
   */
  private exactCanonicalMatch(left: string, right: string): boolean {
    const leftCanonical = this.canonicalizeName(left);
    const rightCanonical = this.canonicalizeName(right);

    return !!leftCanonical && !!rightCanonical && leftCanonical === rightCanonical;
  }

  /**
   * Compare two CTU options.
   *
   * Matching order:
   * 1. SharePoint ID if both are available
   * 2. Same normalized country
   * 3. Exact canonical short name match
   * 4. Exact canonical full name match
   */
  compareCtuOptions(a: any, b: any, countries?: CountryInterface[]): boolean {
    if (!a || !b) {
      return a === b;
    }

    // Strongest match: identical SharePoint item id
    if (a?.sharepointItemId && b?.sharepointItemId) {
      return String(a.sharepointItemId) === String(b.sharepointItemId);
    }

    // If countries do not match, do not try to match names.
    if (!this.sameCountry(a, b, countries)) {
      return false;
    }

    // Match by canonical short name
    if (this.exactCanonicalMatch(a?.shortName, b?.shortName)) {
      return true;
    }

    // Match by canonical full name
    if (this.exactCanonicalMatch(a?.name, b?.name)) {
      return true;
    }

    return false;
  }

  /**
   * Replace an existing DB CTU by its SharePoint equivalent for display purposes.
   */
  mapExistingCtuToDisplayedCtu(ctu: any, sharePointCtus: any[], countries?: CountryInterface[]): any {
    if (!ctu || !sharePointCtus?.length) {
      return ctu;
    }

    const match = sharePointCtus.find((spCtu: any) => this.compareCtuOptions(ctu, spCtu, countries));
    return match || ctu;
  }

  /**
   * Convert a SharePoint country value to a DB ISO2 country code.
   */
  findCountryIso2FromSharePoint(selectedCtu: any, countries: CountryInterface[]): string | null {
    const rawIso2 = this.normalizeText(selectedCtu?.country?.iso2);
    const rawName = this.normalizeText(selectedCtu?.country?.name);

    if (!rawIso2 && !rawName) {
      return null;
    }

    // 1. Direct ISO2 match
    const directIso2Match = countries.find((country) => {
      const iso2 = this.normalizeText(country?.iso2);
      return iso2 === rawIso2 || iso2 === rawName;
    });

    if (directIso2Match?.iso2) {
      return directIso2Match.iso2;
    }

    // 2. Convert ISO3 to ISO2 using the countries array
    const iso3Candidate = rawIso2 || rawName;
    const iso3Match = countries.find((country) => {
      const iso3 = this.normalizeText(country?.iso3);
      return iso3 === iso3Candidate;
    });

    if (iso3Match?.iso2) {
      return iso3Match.iso2;
    }

    // 3. Match by country name
    const byNameMatch = countries.find((country) => {
      const name = this.normalizeText(country?.name);
      return name === rawIso2 || name === rawName;
    });

    return byNameMatch?.iso2 || null;
  }

  /**
   * Search helper used by the CTU dropdown.
   */
  searchCTUs(term: string, item: any): boolean {
    const q = this.normalizeText(term);
    const shortName = this.normalizeText(item?.shortName);
    const name = this.normalizeText(item?.name);
    const country = this.normalizeText(item?.country?.name || item?.country?.iso2);

    return shortName.includes(q) || name.includes(q) || country.includes(q);
  }
}