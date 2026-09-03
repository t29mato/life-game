import type { EditionTranslation } from '../../i18n/types'

/**
 * The France edition in French — the other overlay in this project that is not
 * really a translation.
 *
 * Same rule as `japan/i18n/ja.ts`: the English tiles explain France to a
 * reader who is not French ("a second policy called the mutuelle", "this
 * negotiated exit gets you a payout", "the original French savings account"),
 * and a French reader needs none of it. So the glosses go, the things get
 * called what they are called — la chambre de bonne, le concours, la rupture
 * conventionnelle, le constat amiable, le bas de laine, le treizième mois —
 * and where the joke lived in the explanation it is rebuilt out of
 * recognition instead.
 *
 * Vouvoiement, present tense, short sentences. Typographic apostrophes (’) and
 * guillemets (« »), as French is set.
 */
export const FRANCE_FR: EditionTranslation = {
  locale: 'fr',
  editionId: 'france',

  spaces: {
    'fr-start': {
      title: 'La rentrée',
      description: 'Chaque septembre, le pays entier repart en même temps : chaussures neuves, emploi du temps neuf, et votre vie qui commence le même matin que celle de tout le monde.',
    },
    'fr-uni-move-in': {
      title: 'La chambre de bonne',
      description: 'Votre premier chez-vous fait neuf mètres carrés sous les toits, au sixième sans ascenseur. C’est minuscule, mais c’est à vous.',
      harsher: {
        description: 'Neuf mètres carrés sous les toits, au sixième sans ascenseur — et l’agence veut une caution, un garant, et des frais de dossier rien que pour vous avoir fait visiter.',
        reason: 'Caution et frais d’agence',
      },
    },
    'fr-uni-fees': {
      title: 'Les frais de scolarité',
      description: 'Deux ans de prépa payés : vous avez le concours. Mais l’école, elle, n’est pas gratuite, et la facture tombe avant même qu’on vous montre la bibliothèque.',
      reason: 'Frais de grande école',
    },
    'fr-uni-harvest': {
      title: 'Les vendanges',
      description: 'Trois semaines de septembre à vendanger pour un domaine qui nourrit très bien à midi. Ça paie en liquide, en courbatures, et en une bouteille que vous gardez pour plus tard.',
      reason: 'Paie des vendanges',
    },
    'fr-uni-overdraft': {
      title: 'Agios',
      description: 'Votre compte passe sous zéro une seule journée. La banque vous le facture quand même, et joint un dépliant sur la gestion de budget.',
      reason: 'Agios',
    },
    'fr-uni-grant': {
      title: 'La bourse au mérite',
      description: 'Il existe une bourse taillée exactement pour vous. Vous relisez la lettre deux fois pour y croire, et elle couvre une bonne partie des frais.',
      reason: 'Bourse de fondation',
    },
    'fr-uni-exams': {
      title: 'Quinzaine d’examens',
      description: 'Cinq écrits, puis un oral où trois professeurs vous regardent chercher au tableau. Vous vivez au café.',
      harsher: {
        description: 'Cinq écrits, un oral au tableau devant trois professeurs — et un prof particulier engagé dans la panique pour la matière qui vous terrifie.',
        reason: 'Cours particuliers en urgence',
      },
    },
    'fr-uni-graduation': {
      title: 'La remise des diplômes',
      description: 'Vous sortez diplômé, avec un intitulé long et impressionnant, une poignée de main officielle, et un réseau d’anciens sur lequel compter toute votre vie.',
    },
    'fr-uni-farewell': {
      title: 'On vide la chambre',
      description: 'Vous videz la chambre d’étudiant dans deux valises et rendez la clé à la gardienne.',
    },
    'fr-grad-forum': {
      title: 'Le forum des métiers',
      description: 'Les anciens de votre école remplissent le grand amphi une journée durant, avec des poignées de main fermes et des chiffres de salaire plus fermes encore. Deux postes sont ouverts. Choisissez.',
    },
    'fr-apprenticeship-day': {
      title: 'Entrée en apprentissage',
      description: 'Un CFA vous trouve un employeur sur-le-champ. Vous signez le lundi, vous êtes payé dès le mardi — pendant que les prépas font encore la queue pour s’inscrire.',
    },
    'fr-work-first-payslip': {
      title: 'Première fiche de paie',
      description: 'Votre première fiche de paie compte quarante lignes. Votre salaire réel se trouve quelque part sous quatre sortes de cotisations, et il paraît quand même énorme.',
      reason: 'Première paie',
      footnote: 'Un mois entamé, pas un mois complet — vous avez signé en cours de mois. La première fiche entière, c’est la prochaine case « Jour de paie ».',
    },
    'fr-work-payday-1': {
      title: 'Jour de paie',
      description: 'Un mois complet travaillé, et l’argent tombe pendant que vos amis sont encore étudiants.',
      harsher: {
        title: 'Paie décalée',
        description: 'Personne ne vous l’avait dit : le premier mois est payé avec un mois de retard. Le propriétaire, lui, s’en moque.',
        reason: 'Un mois à vivre de rien',
      },
    },
    'fr-work-moving-out': {
      title: 'Premier appartement',
      description: 'Maintenant que vous gagnez votre vie, on vous attend dehors : une caution, un garant — vos parents doivent signer — et un dossier de location plus épais qu’une candidature.',
      reason: 'Caution et premier mois',
    },
    'fr-work-first-night': {
      title: 'Première nuit',
      description: 'Vous déballez à la lampe de chevet, parce que l’ampoule du plafonnier est encore sur la liste de courses de la semaine prochaine.',
    },
    'fr-work-gear': {
      title: 'Caution du matériel',
      description: 'Deux bleus de travail, des chaussures de sécurité, un badge, et une caution que vous doutez de revoir un jour.',
      reason: 'Caution du matériel',
    },
    'fr-work-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois, encore une fiche de paie. Toujours personne pour demander à voir votre diplôme.',
      harsher: {
        title: 'Heures rabotées',
        description: 'Votre patron affiche le planning de la semaine prochaine en soupirant. Votre nom est sur deux fois moins de créneaux.',
        reason: 'Un demi-mois de créneaux',
      },
    },
    'fr-work-payday-3': {
      title: 'Jour de paie',
      description: 'Trois mois plus tard, être payé n’a plus rien d’une surprise.',
    },
    'fr-main-trial-period': {
      title: 'Fin de période d’essai',
      description: 'Votre période d’essai s’achève aujourd’hui. Quelqu’un s’assoit en face de vous avec un formulaire. Lancez le dé pour savoir ce qu’on vous dit.',
      reason: 'La fin de la période d’essai',
    },
    'fr-main-bank': {
      title: 'Rendez-vous à la banque',
      description: 'Votre conseiller vous reçoit sur rendez-vous, vous offre un café, et demande comment se porte votre argent.',
    },
    'fr-main-insurance': {
      title: 'L’agence d’assurance',
      description: 'L’assurance habitation est obligatoire, et la mutuelle prend le relais là où la Sécu s’arrête. Le courtier a un dossier prêt pour chacune.',
    },
    'fr-main-payday-1': {
      title: 'Jour de paie',
      description: 'L’argent tombe le 28, réglé comme une horloge — la meilleure notification de la semaine.',
    },
    'fr-main-stock-tip': {
      title: 'Tuyau boursier',
      description: 'Un collègue jure au déjeuner qu’une valeur est une affaire sûre. La Bourse ferme à dix-sept heures trente.',
    },
    'fr-main-fender-bender': {
      title: 'Accident de voiture',
      description: 'Vous remplissez le constat amiable avec l’autre conducteur sur le capot d’une voiture qui n’a plus tout à fait sa forme, et convenez que c’était de votre faute.',
      reason: 'Facture de carrosserie',
    },
    'fr-main-pileup': {
      title: 'Carambolage',
      description: 'Brouillard épais sur le périphérique, freinage brutal, et quatre voitures encastrées sur la bretelle de sortie. Aucun blessé. Les factures, elles, sont lourdes.',
      reason: 'Réparations du carambolage',
    },
    'fr-main-dentist': {
      title: 'Le devis du dentiste',
      description: 'Une couronne, un sermon sur le fil dentaire, et un devis dont la plus grosse ligne n’est pas remboursée.',
      reason: 'Soins dentaires',
    },
    'fr-main-lucky-find': {
      title: 'Belle trouvaille',
      description: 'Il vous arrive une petite chose heureuse — le genre d’histoire que vous raconterez à table pendant des années.',
    },
    'fr-crossroads': {
      title: 'Cinq ans de boîte',
      description: 'Cinq ans en CDI, un salaire qui monte lentement à l’ancienneté — et le message d’un chasseur de têtes toujours pas lu dans votre boîte mail. La route se sépare ici.',
    },
    'fr-loyal-grid': {
      title: 'La grille d’ancienneté',
      description: 'Votre salaire monte d’un échelon chaque année, mais le poste au-dessus ne se libère que quand quelqu’un part à la retraite. Lancez le dé pour savoir si c’est cette année.',
      reason: 'Le poste au-dessus s’est libéré',
    },
    'fr-hopper-lookout': {
      title: 'Recherche discrète',
      description: 'Vous actualisez votre CV à la pause déjeuner et prenez des appels que personne au bureau ne peut entendre.',
    },
    'fr-hopper-exit': {
      title: 'Rupture conventionnelle',
      description: 'Votre entreprise et vous convenez par écrit de vous séparer. Une indemnité, vos droits intacts, et un nouveau départ — nouveau poste, nouveau salaire.',
      reason: 'Vous avez signé la rupture conventionnelle',
    },
    'fr-hopper-bonus': {
      title: 'Prime d’arrivée',
      description: 'Votre nouvel employeur vous rachète vos trois mois de préavis. Ça tombe comme une paie entière en plus.',
    },
    'fr-main-annual-review': {
      title: 'L’entretien annuel',
      description: 'Une petite salle de réunion, deux managers, votre dossier ouvert sur la table. Une seule question : êtes-vous prêt pour le poste au-dessus ? Lancez le dé pour connaître leur décision.',
      reason: 'Votre entretien annuel est arrivé',
    },
    'fr-main-tax-audit': {
      title: 'Contrôle fiscal',
      description: 'Une lettre très polie du fisc mène à un long après-midi à trier une boîte à chaussures de reçus — et à un montant final qui semblait décidé d’avance.',
      reason: 'Redressement fiscal',
    },
    'fr-main-cdd-ends': {
      title: 'Fin de CDD',
      description: 'Votre CDD, dont tout le monde jurait qu’il passerait en CDI, n’est tout simplement pas renouvelé. La carte de départ est très jolie, au moins.',
      reason: 'Contrat non renouvelé',
    },
    'fr-main-redundancy': {
      title: 'Le plan social',
      description: 'Tout l’étage est convoqué dans une même réunion avec un consultant en costume coûteux. Ensuite, votre badge ne fonctionne plus.',
      reason: 'Poste supprimé',
    },
    'fr-main-employment-office': {
      title: 'L’agence pour l’emploi',
      description: 'Un conseiller reprend votre dossier et trouve deux postes qui vous vont. Choisissez.',
      reason: 'Un nouveau départ à l’agence pour l’emploi',
    },
    'fr-main-gifts': {
      title: 'Cadeaux de Noël',
      description: 'Vous achetez un cadeau pour chaque personne autour de la table, choisi avec soin et emballé magnifiquement par la boutique.',
      reason: 'Un cadeau pour chacun',
    },
    'fr-wedding': {
      title: 'Jour du mariage',
      description: 'Vous vous mariez deux fois le même jour : une fois à la mairie devant le maire, une fois à une fête qui, par tradition, dure jusqu’à l’aube. Les invités remplissent l’urne posée sur la table.',
    },
    'fr-family-nursery-setup': {
      title: 'La chambre du bébé',
      description: 'Vous peignez la chambre d’un jaune joyeux, montez un lit à barreaux à minuit, et récupérez le carnet de santé déjà imprimé au nom de votre enfant.',
      reason: 'Aménagement de la chambre',
    },
    'fr-family-new-baby': {
      title: 'Naissance',
      description: 'La petite chambre est peinte et le berceau monté. L’État, qui n’attendait que ça, ouvrira le dossier le jour où il y aura un dossier.',
    },
    'fr-family-creche': {
      title: 'La liste d’attente',
      description: 'Obtenir une place en crèche municipale relève du concours. L’assistante maternelle qui fait le pont coûte tout aussi cher.',
      reason: 'Garde d’enfant, par enfant',
    },
    'fr-family-school-list': {
      title: 'La liste de fournitures',
      description: 'La liste de rentrée réclame dix-sept articles précis par enfant, dont une marque exacte de cahier introuvable partout.',
      reason: 'Fournitures scolaires, par enfant',
    },
    'fr-family-year-end-show': {
      title: 'Le spectacle de fin d’année',
      description: 'Votre enfant dit ses deux répliques parfaitement au spectacle de l’école, et vous pleurez au troisième rang derrière un mur de téléphones.',
    },
    'fr-family-twins': {
      title: 'Des jumeaux',
      description: 'L’échographiste se tait, tourne l’écran vers vous, et lève deux doigts.',
    },
    'fr-fast-payday-1': {
      title: 'Jour de paie',
      description: 'Plus personne ne compte vos heures supplémentaires, mais la paie arrive quand même.',
    },
    'fr-fast-headhunted': {
      title: 'Approché',
      description: 'Un chasseur de têtes appelle votre téléphone personnel en pleine réunion, avec deux offres et zéro patience.',
      reason: 'Approché pour autre chose',
    },
    'fr-fast-burnout': {
      title: 'Arrêt pour burn-out',
      description: 'Un médecin vous arrête six semaines et emploie calmement le mot « surmenage ». La paie est bien plus légère à votre retour.',
      reason: 'Congé sans solde',
    },
    'fr-fast-payday-severance': {
      title: 'Paie de fin d’année',
      description: 'L’année se clôt, et ce que ce poste paie tombe une dernière fois sur votre compte avant que l’organigramme soit redessiné.',
    },
    'fr-fast-reorg': {
      title: 'La réorganisation',
      description: 'L’organigramme est redessiné du jour au lendemain, et votre nom se retrouve dans une case complètement différente. On ne vous a rien demandé — c’est bien ce qu’est une réorganisation.',
      reason: 'Réaffecté après réorganisation',
    },
    'fr-fast-trading-desk': {
      title: 'La salle des marchés',
      description: 'Vous avez hâte de dépenser votre prime, et le quartier d’affaires est plein de gens ravis de vous suggérer où la mettre.',
    },
    'fr-fast-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois de passé, encore une paie qui rentre.',
      harsher: {
        title: 'Prime reprise',
        description: 'Un auditeur dans un bureau lointain recalcule la prime de l’an dernier — à la baisse, avec une longue explication jointe.',
        reason: 'Prime reprise',
      },
    },
    'fr-fast-retention': {
      title: 'Contre-offre',
      description: 'Vous glissez, l’air de rien devant un café, que quelqu’un d’autre vous a contacté. La contre-offre arrive avant le café.',
    },
    'fr-midtown-brokerage': {
      title: 'La maison de courtage',
      description: 'Des écrans partout, une file de retraités au guichet, et un courtier qui jure que cette valeur-là est différente.',
    },
    'fr-midtown-insurance': {
      title: 'L’agence d’assurance',
      description: 'Avant que le notaire ne vous remette les clés, il lui faut une attestation d’assurance — et l’agent vous déroule une carte détaillée du risque d’inondation de votre future rue.',
    },
    'fr-midtown-payday': {
      title: 'Jour de paie',
      description: 'Votre paie tombe la semaine même où l’apport de l’appartement est dû.',
    },
    'fr-midtown-joint-account': {
      title: 'Le compte joint',
      description: 'Vous fusionnez vos comptes lors d’un rendez-vous en bonne et due forme. Pour la première fois, les dépenses de quelqu’un d’autre sont aussi, inévitablement, votre problème.',
      reason: 'Le compte joint, soldé',
    },
    'fr-midtown-convocation': {
      title: 'La convocation',
      description: 'Un courrier vous convoque à l’école un mardi matin. Le CPE est poli, méthodique, et tient un devis détaillé pour une porte.',
      reason: 'Ce qu’ils ont cassé, par enfant',
    },
    'fr-midtown-bonus': {
      title: 'Le treizième mois',
      description: 'Votre fiche de paie de décembre arrive avec une page en plus : une prime calculée sur ce que vous gagnez, si bien que chacun autour de la table ouvre un chiffre différent.',
    },
    'fr-midtown-raise': {
      title: 'Augmentation',
      description: 'Un mot discret près de l’ascenseur, un nouveau chiffre sur la fiche de paie, et une poignée de main ferme en sortant.',
    },
    'fr-midtown-rate-rise': {
      title: 'Hausse des taux',
      description: 'Votre taux fixe arrive à échéance un jeudi matin, et toutes les mensualités de la maison suivent le mouvement.',
      reason: 'Les taux partent du mauvais côté',
    },
    'fr-notary': {
      title: 'Chez le notaire',
      description: 'Un logement n’est vraiment à vous qu’une fois l’acte lu à voix haute, en entier, dans un bureau lambrissé. Les frais de notaire tiennent plus de l’impôt que de l’honoraire, et ils sont pour vous aussi.',
    },
    'fr-risky-startup': {
      title: 'Pari sur une start-up',
      description: 'Vous placez vos économies dans la start-up d’un ami, dans un grand accélérateur parisien. Lancez le dé pour voir ce qui revient.',
      reason: 'Retour sur investissement',
    },
    'fr-risky-bad-tip': {
      title: 'Mauvais tuyau',
      description: 'Votre « valeur sûre » s’effondre en une semaine. Vous invitez toute la table à dîner pour vous faire pardonner de l’avoir recommandée.',
      reason: 'Mauvais tuyau boursier',
    },
    'fr-risky-casino': {
      title: 'Week-end au casino',
      description: 'Un week-end dans un casino en bord de mer se passe parfaitement : vous partez pendant que vous êtes en tête, ce que personne là-bas n’avait encore réussi.',
      reason: 'Une soirée parfaite',
    },
    'fr-risky-crash': {
      title: 'Krach boursier',
      description: 'Le marché chute lourdement et votre portefeuille encaisse. Un oncle rappelle, encore, que la pierre, elle, ne déçoit jamais.',
      reason: 'Krach boursier',
    },
    'fr-risky-aftershock': {
      title: 'Réplique',
      description: 'Le marché descend encore plus bas que prévu — et tout cela en un seul après-midi.',
      reason: 'Le marché rechute',
    },
    'fr-risky-lottery': {
      title: 'Le billet de loto',
      description: 'Vous achetez un billet de loto au bureau de tabac que tout le monde dit chanceux. Lancez le dé pour voir si la chance était réelle.',
      reason: 'Le tirage national',
    },
    'fr-risky-payday': {
      title: 'Jour de paie',
      description: 'Votre paie tombe pendant que vos placements se portent très mal.',
    },
    'fr-risky-swap': {
      title: 'Échange de fortunes',
      description: 'Un long déjeuner, une poignée de main, et vous échangez vos soldes bancaires avec le meneur du moment.',
      reason: 'Un accord avec le meneur',
    },
    'fr-safe-points': {
      title: 'La carte de fidélité',
      description: 'Vous avez utilisé fidèlement votre carte de fidélité toute l’année. Aujourd’hui, elle couvre le caddie entier.',
      reason: 'Les points sont versés',
    },
    'fr-safe-payday': {
      title: 'Jour de paie',
      description: 'Votre paie tombe le 28, comme toujours.',
      harsher: {
        title: 'Salaire retenu',
        description: 'On vous explique calmement qu’une erreur de dossier fera arriver le salaire de ce mois-ci le mois prochain, avec des excuses en bonne et due forme.',
        reason: 'Un mois de salaire retenu',
      },
    },
    'fr-safe-excess': {
      title: 'Franchise d’assurance',
      description: 'Même la route prudente a parfois son sinistre à déclarer, et la franchise reste à votre charge.',
      reason: 'Franchise d’assurance',
    },
    'fr-safe-budget': {
      title: 'Budget tenu',
      description: 'Vous tenez un budget familial fidèlement pendant un an entier, et il se trouve que vous avez économisé plus que vous ne le pensiez.',
      reason: 'Vous avez économisé plus que prévu',
    },
    'fr-safe-refund': {
      title: 'Remboursement d’impôts',
      description: 'Un remboursement d’impôts arrive pile au moment où vous aviez oublié de l’attendre, accompagné d’une longue lettre d’explication.',
      reason: 'Remboursement d’impôts',
    },
    'fr-safe-wool-sock': {
      title: 'Le bas de laine',
      description: 'Le vieux bas de laine au fond du tiroir a grossi, tranquillement, au fil des années.',
      reason: 'Le bas de laine rapporte',
    },
    'fr-safe-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un 28, encore une paie tranquille. C’est tout l’intérêt.',
    },
    'fr-safe-dividend': {
      title: 'Jour de dividende',
      description: 'Vos placements sages et ennuyeux versent leur dividende sage et ennuyeux — plus un bon de réduction pour la cafétéria de l’aire d’autoroute.',
      reason: 'Dividende trimestriel',
    },
    'fr-sunset-number': {
      title: 'Le chiffre',
      description: 'Vous faites un calcul rapide, au dos d’une enveloppe : que faudrait-il pour arrêter maintenant, plus tôt, selon vos propres termes ? Le chiffre est plus petit que vous ne le craigniez.',
    },
    'fr-sunset-upgrade': {
      title: 'Monter d’un étage',
      description: 'L’agent immobilier appelle pour quelque chose de plus lumineux, plus haut, et tout juste à portée. Le dernier étage se libère, et la vue le vaut.',
    },
    'fr-sunset-fire': {
      title: 'Incendie',
      description: 'Une casserole oubliée sur le feu, un coup de téléphone de trop, et une cuisine à refaire depuis le sol.',
      reason: 'Dégâts d’incendie',
    },
    'fr-sunset-care': {
      title: 'Frais de dépendance',
      description: 'Quelqu’un qui s’est occupé de vous a maintenant besoin qu’on s’occupe de lui, et la liste d’attente de l’EHPAD est plus longue qu’espéré. Vous paieriez n’importe quoi pour cela, et la facture est énorme.',
      reason: 'Aider un proche',
    },
    'fr-sunset-payday-1': {
      title: 'Jour de paie',
      description: 'L’une de vos toutes dernières paies tombe.',
    },
    'fr-sunset-swap': {
      title: 'Échange de fortunes',
      description: 'Un dernier coup audacieux au cours d’un dîner, et la fortune du meneur du moment quitte la table avec vous.',
      reason: 'L’échange de la dernière heure',
    },
    'fr-sunset-children-visit': {
      title: 'La visite des enfants',
      description: 'Vos enfants devenus grands viennent déjeuner le dimanche avec un gâteau de la bonne pâtisserie, et laissent discrètement une enveloppe derrière eux.',
      reason: 'Une enveloppe de chaque enfant',
    },
    'fr-sunset-sticky': {
      title: 'Doigts collants',
      description: 'Autour d’un bon cognac, vous convainquez le meneur du moment de vous céder sa plus belle histoire d’il y a des années.',
      reason: 'Une histoire change de mains',
    },
    'fr-sunset-last-title': {
      title: 'Un dernier titre',
      description: 'Une promotion de plus avant la retraite, si vous savez la décrocher. Lancez le dé et laissez ce dernier entretien trancher.',
      reason: 'Le dernier entretien de votre vie',
    },
    'fr-sunset-payday-2': {
      title: 'Jour de paie',
      description: 'Vous avez cessé de compter vos jours de paie il y a des années. Le 28, non.',
    },
    'fr-sunset-final-tax': {
      title: 'Dernier avis d’impôt',
      description: 'Une dernière lettre du fisc arrive juste avant votre départ définitif à la retraite.',
      reason: 'Dernier avis d’imposition',
    },
    'fr-sunset-ahead': {
      title: 'Le couchant approche',
      description: 'Les platanes de la vieille route défilent dans la lumière du soir — comme toujours, les soirs où vous étiez trop occupé pour les regarder.',
    },
    'fr-retirement': {
      title: 'Le pot de départ',
      description: 'Le dernier pot de départ de tous, une ultime traversée du bureau avec un carton, et votre premier lundi en quarante ans sans nulle part où aller. La retraite que vous avez passé une vie à défendre est enfin la vôtre.',
    },
  },

  lanes: {
    'The Great Schools': {
      name: 'Les grandes écoles',
      summary: 'Deux ans de prépa acharnée, un concours, et la facture de l’école qu’il vous ouvre — à payer en entier avant d’avoir gagné un seul euro. Ce que le diplôme achète, c’est une carrière qui monte presque toujours, et un réseau d’anciens pour la vie.',
    },
    'Straight to Work': {
      name: 'Direct au boulot',
      summary: 'Un CFA vous trouve un employeur pendant que les prépas révisent encore. Payé dès le premier jour, sans filet — et le haut de cette échelle paie plus que n’importe quel diplôme de cette table.',
    },
    'The Permanent Contract': {
      name: 'Le CDI',
      summary: 'Rester. Le CDI monte votre salaire à l’ancienneté, verse un treizième mois chaque décembre, et décide en échange où vous habitez.',
    },
    'Job-Hopper Alley': {
      name: 'La rupture conventionnelle',
      summary: 'Partir. Vous signez la rupture, prenez l’indemnité, et tirez un salaire tout neuf — formidable si le précédent était mauvais, risqué s’il ne l’était pas.',
    },
    'Family Lane': {
      name: 'Voie de la Famille',
      summary: 'Listes de fournitures, cours de musique et une maison bruyante, avec les allocations chaque mois et les enfants devenus grands qui reviennent déjeuner le dimanche. Moins de jours de paie, et chaque facture coûte plus cher.',
    },
    'The Executive Track': {
      name: 'Le statut cadre',
      summary: 'On cesse de vous payer vos heures supplémentaires, ce qui n’est pas la même chose que d’en faire moins. Les augmentations, les primes et le bureau d’angle sont réels — la vie que vous y avez laissée aussi.',
    },
    'Speculation Street': {
      name: 'Rue de la Spéculation',
      summary: 'Start-up, effet de levier, et un courtier aux boutons de manchette magnifiques. Si vous êtes derrière après l’achat de la maison, c’est la route pour revenir. Si vous êtes devant, réfléchissez à deux fois.',
    },
    'Prudence Street': {
      name: 'Rue de la Prudence',
      summary: 'Le livret d’épargne, la carte de fidélité, le vieux bas de laine au fond du tiroir. Personne ne s’est jamais enrichi ici — mais personne ne s’y est jamais ruiné non plus, ce qui compte beaucoup quand on est déjà en tête.',
    },
  },

  careers: {
    'career-fr-salon-apprentice': {
      title: 'Apprenti coiffeur',
      description: 'Balaie, fait les shampooings, et découvre que la conversation pendant la coupe fait la moitié du métier.',
    },
    'career-fr-stylist': {
      title: 'Coiffeur styliste',
      description: 'A son fauteuil, un carnet plein trois semaines à l’avance, et des habitués qui le suivraient à l’autre bout de la ville.',
    },
    'career-fr-salon-owner': {
      title: 'Patron de salon',
      description: 'Tient le salon de la place, où chaque coupe vient avec toutes les nouvelles du quartier.',
    },
    'career-fr-apprentice-baker': {
      title: 'Apprenti boulanger',
      description: 'Arrivé à quatre heures, parti à midi, et déjà meilleur au tourage du croissant que personne ne l’avoue à voix haute.',
    },
    'career-fr-village-baker': {
      title: 'Boulanger du village',
      description: 'La queue se forme avant que le rideau ne remonte, et la fermeture d’août s’annonce comme un événement national.',
    },
    'career-fr-master-baker': {
      title: 'Maître boulanger',
      description: 'Porte le col de Meilleur Ouvrier de France, et goûte encore chaque fournée avant qu’elle parte.',
    },
    'career-fr-commis-chef': {
      title: 'Commis de cuisine',
      description: 'Six feux, une ligne de bons de commande, et un service du midi qui décide de ce que vaut la semaine.',
    },
    'career-fr-crepe-stand-owner': {
      title: 'Patron de crêperie ambulante',
      description: 'Installe la crêpière à l’entrée du marché et transforme le samedi matin en petite fête. La file d’attente est le dé.',
    },
    'career-fr-bistro-owner': {
      title: 'Patron de bistrot',
      description: 'Quarante couverts, une ardoise, et un service du midi sur lequel toute la rue règle sa montre.',
    },
    'career-fr-site-labourer': {
      title: 'Manœuvre de chantier',
      description: 'Porte, creuse, gâche et soulève, et sait où se trouve réellement chaque outil du chantier.',
    },
    'career-fr-site-supervisor': {
      title: 'Chef de chantier',
      description: 'Mène le briefing du matin, la feuille de présence, et la dispute quotidienne avec les échafaudeurs.',
    },
    'career-fr-site-foreman': {
      title: 'Conducteur de travaux',
      description: 'Transforme des plans roulés en bâtiments qui passent toutes les visites de conformité, et chiffre le chantier correctement.',
    },
    'career-fr-delivery-courier': {
      title: 'Coursier livreur',
      description: 'Se faufile entre les pavés et les couloirs de bus pour nourrir et livrer tout le quartier. Décembre est le dé.',
    },
    'career-fr-depot-dispatcher': {
      title: 'Régulateur de dépôt',
      description: 'Descend du scooter et passe au tableau de répartition, où chaque camionnette du département a un nom.',
    },
    'career-fr-distribution-lead': {
      title: 'Responsable logistique',
      description: 'Déplace cent mille colis par nuit et rentre quand même dîner, ce qui dans ce pays relève de l’obligation professionnelle.',
    },
    'career-fr-apprentice-mechanic': {
      title: 'Apprenti mécanicien',
      description: 'Trois ans à tenir la lampe pour le patron, et le soupçon grandissant que les vieilles camionnettes comprennent chaque mot qu’il marmonne.',
    },
    'career-fr-scooter-mechanic': {
      title: 'Mécanicien deux-roues',
      description: 'Comprend de quoi un scooter de livraison se plaint avant que son pilote ait fini sa phrase.',
    },
    'career-fr-garage-owner': {
      title: 'Patron de garage',
      description: 'Quatre ponts, une liste d’attente en saison de contrôle technique, et un mur de photos d’anciennes arrivées sur plateau.',
    },
    'career-fr-session-musician': {
      title: 'Musicien de studio',
      description: 'Joue la ligne d’accordéon que tout le pays a fredonnée en mariage sans jamais voir la pochette, et attend près du téléphone entre deux séances.',
    },
    'career-fr-touring-player': {
      title: 'Musicien de tournée',
      description: 'Un été de scènes de festival, de la côte à la montagne, une caisse de vol, et un nom enfin imprimé en petit sur l’affiche.',
    },
    'career-fr-record-producer': {
      title: 'Producteur de disques',
      description: 'S’assoit derrière la vitre, dit « on la refait, mais avec plus de mélancolie », et a toujours raison, on ne sait pas comment.',
    },
    'career-fr-radio-runner': {
      title: 'Assistant de radio',
      description: 'Va chercher les express, fait signe aux invités, et apprend tranquillement comment se fabrique une matinale.',
    },
    'career-fr-morning-host': {
      title: 'Animateur de la matinale',
      description: 'La moitié des cuisines du pays a votre voix à sept heures et demie, et l’autre moitié a changé de station pour protester.',
    },
    'career-fr-station-owner': {
      title: 'Patron de station',
      description: 'Fait tourner onze émissions, en anime toujours une à l’aube, et vend les écrans publicitaires des douze.',
    },
    'career-fr-second-shooter': {
      title: 'Second photographe',
      description: 'Couvre le fond de la salle des mariages et l’instant exact où l’adjoint au maire perd sa ligne dans le registre.',
    },
    'career-fr-wedding-photographer': {
      title: 'Photographe de mariage',
      description: 'Juin est pris deux ans à l’avance et janvier est un silence — l’agenda est le dé, et la saison des châteaux décide de l’année.',
    },
    'career-fr-lettings-negotiator': {
      title: 'Négociateur en location',
      description: 'Fait visiter onze appartements par samedi, et se souvient du dossier auquel il manquait la page du garant.',
    },
    'career-fr-estate-agent': {
      title: 'Agent immobilier',
      description: 'Vend d’abord la cuisine, ensuite les volets, et jamais le diagnostic énergétique.',
    },
    'career-fr-agency-owner': {
      title: 'Patron d’agence',
      description: 'Votre nom est sur les panneaux devant quatre cents maisons. Une bonne année en porte trois calmes.',
    },
    'career-fr-warehouse-picker': {
      title: 'Préparateur de commandes',
      description: 'Marche dix-huit kilomètres par service devant le même bras robotisé, et retrouverait l’allée quarante dans le noir.',
    },
    'career-fr-warehouse-lead': {
      title: 'Chef d’entrepôt',
      description: 'Fait tourner un bâtiment grand comme quatre terrains de foot avec du café de distributeur et des porte-blocs.',
    },
    'career-fr-grooming-assistant': {
      title: 'Assistant toiletteur',
      description: 'Des serviettes, des friandises, et le sang-froid de ne pas bouger pendant qu’un tout petit chien très affirmé se fait un avis sur vous.',
    },
    'career-fr-dog-groomer': {
      title: 'Toiletteur canin',
      description: 'Donne aux chiens de terrasse de tout le quartier leur coupe mensuelle, et se fait saluer par son prénom à chaque café.',
    },
    'career-fr-village-coach': {
      title: 'Entraîneur du club du village',
      description: 'Mène les entraînements du samedi sur le terrain municipal, trace les lignes lui-même, et connaît chaque prénom. Il n’y a pas de promotion là-dedans, et il n’y en a jamais eu.',
    },
    'career-fr-market-gardener': {
      title: 'Maraîcher',
      description: 'Fait pousser les tomates pour lesquelles tout le marché du dimanche fait la queue dès huit heures, et a refusé trois fois les acheteurs de la grande distribution, chaque fois plus poliment.',
    },
    'career-fr-surgical-resident': {
      title: 'Interne en chirurgie',
      description: 'Six ans de gardes au CHU, d’écarteurs tenus, et la question permanente : que ferait le professeur, ensuite ?',
    },
    'career-fr-hospital-surgeon': {
      title: 'Chirurgien hospitalier',
      description: 'Sauve des vies avec des mains sûres, des nerfs plus sûrs encore, et une pause déjeuner que personne n’a le droit d’interrompre.',
    },
    'career-fr-junior-associate': {
      title: 'Collaborateur junior',
      description: 'Lit neuf cents pages pour qu’un associé puisse lire le seul paragraphe qui compte, dans un cabinet derrière les grands boulevards.',
    },
    'career-fr-corporate-lawyer': {
      title: 'Avocat d’affaires',
      description: 'Gagne les batailles de conseil d’administration avec une belle mallette, un argument plus tranchant encore, et un déjeuner de deux heures qui conclut l’affaire.',
    },
    'career-fr-architectural-assistant': {
      title: 'Assistant d’architecte',
      description: 'Dessine onze fois le détail d’escalier d’un bâtiment classé auquel personne n’a le droit de toucher, et apprend plus de la onzième que des dix premières.',
    },
    'career-fr-architect': {
      title: 'Architecte',
      description: 'Glisse du verre et de l’acier entre des façades protégées, et se bat avec les Bâtiments de France comme si c’était un second emploi à plein temps.',
    },
    'career-fr-junior-engineer': {
      title: 'Ingénieur débutant',
      description: 'Corrige le petit bug dont personne ne voulait, et trouve le gros en chemin, titre estampillé par une école d’ingénieurs.',
    },
    'career-fr-software-engineer': {
      title: 'Ingénieur logiciel',
      description: 'Écrit le code discret qui fait tourner la moitié des trains, les péages, et la file de billetterie d’un musée très célèbre.',
    },
    'career-fr-junior-designer': {
      title: 'Game designer junior',
      description: 'Équilibre le niveau du tutoriel pendant quatre mois au studio de Montpellier, puis regarde des inconnus en venir à bout sans lire un mot.',
    },
    'career-fr-game-designer': {
      title: 'Game designer',
      description: 'Construit des mondes que la planète entière explore bien trop tard dans la nuit, depuis un studio au-dessus d’une très bonne boulangerie.',
    },
    'career-fr-aerospace-graduate': {
      title: 'Diplômé en aéronautique',
      description: 'Passe un an à Toulouse à faire perdre quarante grammes à une nervure d’aile, et considère l’année bien employée.',
    },
    'career-fr-aerospace-engineer': {
      title: 'Ingénieur aéronautique',
      description: 'Construit les ailes sur lesquelles vole la moitié du monde, et les montre du doigt depuis le hublot à chaque fois.',
    },
    'career-fr-investment-analyst': {
      title: 'Analyste financier',
      description: 'Monte le tableur sur lequel toute la salle se dispute, depuis une tour du quartier d’affaires, et a raison sur la moitié.',
    },
    'career-fr-fund-manager': {
      title: 'Gérant de fonds',
      description: 'Déplace l’argent des autres sur un écran avec vue sur l’arche, et a raison un peu plus souvent que le contraire.',
    },
    'career-fr-ministry-attache': {
      title: 'Attaché ministériel',
      description: 'Réussit le concours et entre dans la fonction publique pour la vie. L’État, contrairement à tout le monde sur ce plateau, ne licencie pas.',
    },
    'career-fr-ministry-section-head': {
      title: 'Chef de bureau',
      description: 'Rédige les réponses qu’un ministre lira à voix haute à sept heures le lendemain matin, depuis un bureau à moulures d’origine et sans budget de chauffage.',
    },
    'career-fr-research-assistant': {
      title: 'Assistant de recherche',
      description: 'Compte des choses dans l’Atlantique froid pour l’article de quelqu’un d’autre, et adore chaque minute.',
    },
    'career-fr-marine-biologist': {
      title: 'Biologiste marin',
      description: 'Étudie la côte bretonne depuis une station que la marée coupe du monde deux fois par jour, ce qui convient très bien à tout le monde là-bas.',
    },
    'career-fr-jobbing-writer': {
      title: 'Rédacteur à la pige',
      description: 'De la publicité, des catalogues et une chronique tous les quinze jours, pendant que le vrai texte attend septembre dans un tiroir.',
    },
    'career-fr-novelist': {
      title: 'Romancier',
      description: 'Publié enfin, en même temps que six cents autres nouveautés du même automne. Les droits d’auteur tiennent du dé, et le fait qu’on vous remarque, à peu près aussi.',
    },
    'career-fr-veterinarian': {
      title: 'Vétérinaire',
      description: 'Rassure les maîtres inquiets tout en réduisant tranquillement une toute petite fracture. Ne dirigerait une chaîne de cliniques pour aucune somme imaginable.',
    },
    'career-fr-university-professor': {
      title: 'Professeur d’université',
      description: 'Donne cours le mardi, se dispute avec ses collègues le mercredi, fait changer les avis d’ici vendredi, et a refusé deux fois le décanat.',
    },
  },

  houses: {
    'house-fr-village-cottage': {
      name: 'Maison de village en pierre',
      description: 'Des murs épais, un puits, et un village qui attendait tranquillement que quelqu’un l’aime. Les frais de notaire représentent une part étonnante du total.',
    },
    'house-fr-suburban-pavilion': {
      name: 'Pavillon de banlieue',
      description: 'Une petite maison bien tenue derrière un petit portail bien tenu, avec un nain que les anciens propriétaires ont juré qu’il restait.',
    },
    'house-fr-terraced-townhouse': {
      name: 'Maison de ville mitoyenne',
      description: 'Deux étages, des volets peints, et des voisins qui ont un avis sur la fréquence à laquelle vous les repeignez.',
    },
    'house-fr-converted-atelier': {
      name: 'Atelier réhabilité',
      description: 'Un ancien atelier de meubles avec la lumière du nord que l’agent a mentionnée onze fois, et un radiateur particulièrement bruyant.',
    },
    'house-fr-modern-duplex': {
      name: 'Duplex moderne',
      description: 'Des lignes nettes, une terrasse sur le toit, et juste assez de place pour louer un étage à un étudiant qui joue très bien du violoncelle.',
    },
    'house-fr-riverside-longhouse': {
      name: 'Longère au bord de l’eau',
      description: 'Une longue ferme basse dans la boucle de la rivière, des hérons à l’aube, et une cave que l’ancien propriétaire a laissée mystérieusement pleine.',
    },
    'house-fr-country-manor': {
      name: 'Manoir de campagne',
      description: 'Des grilles, une cour de gravier, et une salle à manger bâtie pour des discussions qui durent jusqu’à deux heures du matin et ne règlent rien.',
    },
    'house-fr-clifftop-villa': {
      name: 'Villa sur la falaise',
      description: 'Du verre sur trois côtés, la mer en contrebas, et une route côtière escarpée dont les invités se plaignent avec plaisir.',
    },
    'house-fr-haussmann-top-floor': {
      name: 'Dernier étage haussmannien',
      description: 'Tout le dernier étage d’un immeuble en pierre de taille, balcons en fer forgé, parquet en point de Hongrie, et une ville qui ressemble la nuit à des bijoux renversés.',
    },
  },

  stocks: {
    'stock-fr-toll-roads': {
      name: 'Union des Autoroutes à Péage',
      description: 'Chaque mois d’août, le pays entier descend vers le sud à travers ses caisses enregistreuses. Voilà tout l’argumentaire, et il ne rate jamais.',
    },
    'stock-fr-grid-power': {
      name: 'Hexagone Énergie & Réseau',
      description: 'Cinquante-six réacteurs qui ronronnent le long des fleuves, et versent un dividende ennuyeux et magnifique.',
    },
    'stock-fr-cinema': {
      name: 'Films Nouvelle Vague',
      description: 'À un prix de festival de la gloire, à un noir et blanc de trois heures du bac à soldes. Personne ne sait lequel.',
    },
    'stock-fr-vineyards': {
      name: 'Vignobles Grand Cru',
      description: 'Des coteaux qui font du vin depuis huit siècles — tant que le gel d’avril et la mode se tiennent bien.',
    },
    'stock-fr-rocket-lines': {
      name: 'Lignes Spatiales Équatoriales',
      description: 'Des fusées cargo depuis un pas de tir en pleine jungle, montées au plus juste. Soit l’avenir du transport, soit un feu d’artifice très cher.',
    },
  },

  lifeTiles: {
    'tile-fr-paris-marathon': { title: 'Couru le marathon de Paris' },
    'tile-fr-autumn-novel': { title: 'Publié un roman de rentrée' },
    'tile-fr-refuge-dog': { title: 'Adopté un chien de refuge' },
    'tile-fr-biarritz-surf': { title: 'Appris à surfer à Biarritz' },
    'tile-fr-allotment': { title: 'Tenu un potager primé' },
    'tile-fr-cassoulet': { title: 'Gagné le concours de cassoulet' },
    'tile-fr-pilgrim-road': { title: 'Fait le chemin depuis Le Puy' },
    'tile-fr-chanson-album': { title: 'Sorti un album de chanson' },
    'tile-fr-plane-treehouse': { title: 'Bâti une cabane dans le platane' },
    'tile-fr-cheese-blog': { title: 'Votre blog fromage est devenu viral' },
    'tile-fr-alpine-triathlon': { title: 'Terminé le triathlon des Alpes' },
    'tile-fr-animal-refuge': { title: 'Bénévole au refuge animalier' },
    'tile-fr-crepe-stand': { title: 'Tenu le stand de crêpes de la kermesse' },
    'tile-fr-canal-mural': { title: 'Peint une fresque au bord du canal' },
    'tile-fr-glider-licence': { title: 'Obtenu le brevet de pilote de planeur' },
    'tile-fr-hit-podcast': { title: 'Votre podcast en tête des classements' },
    'tile-fr-corkscrew-patent': { title: 'Breveté un meilleur tire-bouchon' },
    'tile-fr-petanque': { title: 'Gagné le concours de pétanque' },
    'tile-fr-rooftop-kitten': { title: 'Sauvé un chaton sur les toits' },
    'tile-fr-mont-blanc': { title: 'Gravi le mont Blanc à l’aube' },
    'tile-fr-market-pottery': { title: 'Vendu vos poteries au marché' },
    'tile-fr-minis-coach': { title: 'Entraîné les moins de neuf ans' },
    'tile-fr-national-jingle': { title: 'Écrit un jingle que tout le pays fredonne' },
    'tile-fr-prize-pumpkin': { title: 'Fait pousser un potiron primé' },
    'tile-fr-startup-backer': { title: 'Financé la start-up parisienne d’un ami' },
    'tile-fr-barn-find': { title: 'Restauré un cabriolet trouvé dans une grange' },
    'tile-fr-street-dinner': { title: 'Organisé le repas de toute la rue' },
    'tile-fr-baguette-prize': { title: 'Fait la meilleure baguette du département' },
    'tile-fr-brittany-sail': { title: 'Longé toute la côte bretonne à la voile' },
    'tile-fr-village-square': { title: 'Redessiné la place du village' },
    'tile-fr-fostered-litter': { title: 'Accueilli toute une portée' },
    'tile-fr-attic-sale': { title: 'Tenu le vide-grenier du village' },
    'tile-fr-cooking-class': { title: 'Donné un cours de cuisine complet' },
    'tile-fr-corsica-trail': { title: 'Parcouru le grand sentier corse' },
    'tile-fr-village-cinema': { title: 'Restauré le vieux cinéma du village' },
    'tile-fr-rose-name': { title: 'Une rose porte votre nom' },
  },

  economy: {
    tuitionNotes: [
      'La facture arrive avec des frais de dossier surprise dont personne n’a parlé aux portes ouvertes, et ils ne sont pas petits.',
      'La facture de la grande école correspond exactement au montant annoncé dans la brochure.',
      'Une bourse sur critères sociaux couvre une plus grosse part de la facture que prévu.',
      'Exonération totale — l’école efface tout, et vos parents n’y croient pas vraiment.',
    ],
    marriage: {
      rescued: 'Oui à la deuxième tentative — et l’installation se fait avec une voiture en leasing, une amende impayée d’un radar près de Limoges, et une attitude très détendue vis-à-vis des deux.',
      outcomes: [
        'Le mariage au château a pris le large : le chapiteau, le quatrième service du traiteur, et les deux familles qui commandent le bon champagne.',
        'Dix minutes à la mairie sous le portrait de la République, puis un long dîner pour quarante. Un discours touche, et les enveloppes ont tout couvert.',
        'Deux salaires sous le même toit, et le loyer en ville a soudain l’air deux fois plus petit.',
        'Tout le village débarque, chacun est généreux, et il se trouve que votre conjoint détient un livret d’épargne intact depuis sa communion.',
      ],
    },
  },
}
