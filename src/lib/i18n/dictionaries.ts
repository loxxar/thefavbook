import type { Locale } from '@/lib/i18n/config'

/**
 * Textes de l'interface.
 *
 * Le français fait référence : c'est la langue dans laquelle le produit a été
 * pensé, et celle où les nuances sont les plus justes. Le type se déduit de
 * lui, si bien qu'une clé oubliée dans une traduction ne compile pas.
 */
export const fr = {
  common: {
    cancel: 'Annuler',
    close: 'Fermer',
    delete: 'Supprimer',
    rename: 'Renommer',
    back: 'Retour',
    language: 'Langue',
  },
  legal: {
    notice:
      "thefavbook n'est ni affilié à Apple, ni approuvé par Apple. Son apparence est un hommage à Mac OS X. Les marques citées appartiennent à leurs propriétaires respectifs.",
  },
  auth: {
    signInTitle: 'Connexion',
    signInIntro: 'Accédez à vos favoris.',
    signUpIntro:
      'Vos favoris restent les vôtres : rien n’est partagé, rien n’est envoyé ailleurs sans votre accord.',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    name: 'Nom',
    signIn: 'Se connecter',
    signingIn: 'Connexion…',
    createAccount: 'Créer le compte',
    creatingAccount: 'Création…',
    switchToSignUp: 'Créer un compte',
    switchToSignIn: 'J’ai déjà un compte',
    privacyLink: 'Que devient ce que j’envoie ?',
    badCredentials: 'Identifiants incorrects.',
    signUpFailed: 'La création du compte a échoué.',
    signOut: 'Se déconnecter',
    signingOut: 'Déconnexion…',
    signOutFailed: 'La déconnexion a échoué.',
    passwordHint: (n: number) => `${n} caractères minimum.`,
    nameRequired: 'Nom requis.',
    emailInvalid: 'Adresse e-mail invalide.',
    passwordRequired: 'Mot de passe requis.',
    passwordTooShort: (n: number) => `Au moins ${n} caractères.`,
  },
  menu: {
    home: 'Accueil',
    privacy: 'Confidentialité',
    sourceCode: 'Code source',
    file: 'Fichier',
    import: 'Importer des favoris…',
    export: 'Exporter en HTML',
    newRootFolder: 'Nouveau dossier à la racine…',
    tools: 'Outils',
    maintenance: 'Entretien : doublons et liens morts…',
    spaces: 'Espaces',
    newSpace: 'Nouvel espace…',
    renameSpace: 'Renommer cet espace…',
    deleteSpace: 'Supprimer cet espace…',
    account: 'Compte',
    deleteAccount: 'Supprimer mon compte…',
  },
  dashboard: {
    bookmarks: 'Mes favoris',
    sortWithAi: 'Ranger avec l’IA',
    suggestions: 'Propositions de rangement',
    noSuggestions:
      'Aucune proposition en attente. Lancez un rangement dans le panneau de gauche.',
    emptySpace:
      'Cet espace est vide. Ouvrez le menu Fichier puis « Importer des favoris » pour y déposer un export de navigateur.',
    counts: (bookmarks: number, folders: number) =>
      `${bookmarks} favori${bookmarks > 1 ? 's' : ''}, ${folders} dossier${folders > 1 ? 's' : ''}`,
  },
  importer: {
    title: 'Importer des favoris',
    files: 'Fichiers de favoris',
    filesHint:
      'Export Chrome, Firefox, Safari ou Edge. Plusieurs fichiers à la fois sont fusionnés.',
    source: 'Provenance',
    optional: '(facultatif)',
    sourcePlaceholder: 'Chrome perso',
    submit: 'Importer',
    submitting: 'Import en cours…',
    progress:
      'Lecture du fichier, analyse et écriture en base. Sur plusieurs milliers de favoris, comptez une poignée de secondes.',
    emptyFile: 'Fichier vide.',
    tooLarge: (mb: number) => `Fichier trop volumineux (maximum ${mb} Mo).`,
    noFile: 'Choisissez au moins un fichier.',
    invalidFile: 'Fichier invalide.',
    noBookmarks: (name: string) =>
      `Aucun favori trouvé dans « ${name} ». Est-ce bien un export de navigateur ?`,
    imported: (n: number) =>
      `${n} favori${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}.`,
  },
  preview: {
    empty: 'Sélectionnez un favori pour l’examiner sans quitter la page.',
    domain: 'Domaine :',
    addedOn: 'Ajouté le :',
    openInTab: 'Ouvrir dans un onglet',
    tryEmbed: 'Tenter l’aperçu intégré',
    loading: 'Lecture des informations de partage…',
    embedRefused:
      'Un cadre vide signifie que le site refuse d’être affiché ailleurs que chez lui. Passez par « Ouvrir dans un onglet ».',
    failedSuffix:
      'Beaucoup de pages exigent une connexion ou refusent les visiteurs automatiques.',
    noMetadata: 'Cette page ne publie aucune information de partage.',
  },
  maintenance: {
    title: 'Entretien',
    backToBookmarks: '← Retour aux favoris',
    linkCheckTitle: 'Vérification des liens',
    duplicatesTitle: 'Doublons',
    duplicatesRule:
      'Deux adresses sont considérées identiques quand elles ne diffèrent que par le protocole, le www, un slash final ou des paramètres de suivi. Ce qui distingue deux pages réelles est conservé.',
    noDuplicates: 'Aucun doublon dans cet espace.',
    merge: 'Fusionner',
    mergeAll: 'Tout fusionner',
    copies: (n: number) => `${n} exemplaires`,
    totalBookmarks: 'Favoris',
    unchecked: 'Non vérifiés',
    brokenLinks: 'Liens morts',
    checkLinks: 'Vérifier les liens',
    checking: 'Vérification…',
    recheckAll: 'Tout revérifier',
    deleteBroken: 'Supprimer les liens morts',
    unverifiableNote:
      'Les adresses hors de portée — chrome://, réseau local — ne comptent pas comme mortes et ne sont jamais supprimées : le serveur ne peut pas les joindre, ce qui ne dit rien de leur validité.',
    checkDone: 'Vérification terminée.',
    duplicateSummary: (groups: number, shown: number, removable: number) =>
      `${groups} adresse${groups > 1 ? 's' : ''} en double. ${shown} affichée${shown > 1 ? 's' : ''} ici, ${removable} favori${removable > 1 ? 's' : ''} supprimable${removable > 1 ? 's' : ''}.`,
    confirmMergeAll: (groups: number) =>
      `Fusionner les ${groups} groupes en gardant le plus ancien de chacun ? Cette action est irréversible.`,
    confirmDeleteBroken: (n: number) =>
      `Supprimer les ${n} favoris dont le lien est mort ? Cette action est irréversible.`,
    removed: (n: number) => `${n} favoris supprimés.`,
    recheckQueued: (n: number) => `${n} liens à revérifier.`,
    checkProgress: (done: number, total: number) =>
      `${done} sur ${total} vérifiés.`,
  },
} as const

/**
 * Élargit les littéraux figés par `as const` : sans cela, une traduction
 * devrait répéter mot pour mot le texte français pour compiler. Les fonctions
 * gardent leur signature, ce qui force chaque langue à accepter les mêmes
 * paramètres.
 */
type Widen<T> = T extends (...args: infer A) => string
  ? (...args: A) => string
  : string

export type Dictionary = {
  [K in keyof typeof fr]: {
    [P in keyof (typeof fr)[K]]: Widen<(typeof fr)[K][P]>
  }
}

export const en: Dictionary = {
  common: {
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    rename: 'Rename',
    back: 'Back',
    language: 'Language',
  },
  legal: {
    notice:
      'thefavbook is not affiliated with, or endorsed by, Apple. Its appearance is a tribute to Mac OS X. Trademarks belong to their respective owners.',
  },
  auth: {
    signInTitle: 'Sign in',
    signInIntro: 'Reach your bookmarks.',
    signUpIntro:
      'Your bookmarks stay yours: nothing is shared, nothing leaves without your consent.',
    email: 'Email address',
    password: 'Password',
    name: 'Name',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    createAccount: 'Create account',
    creatingAccount: 'Creating…',
    switchToSignUp: 'Create an account',
    switchToSignIn: 'I already have an account',
    privacyLink: 'What happens to what I send?',
    badCredentials: 'Incorrect credentials.',
    signUpFailed: 'Account creation failed.',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
    signOutFailed: 'Sign-out failed.',
    passwordHint: (n: number) => `${n} characters minimum.`,
    nameRequired: 'Name required.',
    emailInvalid: 'Invalid email address.',
    passwordRequired: 'Password required.',
    passwordTooShort: (n: number) => `At least ${n} characters.`,
  },
  menu: {
    home: 'Home',
    privacy: 'Privacy',
    sourceCode: 'Source code',
    file: 'File',
    import: 'Import bookmarks…',
    export: 'Export as HTML',
    newRootFolder: 'New top-level folder…',
    tools: 'Tools',
    maintenance: 'Maintenance: duplicates and dead links…',
    spaces: 'Spaces',
    newSpace: 'New space…',
    renameSpace: 'Rename this space…',
    deleteSpace: 'Delete this space…',
    account: 'Account',
    deleteAccount: 'Delete my account…',
  },
  dashboard: {
    bookmarks: 'My bookmarks',
    sortWithAi: 'Sort with AI',
    suggestions: 'Suggested placements',
    noSuggestions:
      'No pending suggestion. Start a sorting run from the left-hand panel.',
    emptySpace:
      'This space is empty. Open the File menu, then “Import bookmarks”, to drop a browser export into it.',
    counts: (bookmarks: number, folders: number) =>
      `${bookmarks} bookmark${bookmarks > 1 ? 's' : ''}, ${folders} folder${folders > 1 ? 's' : ''}`,
  },
  importer: {
    title: 'Import bookmarks',
    files: 'Bookmark files',
    filesHint:
      'Exports from Chrome, Firefox, Safari or Edge. Several files at once are merged.',
    source: 'Origin',
    optional: '(optional)',
    sourcePlaceholder: 'Personal Chrome',
    submit: 'Import',
    submitting: 'Importing…',
    progress:
      'Reading the file, parsing it and writing to the database. On several thousand bookmarks, expect a handful of seconds.',
    emptyFile: 'Empty file.',
    tooLarge: (mb: number) => `File too large (maximum ${mb} MB).`,
    noFile: 'Choose at least one file.',
    invalidFile: 'Invalid file.',
    noBookmarks: (name: string) =>
      `No bookmark found in “${name}”. Is it really a browser export?`,
    imported: (n: number) => `${n} bookmark${n > 1 ? 's' : ''} imported.`,
  },
  preview: {
    empty: 'Select a bookmark to inspect it without leaving the page.',
    domain: 'Domain:',
    addedOn: 'Added on:',
    openInTab: 'Open in a tab',
    tryEmbed: 'Try the embedded preview',
    loading: 'Reading sharing metadata…',
    embedRefused:
      'An empty frame means the site refuses to be displayed anywhere but on its own domain. Use “Open in a tab”.',
    failedSuffix:
      'Many pages require a sign-in, or turn automated visitors away.',
    noMetadata: 'This page publishes no sharing metadata.',
  },
  maintenance: {
    title: 'Maintenance',
    backToBookmarks: '← Back to bookmarks',
    linkCheckTitle: 'Link checking',
    duplicatesTitle: 'Duplicates',
    duplicatesRule:
      'Two addresses count as identical when they only differ by protocol, www, a trailing slash or tracking parameters. Whatever tells two real pages apart is kept.',
    noDuplicates: 'No duplicate in this space.',
    merge: 'Merge',
    mergeAll: 'Merge all',
    copies: (n: number) => `${n} copies`,
    totalBookmarks: 'Bookmarks',
    unchecked: 'Unchecked',
    brokenLinks: 'Dead links',
    checkLinks: 'Check links',
    checking: 'Checking…',
    recheckAll: 'Recheck everything',
    deleteBroken: 'Delete dead links',
    unverifiableNote:
      'Out-of-reach addresses — chrome://, local network — do not count as dead and are never deleted: the server cannot reach them, which says nothing about their validity.',
    checkDone: 'Checking finished.',
    duplicateSummary: (groups: number, shown: number, removable: number) =>
      `${groups} duplicated address${groups > 1 ? 'es' : ''}. ${shown} shown here, ${removable} bookmark${removable > 1 ? 's' : ''} removable.`,
    confirmMergeAll: (groups: number) =>
      `Merge all ${groups} groups, keeping the oldest of each? This cannot be undone.`,
    confirmDeleteBroken: (n: number) =>
      `Delete the ${n} bookmarks whose link is dead? This cannot be undone.`,
    removed: (n: number) => `${n} bookmarks deleted.`,
    recheckQueued: (n: number) => `${n} links to check again.`,
    checkProgress: (done: number, total: number) =>
      `${done} of ${total} checked.`,
  },
}

export const de: Dictionary = {
  common: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    delete: 'Löschen',
    rename: 'Umbenennen',
    back: 'Zurück',
    language: 'Sprache',
  },
  legal: {
    notice:
      'thefavbook steht in keiner Verbindung zu Apple und wird von Apple nicht unterstützt. Das Erscheinungsbild ist eine Hommage an Mac OS X. Marken gehören ihren jeweiligen Inhabern.',
  },
  auth: {
    signInTitle: 'Anmelden',
    signInIntro: 'Zu Ihren Lesezeichen.',
    signUpIntro:
      'Ihre Lesezeichen bleiben Ihre: nichts wird geteilt, nichts verlässt das System ohne Ihre Zustimmung.',
    email: 'E-Mail-Adresse',
    password: 'Passwort',
    name: 'Name',
    signIn: 'Anmelden',
    signingIn: 'Anmeldung…',
    createAccount: 'Konto erstellen',
    creatingAccount: 'Wird erstellt…',
    switchToSignUp: 'Konto erstellen',
    switchToSignIn: 'Ich habe bereits ein Konto',
    privacyLink: 'Was geschieht mit dem, was ich sende?',
    badCredentials: 'Falsche Zugangsdaten.',
    signUpFailed: 'Das Konto konnte nicht erstellt werden.',
    signOut: 'Abmelden',
    signingOut: 'Abmeldung…',
    signOutFailed: 'Abmeldung fehlgeschlagen.',
    passwordHint: (n: number) => `Mindestens ${n} Zeichen.`,
    nameRequired: 'Name erforderlich.',
    emailInvalid: 'Ungültige E-Mail-Adresse.',
    passwordRequired: 'Passwort erforderlich.',
    passwordTooShort: (n: number) => `Mindestens ${n} Zeichen.`,
  },
  menu: {
    home: 'Start',
    privacy: 'Datenschutz',
    sourceCode: 'Quelltext',
    file: 'Datei',
    import: 'Lesezeichen importieren…',
    export: 'Als HTML exportieren',
    newRootFolder: 'Neuer Ordner auf oberster Ebene…',
    tools: 'Werkzeuge',
    maintenance: 'Wartung: Duplikate und tote Links…',
    spaces: 'Bereiche',
    newSpace: 'Neuer Bereich…',
    renameSpace: 'Diesen Bereich umbenennen…',
    deleteSpace: 'Diesen Bereich löschen…',
    account: 'Konto',
    deleteAccount: 'Mein Konto löschen…',
  },
  dashboard: {
    bookmarks: 'Meine Lesezeichen',
    sortWithAi: 'Mit KI ordnen',
    suggestions: 'Vorgeschlagene Ablage',
    noSuggestions:
      'Keine offenen Vorschläge. Starten Sie einen Durchlauf im linken Bereich.',
    emptySpace:
      'Dieser Bereich ist leer. Öffnen Sie das Menü Datei und dann „Lesezeichen importieren“, um einen Browser-Export abzulegen.',
    counts: (bookmarks: number, folders: number) =>
      `${bookmarks} Lesezeichen, ${folders} Ordner`,
  },
  importer: {
    title: 'Lesezeichen importieren',
    files: 'Lesezeichen-Dateien',
    filesHint:
      'Exporte aus Chrome, Firefox, Safari oder Edge. Mehrere Dateien werden zusammengeführt.',
    source: 'Herkunft',
    optional: '(optional)',
    sourcePlaceholder: 'Privates Chrome',
    submit: 'Importieren',
    submitting: 'Import läuft…',
    progress:
      'Datei lesen, auswerten und in die Datenbank schreiben. Bei mehreren Tausend Lesezeichen dauert das einige Sekunden.',
    emptyFile: 'Leere Datei.',
    tooLarge: (mb: number) => `Datei zu groß (höchstens ${mb} MB).`,
    noFile: 'Wählen Sie mindestens eine Datei.',
    invalidFile: 'Ungültige Datei.',
    noBookmarks: (name: string) =>
      `Keine Lesezeichen in „${name}“ gefunden. Ist das wirklich ein Browser-Export?`,
    imported: (n: number) => `${n} Lesezeichen importiert.`,
  },
  preview: {
    empty: 'Wählen Sie ein Lesezeichen, um es ohne Seitenwechsel anzusehen.',
    domain: 'Domain:',
    addedOn: 'Hinzugefügt am:',
    openInTab: 'In neuem Tab öffnen',
    tryEmbed: 'Eingebettete Vorschau versuchen',
    loading: 'Freigabe-Informationen werden gelesen…',
    embedRefused:
      'Ein leerer Rahmen bedeutet, dass die Website sich nicht außerhalb ihrer eigenen Domain anzeigen lässt. Nutzen Sie „In neuem Tab öffnen“.',
    failedSuffix:
      'Viele Seiten verlangen eine Anmeldung oder weisen automatische Besucher ab.',
    noMetadata: 'Diese Seite veröffentlicht keine Freigabe-Informationen.',
  },
  maintenance: {
    title: 'Wartung',
    backToBookmarks: '← Zurück zu den Lesezeichen',
    linkCheckTitle: 'Linkprüfung',
    duplicatesTitle: 'Duplikate',
    duplicatesRule:
      'Zwei Adressen gelten als identisch, wenn sie sich nur durch Protokoll, www, einen abschließenden Schrägstrich oder Tracking-Parameter unterscheiden. Was zwei echte Seiten trennt, bleibt erhalten.',
    noDuplicates: 'Keine Duplikate in diesem Bereich.',
    merge: 'Zusammenführen',
    mergeAll: 'Alle zusammenführen',
    copies: (n: number) => `${n} Exemplare`,
    totalBookmarks: 'Lesezeichen',
    unchecked: 'Ungeprüft',
    brokenLinks: 'Tote Links',
    checkLinks: 'Links prüfen',
    checking: 'Prüfung…',
    recheckAll: 'Alles erneut prüfen',
    deleteBroken: 'Tote Links löschen',
    unverifiableNote:
      'Nicht erreichbare Adressen — chrome://, lokales Netz — gelten nicht als tot und werden nie gelöscht: der Server kann sie nicht erreichen, was nichts über ihre Gültigkeit aussagt.',
    checkDone: 'Prüfung abgeschlossen.',
    duplicateSummary: (groups: number, shown: number, removable: number) =>
      `${groups} doppelte Adresse${groups > 1 ? 'n' : ''}. ${shown} hier angezeigt, ${removable} Lesezeichen entfernbar.`,
    confirmMergeAll: (groups: number) =>
      `Alle ${groups} Gruppen zusammenführen und jeweils das älteste behalten? Das lässt sich nicht rückgängig machen.`,
    confirmDeleteBroken: (n: number) =>
      `Die ${n} Lesezeichen mit totem Link löschen? Das lässt sich nicht rückgängig machen.`,
    removed: (n: number) => `${n} Lesezeichen gelöscht.`,
    recheckQueued: (n: number) => `${n} Links erneut zu prüfen.`,
    checkProgress: (done: number, total: number) =>
      `${done} von ${total} geprüft.`,
  },
}

export const es: Dictionary = {
  common: {
    cancel: 'Cancelar',
    close: 'Cerrar',
    delete: 'Eliminar',
    rename: 'Renombrar',
    back: 'Volver',
    language: 'Idioma',
  },
  legal: {
    notice:
      'thefavbook no está afiliado a Apple ni cuenta con su respaldo. Su aspecto es un homenaje a Mac OS X. Las marcas citadas pertenecen a sus respectivos propietarios.',
  },
  auth: {
    signInTitle: 'Iniciar sesión',
    signInIntro: 'Accede a tus favoritos.',
    signUpIntro:
      'Tus favoritos siguen siendo tuyos: nada se comparte, nada sale sin tu consentimiento.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    name: 'Nombre',
    signIn: 'Iniciar sesión',
    signingIn: 'Iniciando sesión…',
    createAccount: 'Crear la cuenta',
    creatingAccount: 'Creando…',
    switchToSignUp: 'Crear una cuenta',
    switchToSignIn: 'Ya tengo una cuenta',
    privacyLink: '¿Qué ocurre con lo que envío?',
    badCredentials: 'Credenciales incorrectas.',
    signUpFailed: 'No se pudo crear la cuenta.',
    signOut: 'Cerrar sesión',
    signingOut: 'Cerrando sesión…',
    signOutFailed: 'No se pudo cerrar la sesión.',
    passwordHint: (n: number) => `${n} caracteres como mínimo.`,
    nameRequired: 'Nombre obligatorio.',
    emailInvalid: 'Correo electrónico no válido.',
    passwordRequired: 'Contraseña obligatoria.',
    passwordTooShort: (n: number) => `Al menos ${n} caracteres.`,
  },
  menu: {
    home: 'Inicio',
    privacy: 'Privacidad',
    sourceCode: 'Código fuente',
    file: 'Archivo',
    import: 'Importar favoritos…',
    export: 'Exportar en HTML',
    newRootFolder: 'Nueva carpeta en la raíz…',
    tools: 'Herramientas',
    maintenance: 'Mantenimiento: duplicados y enlaces rotos…',
    spaces: 'Espacios',
    newSpace: 'Nuevo espacio…',
    renameSpace: 'Renombrar este espacio…',
    deleteSpace: 'Eliminar este espacio…',
    account: 'Cuenta',
    deleteAccount: 'Eliminar mi cuenta…',
  },
  dashboard: {
    bookmarks: 'Mis favoritos',
    sortWithAi: 'Ordenar con IA',
    suggestions: 'Propuestas de ordenación',
    noSuggestions:
      'Ninguna propuesta pendiente. Inicia una ordenación en el panel izquierdo.',
    emptySpace:
      'Este espacio está vacío. Abre el menú Archivo y luego «Importar favoritos» para depositar una exportación del navegador.',
    counts: (bookmarks: number, folders: number) =>
      `${bookmarks} favorito${bookmarks > 1 ? 's' : ''}, ${folders} carpeta${folders > 1 ? 's' : ''}`,
  },
  importer: {
    title: 'Importar favoritos',
    files: 'Archivos de favoritos',
    filesHint:
      'Exportaciones de Chrome, Firefox, Safari o Edge. Varios archivos a la vez se fusionan.',
    source: 'Procedencia',
    optional: '(opcional)',
    sourcePlaceholder: 'Chrome personal',
    submit: 'Importar',
    submitting: 'Importando…',
    progress:
      'Lectura del archivo, análisis y escritura en la base de datos. Con varios miles de favoritos, cuenta unos segundos.',
    emptyFile: 'Archivo vacío.',
    tooLarge: (mb: number) => `Archivo demasiado grande (máximo ${mb} MB).`,
    noFile: 'Elige al menos un archivo.',
    invalidFile: 'Archivo no válido.',
    noBookmarks: (name: string) =>
      `No se encontró ningún favorito en «${name}». ¿Es realmente una exportación del navegador?`,
    imported: (n: number) =>
      `${n} favorito${n > 1 ? 's' : ''} importado${n > 1 ? 's' : ''}.`,
  },
  preview: {
    empty: 'Selecciona un favorito para examinarlo sin salir de la página.',
    domain: 'Dominio:',
    addedOn: 'Añadido el:',
    openInTab: 'Abrir en una pestaña',
    tryEmbed: 'Intentar la vista previa integrada',
    loading: 'Leyendo la información para compartir…',
    embedRefused:
      'Un marco vacío significa que el sitio se niega a mostrarse fuera de su propio dominio. Usa «Abrir en una pestaña».',
    failedSuffix:
      'Muchas páginas exigen iniciar sesión o rechazan a los visitantes automáticos.',
    noMetadata: 'Esta página no publica información para compartir.',
  },
  maintenance: {
    title: 'Mantenimiento',
    backToBookmarks: '← Volver a los favoritos',
    linkCheckTitle: 'Verificación de enlaces',
    duplicatesTitle: 'Duplicados',
    duplicatesRule:
      'Dos direcciones se consideran idénticas cuando solo difieren en el protocolo, el www, una barra final o parámetros de seguimiento. Lo que distingue dos páginas reales se conserva.',
    noDuplicates: 'Ningún duplicado en este espacio.',
    merge: 'Fusionar',
    mergeAll: 'Fusionar todo',
    copies: (n: number) => `${n} ejemplares`,
    totalBookmarks: 'Favoritos',
    unchecked: 'Sin verificar',
    brokenLinks: 'Enlaces rotos',
    checkLinks: 'Verificar los enlaces',
    checking: 'Verificando…',
    recheckAll: 'Verificar todo de nuevo',
    deleteBroken: 'Eliminar los enlaces rotos',
    unverifiableNote:
      'Las direcciones fuera de alcance — chrome://, red local — no cuentan como rotas y nunca se eliminan: el servidor no puede alcanzarlas, lo que no dice nada sobre su validez.',
    checkDone: 'Verificación terminada.',
    duplicateSummary: (groups: number, shown: number, removable: number) =>
      `${groups} dirección${groups > 1 ? 'es' : ''} duplicada${groups > 1 ? 's' : ''}. ${shown} mostrada${shown > 1 ? 's' : ''} aquí, ${removable} favorito${removable > 1 ? 's' : ''} eliminable${removable > 1 ? 's' : ''}.`,
    confirmMergeAll: (groups: number) =>
      `¿Fusionar los ${groups} grupos conservando el más antiguo de cada uno? Esta acción es irreversible.`,
    confirmDeleteBroken: (n: number) =>
      `¿Eliminar los ${n} favoritos cuyo enlace está roto? Esta acción es irreversible.`,
    removed: (n: number) => `${n} favoritos eliminados.`,
    recheckQueued: (n: number) => `${n} enlaces por verificar de nuevo.`,
    checkProgress: (done: number, total: number) =>
      `${done} de ${total} verificados.`,
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, de, es }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}
