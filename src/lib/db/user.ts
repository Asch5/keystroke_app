import { db } from '@vercel/postgres';

export const getUserByEmail = async (email: string) => {
    if (typeof email !== 'string') {
        throw new Error('Email must be a string');
    }
    const client = await db.connect();
    const result = await client.sql`
        SELECT * FROM users 
        WHERE email = ${email} 
        LIMIT 1
    `;
    return result.rows[0];
};
