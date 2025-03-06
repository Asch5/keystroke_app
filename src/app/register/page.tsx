// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { FormInput } from '@/components/ui/FormInput';
// import {
//     registerSchema,
//     type RegisterFormValues,
// } from '@/lib/validations/auth';
// import { register } from '@/lib/actions/authActions';
// import { useFormState } from 'react-dom';
// import { useFormStatus } from 'react-dom';

// function SubmitButton() {
//     const { pending } = useFormStatus();

//     return (
//         <button
//             type="submit"
//             disabled={pending}
//             className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//             {pending ? 'Creating account...' : 'Create account'}
//         </button>
//     );
// }

// export default function RegisterPage() {
//     const router = useRouter();
//     const [formValues, setFormValues] = useState<RegisterFormValues>({
//         name: '',
//         email: '',
//         password: '',
//         confirmPassword: '',
//     });
//     const [errors, setErrors] = useState<Record<string, string>>({});
//     const [isLoading, setIsLoading] = useState(false);
//     const [registerError, setRegisterError] = useState<string | null>(null);
//     const [state, formAction] = useFormState(register, {
//         errors: {},
//         message: null,
//         success: false,
//     });

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         setFormValues((prev) => ({ ...prev, [name]: value }));
//         // Clear error when user types
//         if (errors[name]) {
//             setErrors((prev) => ({ ...prev, [name]: '' }));
//         }
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setRegisterError(null);

//         // Validate form
//         const result = registerSchema.safeParse(formValues);
//         if (!result.success) {
//             const fieldErrors: Record<string, string> = {};
//             result.error.issues.forEach((issue) => {
//                 fieldErrors[issue.path[0]] = issue.message;
//             });
//             setErrors(fieldErrors);
//             return;
//         }

//         setIsLoading(true);

//         try {
//             const response = await register(formValues);

//             if (response.error) {
//                 setRegisterError(response.error);
//             } else {
//                 // Redirect to login page after successful registration
//                 router.push('/login?registered=true');
//             }
//         } catch (error) {
//             console.error('Registration error:', error);
//             setRegisterError('Something went wrong. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Redirect after successful registration
//     useEffect(() => {
//         if (state.success) {
//             router.push('/login?registered=true');
//         }
//     }, [state.success, router]);

//     return (
//         <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
//             <div className="max-w-md w-full space-y-8">
//                 <div className="text-center">
//                     <h2 className="mt-6 text-3xl font-extrabold text-foreground">
//                         Create a new account
//                     </h2>
//                     <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
//                         Or{' '}
//                         <Link
//                             href="/login"
//                             className="font-medium text-primary-600 hover:text-primary-500"
//                         >
//                             sign in to your existing account
//                         </Link>
//                     </p>
//                 </div>

//                 <form
//                     className="mt-8 space-y-6"
//                     onSubmit={handleSubmit}
//                     action={formAction}
//                 >
//                     {registerError && (
//                         <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
//                             {registerError}
//                         </div>
//                     )}

//                     <div className="space-y-4">
//                         <FormInput
//                             id="name"
//                             label="Full name"
//                             required
//                             value={formValues.name}
//                             onChange={handleChange}
//                             error={errors.name}
//                         />

//                         <FormInput
//                             id="email"
//                             label="Email address"
//                             type="email"
//                             required
//                             value={formValues.email}
//                             onChange={handleChange}
//                             error={errors.email}
//                         />

//                         <FormInput
//                             id="password"
//                             label="Password"
//                             type="password"
//                             required
//                             value={formValues.password}
//                             onChange={handleChange}
//                             error={errors.password}
//                         />

//                         <FormInput
//                             id="confirmPassword"
//                             label="Confirm password"
//                             type="password"
//                             required
//                             value={formValues.confirmPassword}
//                             onChange={handleChange}
//                             error={errors.confirmPassword}
//                         />
//                     </div>

//                     <div>
//                         <SubmitButton />
//                     </div>

//                     <div className="text-sm text-center text-gray-600 dark:text-gray-400">
//                         By creating an account, you agree to our{' '}
//                         <Link
//                             href="/terms"
//                             className="font-medium text-primary-600 hover:text-primary-500"
//                         >
//                             Terms of Service
//                         </Link>{' '}
//                         and{' '}
//                         <Link
//                             href="/privacy"
//                             className="font-medium text-primary-600 hover:text-primary-500"
//                         >
//                             Privacy Policy
//                         </Link>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }
