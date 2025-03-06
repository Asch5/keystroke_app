'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long.' }),
});

type State = {
    errors?: {
        email?: string[];
        password?: string[];
    };
    message?: string | null;
};

export async function authenticate(
    prevState: State,
    formData: FormData
): Promise<State> {
    try {
        const validatedFields = formSchema.safeParse({
            email: formData.get('email'),
            password: formData.get('password'),
        });

        if (!validatedFields.success) {
            return { errors: validatedFields.error.flatten().fieldErrors };
        }

        const { email, password } = validatedFields.data;
        console.log(email, password);
        try {
            await signIn('credentials', {
                email,
                password,
                redirect: false,
            });
            redirect('/dashboard');
        } catch (error) {
            if (error instanceof AuthError) {
                return { message: 'Invalid credentials.' };
            }
            throw error;
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { message: 'Invalid credentials.' };
                default:
                    return { message: 'Something went wrong.' };
            }
        }
        throw error;
    }
}
