import type { EditionTranslation } from '../../i18n/types'

/**
 * The Japan edition in French.
 *
 * The mirror image of `ja.ts` next door. That overlay could throw the
 * explanations away, because a Japanese reader already knows what 礼金 is;
 * a French reader does not, so this one keeps every gloss the English tile
 * carries — the deposit that thanks the landlord for existing, the leather
 * schoolbag that outlasts the car, the government report on retirement savings.
 * The explanation *is* the joke here, exactly as in English.
 *
 * Vouvoiement, present tense, short sentences. Japanese terms are used only
 * where French has genuinely adopted them (yatai, manga, konbini stays
 * translated) and never in a title.
 */
export const JAPAN_FR: EditionTranslation = {
  locale: 'fr',
  editionId: 'japan',

  spaces: {
    'jp-start': {
      title: 'Début de la vie',
      description: 'Le voyage commence un matin d’avril : portefeuille léger, chaussures neuves, et tout l’emploi du temps d’une vie affiché sur le mur devant vous.',
    },
    'jp-uni-move-in': {
      title: 'Six tatamis',
      description: 'Votre premier logement seul se mesure en nattes de paille. Il contient un futon, un cuiseur à riz, et toutes vos ambitions.',
      harsher: {
        description: 'Votre premier logement seul se mesure en nattes de paille — et le propriétaire veut une caution, plus une somme non remboursable dite « argent de gratitude », pour le privilège de vous louer les lieux.',
        reason: 'Caution et argent de gratitude',
      },
    },
    'jp-uni-tuition': {
      title: 'Droits d’inscription',
      description: 'Un matin de février décide de quatre ans : une salle d’examen silencieuse, six cents crayons et une personne qui tousse. Vous êtes reçu — et les frais sont dus avant qu’on vous montre la bibliothèque.',
      reason: 'Inscription et frais universitaires',
    },
    'jp-uni-konbini-shifts': {
      title: 'Nuits à la supérette',
      description: 'Postes de nuit à la supérette : vous savez désormais scanner, emballer, préparer le café, faire la friture et saluer en même temps, et la paie s’accumule.',
      reason: 'Postes à la supérette',
    },
    'jp-uni-phone-trap': {
      title: 'Le forfait mobile',
      description: 'Le forfait signé à dix-neuf ans cachait des frais de résiliation en petits caractères, et c’est ce mois-ci qu’ils vous rattrapent.',
      reason: 'Frais de résiliation',
    },
    'jp-uni-grant': {
      title: 'La vraie bourse',
      description: 'Une bourse de fondation que personne n’attendait — vous relisez deux fois les conditions pour confirmer que c’est bien un don — et elle couvre une belle part des frais.',
      reason: 'Bourse de fondation',
    },
    'jp-uni-suit-season': {
      title: 'Saison des costumes',
      description: 'La chasse à l’emploi commence : un costume noir, une chemise blanche, une coiffure homologuée, et quarante mille dossiers identiques. Le vôtre a une jolie police de caractères.',
      harsher: {
        description: 'La chasse à l’emploi commence : le costume noir, les chaussures sobres, les photos d’identité au demi-sourire réglementaire — tout cela, il s’avère, vendu séparément.',
        reason: 'L’uniforme d’entretien',
      },
    },
    'jp-uni-graduation': {
      title: 'Remise du diplôme',
      description: 'Quatre ans, un mémoire, et un tube à diplôme que vous n’ouvrirez plus jamais. Officiellement diplômé.',
    },
    'jp-uni-farewell': {
      title: 'On vide la chambre',
      description: 'Vous rangez quatre ans dans deux cartons et rendez la clé au gardien.',
    },
    'jp-job-hunt': {
      title: 'La chasse à l’emploi',
      description: 'Quarante mille candidats achètent le même costume noir la même semaine et passent le même test d’aptitude. Deux portes s’ouvrent ; choisissez.',
    },
    'jp-placement-day': {
      title: 'Placement par l’école',
      description: 'Votre école a un accord avec une entreprise du coin, et dès vendredi vous avez un badge, un uniforme et un salaire — deux ans avant que les étudiants gagnent quoi que ce soit.',
    },
    'jp-work-first-envelope': {
      title: 'Première enveloppe',
      description: 'Votre toute première paie tombe et paraît énorme. Selon l’usage, vous invitez vos parents au restaurant, et ils vous laissent payer avec une fierté visible.',
      reason: 'Première enveloppe de paie',
      footnote: 'Un mois entamé, pas un mois complet — vous avez été placé en cours de mois. La première enveloppe entière, c’est la prochaine case « Jour de paie ».',
    },
    'jp-work-payday-1': {
      title: 'Jour de paie',
      description: 'Un mois complet au compteur, et le virement tombe pendant que vos camarades font encore la queue pour une place en amphi.',
      harsher: {
        title: 'Paie décalée',
        description: 'Personne n’avait précisé que le premier mois est payé avec un mois de retard, et le cuiseur à riz s’en moque.',
        reason: 'Un mois à vivre de rien',
      },
    },
    'jp-work-moving-out': {
      title: 'Premier appartement',
      description: 'Vous gagnez votre vie, donc on vous imagine logé : une caution, un mois d’argent de gratitude qui remercie le propriétaire d’exister, et un lit que vous montez vous-même.',
      reason: 'Caution, gratitude et premier mois',
    },
    'jp-work-first-night': {
      title: 'Première nuit',
      description: 'Vous déballez à la lumière d’une ampoule nue, parce que le plafonnier reste à acheter.',
    },
    'jp-work-uniform': {
      title: 'Caution d’uniforme',
      description: 'Deux uniformes, un badge, des chaussures de sécurité, et une caution que vous ne reverrez jamais, vous le sentez bien.',
      reason: 'Caution de l’uniforme',
    },
    'jp-work-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois, encore une enveloppe, et toujours personne pour demander un diplôme.',
      harsher: {
        title: 'Heures rabotées',
        description: 'Le planning est affiché le dimanche, avec votre nom sur deux fois moins de lignes que la semaine passée.',
        reason: 'Un demi-mois de créneaux',
      },
    },
    'jp-work-payday-3': {
      title: 'Jour de paie',
      description: 'Trois paies plus tard, le livret bancaire commence à ressembler à une habitude.',
    },
    'jp-main-probation': {
      title: 'Bilan d’essai',
      description: 'Six mois plus tard, quelqu’un s’assoit en face de vous avec un formulaire à remplir en trois exemplaires et vous demande comment ça se passe, selon vous. Lancez le dé.',
      reason: 'La fin de la période d’essai',
    },
    'jp-main-bank': {
      title: 'Passage à la banque',
      description: 'La guichetière s’incline exactement à l’angle prévu par le manuel et demande, chaleureusement, comment l’argent vous traite.',
    },
    'jp-main-insurance': {
      title: 'Agence d’assurance',
      description: 'La carte plastifiée des risques d’inondation, d’incendie et de séisme de votre quartier est complète, récente, et discrètement terrifiante.',
    },
    'jp-main-payday-1': {
      title: 'Jour de paie',
      description: 'Le virement tombe à neuf heures pile, évidemment. La meilleure notification de la semaine.',
    },
    'jp-main-stock-tip': {
      title: 'Tuyau boursier',
      description: 'Un collègue ouvre l’appli de trading sous le bureau et ne jure que par une valeur. La Bourse ferme à quinze heures.',
    },
    'jp-main-fender-bender': {
      title: 'Accident de voiture',
      description: 'Un passage mouillé et une voiture qui ne s’arrête pas. L’autre conducteur s’incline à quarante-cinq degrés précisément ; le carrossier s’excuse beaucoup moins pour son devis.',
      reason: 'Facture de carrosserie',
    },
    'jp-main-pileup': {
      title: 'Carambolage',
      description: 'Du brouillard sur la voie rapide, des feux stop, et quatre voitures encastrées sur la bretelle. Tout le monde repart à pied ; les factures, non.',
      reason: 'Réparations du carambolage',
    },
    'jp-main-dentist': {
      title: 'Note du dentiste',
      description: 'Un plombage, une couronne en argent, un sermon sur le fil dentaire, et une facture qui pique nettement plus que la fraise.',
      reason: 'Soins dentaires',
    },
    'jp-main-blossom-duty': {
      title: 'Garde des cerisiers',
      description: 'Les cerisiers fleurissent une semaine parfaite, et cette année c’est vous qui tenez la bâche à six heures du matin, gardant un rectangle vide contre les porteurs de bâche des autres entreprises. Ça valait le coup.',
    },
    'jp-crossroads': {
      title: 'Cinq ans de boîte',
      description: 'Cinq ans au même bureau, une augmentation à l’ancienneté tombée à l’heure, et le message d’un chasseur de têtes que vous n’avez toujours pas supprimé. La route se sépare ici.',
    },
    'jp-loyal-seniority': {
      title: 'L’ancienneté',
      description: 'Personne n’a quitté ce service depuis dix ans, alors le poste au-dessus ne se libère que le jour où quelqu’un part enfin à la retraite. Lancez le dé pour savoir si c’était cette année.',
      reason: 'Le poste au-dessus s’est libéré',
    },
    'jp-hopper-lookout': {
      title: 'Recherche discrète',
      description: 'Vous actualisez votre CV dans un café à mangas après le bureau et prenez des appels que personne au travail ne peut entendre.',
    },
    'jp-hopper-move': {
      title: 'Fixez votre prix',
      description: 'Vous posez votre démission avec l’offre suivante déjà signée. Les RH ont l’air stupéfait, comme si vous partiez à l’instant ; le nouveau titre arrive avec un nouveau chiffre.',
      reason: 'Vous avez fixé votre prix ailleurs',
    },
    'jp-hopper-bonus': {
      title: 'Prime d’arrivée',
      description: 'La nouvelle entreprise rachète votre préavis, et le virement tombe comme une saison de primes qu’il n’a pas fallu attendre.',
    },
    'jp-main-review': {
      title: 'L’entretien annuel',
      description: 'Une petite salle de réunion, deux chefs avec votre dossier ouvert entre eux, et une seule question : êtes-vous prêt pour le bureau au-dessus ? Lancez le dé et écoutez la réponse.',
      reason: 'Votre entretien est arrivé',
    },
    'jp-main-tax-audit': {
      title: 'Contrôle fiscal',
      description: 'Une lettre très polie, un long après-midi avec une boîte à chaussures pleine de reçus, et un chiffre tout en bas qui était manifestement déjà décidé.',
      reason: 'Redressement fiscal',
    },
    'jp-main-contract-ends': {
      title: 'Fin de contrat',
      description: 'Le contrat dont tout le monde jurait qu’il serait renouvelé en avril n’est, très discrètement, pas renouvelé. Le bouquet d’adieu est ravissant.',
      reason: 'Contrat non renouvelé',
    },
    'jp-main-restructuring': {
      title: 'Restructuration',
      description: 'L’entreprise annonce un plan de départs « volontaires », et votre nom figure sur la liste des volontaires.',
      reason: 'Volontaire, paraît-il',
    },
    'jp-main-midcareer-fair': {
      title: 'Salon des expérimentés',
      description: 'Un hall de stands pour les gens qui ont tout fait comme il faut dans une entreprise qui, non. Deux firmes aiment votre CV ; choisissez.',
      reason: 'Un nouveau départ au salon des expérimentés',
    },
    'jp-main-seasonal-gifts': {
      title: 'Cadeaux de saison',
      description: 'Cadeaux d’été et cadeaux d’hiver pour chaque personne autour de la table, choisis avec le plus grand soin dans un catalogue essentiellement composé de jambon.',
      reason: 'Un jambon magnifiquement emballé chacun',
    },
    'jp-wedding': {
      title: 'Jour du mariage',
      description: 'Un banquet d’hôtel, deux changements de tenue, et chaque invité qui remet une épaisse enveloppe de billets neufs — la présence a un tarif, et une superbe calligraphie.',
    },
    'jp-family-nursery-setup': {
      title: 'La chambre du bébé',
      description: 'Vous peignez la chambre d’un jaune joyeux, montez un berceau à minuit, et récupérez à la mairie le carnet destiné aux nouveaux parents, plus lourd que le berceau.',
      reason: 'Aménagement de la chambre',
    },
    'jp-family-new-baby': {
      title: 'Naissance',
      description: 'Un tout petit colocataire arrive. La mairie envoie une infirmière, un carnet, et une allocation forfaitaire qui couvre presque l’hôpital.',
    },
    'jp-family-waitlist': {
      title: 'Liste d’attente',
      description: 'Vous aviez demandé une crèche publique avant que le bébé sache s’asseoir. Vous êtes 47e, alors une crèche privée fait le pont, à des tarifs privés.',
      reason: 'Crèche privée, par enfant',
    },
    'jp-family-school-bag': {
      title: 'Le cartable',
      description: 'Chaque enfant a besoin du cartable en cuir traditionnel, de l’uniforme, de la tenue de sport, et de quarante et un objets étiquetés à la main avant mardi. Le cartable coûte plus cher que votre premier ordinateur et survivra à votre voiture.',
      reason: 'Cartable et uniformes, par enfant',
    },
    'jp-family-sports-day': {
      title: 'Fête du sport',
      description: 'La classe de votre enfant gagne l’épreuve du ballon géant. Vous avez filmé le mauvais enfant pendant l’essentiel, mais les encouragements étaient sincères.',
    },
    'jp-family-twins': {
      title: 'Des jumeaux',
      description: 'L’échographiste se tait, tourne l’écran vers vous, et lève deux doigts.',
    },
    'jp-fast-payday-1': {
      title: 'Jour de paie',
      description: 'Les heures supplémentaires apparaissent enfin sur la fiche de paie.',
    },
    'jp-fast-headhunted': {
      title: 'Approché',
      description: 'Un chasseur de têtes appelle votre téléphone personnel pendant la réunion du lundi, avec deux offres et aucune patience.',
      reason: 'Approché pour autre chose',
    },
    'jp-fast-burnout': {
      title: 'Arrêt pour burn-out',
      description: 'Six semaines d’arrêt avec certificat médical, et la paie est nettement plus légère le jour où vous revenez en vous inclinant.',
      reason: 'Congé sans solde',
    },
    'jp-fast-payday-severance': {
      title: 'Paie de fin d’exercice',
      description: 'L’exercice se clôture, et ce que ce poste paie tombe une dernière fois sur votre compte avant que l’organigramme soit redessiné.',
    },
    'jp-fast-reorg': {
      title: 'La réorganisation',
      description: 'L’organigramme est redessiné du jour au lendemain et votre nom se retrouve dans une case complètement différente. Personne n’a demandé, et c’est bien ce qu’est une réorganisation.',
      reason: 'Réaffecté après réorganisation',
    },
    'jp-fast-trading': {
      title: 'L’appli de trading',
      description: 'La prime vous brûle les doigts, et l’appli envoie des notifications avec des points d’exclamation.',
    },
    'jp-fast-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois de passé, encore un virement qui rentre.',
      harsher: {
        title: 'Prime reprise',
        description: 'La prime de l’an dernier est réévaluée par quelqu’un dans un autre bâtiment, et réévaluée à la baisse.',
        reason: 'Prime reprise',
      },
    },
    'jp-fast-retention': {
      title: 'Contre-offre',
      description: 'Vous glissez, l’air de rien, devant un thé, que quelqu’un d’autre vous a contacté. La contre-offre arrive avant le thé.',
    },
    'jp-midtown-trading': {
      title: 'La maison de titres',
      description: 'Des écrans partout, une file de retraités au guichet, et un courtier qui jure que celle-ci est différente.',
    },
    'jp-midtown-insurance': {
      title: 'Agence d’assurance',
      description: 'Avant qu’on vous confie un trousseau de clés, quelqu’un aimerait vous parler garanties — et déroule une carte des risques de votre quartier, complète, récente, et discrètement terrifiante.',
    },
    'jp-midtown-payday': {
      title: 'Jour de paie',
      description: 'Un virement tombe la semaine même où l’apport pour l’appartement est dû.',
    },
    'jp-midtown-allowance': {
      title: 'L’argent de poche',
      description: 'Les comptes fusionnent. Tout votre salaire part désormais sur un compte commun, et une somme fixe vous revient chaque mois — inscrite « argent de poche » dans le livre de comptes du foyer.',
      reason: 'Le livre de comptes du foyer, soldé',
    },
    'jp-midtown-bonus': {
      title: 'Prime d’hiver',
      description: 'L’enveloppe d’hiver tombe, chiffrée en mois de ce que vous gagnez plutôt qu’en promesses, et chacun repart avec un chiffre différent.',
    },
    'jp-midtown-raise': {
      title: 'Augmentation',
      description: 'Un mot discret près de l’ascenseur, un nouveau chiffre, et une inclinaison d’une profondeur exactement assortie en repartant.',
    },
    'jp-midtown-rate-rise': {
      title: 'Hausse des taux',
      description: 'L’ère du taux variable immobile prend fin un jeudi matin, et toutes les mensualités du foyer la suivent.',
      reason: 'Les taux partent du mauvais côté',
    },
    'jp-model-room': {
      title: 'L’appartement témoin',
      description: 'Un appartement de démonstration avec des meubles loués, un éclairage doux, et un vendeur dont le plan de remboursement dure exactement aussi longtemps que le reste de votre vie active.',
    },
    'jp-risky-startup': {
      title: 'Pari sur une start-up',
      description: 'Vous versez vos économies dans la start-up d’un ami à Shibuya et lancez le dé pour voir ce qui revient.',
      reason: 'Retour sur investissement',
    },
    'jp-risky-bad-tip': {
      title: 'Mauvais tuyau',
      description: 'Votre « valeur sûre » s’effondre en une semaine, et vous invitez toute la table à dîner pour vous faire pardonner de l’avoir recommandée si fort.',
      reason: 'Mauvais tuyau boursier',
    },
    'jp-risky-golf': {
      title: 'Golf avec le client',
      description: 'Dix-huit trous, un petit pari par trou, et un handicap que vous entretenez discrètement plus mauvais qu’il ne l’est, depuis le début de la saison.',
      reason: 'Dix-huit petits paris',
    },
    'jp-risky-crash': {
      title: 'Krach boursier',
      description: 'Le marché plonge et votre portefeuille grimace. Votre père évoque, encore, l’année où le terrain du palais impérial valait plus que la Californie.',
      reason: 'Krach boursier',
    },
    'jp-risky-aftershock': {
      title: 'Réplique',
      description: 'L’indice trouve un plancher plus bas que personne ne le croyait possible, et il le trouve en une seule séance de l’après-midi.',
      reason: 'Le marché rechute',
    },
    'jp-risky-jumbo': {
      title: 'La grande loterie',
      description: 'Vous faites quarante minutes de queue au guichet réputé chanceux, parce que le guichet réputé chanceux est réputé chanceux. Lancez le dé pour savoir ce que valait la queue.',
      reason: 'Grande loterie de fin d’année',
    },
    'jp-risky-payday': {
      title: 'Jour de paie',
      description: 'Une paie tombe pendant que vos placements font n’importe quoi.',
    },
    'jp-risky-swap': {
      title: 'Échange de fortunes',
      description: 'Une poignée de main, un sceau apposé sur un document, et vous échangez votre solde bancaire avec celui du meneur.',
      reason: 'Un accord avec le meneur',
    },
    'jp-safe-points': {
      title: 'Cagnotte de fidélité',
      description: 'Treize cartes de fidélité, un portefeuille qui craque, et un passage en caisse où les points couvrent tout le panier.',
      reason: 'Les points sont versés',
    },
    'jp-safe-payday': {
      title: 'Jour de paie',
      description: 'Le virement arrive le vingt-cinq, comme chaque mois d’aussi loin que vous vous souveniez.',
      harsher: {
        title: 'Salaire retenu',
        description: 'Une cellule dans un tableur quelque part fait que le salaire de ce mois-ci arrivera le mois prochain.',
        reason: 'Un mois de salaire retenu',
      },
    },
    'jp-safe-excess': {
      title: 'Franchise d’assurance',
      description: 'Même la route prudente a son formulaire de sinistre, et la franchise est à votre charge, en monnaie exacte.',
      reason: 'Franchise d’assurance',
    },
    'jp-safe-ledger': {
      title: 'Le livre de comptes',
      description: 'Vous tenez le livre de comptes du foyer fidèlement pendant un an entier, colonne après colonne, et le livre gagne tranquillement.',
      reason: 'Le livre de comptes finit dans le vert',
    },
    'jp-safe-old-passbook': {
      title: 'Le vieux livret',
      description: 'Un livret d’épargne postale d’enfance refait surface dans un tiroir chez vos parents, et le solde attendait patiemment depuis l’école primaire.',
      reason: 'Le compte oublié',
    },
    'jp-safe-coin-tin': {
      title: 'La boîte à pièces',
      description: 'Chaque pièce de 500 yens part dans une boîte à biscuits depuis trois ans. Aujourd’hui la boîte est pleine, et elle est plus lourde qu’elle n’en a le droit.',
      reason: 'Trois ans de pièces',
    },
    'jp-safe-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un vingt-cinq, encore un virement tranquille. C’est tout l’intérêt.',
    },
    'jp-safe-dividend': {
      title: 'Jour de dividende',
      description: 'La moitié sage de votre portefeuille verse son sage petit chèque, plus un colis d’actionnaire contenant du très bon riz.',
      reason: 'Dividende trimestriel',
    },
    'jp-sunset-number': {
      title: 'Les vingt millions',
      description: 'Un rapport officiel calcule ce qu’exige une retraite confortable, puis s’excuse de l’avoir dit. Votre propre calcul au dos d’une enveloppe donne un peu plus — et le chiffre ne disparaît pas tout seul.',
    },
    'jp-sunset-upgrade': {
      title: 'Monter d’un étage',
      description: 'L’agent appelle pour quelque chose de plus lumineux, de plus haut, et tout juste à portée — la tour a un étage libre, et l’étage a une vue.',
    },
    'jp-sunset-earthquake': {
      title: 'Le séisme',
      description: 'Le grand se présente enfin à quatre heures du matin, fait tomber toutes vos assiettes, et fissure la cuisine dans laquelle elles ont atterri.',
      reason: 'Dégâts du séisme',
    },
    'jp-sunset-parents': {
      title: 'S’occuper des parents',
      description: 'Quelqu’un qui vous a porté a besoin d’être porté, et la liste d’attente de la maison de retraite est plus longue que sa brochure. Vous refuseriez de compter. La facture compte quand même.',
      reason: 'Aider un proche',
    },
    'jp-sunset-payday-1': {
      title: 'Jour de paie',
      description: 'L’une de vos toutes dernières enveloppes de paie tombe.',
    },
    'jp-sunset-swap': {
      title: 'Échange de fortunes',
      description: 'Un dernier accord audacieux autour d’un thé vert, et le meneur regarde sa fortune s’incliner poliment et repartir avec vous.',
      reason: 'L’échange de la dernière heure',
    },
    'jp-sunset-children-visit': {
      title: 'Visite des enfants',
      description: 'Chaque enfant devenu grand arrive avec des fruits dans une boîte trop belle pour être ouverte, et laisse discrètement une enveloppe dessous.',
      reason: 'Une enveloppe de chaque enfant',
    },
    'jp-sunset-sticky': {
      title: 'Doigts collants',
      description: 'Autour du bon thé, vous entreprenez de convaincre le meneur de vous céder sa plus belle histoire.',
      reason: 'Une histoire change de mains',
    },
    'jp-sunset-last-title': {
      title: 'Un dernier titre',
      description: 'Un titre de plus avant la porte, si on se laisse convaincre. Lancez le dé et laissez le dernier entretien de votre vie trancher.',
      reason: 'Le dernier entretien de votre vie',
    },
    'jp-sunset-payday-2': {
      title: 'Jour de paie',
      description: 'Vous avez cessé de compter les jours de paie il y a des années ; le vingt-cinq, non.',
    },
    'jp-sunset-final-tax': {
      title: 'Dernier avis d’impôt',
      description: 'Une dernière enveloppe du fisc arrive avant que la porte du bureau se referme définitivement derrière vous.',
      reason: 'Dernier avis d’imposition',
    },
    'jp-sunset-ahead': {
      title: 'Le couchant approche',
      description: 'Depuis la fenêtre du train, la montagne rosit au crépuscule, comme chaque soir où vous étiez trop occupé pour regarder.',
    },
    'jp-retirement': {
      title: 'Départ à la retraite',
      description: 'Un bouquet sur votre bureau, une profonde inclinaison devant le service, et le premier lundi en quarante ans où vous n’êtes attendu nulle part.',
    },
  },

  lanes: {
    'University Lane': {
      name: 'Filière Université',
      summary: 'Quatre ans, un examen qui les décide, et la facture d’avance, en entier, avant d’avoir gagné un yen. Ce que le diplôme achète, c’est une échelle interne qui monte presque toujours — fiable, jamais énorme.',
    },
    'Straight to Work': {
      name: 'Direct au boulot',
      summary: 'Votre école vous remet à un employeur avant que les diplômés aient acheté leur costume. Payé dès le premier jour, aucun filet, et une échelle de métier dont le premier barreau est rude et le dernier bat tous les diplômés de cette table.',
    },
    'Company Loyalty Road': {
      name: 'Route de la Fidélité',
      summary: 'Rester. Les augmentations viennent à l’ancienneté, lentement et sans faute, la prime tombe deux fois l’an, et l’entreprise se souvient de la loyauté — en général. Elle décide aussi où vous habitez.',
    },
    'Job-Hopper Alley': {
      name: 'Allée des Départs',
      summary: 'Partir, et fixer son prix. Les chasseurs de têtes vous adorent et les RH gardent une fiche — jubilatoire si le premier tirage était mauvais, vrai risque s’il ne l’était pas.',
    },
    'Family Lane': {
      name: 'Voie de la Famille',
      summary: 'Des cartables, des cours du soir et une maison pleine de bruit, avec une enveloppe de chaque enfant devenu grand à la fin. Beaucoup moins de jours de paie, et chaque facture arrive multipliée.',
    },
    'Career Track': {
      name: 'Voie Rapide',
      summary: 'Les heures supplémentaires sont réelles, et les augmentations, les primes et la grande table au fond de la salle aussi. Ce que vous y avez laissé fait une liste à part, et elle est longue.',
    },
    'Speculation Street': {
      name: 'Rue de la Spéculation',
      summary: 'Crypto, effet de levier, et un tuyau donné par un homme en très beau costume. Qui est derrière au moment de l’appartement témoin devrait venir ici ; qui est devant devrait bien y réfléchir.',
    },
    'Steady Street': {
      name: 'Rue Tranquille',
      summary: 'Le livret d’épargne, la carte de fidélité, le bon de réduction, la boîte à biscuits pleine de pièces de 500 yens. Personne ne s’est jamais enrichi ici, ni ruiné — ce qui vaut très cher quand on est déjà en tête.',
    },
  },

  careers: {
    'career-jp-salon-apprentice': {
      title: 'Apprenti coiffeur',
      description: 'Deux ans de shampooings avant qu’on vous confie des ciseaux, et des soirées d’entraînement sur une tête à coiffer qui a un prénom.',
    },
    'career-jp-stylist': {
      title: 'Coiffeur styliste',
      description: 'A son fauteuil, un carnet plein trois semaines à l’avance, et des habitués qui le suivraient jusqu’à n’importe quelle station de la ligne.',
    },
    'career-jp-salon-owner': {
      title: 'Patron de salon',
      description: 'Tient un salon à deux minutes de la gare où ni la conversation ni les réservations ne s’arrêtent jamais.',
    },
    'career-jp-rice-apprentice': {
      title: 'Apprenti au riz',
      description: 'Arrivé à cinq heures, parti à dix, et toujours pas autorisé à toucher le poisson. Le riz, vous dit-on, est le métier tout entier.',
    },
    'career-jp-sushi-chef': {
      title: 'Chef sushi',
      description: 'Tient le comptoir, lit le client, et tranche exactement à l’épaisseur de son humeur.',
    },
    'career-jp-sushi-master': {
      title: 'Maître sushi',
      description: 'Huit places, pas de carte, et un carnet de réservations qui ouvre à minuit le premier du mois et ferme à 0 h 04.',
    },
    'career-jp-noodle-cook': {
      title: 'Cuisinier de nouilles',
      description: 'Six marmites, un distributeur de tickets, et un coup de feu du midi qui décide de ce que vaut la semaine.',
    },
    'career-jp-ramen-stall-owner': {
      title: 'Patron de yatai',
      description: 'Gare son échoppe roulante près de la gare à la tombée du jour et transforme la foule du dernier train en petite fête. La file d’attente est le dé.',
    },
    'career-jp-ramen-shop-owner': {
      title: 'Patron de restaurant de ramen',
      description: 'Onze tabourets au comptoir, un bouillon sans concession, et une file sur laquelle les boutiques voisines règlent leur horloge.',
    },
    'career-jp-site-labourer': {
      title: 'Manœuvre de chantier',
      description: 'Mène la gymnastique de huit heures, lance l’appel de sécurité avec conviction, et sait où se trouve réellement chaque outil du chantier.',
    },
    'career-jp-site-supervisor': {
      title: 'Chef d’équipe',
      description: 'Mène le briefing du matin, le tableau de présence, et la dispute permanente avec les échafaudeurs.',
    },
    'career-jp-site-foreman': {
      title: 'Conducteur de travaux',
      description: 'Transforme des plans roulés en bâtiments qui haussent les épaules devant les séismes, et chiffre le chantier correctement.',
    },
    'career-jp-parcel-courier': {
      title: 'Livreur de colis',
      description: 'Livre à la minute près dans un créneau de deux heures, et porte un carnet d’avis de passage aux coins usés.',
    },
    'career-jp-depot-dispatcher': {
      title: 'Régulateur de dépôt',
      description: 'Descend du scooter et passe au tableau, où chaque camionnette de l’arrondissement est un aimant portant un nom.',
    },
    'career-jp-distribution-lead': {
      title: 'Chef de centre logistique',
      description: 'Fait passer cent mille colis par le tri de nuit et rentre chez lui avant que le premier train comprenne comment.',
    },
    'career-jp-apprentice-mechanic': {
      title: 'Apprenti mécanicien',
      description: 'Trois ans à tenir la lampe pour le patron, et le soupçon grandissant que les petits camions se plaignent à lui aussi.',
    },
    'career-jp-scooter-mechanic': {
      title: 'Mécanicien scooter',
      description: 'Comprend de quoi un scooter de livraison se plaint avant que son pilote ait fini sa phrase.',
    },
    'career-jp-workshop-owner': {
      title: 'Patron de garage',
      description: 'Quatre ponts, une liste d’attente en pleine saison du contrôle technique, et un mur de photos de motos arrivées sur plateau.',
    },
    'career-jp-session-player': {
      title: 'Musicien de studio',
      description: 'Joue la basse d’un disque d’enka que tout le pays a fredonné sans jamais voir la pochette, et attend près du téléphone entre deux séances.',
    },
    'career-jp-touring-player': {
      title: 'Musicien de tournée',
      description: 'Quarante-sept préfectures, une caisse de vol, et un nom enfin imprimé en petit sur l’affiche de la salle.',
    },
    'career-jp-record-producer': {
      title: 'Producteur de disques',
      description: 'S’assoit derrière la vitre, dit « on la refait, mais plus triste », et a toujours raison, on ne sait pas comment.',
    },
    'career-jp-radio-runner': {
      title: 'Assistant de radio',
      description: 'Sert le thé, fait signe aux invités, trie les cartes des auditeurs, et apprend tranquillement comment se fabrique une émission.',
    },
    'career-jp-late-night-host': {
      title: 'Animateur de nuit',
      description: 'Lit à deux heures du matin les cartes de routiers et d’étudiants insomniaques, et n’est célèbre qu’auprès de ceux qui sont réveillés pour l’entendre.',
    },
    'career-jp-programme-director': {
      title: 'Directeur des programmes',
      description: 'Fait tourner onze émissions, en anime toujours une sous pseudonyme, et vend les espaces sponsors des douze.',
    },
    'career-jp-second-shooter': {
      title: 'Second photographe',
      description: 'Couvre le fond de la salle de banquet et l’instant exact où le père de la mariée cesse de faire semblant de ne pas pleurer.',
    },
    'career-jp-wedding-photographer': {
      title: 'Photographe de mariage',
      description: 'Les week-ends de juin sont pris deux ans à l’avance et février est un silence — l’agenda est le dé, et la saison des sanctuaires décide de l’année.',
    },
    'career-jp-rental-agent': {
      title: 'Agent de location',
      description: 'Fait visiter onze studios par samedi, et se souvient lequel avait chronométré le « à pied de la gare » en courant.',
    },
    'career-jp-property-agent': {
      title: 'Agent immobilier',
      description: 'Vend d’abord la cuisine, ensuite le balcon, et jamais les quatre-vingt-dix minutes de trajet.',
    },
    'career-jp-agency-owner': {
      title: 'Patron d’agence',
      description: 'Votre nom est sur les panneaux devant quatre cents immeubles. Une bonne année de tours en porte trois calmes.',
    },
    'career-jp-warehouse-picker': {
      title: 'Préparateur de commandes',
      description: 'Marche dix-huit kilomètres par service devant le même bras robotisé, et retrouverait l’allée quarante dans le noir.',
    },
    'career-jp-warehouse-lead': {
      title: 'Chef d’entrepôt',
      description: 'Fait tourner un bâtiment grand comme quatre terrains de baseball avec du café en canette et des porte-blocs.',
    },
    'career-jp-grooming-assistant': {
      title: 'Assistant toiletteur',
      description: 'Des serviettes, des friandises, et le sang-froid de ne pas bouger pendant qu’un tout petit chien en tout petit imperméable se fait un avis sur vous.',
    },
    'career-jp-pet-salon-groomer': {
      title: 'Toiletteur',
      description: 'Donne aux caniches nains du quartier leur coupe nounours mensuelle, et est photographié plus que la plupart des idoles.',
    },
    'career-jp-baseball-coach': {
      title: 'Entraîneur de baseball',
      description: 'Mène les entraînements du samedi sur un terrain de terre battue, sert le thé d’orge, et connaît chaque prénom. Il n’y a pas de promotion là-dedans, et il n’y en a jamais eu.',
    },
    'career-jp-rice-farmer': {
      title: 'Riziculteur',
      description: 'Fait pousser le riz pour lequel tout le village fait la queue dès sept heures, et a refusé trois fois les hommes du golf, chaque fois plus poliment.',
    },
    'career-jp-surgical-resident': {
      title: 'Interne en chirurgie',
      description: 'Six ans de gardes au CHU, des heures d’assistance au bloc, et la question permanente : que ferait le professeur, ensuite ?',
    },
    'career-jp-hospital-surgeon': {
      title: 'Chirurgien hospitalier',
      description: 'Sauve des vies avec des mains sûres, des nerfs plus sûrs encore, et des visites qui commencent avant les trains.',
    },
    'career-jp-junior-associate': {
      title: 'Collaborateur junior',
      description: 'Lit neuf cents pages pour qu’un associé puisse lire le seul paragraphe qui compte, dans un bureau au-dessus des anciennes douves.',
    },
    'career-jp-corporate-lawyer': {
      title: 'Avocat d’affaires',
      description: 'Gagne les batailles de conseil d’administration avec une belle mallette, un argument plus tranchant encore, et une inclinaison d’une profondeur exactement dosée.',
    },
    'career-jp-architectural-assistant': {
      title: 'Assistant d’architecte',
      description: 'Dessine onze fois le détail d’escalier d’une maison bâtie sur la largeur d’une voiture garée, et apprend plus de la onzième que des dix premières.',
    },
    'career-jp-architect': {
      title: 'Architecte',
      description: 'Coule du béton brut dans des angles impossibles et fait passer six mètres carrés de jardin pour une forêt.',
    },
    'career-jp-junior-systems-engineer': {
      title: 'Ingénieur systèmes junior',
      description: 'Corrige le petit bug dont personne ne voulait, et le documente dans un tableur à quarante et un onglets.',
    },
    'career-jp-systems-engineer': {
      title: 'Ingénieur systèmes',
      description: 'La carte de visite dit « SE », le pays le répète sans cesse, et le code discret en dessous fait ronronner la moitié du pays.',
    },
    'career-jp-junior-designer': {
      title: 'Game designer junior',
      description: 'Équilibre le niveau du tutoriel pendant quatre mois au studio de Kyoto, puis regarde des inconnus en venir à bout sans lire un mot.',
    },
    'career-jp-game-designer': {
      title: 'Game designer',
      description: 'Construit des mondes que la planète entière explore bien trop tard dans la nuit. Ce fut toujours l’export du pays, et c’est maintenant votre bureau.',
    },
    'career-jp-robotics-graduate': {
      title: 'Diplômé en robotique',
      description: 'Passe un an à apprendre à un bras à s’incliner au bon angle, et considère l’année bien employée.',
    },
    'career-jp-robotics-engineer': {
      title: 'Ingénieur roboticien',
      description: 'Construit des aides-soignants pour un pays qui vieillit, une articulation à la fois, et répond à la même question à chaque repas de famille.',
    },
    'career-jp-trading-house-trainee': {
      title: 'Recrue de maison de négoce',
      description: 'Apprend à vendre du minerai de fer, du saumon et de l’assurance dans la même semaine, et se fait jauger pour une expatriation.',
    },
    'career-jp-trading-house-generalist': {
      title: 'Généraliste de maison de négoce',
      description: 'Posté sur trois continents avant quarante ans. Personne, vous compris, ne sait expliquer votre métier en soirée, mais la prime tombe deux fois par an.',
    },
    'career-jp-ministry-recruit': {
      title: 'Recrue de ministère',
      description: 'Passe le concours national, entre au ministère, et découvre pourquoi les lumières du quartier restent allumées après minuit.',
    },
    'career-jp-ministry-section-chief': {
      title: 'Chef de section',
      description: 'Rédige les réponses qu’un ministre lira à voix haute à sept heures le lendemain matin. Les heures supplémentaires se mesurent en budgets nationaux.',
    },
    'career-jp-research-assistant': {
      title: 'Assistant de recherche',
      description: 'Compte des choses en eau froide pour l’article de quelqu’un d’autre, et adore chaque minute.',
    },
    'career-jp-aquarium-researcher': {
      title: 'Chercheur en aquarium',
      description: 'Étudie le bassin pour lequel toute la ville fait la queue, et tutoie un dauphin extrêmement curieux.',
    },
    'career-jp-manga-assistant': {
      title: 'Assistant mangaka',
      description: 'Encre les décors jusqu’à quatre heures du matin pour un hebdomadaire qui ne saute jamais un numéro, pendant que la vraie histoire dort dans un tiroir.',
    },
    'career-jp-manga-artist': {
      title: 'Mangaka',
      description: 'Enfin publié en série. Les droits d’auteur sont un dé, le sondage des lecteurs une guillotine, et l’échéance revient chaque semaine, à vie.',
    },
    'career-jp-veterinarian': {
      title: 'Vétérinaire',
      description: 'Rassure les maîtres inquiets tout en réduisant tranquillement une toute petite fracture. Ne dirigerait une chaîne de cliniques pour aucune somme imaginable.',
    },
    'career-jp-university-professor': {
      title: 'Professeur d’université',
      description: 'Donne cours le mardi, se dispute avec ses collègues le mercredi, fait changer les avis d’ici vendredi, et a refusé deux fois le décanat.',
    },
  },

  houses: {
    'house-jp-country-farmhouse': {
      name: 'Ferme de campagne',
      description: 'Une immense vieille maison en bois, dans un village prêt à vous payer pour l’aimer. Huit millions de maisons comme celle-ci sont vides ; valeur de revente : sentimentale.',
    },
    'house-jp-one-room-flat': {
      name: 'Studio en ville',
      description: 'Dix-huit mètres carrés, quatre minutes de la gare, et une baignoire qui sert aussi de lavabo. Ce sont les quatre minutes que vous achetez.',
    },
    'house-jp-suburban-tract-house': {
      name: 'Pavillon de lotissement',
      description: 'Identique à ses voisins jusqu’à la boîte aux lettres, à quatre-vingt-dix minutes de votre bureau. Odeur de neuf incluse ; valeur du neuf non conservée.',
    },
    'house-jp-warehouse-loft': {
      name: 'Entrepôt réhabilité',
      description: 'Un ancien entrepôt à saké, d’énormes poutres en bois au plafond, de grandes fenêtres, et un poêle à pétrole magnifiquement bruyant.',
    },
    'house-jp-two-family-house': {
      name: 'Maison à deux foyers',
      description: 'Vos parents habitent en dessous. Cela règle plusieurs problèmes et en crée à peu près autant.',
    },
    'house-jp-seaside-villa': {
      name: 'Villa en bord de mer',
      description: 'La vue sur l’océan est éternelle ; l’assurance typhon est annuelle. Le marché a fait ce calcul avant vous.',
    },
    'house-jp-custom-built-house': {
      name: 'Maison sur mesure',
      description: 'Un architecte a bâti votre rêve à l’identique, jusqu’au coin lecture. Les rêves, note poliment le marché, ne sont pas transmissibles.',
    },
    'house-jp-bayside-tower': {
      name: 'Tour de la baie, 38e étage',
      description: 'Du béton, un concierge, et une vue nocturne sur le pont. Les tours, contrairement aux maisons, ont le droit de prendre de la valeur.',
    },
    'house-jp-central-penthouse': {
      name: 'Penthouse du centre',
      description: 'Tout le dernier étage au-dessus du quartier des anciennes douves. L’ascenseur a un canapé, et le canapé a une vue.',
    },
  },

  stocks: {
    'stock-jp-konbini': {
      name: 'Supérettes Nationales',
      description: 'Cinquante-huit mille magasins qui ne ferment jamais, ne ratent jamais rien, et ne surprennent personne. Voilà tout l’argumentaire.',
    },
    'stock-jp-rail': {
      name: 'Rail & Foncier Sunrise',
      description: 'Les trains sont à l’heure à la seconde près, l’entreprise possède chaque boutique devant laquelle vous passez, et elle s’excuse quand même pour quarante secondes de retard.',
    },
    'stock-jp-animation': {
      name: 'Studio d’animation Lantern',
      description: 'À un succès mondial en streaming de la gloire, à une production qui dérape du documentaire qu’on fera dessus.',
    },
    'stock-jp-gacha': {
      name: 'Guilde des Jeux Gacha',
      description: 'Gratuit à jouer, mystérieusement rentable. Le chiffre d’affaires dépend entièrement de l’accueil réservé par les adolescents aux personnages à collectionner du trimestre.',
    },
    'stock-jp-robotics': {
      name: 'Robotique Orbital Springs',
      description: 'Des aides-soignants humanoïdes pour un pays qui vieillit — soit le prochain champion national, soit la façon la plus chère au monde de plier une serviette.',
    },
  },

  lifeTiles: {
    'tile-jp-tokyo-marathon': { title: 'Couru le marathon de Tokyo' },
    'tile-jp-visual-novel': { title: 'Sorti un roman visuel indé' },
    'tile-jp-neighbourhood-shiba': { title: 'Apprivoisé le shiba du quartier' },
    'tile-jp-shonan-surf': { title: 'Appris à surfer à Shonan' },
    'tile-jp-goya-curtain': { title: 'Fait pousser un rideau de courges' },
    'tile-jp-gyoza-seal': { title: 'Perfectionné le pli des raviolis' },
    'tile-jp-pilgrimage': { title: 'Fait le pèlerinage des 88 temples' },
    'tile-jp-enka-single': { title: 'Sorti un single de chanson enka' },
    'tile-jp-tea-hut': { title: 'Bâti un pavillon de thé au jardin' },
    'tile-jp-food-stall-news': { title: 'Votre échoppe au journal local' },
    'tile-jp-island-triathlon': { title: 'Terminé le triathlon de l’île' },
    'tile-jp-cat-shelter': { title: 'Bénévole au refuge pour chats' },
    'tile-jp-shaved-ice-stall': { title: 'Tenu le stand de glace pilée' },
    'tile-jp-arcade-mural': { title: 'Peint la fresque de la galerie' },
    'tile-jp-national-haiku': { title: 'Votre haïku dans le journal national' },
    'tile-jp-catchphrase': { title: 'Votre gag de nuit devenu expression' },
    'tile-jp-vending-snack': { title: 'Inventé un snack de distributeur' },
    'tile-jp-bon-dance': { title: 'Gagné la danse du quartier' },
    'tile-jp-shrine-cat': { title: 'Adopté le chat du sanctuaire' },
    'tile-jp-fuji-sunrise': { title: 'Gravi le mont Fuji au lever du jour' },
    'tile-jp-tea-bowl': { title: 'Cuit votre propre bol à thé' },
    'tile-jp-junior-baseball': { title: 'Entraîné l’équipe de baseball des jeunes' },
    'tile-jp-departure-melody': { title: 'Composé une mélodie de départ de train' },
    'tile-jp-prize-daikon': { title: 'Fait pousser un radis primé' },
    'tile-jp-shibuya-startup': { title: 'Financé la start-up d’un ami à Shibuya' },
    'tile-jp-showa-motorcycle': { title: 'Restauré une moto de l’ère Showa' },
    'tile-jp-hanami-spot': { title: 'Tenu la meilleure place sous les cerisiers' },
    'tile-jp-bento': { title: 'Fait un bento trop beau pour être mangé' },
    'tile-jp-inland-sea': { title: 'Navigué la mer intérieure' },
    'tile-jp-village-mascot': { title: 'Dessiné la mascotte du village' },
    'tile-jp-fostered-litter': { title: 'Accueilli toute une portée' },
    'tile-jp-radio-calisthenics': { title: 'Rempli la carte de gymnastique matinale' },
    'tile-jp-calligraphy-class': { title: 'Donné un cours de calligraphie complet' },
    'tile-jp-kumano-kodo': { title: 'Parcouru le chemin de Kumano' },
    'tile-jp-town-cinema': { title: 'Restauré le vieux cinéma de la ville' },
    'tile-jp-bonsai': { title: 'Votre bonsaï a traversé trois ères' },
  },

  economy: {
    tuitionNotes: [
      'Le dossier de bourse se perd dans une pile de paperasse, et une deuxième année de cours du soir vient s’ajouter à la facture.',
      'Inscription et frais de scolarité tombent exactement à ce que promettait la brochure de l’université.',
      'Une bourse de la préfecture couvre une plus grosse part des quatre ans que prévu.',
      'Exonération totale des frais — le genre de relevé de notes qu’une famille fait encadrer.',
    ],
    marriage: {
      rescued: 'Oui à la deuxième tentative — et l’installation se fait avec un crédit renouvelable, une place de parking pour une voiture qui n’est plus là, et une attitude très détendue vis-à-vis des deux.',
      outcomes: [
        'Le banquet d’hôtel a pris le large : deux changements de tenue, une entrée à la glace carbonique, et les deux familles qui commandent le bon saké.',
        'Une petite cérémonie au sanctuaire et un bon restaurant. Quarante invités, un discours qui touche, et les enveloppes ont tout couvert.',
        'Deux salaires sous le même toit, et le loyer du trois-pièces a soudain l’air deux fois plus petit.',
        'Toute la ville natale débarque, chacun est généreux, et il se trouve que votre conjoint remplissait discrètement un livret d’épargne postale depuis le lycée.',
      ],
    },
  },
}
