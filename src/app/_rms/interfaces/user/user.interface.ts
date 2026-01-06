import { AddressInterface } from './address.interface';
import { SocialNetworksInterface } from './social-networks.interface';
import { AuthInterface } from './auth.interface';
import { OrganisationInterface } from '../context/organisation.interface';
import { UserProfileInterface } from './user-profile.interface';

export interface UserInterface {
  id: string;
  name: string;
  email: string;
  isSuperuser: boolean;
  // userProfile: UserProfileInterface;
  // // password: string;
  // lastLogin?: string;
  // username: string;
  // firstName: string;
  // lastName: string;
  // isActive: boolean;
  // dateJoined: string;
}
