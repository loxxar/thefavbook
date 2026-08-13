import { createAuthClient } from 'better-auth/react'

/**
 * Client d'authentification, utilisable depuis un composant `"use client"`.
 *
 * Aucune baseURL : le client et le serveur partagent l'origine, et coder l'URL
 * en dur casserait les déploiements de prévisualisation Vercel.
 */
export const authClient = createAuthClient()

export const { signIn, signUp, signOut, useSession } = authClient
