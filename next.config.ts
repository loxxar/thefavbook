import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /*
       * Un export de navigateur dépasse allègrement la limite d'1 Mo par
       * défaut : les favicons inline (attribut ICON, en data: URI) pèsent
       * souvent plusieurs Mo à eux seuls, pour quelques milliers de favoris.
       *
       * La limite porte sur le corps HTTP brut, en-têtes multipart compris —
       * d'où la marge par rapport au plafond annoncé côté formulaire.
       */
      bodySizeLimit: '12mb',
    },
  },
}

export default nextConfig
