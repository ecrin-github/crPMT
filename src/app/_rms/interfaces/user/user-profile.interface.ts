import { OrganisationInterface } from '../organisation/organisation.interface';

export interface UserProfileInterface {
  id: string;  // different than user id
  role?: number;
  roleClass?: any;
  userType?: any;
  organisation: OrganisationInterface;
  lsAaiId: string;
  profTitle?: string;
  fullName?: string;
  invertedFullName?: string;
  ocrid?: any;
  designation?: string;
  user: string;  // corresponds to user id
  // companyName: string;
  // phone: string;
  // address?: AddressInterface;
  // socialNetworks?: SocialNetworksInterface;
  // pic: string;
}
