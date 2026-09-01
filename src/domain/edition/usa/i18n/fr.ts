import type { EditionTranslation } from '../../i18n/types'

/**
 * The USA edition in French.
 *
 * Vouvoiement throughout, present tense, short sentences — the register a
 * French family board game actually prints, rather than the heavier literary
 * French a translation drifts into. Typographic apostrophes (’) and guillemets
 * (« ») are used because this is French text and that is how French is set;
 * they also keep every string free of escaped quotes.
 *
 * The country is not localised: this is still the American board, so the money
 * is still dollars and the recruiters still line a campus quad. Only the prose
 * changes.
 */
export const USA_FR: EditionTranslation = {
  locale: 'fr',
  editionId: 'usa',

  spaces: {
    start: {
      title: 'Début de la vie',
      description: 'Le portefeuille est léger, l’avenir grand ouvert. Le voyage commence ici.',
    },
    'college-1': {
      title: 'Emménagement',
      description: 'Vous montez vos cartons dans une chambre de cité U minuscule et vous appelez ça chez vous.',
      harsher: {
        description: 'Vous montez vos cartons dans une chambre minuscule, et le bureau des résidences réclame une caution au passage.',
        reason: 'Caution de la résidence',
      },
    },
    'college-2': {
      title: 'Frais de scolarité',
      description: 'Le service des inscriptions envoie une facture d’une hauteur stupéfiante, et personne ne s’inscrit tant qu’elle n’est pas payée.',
      reason: 'Frais de scolarité',
    },
    'college-4': {
      title: 'Job sur le campus',
      description: 'Un petit boulot à la bibliothèque devient de vraies heures et une paie franchement utile.',
      reason: 'Paie du job étudiant',
    },
    'college-overdraft': {
      title: 'Frais de découvert',
      description: 'Le compte passe sous zéro pendant une seule journée, et la banque le remarque avant vous.',
      reason: 'Agios',
    },
    'college-6': {
      title: 'Bourse obtenue',
      description: 'Votre dissertation décroche une bourse que personne n’attendait, et elle couvre une bonne partie de la facture.',
      reason: 'Montant de la bourse',
    },
    'college-7': {
      title: 'Semaine d’examens',
      description: 'Cinq épreuves en quatre jours. Vous survivez aux nouilles instantanées.',
      harsher: {
        description: 'Cinq épreuves en quatre jours, et un prof particulier engagé dans la panique pour celle qui vous terrifie.',
        reason: 'Cours particuliers en urgence',
      },
    },
    'college-8': {
      title: 'Remise du diplôme',
      description: 'Vous enfilez la toge et la toque : officiellement diplômé.',
    },
    'college-9': {
      title: 'On plie bagage',
      description: 'Vous videz la chambre et rendez la clé, avec un carton de manuels de moins que vous ne l’espériez.',
    },
    'grad-fair': {
      title: 'Forum des diplômés',
      description: 'Les recruteurs s’alignent sur le campus, impatients d’embaucher de jeunes diplômés comme vous.',
    },
    'first-job-fair': {
      title: 'Premier forum emploi',
      description: 'Les entreprises du coin installent leurs stands, en quête de nouveaux talents affamés — et vous êtes embauché avant vendredi.',
    },
    'work-1': {
      title: 'Première paie',
      description: 'Votre toute première paie tombe et elle paraît énorme.',
      reason: 'Première paie',
    },
    'work-payday-1': {
      title: 'Jour de paie',
      description: 'Un mois complet au compteur, et le virement tombe pendant que vos amis défont encore leurs cartons en cité U.',
      harsher: {
        title: 'Paie décalée',
        description: 'Personne n’avait précisé que le premier mois est payé avec un mois de retard, et le frigo s’en moque.',
        reason: 'Un mois à vivre de rien',
      },
    },
    'work-2': {
      title: 'Premier appartement',
      description: 'Vous gagnez votre vie, donc on vous imagine logé : une caution, un mois d’avance, et un lit que vous montez vous-même.',
      reason: 'Caution et premier mois',
    },
    'work-first-night': {
      title: 'Première nuit',
      description: 'Vous déballez à la lumière d’une lampe, parce que le plafonnier attend toujours son ampoule.',
    },
    'work-uniform': {
      title: 'Caution d’uniforme',
      description: 'Deux chemises, un badge, et une caution que vous ne reverrez jamais, vous le sentez bien.',
      reason: 'Caution de l’uniforme',
    },
    'work-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois, encore un virement, et toujours personne pour demander un diplôme.',
      harsher: {
        title: 'Heures rabotées',
        description: 'Le planning est affiché le dimanche, avec votre nom sur deux fois moins de créneaux que la semaine passée.',
        reason: 'Un demi-mois de créneaux',
      },
    },
    'work-payday-3': {
      title: 'Jour de paie',
      description: 'Trois mois plus tard, les virements ont cessé d’être une surprise.',
    },
    'main-early-review': {
      title: 'Bilan d’essai',
      description: 'Six mois plus tard, quelqu’un s’assoit avec un formulaire et vous demande comment ça se passe, selon vous. Lancez le dé.',
      reason: 'La fin de la période d’essai',
    },
    'grad-1': {
      title: 'Frais de doctorat',
      description: 'Inscription, frais de laboratoire et quatre ans de loyer à trouver, sans salaire derrière. La lettre de financement décide de la part qui vous revient.',
      reason: 'Frais de doctorat',
    },
    'grad-2': {
      title: 'Nuits au labo',
      description: 'Le bâtiment se vide à dix-huit heures et vous y êtes encore à une heure du matin, et vous ne voudriez être nulle part ailleurs.',
      harsher: {
        description: 'Le bâtiment se vide à dix-huit heures et vous y êtes encore à une heure du matin — et la troisième reconstruction du montage sort de votre poche.',
        reason: 'Reconstruction du montage',
      },
    },
    'grad-3': {
      title: 'Bourse d’enseignement',
      description: 'Deux séminaires par semaine, quarante étudiants de première année, et un petit chèque qui arrive le dernier vendredi du mois.',
      reason: 'Bourse d’enseignement',
    },
    'grad-4': {
      title: 'Bourse de recherche',
      description: 'Le projet que vous avez réécrit deux fois est financé à la troisième tentative, et le jury le dit par écrit.',
      reason: 'Bourse de recherche',
    },
    'grad-5': {
      title: 'La soutenance',
      description: 'Trois heures dans une petite salle avec les gens qui connaissent le mieux le domaine, et au bout ils vous appellent docteur.',
    },
    'grad-6': {
      title: 'La nomination',
      description: 'La lettre arrive sur papier, avec un titre qui a pris dix ans et qui est à vous pour de bon.',
      reason: 'Le travail qu’ouvre un doctorat',
    },
    'stay-1': {
      title: 'Année tranquille',
      description: 'Pas de drame, pas de bouleversement, et une compétence tranquille sur laquelle on a commencé à compter.',
    },
    'stay-payday': {
      title: 'Jour de paie',
      description: 'Un virement tombe pendant qu’une connaissance remplit un dossier de financement.',
    },
    'stay-3': {
      title: 'Cours du soir',
      description: 'Un soir par semaine, aucun doctorat au bout, et une attestation qui s’avère tout de même utile.',
      reason: 'Frais de cours du soir',
    },
    'main-bank': {
      title: 'Passage à la banque',
      description: 'Le conseiller fait glisser un café sur le bureau et demande où en est votre argent.',
    },
    'main-insurance': {
      title: 'Agence d’assurance',
      description: 'Un courtier en gilet vous explique, chaleureusement et longuement, tout ce qui pourrait mal tourner.',
    },
    'main-6': {
      title: 'Jour de paie',
      description: 'Le virement arrive : la meilleure notification de la semaine.',
    },
    'main-stock-tip': {
      title: 'Tuyau boursier',
      description: 'Un ami ne jure que par une valeur lue quelque part. La banque ferme à dix-huit heures.',
    },
    'main-fender-bender': {
      title: 'Petit accrochage',
      description: 'Quelqu’un touche votre pare-chocs sur le parking, et le devis arrive par mail dans l’après-midi.',
      reason: 'Facture de carrosserie',
    },
    'main-pileup': {
      title: 'Carambolage',
      description: 'Du brouillard, des feux stop, et quatre voitures encastrées sur la bretelle d’accès. Tout le monde repart à pied ; les factures, non.',
      reason: 'Réparations du carambolage',
    },
    'main-dentist': {
      title: 'Note du dentiste',
      description: 'Un plombage, un sermon sur le fil dentaire, et une facture qui pique nettement plus que la fraise.',
      reason: 'Soins dentaires',
    },
    'main-9': {
      title: 'Belle trouvaille',
      description: 'Vous tombez sur une petite histoire qui mérite d’être racontée.',
    },
    'main-crossroads': {
      title: 'Cinq ans de boîte',
      description: 'Cinq ans au même bureau, et le mail d’un chasseur de têtes que vous n’avez toujours pas supprimé. La route se sépare ici.',
    },
    'ladder-raise': {
      title: 'Ancienneté',
      description: 'Personne n’a quitté ce service depuis dix ans, alors le poste au-dessus ne se libère que le jour où quelqu’un s’en va enfin. Lancez le dé pour savoir si c’était cette année.',
      reason: 'Le poste au-dessus s’est libéré',
    },
    'hopper-lookout': {
      title: 'Recherche discrète',
      description: 'Vous actualisez votre CV à la pause déjeuner et prenez des appels que personne au bureau ne peut entendre.',
    },
    'hopper-move': {
      title: 'Fixez votre prix',
      description: 'Vous posez votre démission avec l’offre suivante déjà signée, et le nouveau titre arrive avec un nouveau chiffre.',
      reason: 'Vous avez fixé votre prix ailleurs',
    },
    'hopper-bonus': {
      title: 'Prime d’arrivée',
      description: 'La nouvelle boîte rachète votre préavis, et le chèque tombe comme une paie entière en plus.',
    },
    'main-review': {
      title: 'L’entretien annuel',
      description: 'Une petite salle, deux personnes avec votre dossier ouvert devant elles, et une seule question : êtes-vous prêt pour le poste au-dessus ? Lancez le dé et écoutez la réponse.',
      reason: 'Votre entretien est arrivé',
    },
    'main-tax-audit': {
      title: 'Contrôle fiscal',
      description: 'Une lettre polie, un long après-midi avec une boîte à chaussures pleine de reçus, et un chiffre tout en bas.',
      reason: 'Redressement fiscal',
    },
    'main-hours-cut': {
      title: 'Fin de contrat',
      description: 'Le contrat dont tout le monde était sûr qu’il serait renouvelé n’est, très discrètement, pas renouvelé.',
      reason: 'Contrat non renouvelé',
    },
    'main-layoff': {
      title: 'Licenciement',
      description: 'Tout l’étage est convoqué dans une même réunion, et ensuite votre badge ne fonctionne plus.',
      reason: 'Licencié',
    },
    'main-career-fair': {
      title: 'Forum de l’emploi',
      description: 'Un hall plein de stands, des stylos gratuits, et deux offres entre lesquelles il faut trancher.',
      reason: 'Un nouveau départ au forum de l’emploi',
    },
    'main-gifts': {
      title: 'Cadeaux de Noël',
      description: 'Un cadeau pour chaque personne autour de la table, choisi avec plus d’attention que de budget. Au dîner, quelqu’un mentionne qu’il reprend ses études, et la route bifurque ici.',
      reason: 'Un cadeau pour chacun',
    },
    marriage: {
      title: 'Jour du mariage',
      description: 'Les vœux sont échangés, les larmes coulent, et c’est officiel : vous êtes marié !',
    },
    'family-1': {
      title: 'La chambre du bébé',
      description: 'Vous peignez la chambre d’un jaune joyeux et montez un berceau à minuit.',
      reason: 'Aménagement de la chambre',
    },
    'family-2': {
      title: 'Naissance',
      description: 'Un tout petit colocataire arrive, et plus rien ne sera jamais calme.',
    },
    'family-childcare': {
      title: 'Frais de crèche',
      description: 'Crèche à temps plein pour chaque petite personne de la maison, et un total mensuel que vous relisez deux fois.',
      reason: 'Crèche, par enfant',
    },
    'family-school-fees': {
      title: 'Frais d’école',
      description: 'Uniformes, sorties, et une flûte à bec chacun. Les factures arrivent ensemble, évidemment.',
      reason: 'Frais scolaires, par enfant',
    },
    'family-4': {
      title: 'Spectacle de l’école',
      description: 'Votre enfant tient le rôle principal à la perfection et vous pleurez au troisième rang.',
    },
    'family-6': {
      title: 'Des jumeaux',
      description: 'L’échographiste se tait, tourne l’écran vers vous, et en montre deux.',
    },
    'fast-3': {
      title: 'Jour de paie',
      description: 'Les heures supplémentaires apparaissent enfin sur la fiche de paie.',
    },
    'fast-headhunted': {
      title: 'L’année écoulée',
      description: 'Douze mois de départs à l’aube et de trains du soir, et un chiffre au bout que personne dans l’immeuble n’aurait prédit en janvier.',
      reason: 'Une année de longues journées, et ce qu’elles ont rapporté.',
    },
    'fast-burnout': {
      title: 'Arrêt pour burn-out',
      description: 'Six semaines d’arrêt, et la paie est nettement plus légère le jour où vous repassez la porte.',
      reason: 'Congé sans solde',
    },
    'fast-payday-severance': {
      title: 'Paie de fin d’année',
      description: 'L’année s’achève, et ce que ce poste paie tombe une dernière fois avant que tout change encore.',
    },
    'fast-restructure': {
      title: 'La réorganisation',
      description: 'L’entreprise est démontée puis remontée du jour au lendemain. Votre nom est toujours sur la même porte, et plus rien d’autre de l’année ne se ressemble.',
      reason: 'Une année que personne en haut n’avait prévue.',
    },
    'fast-trading-floor': {
      title: 'Salle des marchés',
      description: 'Vous avez hâte de dépenser votre prime, et la salle des marchés crie encore.',
    },
    'fast-6': {
      title: 'Jour de paie',
      description: 'Encore deux semaines de passées, encore un virement qui rentre.',
      harsher: {
        title: 'Prime reprise',
        description: 'La prime de l’an dernier est réexaminée par quelqu’un dans un autre bâtiment, et le nouveau chiffre est plus bas.',
        reason: 'Prime reprise',
      },
    },
    'fast-payday-3': {
      title: 'Contre-offre',
      description: 'Vous glissez, l’air de rien, que quelqu’un d’autre vous a contacté. La contre-offre arrive avant midi.',
    },
    'midtown-trading-floor': {
      title: 'Salle des marchés',
      description: 'Des écrans partout, tout le monde qui crie, et un courtier qui jure que celle-ci est différente.',
    },
    'midtown-insurance': {
      title: 'Agence d’assurance',
      description: 'Avant qu’on vous confie un trousseau de clés, quelqu’un aimerait vous parler garanties.',
    },
    'midtown-payday': {
      title: 'Jour de paie',
      description: 'Un virement tombe la semaine même où l’apport pour la maison est dû.',
    },
    'midtown-party': {
      title: 'Compte joint',
      description: 'Vous fusionnez les comptes, et pour la première fois les dépenses de quelqu’un d’autre sont aussi, inévitablement, les vôtres.',
      reason: 'Le compte joint, soldé',
    },
    'midtown-bonus': {
      title: 'Prime de fin d’année',
      description: 'La prime de fin d’année tombe, calibrée sur ce que vous gagnez plutôt que sur ce qu’on vous avait promis, et chacun repart avec un chiffre différent.',
    },
    'midtown-raise': {
      title: 'Augmentation',
      description: 'Un mot discret, un nouveau chiffre, et une poignée de main en sortant de la pièce.',
    },
    'midtown-rate-rise': {
      title: 'Hausse des taux',
      description: 'Le taux part du mauvais côté un jeudi matin, et toutes les mensualités le suivent.',
      reason: 'Les taux partent du mauvais côté',
    },
    'home-buying': {
      title: 'Visites immobilières',
      description: 'Vous enchaînez les visites tout le week-end, en installant déjà les meubles dans votre tête.',
    },
    'risky-1': {
      title: 'Pari sur une start-up',
      description: 'Vous versez vos économies dans la start-up d’un ami et lancez le dé pour voir ce qui revient.',
      reason: 'Retour sur investissement',
    },
    'risky-2': {
      title: 'Mauvais tuyau',
      description: 'Votre « valeur sûre » perd l’essentiel de sa valeur en une semaine, et vous invitez toute la table à dîner pour vous faire pardonner.',
      reason: 'Mauvais tuyau boursier',
    },
    'risky-3': {
      title: 'Soirée poker',
      description: 'La chance reste de votre côté toute la nuit.',
      reason: 'Gains au poker',
    },
    'risky-5': {
      title: 'Krach boursier',
      description: 'Le marché plonge et votre portefeuille grimace.',
      reason: 'Krach boursier',
    },
    'risky-aftershock': {
      title: 'Réplique',
      description: 'Le marché trouve un plancher plus bas que personne ne le croyait possible, et il le trouve en un seul après-midi.',
      reason: 'Le marché rechute',
    },
    'risky-6': {
      title: 'Ticket de loterie',
      description: 'Un ticket à un dollar, un grattage chanceux, et un lancer de dé pour le montant.',
      reason: 'Ticket à gratter',
    },
    'risky-payday': {
      title: 'Jour de paie',
      description: 'Une paie tombe pendant que vos placements font n’importe quoi.',
    },
    'risky-swap': {
      title: 'Échange de fortunes',
      description: 'Une poignée de main, une signature, et vous échangez votre solde bancaire avec celui du meneur.',
      reason: 'Un accord avec le meneur',
    },
    'safe-1': {
      title: 'Chasse aux bons',
      description: 'Votre pile de bons de réduction paie vraiment à la caisse.',
      reason: 'Économies de bons de réduction',
    },
    'safe-payday': {
      title: 'Jour de paie',
      description: 'Le virement arrive le jour où il arrive toujours.',
      harsher: {
        title: 'Salaire retenu',
        description: 'Une cellule dans un tableur quelque part fait que le salaire de ce mois-ci arrivera le mois prochain.',
        reason: 'Un mois de salaire retenu',
      },
    },
    'safe-excess': {
      title: 'Franchise d’assurance',
      description: 'Même la route prudente a son formulaire de sinistre, et la franchise reste toujours à votre charge.',
      reason: 'Franchise d’assurance',
    },
    'safe-3': {
      title: 'Budget tenu',
      description: 'Pour une fois, vous tenez le budget, et c’est étonnamment agréable.',
      reason: 'Économies sur le budget',
    },
    'safe-7': {
      title: 'Remboursement',
      description: 'Un remboursement d’impôts arrive pile au moment où vous aviez oublié de l’attendre.',
      reason: 'Remboursement d’impôts',
    },
    'safe-8': {
      title: 'Épargne tranquille',
      description: 'Rien de spectaculaire : votre tirelire grossit tranquillement.',
      reason: 'Épargne tranquille',
    },
    'safe-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un virement, encore une semaine tranquille. C’est tout l’intérêt.',
    },
    'safe-dividend': {
      title: 'Jour de dividende',
      description: 'La moitié sage de votre portefeuille verse son sage petit chèque.',
      reason: 'Dividende trimestriel',
    },
    'sunset-number': {
      title: 'Le chiffre',
      description: 'Quelqu’un calcule au dos d’une enveloppe ce qu’il vous faudrait exactement pour ne plus jamais travailler — et le chiffre se révèle bien plus petit que vous ne le craigniez.',
    },
    'sunset-upgrade': {
      title: 'Maison plus grande',
      description: 'L’agent appelle pour quelque chose de plus grand, de plus lumineux, et tout juste à portée.',
    },
    'sunset-fire': {
      title: 'Incendie',
      description: 'Une poêle, un torchon, et une cuisine à refaire depuis le carrelage.',
      reason: 'Dégâts d’incendie',
    },
    'sunset-care': {
      title: 'Frais de dépendance',
      description: 'Quelqu’un que vous aimez a besoin d’être accompagné, et vous refuseriez d’y mettre un prix. La facture, elle, en met un.',
      reason: 'Aider un proche',
    },
    'sunset-2': {
      title: 'Jour de paie',
      description: 'L’une de vos toutes dernières paies tombe.',
    },
    'sunset-swap': {
      title: 'Échange de fortunes',
      description: 'Un dernier échange audacieux, et le meneur regarde sa fortune partir avec vous.',
      reason: 'L’échange de la dernière heure',
    },
    'sunset-benefit': {
      title: 'Aide des enfants',
      description: 'Chaque enfant devenu grand met au pot pour la retraite, et le total compte.',
      reason: 'Un cadeau de chaque enfant',
    },
    'sunset-sticky': {
      title: 'Doigts collants',
      description: 'Vous entreprenez de convaincre le meneur de vous céder sa plus belle histoire.',
      reason: 'Une histoire change de mains',
    },
    'sunset-handshake': {
      title: 'Dernière promotion',
      description: 'Un dernier titre avant la porte, si on se laisse convaincre. Lancez le dé et laissez le dernier entretien de votre vie trancher.',
      reason: 'Le dernier entretien de votre vie',
    },
    'sunset-payday-2': {
      title: 'Jour de paie',
      description: 'Vous avez perdu le compte, mais pas le virement.',
    },
    'sunset-tax': {
      title: 'Dernier avis d’impôt',
      description: 'Une dernière enveloppe brune arrive avant que la porte du bureau se referme définitivement derrière vous.',
      reason: 'Dernier avis d’imposition',
    },
    'sunset-3': {
      title: 'La dernière année',
      description: 'Une année de plus du métier que vous avez fait toute votre vie, puis vous rendez les clés. Tout le monde veut savoir comment elle s’est passée.',
      reason: 'La dernière année du métier.',
    },
    retirement: {
      title: 'Retraite',
      description: 'Vous fermez la porte du bureau pour la dernière fois et entrez dans la retraite.',
    },
  },

  lanes: {
    'College Lane': {
      name: 'Filière Études',
      summary: 'Payez quatre ans maintenant et soyez payé correctement pendant quarante. La facture est due d’avance, en entier, avant d’avoir gagné le moindre centime — et le salaire qu’elle achète est fiable plutôt qu’énorme.',
    },
    'Straight to Work': {
      name: 'Direct au boulot',
      summary: 'Gagner sa vie dès vendredi pendant que les autres défont encore leurs cartons. Pas de frais de scolarité, pas de filet, et une échelle de métier dont le premier barreau est rude et le dernier bat n’importe quel diplômé de cette table.',
    },
    'Grad School': {
      name: 'École doctorale',
      summary: 'Repartez pour quatre ans et ressortez qualifié pour un travail que personne d’autre à cette table ne peut prendre. Vous payez d’avance, encore, et chaque jour de paie manqué là-dedans, ce sont eux qui l’encaissent.',
    },
    'Keep Working': {
      name: 'Rester en poste',
      summary: 'Gardez le poste que vous avez. L’argent est plus modeste que celui d’un docteur et il continue de rentrer — y compris pendant les quatre ans qu’ils passent en bibliothèque.',
    },
    'Company Road': {
      name: 'Route de la Boîte',
      summary: 'Rester. L’augmentation arrive parce que vous étiez encore là pour la recevoir, les bonnes années se partagent, et c’est l’entreprise qui décide où vous habitez.',
    },
    'Job-Hopper Alley': {
      name: 'Allée des Départs',
      summary: 'Partir. Vous vous arrêtez net, vous démissionnez, et vous retirez une nouvelle carte dans toute la grille des salaires — jubilatoire si le premier tirage était mauvais, vrai risque s’il ne l’était pas.',
    },
    'Family Lane': {
      name: 'Voie de la Famille',
      summary: 'Une maison pleine de bruit, une prime par enfant à la fin, et une étagère d’histoires que personne ne peut vous prendre. Beaucoup moins de jours de paie, et chaque facture arrive multipliée.',
    },
    'Fast Track': {
      name: 'Voie Rapide',
      summary: 'Les paies, les augmentations et le bureau d’angle, gagnés au bureau les soirs et les week-ends. La vie personnelle que vous y avez laissée est le vrai prix.',
    },
    'Risky Road': {
      name: 'Route du Risque',
      summary: 'Des start-up, de l’effet de levier et un courtier très sûr de lui. Qui est derrière au moment d’acheter la maison devrait venir ici ; qui est devant devrait bien y réfléchir.',
    },
    'Safe Street': {
      name: 'Rue Tranquille',
      summary: 'Des bons de réduction, des intérêts et un placard plein. Personne ne s’est jamais enrichi ici, et personne ne s’y est jamais ruiné — ce qui vaut très cher quand on est déjà en tête.',
    },
  },

  careers: {
    'career-salon-apprentice': {
      title: 'Apprenti coiffeur',
      description: 'Balaie, fait les shampooings, et surveille les bons ciseaux comme le lait sur le feu.',
    },
    'career-stylist': {
      title: 'Coiffeur styliste',
      description: 'A son fauteuil, un carnet plein trois semaines à l’avance, et des habitués qui le suivraient n’importe où.',
    },
    'career-salon-owner': {
      title: 'Patron de salon',
      description: 'Tient un salon bourdonnant qui ne manque jamais ni de conversation ni de belles coupes.',
    },
    'career-commis-baker': {
      title: 'Commis boulanger',
      description: 'Arrivé à quatre heures, parti à midi, et déjà meilleur en pâte feuilletée que personne ne l’admet.',
    },
    'career-pastry-chef': {
      title: 'Pâtissier',
      description: 'Remplit la vitrine de croissants que les gens photographient avant de les manger.',
    },
    'career-head-pastry-chef': {
      title: 'Chef pâtissier',
      description: 'Écrit la carte, forme l’équipe, et goûte encore chaque fournée avant qu’elle parte.',
    },
    'career-line-cook': {
      title: 'Cuisinier de ligne',
      description: 'Six feux, un rail à commandes, et un coup de feu du midi qui décide de ce que vaut la semaine.',
    },
    'career-food-truck-owner': {
      title: 'Patron de food-truck',
      description: 'Se gare à l’endroit parfait et transforme la pause déjeuner en petite fête.',
    },
    'career-restaurant-owner': {
      title: 'Restaurateur',
      description: 'Quarante couverts par service, un chili d’anthologie, et une ligne de réservation qui sonne à neuf heures tous les matins.',
    },
    'career-site-labourer': {
      title: 'Manœuvre de chantier',
      description: 'Porte, creuse, gâche et soulève, et sait où se trouve réellement chaque outil du chantier.',
    },
    'career-site-supervisor': {
      title: 'Chef d’équipe',
      description: 'Mène le briefing du matin, la feuille de présence, et la discussion avec les échafaudeurs.',
    },
    'career-construction-foreman': {
      title: 'Conducteur de travaux',
      description: 'Transforme des plans roulés en bâtiments, une poutre à la fois, et chiffre le chantier correctement.',
    },
    'career-delivery-courier': {
      title: 'Coursier livreur',
      description: 'Sillonne la ville et nourrit tout le quartier, colis après colis.',
    },
    'career-depot-dispatcher': {
      title: 'Régulateur de dépôt',
      description: 'Descend du vélo et passe au tableau, où chaque camionnette de la ville est un aimant portant un nom.',
    },
    'career-distribution-lead': {
      title: 'Responsable logistique',
      description: 'Déplace cent mille colis par nuit et rentre chez lui avant que quiconque comprenne comment.',
    },
    'career-apprentice-mechanic': {
      title: 'Apprenti mécanicien',
      description: 'Trois ans à tenir la lampe et à tendre les outils, et le soupçon grandissant d’entendre lui aussi les moteurs se plaindre.',
    },
    'career-motorcycle-mechanic': {
      title: 'Mécanicien moto',
      description: 'Comprend de quoi une moto se plaint avant que le propriétaire ait fini sa phrase.',
    },
    'career-workshop-owner': {
      title: 'Patron de garage',
      description: 'Quatre ponts, une liste d’attente, et un mur de photos de motos arrivées sur plateau.',
    },
    'career-session-musician': {
      title: 'Musicien de studio',
      description: 'Joue la ligne de basse que vous avez fredonnée cent fois sans jamais voir la pochette.',
    },
    'career-touring-player': {
      title: 'Musicien de tournée',
      description: 'Neuf pays, une caisse de matériel, et un nom enfin imprimé sur l’affiche, en petit.',
    },
    'career-record-producer': {
      title: 'Producteur de disques',
      description: 'S’assoit derrière la vitre, dit « on la refait, mais plus joyeuse », et a toujours raison, on ne sait pas comment.',
    },
    'career-radio-runner': {
      title: 'Assistant de radio',
      description: 'Va chercher les cafés, fait signe aux invités, et apprend tranquillement comment se fabrique une émission.',
    },
    'career-podcast-host': {
      title: 'Animateur de podcast',
      description: 'Transforme trois micros et une très bonne question en rendez-vous du mardi pour des milliers de gens.',
    },
    'career-network-owner': {
      title: 'Patron de réseau',
      description: 'Fait tourner onze émissions, en anime une, et vend la publicité des douze.',
    },
    'career-second-shooter': {
      title: 'Second photographe',
      description: 'Couvre le fond de l’église et le morceau du discours que tous les autres ont raté.',
    },
    'career-portrait-photographer': {
      title: 'Photographe portraitiste',
      description: 'Arrive à faire sourire toute la famille au même instant, et c’est là tout le métier.',
    },
    'career-lettings-negotiator': {
      title: 'Négociateur en location',
      description: 'Fait visiter onze appartements chaque samedi et se souvient lequel avait un problème de moisissure.',
    },
    'career-real-estate-agent': {
      title: 'Agent immobilier',
      description: 'Vend d’abord la cuisine, ensuite le jardin, et jamais le temps de trajet.',
    },
    'career-agency-owner': {
      title: 'Patron d’agence',
      description: 'Votre nom est sur les panneaux devant quatre cents maisons. Une bonne année en porte trois calmes.',
    },
    'career-warehouse-picker': {
      title: 'Préparateur de commandes',
      description: 'Marche dix-huit kilomètres par service et retrouverait l’allée quarante dans le noir.',
    },
    'career-warehouse-lead': {
      title: 'Chef d’entrepôt',
      description: 'Fait tourner un bâtiment grand comme quatre terrains de foot avec du café et des porte-blocs.',
    },
    'career-grooming-assistant': {
      title: 'Assistant toiletteur',
      description: 'Des serviettes, des friandises, et le sang-froid de ne pas bouger pendant qu’un très grand chien se fait un avis sur vous.',
    },
    'career-pet-groomer': {
      title: 'Toiletteur',
      description: 'Transforme des chiens de refuge hirsutes en mannequins, un bain moussant à la fois.',
    },
    'career-youth-coach': {
      title: 'Entraîneur de foot des jeunes',
      description: 'Mène les entraînements du samedi, distribue les quartiers d’orange, et connaît chaque prénom. Il n’y a pas de promotion là-dedans, et il n’y en a jamais eu.',
    },
    'career-market-gardener': {
      title: 'Maraîcher',
      description: 'Fait pousser les tomates pour lesquelles tout le marché fait la queue dès sept heures, et a refusé toutes les propositions d’en produire davantage.',
    },
    'career-surgical-resident': {
      title: 'Interne en chirurgie',
      description: 'Six ans de gardes, d’écarteurs tenus, et de « vous feriez quoi, ensuite ? ».',
    },
    'career-surgeon': {
      title: 'Chirurgien',
      description: 'Sauve des vies avec des mains sûres et des nerfs plus sûrs encore.',
    },
    'career-junior-associate': {
      title: 'Collaborateur junior',
      description: 'Lit neuf cents pages pour qu’un associé puisse lire le seul paragraphe qui compte.',
    },
    'career-corporate-lawyer': {
      title: 'Avocat d’affaires',
      description: 'Gagne les batailles de conseil d’administration avec une belle mallette et un argument plus tranchant encore.',
    },
    'career-architectural-assistant': {
      title: 'Assistant d’architecte',
      description: 'Dessine onze fois le détail d’escalier et apprend plus de la onzième que des dix premières.',
    },
    'career-architect': {
      title: 'Architecte',
      description: 'Esquisse des silhouettes urbaines qui transforment des rues ordinaires en repères.',
    },
    'career-junior-engineer': {
      title: 'Ingénieur débutant',
      description: 'Corrige le petit bug dont personne ne voulait, et trouve le gros en chemin.',
    },
    'career-software-engineer': {
      title: 'Ingénieur logiciel',
      description: 'Écrit le code discret qui fait ronronner la moitié d’internet.',
    },
    'career-junior-designer': {
      title: 'Game designer junior',
      description: 'Équilibre le niveau du tutoriel pendant quatre mois et regarde des inconnus en venir à bout.',
    },
    'career-game-designer': {
      title: 'Game designer',
      description: 'Construit des mondes que les joueurs explorent bien trop tard dans la nuit.',
    },
    'career-robotics-graduate': {
      title: 'Diplômé en robotique',
      description: 'Passe un an à apprendre à un bras à ramasser une chaussette, et considère l’année bien employée.',
    },
    'career-robotics-engineer': {
      title: 'Ingénieur roboticien',
      description: 'Construit des bras qui plient le linge, puis passe un an à leur expliquer les chaussettes.',
    },
    'career-investment-analyst': {
      title: 'Analyste financier',
      description: 'Monte le tableur sur lequel toute la salle se dispute, et a raison sur la moitié.',
    },
    'career-fund-manager': {
      title: 'Gérant de fonds',
      description: 'Déplace l’argent des autres sur un écran et a raison un peu plus souvent que le contraire.',
    },
    'career-actuarial-trainee': {
      title: 'Actuaire stagiaire',
      description: 'Quinze examens, passés un par un, dans une salle qui sent le radiateur.',
    },
    'career-insurance-actuary': {
      title: 'Actuaire',
      description: 'Sait exactement quelle est la probabilité que votre toit s’envole, et la tarife avant midi.',
    },
    'career-research-assistant': {
      title: 'Assistant de recherche',
      description: 'Compte des choses en eau froide pour l’article de quelqu’un d’autre, et adore chaque minute.',
    },
    'career-marine-biologist': {
      title: 'Biologiste marin',
      description: 'Étudie les récifs coralliens et se lie d’amitié avec le dauphin curieux du coin.',
    },
    'career-jobbing-writer': {
      title: 'Rédacteur indépendant',
      description: 'De la publicité, des catalogues et une chronique tous les quinze jours, pendant que le vrai texte dort dans un tiroir.',
    },
    'career-novelist': {
      title: 'Romancier',
      description: 'Écrit le livre que les gens glissent dans les mains de leurs amis en soirée.',
    },
    'career-veterinarian': {
      title: 'Vétérinaire',
      description: 'Rassure les maîtres inquiets tout en réduisant tranquillement une toute petite fracture. Ne dirigerait jamais une chaîne de cliniques, quel que soit le montant proposé.',
    },
    'career-university-professor': {
      title: 'Professeur d’université',
      description: 'Donne cours le mardi, se dispute avec ses collègues le mercredi, fait changer les avis d’ici vendredi, et a refusé deux fois le décanat.',
    },
  },

  houses: {
    'house-tiny-cabin': {
      name: 'Petite cabane',
      description: 'Une pièce, un hamac, et une véranda faite pour les matins lents.',
    },
    'house-cozy-bungalow': {
      name: 'Pavillon douillet',
      description: 'Une première maison bien serrée, avec un nain de jardin que personne ne se souvient d’avoir acheté.',
    },
    'house-suburban-townhouse': {
      name: 'Maison de lotissement',
      description: 'Deux étages, une clôture mitoyenne, et des voisins qui saluent chaque matin.',
    },
    'house-converted-loft': {
      name: 'Loft réhabilité',
      description: 'Une ancienne fabrique de boutons : murs de brique, immenses fenêtres, et un radiateur particulièrement bruyant.',
    },
    'house-modern-duplex': {
      name: 'Duplex moderne',
      description: 'Des lignes nettes, une terrasse sur le toit, et juste assez de place pour louer un étage.',
    },
    'house-lakeside-villa': {
      name: 'Villa au bord du lac',
      description: 'Vous réveille avec vue sur l’eau et les oiseaux d’eau à l’aube.',
    },
    'house-lavish-estate': {
      name: 'Grande propriété',
      description: 'Des grilles, une fontaine, et une salle à manger bâtie pour les histoires très exagérées.',
    },
    'house-cliffside-retreat': {
      name: 'Refuge sur la falaise',
      description: 'Du verre sur trois côtés, la mer en contrebas, et une route d’accès dont les invités se plaignent avec plaisir.',
    },
    'house-skyline-penthouse': {
      name: 'Penthouse panoramique',
      description: 'Tout le dernier étage, un ascenseur privé, et une ville qui ressemble la nuit à des bijoux renversés.',
    },
  },

  stocks: {
    'stock-noodle-chain': {
      name: 'Nouilles de Minuit',
      description: 'Quarante petites boutiques qui vendent de la soupe à deux heures du matin et n’ont jamais raté un loyer.',
    },
    'stock-green-energy': {
      name: 'Bright Ridge Énergie',
      description: 'Des éoliennes le long de la route de crête, qui font tourner un dividende ennuyeux et magnifique.',
    },
    'stock-studio-pictures': {
      name: 'Studios Lantern Row',
      description: 'À un blockbuster d’été de la gloire, à un four du bac à soldes. Personne ne sait lequel.',
    },
    'stock-robot-farms': {
      name: 'Fermes Tracteur & Boulon',
      description: 'Des moissonneuses robotisées qui nourrissent toute une vallée — tant que la pluie et le logiciel se tiennent bien.',
    },
    'stock-orbital-freight': {
      name: 'Fret Orbital',
      description: 'Des fusées cargo construites au plus juste. Soit l’avenir du transport, soit un feu d’artifice très cher.',
    },
  },

  lifeTiles: {
    'tile-ran-a-marathon': { title: 'Couru un marathon' },
    'tile-wrote-a-novel': { title: 'Écrit un roman' },
    'tile-adopted-a-rescue-dog': { title: 'Adopté un chien de refuge' },
    'tile-learned-to-surf': { title: 'Appris à surfer' },
    'tile-started-a-vegetable-garden': { title: 'Lancé un potager' },
    'tile-won-a-cooking-contest': { title: 'Gagné un concours de cuisine' },
    'tile-backpacked-three-countries': { title: 'Traversé trois pays sac au dos' },
    'tile-released-an-indie-album': { title: 'Sorti un album indé' },
    'tile-built-a-backyard-treehouse': { title: 'Bâti une cabane dans l’arbre' },
    'tile-ran-a-viral-food-blog': { title: 'Tenu un blog cuisine viral' },
    'tile-finished-a-triathlon': { title: 'Terminé un triathlon' },
    'tile-volunteered-at-a-shelter': { title: 'Fait du bénévolat en refuge' },
    'tile-opened-a-lemonade-empire': { title: 'Fondé un empire de la limonade' },
    'tile-painted-a-downtown-mural': { title: 'Peint une fresque en centre-ville' },
    'tile-earned-a-pilots-license': { title: 'Obtenu le brevet de pilote' },
    'tile-launched-a-hit-podcast': { title: 'Lancé un podcast à succès' },
    'tile-patented-a-clever-gadget': { title: 'Breveté un gadget malin' },
    'tile-won-the-fantasy-league': { title: 'Gagné la ligue fantasy' },
    'tile-rescued-a-stray-kitten': { title: 'Sauvé un chaton errant' },
    'tile-climbed-a-famous-peak': { title: 'Gravi un sommet célèbre' },
    'tile-sold-pottery-worldwide': { title: 'Vendu des poteries dans le monde entier' },
    'tile-coached-a-youth-team': { title: 'Entraîné une équipe de jeunes' },
    'tile-wrote-a-hit-jingle': { title: 'Écrit un jingle à succès' },
    'tile-grew-a-prize-pumpkin': { title: 'Fait pousser un potiron primé' },
    'tile-backed-a-friends-startup': { title: 'Financé la start-up d’un ami' },
    'tile-restored-a-vintage-motorcycle': { title: 'Restauré une moto de collection' },
    'tile-threw-the-best-block-party': { title: 'Organisé la meilleure fête de quartier' },
    'tile-won-the-chili-cook-off': { title: 'Gagné le concours de chili' },
    'tile-sailed-the-whole-coast': { title: 'Longé toute la côte à la voile' },
    'tile-designed-a-city-park': { title: 'Dessiné un parc municipal' },
    'tile-fostered-a-whole-litter': { title: 'Accueilli toute une portée' },
    'tile-baked-for-the-whole-town': { title: 'Fait du pain pour toute la ville' },
    'tile-taught-a-sold-out-class': { title: 'Donné un cours complet' },
    'tile-hiked-the-long-trail': { title: 'Parcouru le grand sentier' },
    'tile-restored-an-old-theatre': { title: 'Restauré un vieux théâtre' },
    'tile-named-a-new-beetle': { title: 'Donné son nom à un coléoptère' },
  },

  economy: {
    tuitionNotes: [
      'La notification de bourse arrive avec un semestre de retard, et d’ici là, la différence est pour vous.',
      'Les frais tombent exactement là où la brochure l’annonçait.',
      'Une bourse du département couvre une plus grosse part de la facture que prévu.',
      'Exonération totale. Le décanat appelle pour vous féliciter, ce qui n’est jamais arrivé à personne que vous connaissez.',
    ],
    marriage: {
      rescued: 'Oui à la deuxième tentative — et l’installation se fait avec un crédit auto, une carte de magasin et une attitude très détendue vis-à-vis des deux.',
      outcomes: [
        'La réception a pris le large : la salle, les fleurs, le photographe, et les deux familles qui commandent le bon vin.',
        'Un petit mariage raisonnable. Quarante personnes, un beau discours, et les cadeaux ont tout couvert.',
        'Deux salaires sous le même toit, et le loyer a soudain l’air deux fois plus petit.',
        'Tout le canton débarque, chacun est généreux, et il se trouve que votre conjoint économisait discrètement depuis des années.',
      ],
    },
  },
}
