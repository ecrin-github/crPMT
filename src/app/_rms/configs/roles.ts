import {UserRole} from '../interfaces/user/role.interface';


export const INTERNAL_ROLES: Array<UserRole> = [
    {
        id: 1,
        name: 'System administrator',
        description: 'System administrator'
    },
    {
        id: 2,
        name: 'ECRIN Staff',
        description: 'ECRIN Staff'
    },
    {
        id: 3,
        name: 'TSD staff',
        description: 'TSD Staff'
    }
];

export const EXTERNAL_ROLES: Array<UserRole> = [
    {
        id: 4,
        name: 'Data provider',
        description: 'Data provider'
    },
    {
        id: 5,
        name: 'Data requester',
        description: 'Data requester'
    }
];
