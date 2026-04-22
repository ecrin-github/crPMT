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
   */
  private normalizeCountryCode(value: string): string {
    const raw = this.normalizeText(value).toUpperCase();

    const iso3ToIso2Map: Record<string, string> = {
      AUT: 'AT',
      BEL: 'BE',
      BGR: 'BG',
      HRV: 'HR',
      CYP: 'CY',
      CZE: 'CZ',
      DNK: 'DK',
      EST: 'EE',
      FIN: 'FI',
      FRA: 'FR',
      DEU: 'DE',
      GRC: 'GR',
      HUN: 'HU',
      IRL: 'IE',
      ITA: 'IT',
      LVA: 'LV',
      LTU: 'LT',
      LUX: 'LU',
      MLT: 'MT',
      NLD: 'NL',
      POL: 'PL',
      PRT: 'PT',
      ROU: 'RO',
      SVK: 'SK',
      SVN: 'SI',
      ESP: 'ES',
      SWE: 'SE',
      CHE: 'CH',
      NOR: 'NO',
      ISL: 'IS',
      GBR: 'GB'
    };

    if (!raw) {
      return '';
    }

    if (raw.length === 2) {
      return raw;
    }

    return iso3ToIso2Map[raw] || raw;
  }

  /**
   * Compare two CTU countries in a robust way by normalizing ISO2 / ISO3 codes.
   */
  private sameCountry(a: any, b: any): boolean {
    const aCountryRaw = a?.country?.iso2 || a?.country?.name || '';
    const bCountryRaw = b?.country?.iso2 || b?.country?.name || '';

    const aCountry = this.normalizeCountryCode(aCountryRaw);
    const bCountry = this.normalizeCountryCode(bCountryRaw);

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
  compareCtuOptions(a: any, b: any): boolean {
    if (!a || !b) {
      return a === b;
    }

    // Strongest match: identical SharePoint item id
    if (a?.sharepointItemId && b?.sharepointItemId) {
      return String(a.sharepointItemId) === String(b.sharepointItemId);
    }

    // If countries do not match, do not try to match names.
    if (!this.sameCountry(a, b)) {
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
  mapExistingCtuToDisplayedCtu(ctu: any, sharePointCtus: any[]): any {
    if (!ctu || !sharePointCtus?.length) {
      return ctu;
    }

    const match = sharePointCtus.find((spCtu: any) => this.compareCtuOptions(ctu, spCtu));
    return match || ctu;
  }

  /**
   * Convert a SharePoint country value to a DB ISO2 country code.
   */
  findCountryIso2FromSharePoint(selectedCtu: any, countries: CountryInterface[]): string | null {
    const rawIso2 = this.normalizeText(selectedCtu?.country?.iso2);
    const rawName = this.normalizeText(selectedCtu?.country?.name);

    const iso3ToIso2Map: Record<string, string> = {
      aut: 'AT',
      bel: 'BE',
      bgr: 'BG',
      hrv: 'HR',
      cyp: 'CY',
      cze: 'CZ',
      dnk: 'DK',
      est: 'EE',
      fin: 'FI',
      fra: 'FR',
      deu: 'DE',
      grc: 'GR',
      hun: 'HU',
      irl: 'IE',
      ita: 'IT',
      lva: 'LV',
      ltu: 'LT',
      lux: 'LU',
      mlt: 'MT',
      nld: 'NL',
      pol: 'PL',
      prt: 'PT',
      rou: 'RO',
      svk: 'SK',
      svn: 'SI',
      esp: 'ES',
      swe: 'SE',
      che: 'CH',
      nor: 'NO',
      isl: 'IS',
      gbr: 'GB'
    };

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

    // 2. Convert ISO3 to ISO2
    const iso3Candidate = rawIso2 || rawName;
    const convertedIso2 = iso3ToIso2Map[iso3Candidate];

    if (convertedIso2) {
      const iso2Match = countries.find((country) => {
        return this.normalizeText(country?.iso2) === this.normalizeText(convertedIso2);
      });

      if (iso2Match?.iso2) {
        return iso2Match.iso2;
      }
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