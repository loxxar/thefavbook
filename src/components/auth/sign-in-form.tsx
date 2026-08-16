'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { FieldError } from '@/components/mac/field-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth/client'
import { signInSchema, type SignInInput } from '@/lib/auth/schemas'

export function SignInForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SignInInput): Promise<void> {
    const { error } = await authClient.signIn.email(values)

    if (error) {
      // Message volontairement identique pour un e-mail inconnu et un mot de
      // passe faux : distinguer les deux révélerait quels comptes existent.
      toast.error('Identifiants incorrects.')
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email && <FieldError>{errors.email.message ?? ''}</FieldError>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password !== undefined}
          {...register('password')}
        />
        {errors.password && (
          <FieldError>{errors.password.message ?? ''}</FieldError>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  )
}
