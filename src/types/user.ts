import { User } from '@prisma/client';

export type UserBasicData = Pick<
    User,
    | 'id'
    | 'name'
    | 'email'
    | 'role'
    | 'status'
    | 'baseLanguageId'
    | 'targetLanguageId'
    | 'profilePictureUrl'
>;

export type Theme = ['light', 'dark'];
