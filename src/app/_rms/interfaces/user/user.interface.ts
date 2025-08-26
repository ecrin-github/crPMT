import { AddressInterface } from './address.interface';
import { SocialNetworksInterface } from './social-networks.interface';
import { AuthInterface } from './auth.interface';
import { OrganisationInterface } from '../context/organisation.interface';
import { UserProfileInterface } from './user-profile.interface';

export interface UserInterface {
  id: number;
  userProfile: UserProfileInterface;
  // password: string;
  lastLogin?: string;
  isSuperuser: boolean;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  dateJoined: string;
  groups: Array<any>;
  userPermissions: Array<any>;

  /* Fields used somewhere in the code but not present in the DB */
  // personal information
  website: string;
  // account information
  language: string;
  timeZone: string;
  communication: {
    email: boolean,
    sms: boolean,
    phone: boolean
  };
  // email settings
  emailSettings: {
    emailNotification: boolean,
    sendCopyToPersonalEmail: boolean,
    activityRelatesEmail: {
      youHaveNewNotifications: boolean,
      youAreSentADirectMessage: boolean,
      someoneAddsYouAsAsAConnection: boolean,
    }
  };
  token: AuthInterface;
}
