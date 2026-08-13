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
import {
  createAccountSchema,
  PASSWORD_MIN_LENGTH,
  type CreateAccountInput,
} from '@/lib/auth/schemas'

export function CreateAccountForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function onSubmit(values: CreateAccountInput): Promise<void> {
    const { error } = await authClient.signUp.email(values)

    if (error) {
      toast.error(error.message ?? 'La création du compte a échoué.')
      return
    }

    // `autoSignIn` est actif : la session existe déjà à ce stade.
    router.replace('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          autoComplete="name"
          aria-invalid={errors.name !== undefined}
          {...register('name')}
        />
        {errors.name && (
          <FieldError>{errors.name.message ?? ''}</FieldError>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email !== undefined}
          {...register('email')}
        />
        {errors.email && (
          <FieldError>{errors.email.message ?? ''}</FieldError>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password !== undefined}
          aria-describedby="password-hint"
          {...register('password')}
        />
        <p id="password-hint" className="text-[12px]">
          {PASSWORD_MIN_LENGTH} caractères minimum.
        </p>
        {errors.password && (
          <FieldError>{errors.password.message ?? ''}</FieldError>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Création…' : 'Créer le compte'}
      </Button>
    </form>
  )
}
