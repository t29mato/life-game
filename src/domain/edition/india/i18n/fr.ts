import type { EditionTranslation } from '../../i18n/types'

/**
 * The India edition in French.
 *
 * India is foreign to both target languages, so this overlay keeps every gloss
 * the English tile carries — the coaching classes, the paying-guest room, the
 * envelope whose sum ends in one extra rupee, the two-crore forward in the
 * family group chat. The explanation is the joke, exactly as in English.
 *
 * The one thing French needs that English did not: the lakh and the crore mean
 * nothing to a French reader, so where a sum is *prose* rather than a number
 * the engine prints, it is given in units a French reader feels (vingt
 * millions de roupies rather than two crore). Figures on the tiles themselves
 * belong to the engine and are untouched.
 *
 * Vouvoiement, present tense, short sentences, typographic apostrophes.
 */
export const INDIA_FR: EditionTranslation = {
  locale: 'fr',
  editionId: 'india',

  spaces: {
    'in-start': {
      title: 'Jour des résultats',
      description: 'Le voyage commence un matin de juin, relevé de notes en main, alors que tout le quartier demande déjà ce que vous comptez faire ensuite.',
    },
    'in-uni-hostel': {
      title: 'La chambre du foyer',
      description: 'Votre première chambre loin de chez vous a deux lits, un ventilateur qui marche, et une malle sous le lit où tient tout ce que vous possédez.',
      harsher: {
        description: 'Deux lits et un ventilateur qui marche — et l’intendant réclame la caution, l’avance sur la cantine, et des « frais de développement » qui sont simplement de l’argent en plus que l’école garde et ne rend pas.',
        reason: 'Caution, avance de cantine et frais de développement',
      },
    },
    'in-uni-admission': {
      title: 'Jour d’admission',
      description: 'Deux ans de cours préparatoires se jouent un dimanche matin : une salle d’examen bondée, silencieuse à part les crayons et les chaussures qui grincent d’un surveillant. Votre rang tombe — et les frais sont dus au guichet avant qu’on vous montre la bibliothèque.',
      reason: 'Frais d’admission et de scolarité',
    },
    'in-uni-tuition-classes': {
      title: 'Cours particuliers',
      description: 'Vous enseignez les mathématiques à des écoliers chaque soir dans une pièce louée, et les parents paient le premier du mois sans faute — ce revenu d’appoint paie les factures des étudiants depuis des générations.',
      reason: 'Cours particuliers du soir',
    },
    'in-uni-credit-card': {
      title: 'La carte de crédit',
      description: 'La carte qu’un démarcheur souriant vous a fait signer devant la grille du campus cache un taux élevé en petits caractères, et ce mois-ci il faut enfin payer.',
      reason: 'Intérêts de la carte',
    },
    'in-uni-scholarship': {
      title: 'La bourse au mérite',
      description: 'Une fondation dont personne n’avait entendu parler vous accorde une vraie bourse — vous relisez la lettre trois fois pour vérifier qu’on ne vous vend rien — et elle couvre une bonne part des frais.',
      reason: 'Bourse au mérite',
    },
    'in-uni-placement-season': {
      title: 'Saison du recrutement',
      description: 'La dernière année commence : une chemise habillée, une cravate empruntée, quarante CV identiques, et un test d’aptitude à sept heures du matin. Le vôtre a une jolie police de caractères.',
      harsher: {
        description: 'La dernière année commence : la chemise habillée, les chaussures sobres, le CV imprimé sur le beau papier, et l’abonnement aux annales du test d’aptitude — tout cela, il s’avère, vendu séparément.',
        reason: 'La panoplie du candidat',
      },
    },
    'in-uni-convocation': {
      title: 'Remise des diplômes',
      description: 'Quatre ans, un rapport de projet, et un diplôme roulé que votre mère fera encadrer avant la fin de la semaine. Officiellement diplômé.',
    },
    'in-uni-farewell': {
      title: 'On rend la chambre',
      description: 'Vous rangez quatre ans dans deux malles et rendez la clé à l’intendant.',
    },
    'in-campus-placement': {
      title: 'Recrutement sur le campus',
      description: 'Une semaine de tests d’aptitude, d’entretiens de groupe, et d’un panneau d’affichage devant lequel toute la promotion repasse sans cesse. Deux lettres d’embauche portent votre nom.',
    },
    'in-joining-day': {
      title: 'Jour d’embauche',
      description: 'Votre oncle connaît un homme, l’homme a besoin de bras, et dès vendredi vous avez un badge, un tableau de service et un salaire — deux ans avant que les étudiants gagnent quoi que ce soit.',
    },
    'in-work-first-salary': {
      title: 'Premier salaire',
      description: 'Votre toute première paie tombe et paraît énorme. Selon l’usage, vous offrez des sucreries à toute la rue et glissez le premier billet dans la main de votre mère, qui le gardera toujours.',
      reason: 'Premier salaire',
      footnote: 'Un mois entamé, pas un mois complet — vous avez pris votre poste en cours de mois. Le premier salaire entier, c’est la prochaine case « Jour de paie ».',
    },
    'in-work-payday-1': {
      title: 'Jour de paie',
      description: 'Un mois complet sur les registres, et le virement tombe pendant que vos camarades font encore la queue pour une place en amphi.',
      harsher: {
        title: 'Salaire la semaine prochaine',
        description: 'Le comptable dit la semaine prochaine, exactement comme la dernière fois, et il vous faut toujours de quoi manger.',
        reason: 'Un mois à vivre de rien',
      },
    },
    'in-work-pg-room': {
      title: 'La chambre chez l’habitant',
      description: 'Vous gagnez votre vie, donc on vous imagine logé : une chambre chez l’habitant, une caution, deux mois d’avance, et une logeuse dont le règlement intérieur tient sur deux pages.',
      reason: 'Caution et deux mois d’avance',
    },
    'in-work-first-night': {
      title: 'Première nuit',
      description: 'Vous déballez à la lumière d’une ampoule nue, parce que le néon est encore sur la liste de la semaine prochaine.',
    },
    'in-work-uniform': {
      title: 'Caution d’uniforme',
      description: 'Deux uniformes, un badge, des chaussures de sécurité, et une caution que vous ne reverrez jamais, vous le sentez bien.',
      reason: 'Caution de l’uniforme',
    },
    'in-work-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois, encore un virement, et toujours personne pour demander un diplôme.',
      harsher: {
        title: 'Heures rabotées',
        description: 'Le tableau de service est affiché le dimanche, avec votre nom sur deux fois moins de lignes que la semaine passée.',
        reason: 'Un demi-mois de créneaux',
      },
    },
    'in-work-payday-3': {
      title: 'Jour de paie',
      description: 'Trois paies plus tard, le livret bancaire commence à ressembler à une habitude.',
    },
    'in-main-probation': {
      title: 'Bilan d’essai',
      description: 'Six mois plus tard, quelqu’un s’assoit en face de vous avec un formulaire en trois exemplaires et vous demande comment ça se passe, selon vous.',
      reason: 'La fin de la période d’essai',
    },
    'in-main-bank': {
      title: 'Passage à la banque',
      description: 'Vous prenez un ticket, attendez sous le ventilateur, et êtes envoyé à un deuxième guichet qui vous renvoie au premier, très chaleureusement.',
    },
    'in-main-insurance': {
      title: 'L’assurance en famille',
      description: 'Un cousin qui vend des contrats attendait cette conversation depuis votre naissance, et arrive avec une mallette, un tableau plastifié, et votre date de naissance déjà remplie.',
    },
    'in-main-payday-1': {
      title: 'Jour de paie',
      description: 'Le virement tombe à neuf heures le dernier jour ouvré, et la notification est le meilleur son du mois.',
    },
    'in-main-whatsapp-tip': {
      title: 'Le tuyau du groupe familial',
      description: 'Le groupe de la famille transfère une valeur dans une image jaune ornée de onze fusées. La Bourse ferme à quinze heures trente.',
    },
    'in-main-roundabout': {
      title: 'Le rond-point',
      description: 'Une insertion au rond-point, un bus qui refuse de céder, et l’un de vous cède bien plus brutalement que prévu. Le devis du carrossier arrive sur papier à en-tête.',
      reason: 'Facture de carrosserie',
    },
    'in-main-pileup': {
      title: 'Carambolage',
      description: 'Brouillard d’hiver sur la voie rapide, feux stop, et quatre voitures encastrées au péage. Tout le monde repart à pied ; les factures, non.',
      reason: 'Réparations du carambolage',
    },
    'in-main-root-canal': {
      title: 'Dévitalisation',
      description: 'Un plombage, une couronne, un sermon sur les sucreries, et une facture qui pique nettement plus que la fraise.',
      reason: 'Soins dentaires',
    },
    'in-main-first-rain': {
      title: 'La première pluie',
      description: 'Après deux mois de chaleur, le ciel cède enfin, tout le bureau dérive vers la terrasse, et quelqu’un envoie le stagiaire chercher des beignets chauds. Plus rien ne se fera aujourd’hui, et c’est très bien ainsi.',
    },
    'in-crossroads': {
      title: 'Cinq ans de boîte',
      description: 'Cinq ans au même bureau, une lettre d’augmentation tombée à l’heure, et le message d’un chasseur de têtes que vous n’avez toujours pas supprimé. La route se sépare ici.',
    },
    'in-loyal-seniority': {
      title: 'Le tableau d’ancienneté',
      description: 'Personne n’a quitté ce service depuis dix ans, alors le poste au-dessus ne se libère que le jour où quelqu’un part enfin à la retraite.',
      reason: 'Le poste au-dessus s’est libéré',
    },
    'in-switch-lookout': {
      title: 'Recherche discrète',
      description: 'Vous actualisez votre profil professionnel après le bureau et prenez des appels que personne dans le box d’à côté ne peut entendre.',
    },
    'in-switch-hike': {
      title: 'Quarante pour cent de plus',
      description: 'Vous démissionnez avec la lettre d’embauche suivante déjà en main. Les RH programment un entretien de rétention, puis un second ; la contre-offre arrive exactement un jour après avoir cessé de compter.',
      reason: 'Vous avez négocié votre hausse ailleurs',
    },
    'in-switch-joining-bonus': {
      title: 'Prime d’arrivée',
      description: 'La nouvelle entreprise rachète votre préavis, et le virement tombe comme une prime de fête qu’il n’a pas fallu attendre.',
    },
    'in-main-appraisal': {
      title: 'L’évaluation annuelle',
      description: 'Une petite salle de réunion, deux managers avec votre auto-évaluation ouverte entre eux, et une note qui vous classe par rapport à toute l’équipe.',
      reason: 'Votre évaluation est arrivée',
    },
    'in-main-tax-notice': {
      title: 'L’avis du fisc',
      description: 'Un avis très poli, un long après-midi avec une boîte à chaussures de reçus et votre comptable, et un chiffre tout en bas qui était manifestement déjà décidé.',
      reason: 'Redressement fiscal',
    },
    'in-main-rolled-off': {
      title: 'Sorti du projet',
      description: 'Le projet client dont tout le monde jurait qu’il serait reconduit en avril ne l’est, très discrètement, pas. Vous êtes mis « sur le banc » — sans mission, encore payé, en attente d’un projet — jusqu’à ce que l’entreprise cesse d’attendre elle aussi.',
      reason: 'Sorti du projet, puis remercié',
    },
    'in-main-restructuring': {
      title: 'Restructuration',
      description: 'L’entreprise annonce un plan de départs « volontaires », et votre nom figure sur la liste des volontaires.',
      reason: 'Volontaire, paraît-il',
    },
    'in-main-notice-period': {
      title: 'Jour de paie',
      description: 'Le jour du virement revient et tombe pour tous ceux qui figurent encore sur les registres, avec le même libellé de trois lettres que d’habitude.',
    },
    'in-main-job-portal': {
      title: 'Le site d’emploi',
      description: 'Vous passez le profil en « en recherche active » à minuit, et au petit-déjeuner deux entreprises ont aimé votre CV.',
      reason: 'Un nouveau départ via le site d’emploi',
    },
    'in-main-diwali-hampers': {
      title: 'Les coffrets de Diwali',
      description: 'Des coffrets de fruits secs pour chaque personne autour de la table, choisis avec le plus grand soin dans un catalogue essentiellement composé de noix de cajou disposées en cercles.',
      reason: 'Un coffret magnifiquement présenté chacun',
    },
    'in-wedding': {
      title: 'Le mariage',
      description: 'Trois jours, cinq cérémonies, un cheval blanc, une fanfare, et chaque invité qui remet une enveloppe décorée dont la somme se termine, par tradition stricte, par une roupie de plus.',
    },
    'in-family-nursery-setup': {
      title: 'La chambre du bébé',
      description: 'Vous peignez la chambre d’un jaune joyeux et montez un lit à barreaux à minuit, pendant que les conseils des deux grands-mères arrivent plus vite que le bébé.',
      reason: 'Aménagement de la chambre',
    },
    'in-family-new-baby': {
      title: 'Naissance',
      description: 'La chambre est peinte et le berceau monté. Toute la famille élargie attend avec des sucreries, des avis, et le numéro d’une salle.',
    },
    'in-family-admission': {
      title: 'L’admission à l’école',
      description: 'La « bonne école » fait passer l’entretien aux parents, pas à l’enfant. Vous réussissez l’entretien — et la grille des frais, imprimée au dos, vide votre compte en banque.',
      reason: 'Frais de scolarité, par enfant',
    },
    'in-family-school-list': {
      title: 'La liste de rentrée',
      description: 'Chaque enfant a besoin de l’uniforme d’une boutique précise, des livres d’une autre, et de quarante et un objets étiquetés à la main avant mardi. Le cartable coûte plus cher que votre premier téléphone et lui survivra.',
      reason: 'Uniformes et livres, par enfant',
    },
    'in-family-sports-day': {
      title: 'Fête du sport',
      description: 'L’équipe de votre enfant gagne le relais. Vous avez filmé le mauvais enfant en uniforme identique pendant l’essentiel, mais les encouragements étaient sincères.',
    },
    'in-family-twins': {
      title: 'Des jumeaux',
      description: 'L’échographiste se tait, tourne l’écran vers vous, et lève deux doigts.',
    },
    'in-fast-payday-1': {
      title: 'Jour de paie',
      description: 'Les nuits blanches apparaissent enfin sur la fiche de paie.',
    },
    'in-fast-headhunted': {
      title: 'Approché',
      description: 'Un chasseur de têtes appelle votre numéro personnel pendant la réunion du lundi, avec deux offres et aucune patience.',
      reason: 'Approché pour autre chose',
    },
    'in-fast-burnout': {
      title: 'Arrêt pour burn-out',
      description: 'Six semaines d’arrêt avec certificat médical, et la fiche de paie est nettement plus légère le jour où vous rebadgez.',
      reason: 'Congé sans solde',
    },
    'in-fast-payday-severance': {
      title: 'Paie de fin d’exercice',
      description: 'L’exercice comptable se clôture, et ce que ce poste paie tombe une dernière fois sur votre compte avant que l’organigramme soit redessiné.',
    },
    'in-fast-reorg': {
      title: 'La réorganisation',
      description: 'L’organigramme est redessiné du jour au lendemain et votre nom se retrouve dans une case complètement différente. Personne n’a demandé, et c’est bien ce qu’est une réorganisation.',
      reason: 'Réaffecté après réorganisation',
    },
    'in-fast-trading-app': {
      title: 'L’appli de trading',
      description: 'La prime vous démange, et l’appli envoie des notifications ornées de fusées.',
    },
    'in-fast-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois de passé, encore un virement qui rentre.',
      harsher: {
        title: 'Variable repris',
        description: 'La part variable de l’an dernier est réévaluée par quelqu’un dans un autre fuseau horaire, et réévaluée à la baisse.',
        reason: 'Part variable reprise',
      },
    },
    'in-fast-counteroffer': {
      title: 'La contre-offre',
      description: 'Vous glissez, l’air de rien devant un chai, que quelqu’un d’autre vous a contacté. La contre-offre arrive avant le chai.',
    },
    'in-midtown-brokerage': {
      title: 'Le compte-titres',
      description: 'Vous ouvrez enfin le compte-titres, sous la supervision d’un oncle qui bat le marché chaque année, dans ses récits.',
    },
    'in-midtown-insurance': {
      title: 'Agence d’assurance',
      description: 'Avant qu’on vous confie un trousseau de clés, quelqu’un aimerait vous parler garanties — et déroule une carte des inondations de votre quartier, complète, récente, et discrètement terrifiante.',
    },
    'in-midtown-joint-account': {
      title: 'Le compte joint',
      description: 'Les salaires fusionnent, et le vôtre arrive désormais sur un compte commun d’où une somme fixe vous revient, intitulée, dans le livre de comptes de la maison, « argent de poche ».',
      reason: 'Le livre de comptes du foyer, soldé',
    },
    'in-midtown-head-office': {
      title: 'Chez le directeur',
      description: 'On vous demande de passer un jour de semaine. L’expérience était ambitieuse, le laboratoire va bien, et le matériel listé sur la facture, non.',
      reason: 'Ce qu’ils ont cassé, par enfant',
    },
    'in-midtown-festival-bonus': {
      title: 'La prime de fête',
      description: 'Le virement de Diwali tombe, chiffré en mois de ce que vous gagnez plutôt qu’en promesses, et chacun repart avec un chiffre différent.',
    },
    'in-midtown-raise': {
      title: 'Augmentation',
      description: 'Un mot discret près de l’ascenseur, un nouveau chiffre, et une poignée de main d’une fermeté exactement assortie en repartant.',
    },
    'in-midtown-repo-rate': {
      title: 'Le taux directeur',
      description: 'La banque centrale bouge le taux un jeudi matin, et dès le vendredi chaque mensualité de crédit immobilier du foyer a bougé avec lui.',
      reason: 'Les taux partent du mauvais côté',
    },
    'in-model-flat': {
      title: 'L’appartement témoin',
      description: 'Un appartement d’exposition avec des meubles loués, une brochure pleine d’images de synthèse du club-house, et un vendeur dont le plan de remboursement dure exactement aussi longtemps que le reste de votre vie active.',
    },
    'in-risky-startup': {
      title: 'Pari sur une start-up',
      description: 'Vous versez vos économies dans la start-up d’un ami à Bengaluru.',
      reason: 'Retour sur investissement',
    },
    'in-risky-bad-tip': {
      title: 'Le mauvais tuyau',
      description: 'La « valeur sûre » que vous avez transférée à trois groupes s’effondre en une semaine, et vous invitez toute la table à dîner pour vous faire pardonner de l’avoir recommandée à tant de monde.',
      reason: 'Le mauvais tuyau boursier',
    },
    'in-risky-golf': {
      title: 'Golf avec le client',
      description: 'Dix-huit trous au club privé, un petit pari à chaque trou, et une saison entière passée à jouer discrètement moins bien que votre vrai niveau, pour que la victoire d’aujourd’hui ait l’air innocente.',
      reason: 'Dix-huit petits paris',
    },
    'in-risky-crash': {
      title: 'Krach boursier',
      description: 'L’indice chute lourdement et votre portefeuille encaisse. Votre père évoque, encore, l’année où la fraude d’un seul courtier a fait tomber tout le marché.',
      reason: 'Krach boursier',
    },
    'in-risky-second-leg': {
      title: 'La deuxième jambe de baisse',
      description: 'L’indice trouve un plancher plus bas que personne ne le croyait possible, et il le trouve en une seule séance de l’après-midi.',
      reason: 'Le marché rechute',
    },
    'in-risky-lottery': {
      title: 'Le tirage exceptionnel',
      description: 'Vous faites quarante minutes de queue au guichet réputé chanceux, parce que le guichet réputé chanceux est réputé chanceux.',
      reason: 'Le tirage exceptionnel de la fête',
    },
    'in-risky-payday': {
      title: 'Jour de paie',
      description: 'Un virement de salaire tombe pendant que vos placements font n’importe quoi.',
    },
    'in-risky-swap': {
      title: 'L’accord d’une poignée de main',
      description: 'Une poignée de main autour d’un café filtre, et vous échangez votre solde bancaire avec celui du meneur.',
      reason: 'Un accord avec le meneur',
    },
    'in-safe-cashback': {
      title: 'Jour de cagnotte',
      description: 'Quatre applis de paiement, un téléphone qui sature, et un passage en caisse où la cagnotte accumulée couvre tout le panier.',
      reason: 'La cagnotte est versée',
    },
    'in-safe-payday': {
      title: 'Jour de paie',
      description: 'Le virement arrive le dernier jour ouvré, comme chaque mois d’aussi loin que vous vous souveniez.',
      harsher: {
        title: 'Salaire bloqué',
        description: 'Une cellule dans un tableur quelque part fait que le salaire de ce mois-ci arrivera le mois prochain.',
        reason: 'Un mois de salaire retenu',
      },
    },
    'in-safe-excess': {
      title: 'La franchise',
      description: 'Même la route prudente a son formulaire de sinistre, et le rapport d’expertise retranche la franchise à la roupie près.',
      reason: 'Franchise d’assurance',
    },
    'in-safe-ledger': {
      title: 'Le cahier de comptes',
      description: 'Vous tenez fidèlement le cahier de comptes de la maison pendant un an entier, chaque course en rickshaw et chaque kilo d’oignons, et à la fin de l’année vous avez économisé plus que prévu.',
      reason: 'Le cahier finit dans le vert',
    },
    'in-safe-old-passbook': {
      title: 'Le vieux livret',
      description: 'Un livret d’épargne postale d’enfance refait surface dans l’armoire en acier chez vos parents, et le solde à l’intérieur capitalise patiemment depuis l’école primaire.',
      reason: 'Le compte oublié',
    },
    'in-safe-gold-coins': {
      title: 'Le tiroir à pièces d’or',
      description: 'Chaque année, le jour de fête où l’on achète de l’or, une petite pièce partait au coffre. Aujourd’hui le bijoutier pèse le tiroir, et il contient plus que vous n’aviez le souvenir d’avoir mis de côté.',
      reason: 'Les pièces, pesées',
    },
    'in-safe-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un dernier jour ouvré, encore un virement tranquille. C’est tout l’intérêt.',
    },
    'in-safe-dividend': {
      title: 'Jour de dividende',
      description: 'La moitié sage de votre portefeuille verse son sage petit crédit, plus une invitation à une assemblée générale où les samoussas sont excellents.',
      reason: 'Dividende trimestriel',
    },
    'in-sunset-number': {
      title: 'La question des vingt millions',
      description: 'Tous les groupes familiaux ont transféré le calcul de ce qu’exige une retraite confortable, et tous annoncent vingt millions de roupies. Votre propre calcul rapide donne un peu plus — et le chiffre, malheureusement, ne se retire pas tout seul.',
    },
    'in-sunset-upgrade': {
      title: 'Monter d’un étage',
      description: 'Le promoteur appelle pour quelque chose de plus lumineux, de plus haut, et tout juste à portée — la nouvelle tour a un étage libre, et l’étage a une vue.',
    },
    'in-sunset-flood': {
      title: 'La pluie centennale',
      description: 'La pluie centennale arrive pour la troisième fois de la décennie, passe une nuit dans votre rez-de-chaussée, et repart sans aider à nettoyer.',
      reason: 'Dégâts des eaux',
    },
    'in-sunset-parents': {
      title: 'S’occuper des parents',
      description: 'Quelqu’un qui vous a porté a besoin d’être porté, et vos parents s’installent dans la chambre que vous leur destiniez depuis toujours. Vous refuseriez de compter. L’hôpital compte quand même.',
      reason: 'Aider un proche',
    },
    'in-sunset-payday-1': {
      title: 'Jour de paie',
      description: 'L’un de vos tout derniers virements de salaire tombe.',
    },
    'in-sunset-swap': {
      title: 'Le dernier accord',
      description: 'Une dernière poignée de main audacieuse autour d’un café filtre, et la fortune du meneur quitte la table avec vous.',
      reason: 'L’échange de la dernière heure',
    },
    'in-sunset-children-visit': {
      title: 'La visite des enfants',
      description: 'Chaque enfant devenu grand arrive avec une valise de cadeaux et laisse discrètement une enveloppe dans la pièce de prière. Celui qui vit à l’étranger vire l’argent à la place, avec un appel qui dure deux heures.',
      reason: 'Une enveloppe de chaque enfant',
    },
    'in-sunset-sticky': {
      title: 'Doigts collants',
      description: 'Autour du bon chai, vous entreprenez de convaincre le meneur de vous céder sa plus belle histoire.',
      reason: 'Une histoire change de mains',
    },
    'in-sunset-last-title': {
      title: 'Un dernier titre',
      description: 'Une désignation de plus avant la porte, si on se laisse convaincre.',
      reason: 'La dernière évaluation de votre vie',
    },
    'in-sunset-payday-2': {
      title: 'Jour de paie',
      description: 'Vous avez cessé de compter les jours de paie il y a des années ; le dernier jour ouvré, non.',
    },
    'in-sunset-final-notice': {
      title: 'Le dernier avis',
      description: 'Une dernière enveloppe de l’administration fiscale arrive avant que la porte du bureau se referme définitivement derrière vous.',
      reason: 'Dernier avis d’imposition',
    },
    'in-sunset-ahead': {
      title: 'Le couchant approche',
      description: 'Depuis la terrasse, les cerfs-volants de tout le quartier montent dans le crépuscule, comme chaque soir d’hiver où vous étiez trop occupé pour lever les yeux.',
    },
    'in-retirement': {
      title: 'Départ à la retraite',
      description: 'Un châle sur les épaules, une noix de coco dans les mains, une photo de groupe encadrée — et le premier lundi en quarante ans où vous n’êtes attendu nulle part.',
    },
  },

  lanes: {
    'The College Route': {
      name: 'La voie des études',
      summary: 'Deux ans de cours préparatoires, un examen un dimanche matin qui décide de tout, et les frais d’avance, en entier, avant d’avoir gagné une roupie. Ce que le diplôme achète, c’est une échelle de carrière qui monte presque toujours — fiable, jamais énorme.',
    },
    'Straight to Work': {
      name: 'Direct au boulot',
      summary: 'Un oncle connaît un homme, et dès vendredi vous avez un salaire — des années avant les étudiants. Aucun filet, et une échelle de métier dont le premier barreau est rude et le dernier bat tous les diplômés de cette table.',
    },
    'The Permanent Post': {
      name: 'Le poste permanent',
      summary: 'Rester. Les augmentations viennent à l’ancienneté, lentement et sans faute, la prime de Diwali ne rate jamais, et l’entreprise se souvient de la loyauté — en général. Elle décide aussi dans quelle ville vous vivez.',
    },
    'The Switch': {
      name: 'Le changement',
      summary: 'Partir, et négocier sa hausse. Les chasseurs de têtes vous adorent et les RH gardent une fiche — jubilatoire si le premier tirage était mauvais, vrai risque s’il ne l’était pas.',
    },
    'Family Lane': {
      name: 'Voie de la Famille',
      summary: 'Listes de rentrée, cours du soir et une maison pleine de bruit, avec une enveloppe de chaque enfant devenu grand à la fin. Beaucoup moins de jours de paie, et chaque facture arrive multipliée.',
    },
    'Career Track': {
      name: 'Voie Rapide',
      summary: 'Les horaires sont réels, et les augmentations, les primes et le bureau au bout du couloir aussi. Tout ce que vous avez abandonné pour les obtenir également.',
    },
    'Dalal Street': {
      name: 'Rue de la Spéculation',
      summary: 'Options, crypto, et un tuyau donné par un homme en très beau costume. Qui est derrière au moment de l’appartement témoin devrait venir ici ; qui est devant devrait bien y réfléchir.',
    },
    'Steady Street': {
      name: 'Rue Tranquille',
      summary: 'Le dépôt à terme, la pièce d’or, le ticket à gratter, le cahier où chaque roupie est notée. Personne ne s’est jamais enrichi ici, ni ruiné — ce qui vaut très cher quand on est déjà en tête.',
    },
  },

  careers: {
    'career-in-parlour-apprentice': {
      title: 'Apprentie esthéticienne',
      description: 'Deux ans à tenir le sèche-cheveux et balayer le sol avant qu’on vous confie des ciseaux, et l’épilation au fil qu’on s’entraîne sur sa propre sœur, très patiente.',
    },
    'career-in-beautician': {
      title: 'Esthéticienne',
      description: 'A son fauteuil, un mois de novembre rempli dès juillet, et des mariées qui traversent toute la ville pour ces mains-là et aucune autre.',
    },
    'career-in-bridal-salon-owner': {
      title: 'Patronne de salon de mariage',
      description: 'Tient le salon que réserve en premier chaque mariage de trois quartiers. La saison dure quatre mois et paie les douze.',
    },
    'career-in-sweet-shop-apprentice': {
      title: 'Apprenti confiseur',
      description: 'Arrivé à quatre heures, parti à dix, et toujours pas autorisé près du sirop. Faire bouillir le lait comme il faut, vous dit-on, est pour l’instant tout le métier.',
    },
    'career-in-sweet-maker': {
      title: 'Confiseur',
      description: 'Tient les cuves, lit le sucre, et sait à l’odeur du beurre clarifié seul à quel instant se taire et aller vérifier la casserole.',
    },
    'career-in-sweet-shop-owner': {
      title: 'Patron de confiserie',
      description: 'Un comptoir, une recette que personne n’a jamais réussi à lui soutirer, et une file de fête que la police aide poliment à canaliser.',
    },
    'career-in-dosa-griddle-cook': {
      title: 'Cuisinier à la plaque',
      description: 'Une plaque d’un mètre vingt, six pâtes différentes, et un coup de feu du midi qui décide de ce que vaut la semaine.',
    },
    'career-in-chaat-cart-owner': {
      title: 'Patron de charrette à snacks',
      description: 'Gare la charrette près du marché à cinq heures et transforme la foule du soir en petite fête. La file d’attente est le dé.',
    },
    'career-in-dhaba-owner': {
      title: 'Patron de relais routier',
      description: 'Quarante lits de corde, un plat de lentilles sans concession, et chaque chauffeur de la nationale sait exactement à quelle heure ouvre votre cuisine.',
    },
    'career-in-site-labourer': {
      title: 'Manœuvre de chantier',
      description: 'Monte la charge sur la tête neuf étages d’échafaudage, sait où se trouve réellement chaque outil du chantier, et est le seul en qui le grutier ait confiance.',
    },
    'career-in-site-supervisor': {
      title: 'Chef de chantier',
      description: 'Mène l’appel du matin, le registre de présence, et la dispute permanente avec le fournisseur de ciment.',
    },
    'career-in-building-contractor': {
      title: 'Entrepreneur du bâtiment',
      description: 'Transforme des plans roulés en tours qui survivent à la mousson, et chiffre le chantier avant que l’architecte ait fini sa phrase.',
    },
    'career-in-delivery-rider': {
      title: 'Livreur à scooter',
      description: 'Faufile un scooter dans un trafic que l’appli qualifie de « modéré », et sait quel immeuble a un ascenseur en panne avant le client. Les heures de pointe sont le dé.',
    },
    'career-in-hub-dispatcher': {
      title: 'Régulateur du hub',
      description: 'Descend du scooter et passe au tableau de bord, où chaque livreur de la zone est un point avec un nom et une famille.',
    },
    'career-in-logistics-lead': {
      title: 'Responsable logistique',
      description: 'Fait passer l’équivalent d’une grande braderie de colis par le tri de nuit et rentre avant que la camionnette de lait comprenne comment.',
    },
    'career-in-garage-apprentice': {
      title: 'Apprenti de garage',
      description: 'Trois ans à tendre la clé de quatorze au patron, et le soupçon grandissant que les scooters l’entendent arriver.',
    },
    'career-in-scooter-mechanic': {
      title: 'Mécanicien scooter',
      description: 'Comprend de quoi un scooter de livraison se plaint avant que son pilote ait fini de décrire le bruit.',
    },
    'career-in-garage-owner': {
      title: 'Patron de garage',
      description: 'Quatre fosses, une liste d’attente en pleine mousson, et un mur de photos de motos arrivées à l’arrière d’un camion.',
    },
    'career-in-session-player': {
      title: 'Musicien de studio',
      description: 'Joue la ligne de flûte d’une chanson de film que tout le pays a fredonnée sans jamais lire le générique, et attend près du téléphone entre deux séances.',
    },
    'career-in-wedding-band-leader': {
      title: 'Chef de fanfare de mariage',
      description: 'Mène les cuivres au milieu de la chaussée en uniforme blanc et or, et les réservations de la saison sont le dé.',
    },
    'career-in-music-director': {
      title: 'Directeur musical',
      description: 'S’assoit derrière la vitre, dit « on la refait, mais avec plus de nostalgie », et a toujours raison, on ne sait pas comment.',
    },
    'career-in-radio-runner': {
      title: 'Assistant de radio',
      description: 'Va chercher le chai, fait signe aux invités, filtre les auditeurs au téléphone, et apprend tranquillement comment se fabrique une émission.',
    },
    'career-in-radio-jockey': {
      title: 'Animateur radio',
      description: 'Prend les dédicaces des routiers et des étudiants insomniaques à deux heures du matin, et est aimé dans tout le pays sans jamais être vu.',
    },
    'career-in-station-director': {
      title: 'Directeur d’antenne',
      description: 'Fait tourner onze émissions, en anime toujours une sous un nom de scène, et vend les espaces sponsors des douze.',
    },
    'career-in-second-shooter': {
      title: 'Second photographe',
      description: 'Couvre le fond de la salle de mariage et l’instant exact où le père de la mariée cesse de faire semblant de ne pas pleurer.',
    },
    'career-in-wedding-photographer': {
      title: 'Photographe de mariage',
      description: 'De novembre à février, tout est pris deux ans à l’avance, et juillet est un silence — l’agenda est le dé, et la saison des mariages décide de l’année.',
    },
    'career-in-rental-broker': {
      title: 'Courtier en location',
      description: 'Fait visiter onze deux-pièces par samedi, et se souvient lequel avait chronométré le « deux minutes du métro » en sprintant.',
    },
    'career-in-property-dealer': {
      title: 'Marchand de biens',
      description: 'Vend d’abord le balcon, ensuite le club-house, et jamais les quatre-vingt-dix minutes de trajet.',
    },
    'career-in-builder': {
      title: 'Promoteur',
      description: 'Votre nom est sur les panneaux au-dessus de quatre échangeurs. Une bonne année de lancements en porte trois calmes.',
    },
    'career-in-warehouse-picker': {
      title: 'Préparateur de commandes',
      description: 'Marche dix-huit kilomètres par service le long du même convoyeur, et retrouverait l’allée quarante pendant une coupure de courant.',
    },
    'career-in-warehouse-lead': {
      title: 'Chef d’entrepôt',
      description: 'Fait tourner un bâtiment grand comme quatre terrains de cricket au petit chai et aux porte-blocs, pendant toute la braderie de fête.',
    },
    'career-in-chai-stall-helper': {
      title: 'Aide à l’échoppe à thé',
      description: 'Lave les verres, monte le plateau à quatre bureaux, et peut porter six thés dans un escalier sans plateau du tout.',
    },
    'career-in-chai-stall-owner': {
      title: 'Patron d’échoppe à thé',
      description: 'Fait bouillir le même thé parfait mille fois par jour devant une tour de bureaux, et en sait plus sur l’entreprise que son conseil d’administration.',
    },
    'career-in-cricket-coach': {
      title: 'Entraîneur de cricket',
      description: 'Mène les entraînements de l’aube sur un terrain de poussière, alimente la machine à balles à la main, et se souvient de chaque coup droit. Il n’y a pas de promotion là-dedans, et il n’y en a jamais eu.',
    },
    'career-in-farmer': {
      title: 'Agriculteur',
      description: 'Fait pousser le blé pour lequel tout le marché du district ouvre, et a refusé trois fois les promoteurs fonciers, chaque fois plus définitivement.',
    },
    'career-in-medical-resident': {
      title: 'Interne en médecine',
      description: 'A réussi le concours de médecine à la deuxième tentative, et travaille désormais de nuit à l’hôpital public, où la file commence avant l’ouverture du bâtiment.',
    },
    'career-in-hospital-surgeon': {
      title: 'Chirurgien hospitalier',
      description: 'Sauve des vies avec des mains sûres, des nerfs plus sûrs encore, et une file de consultation qui vous considère comme de la famille.',
    },
    'career-in-junior-advocate': {
      title: 'Avocat débutant',
      description: 'Porte les dossiers du maître dans les escaliers de la Haute Cour, rédige les neuf cents pages, et attend des années le paragraphe qui sera le sien.',
    },
    'career-in-high-court-advocate': {
      title: 'Avocat à la Haute Cour',
      description: 'Gagne le prétoire avec une robe noire impeccable, une citation plus tranchante encore, et un talent pour le renvoi que personne n’avait vu venir.',
    },
    'career-in-architectural-assistant': {
      title: 'Assistant d’architecte',
      description: 'Dessine onze fois le détail d’escalier d’une maison bâtie sur la largeur d’une voiture garée, et apprend plus de la onzième que des dix premières.',
    },
    'career-in-architect': {
      title: 'Architecte',
      description: 'Glisse une cour intérieure dans une parcelle impossible et fait passer six mètres carrés de véranda pour un matin de village.',
    },
    'career-in-software-trainee': {
      title: 'Ingénieur logiciel stagiaire',
      description: 'Trois mois de campus de formation, un badge, et un premier projet que tout le monde appelle « le support » et que personne n’appelle simple.',
    },
    'career-in-software-engineer': {
      title: 'Ingénieur logiciel',
      description: 'Prend la réunion de vingt-trois heures trente au fuseau du client, livre la version, et fait ronronner discrètement la moitié des back-offices du monde.',
    },
    'career-in-associate-product-manager': {
      title: 'Chef de produit junior',
      description: 'Rédige les spécifications d’une appli de Bengaluru pendant quatre mois, puis regarde un inconnu dans le métro utiliser la fonctionnalité sans lire un mot.',
    },
    'career-in-product-manager': {
      title: 'Chef de produit',
      description: 'Possède une feuille de route, un indicateur, et une réunion qui aurait pu être un mail mais qui est à la place tout votre mardi.',
    },
    'career-in-propulsion-graduate': {
      title: 'Diplômé en propulsion',
      description: 'Passe un an à tester une seule vanne pour le programme spatial, et considère — à juste titre — l’année bien employée.',
    },
    'career-in-spacecraft-engineer': {
      title: 'Ingénieur spatial',
      description: 'Pose une sonde avec le budget que d’autres agences consacrent à la fête de lancement, et répond à la même question à chaque repas de famille.',
    },
    'career-in-bank-probationary-officer': {
      title: 'Cadre bancaire stagiaire',
      description: 'A devancé un million de candidats au concours, et apprend maintenant l’agence en partant du guichet, une mutation à la fois.',
    },
    'career-in-bank-branch-manager': {
      title: 'Directeur d’agence',
      description: 'Dirige l’agence où tous les commerçants de la rue ont leur compte, et est invité à plus de mariages qu’aucun de vos proches.',
    },
    'career-in-civil-service-probationer': {
      title: 'Élève administrateur',
      description: 'A donné trois ans de sa vingtaine à un seul concours, l’a eu à la tentative qu’il avait juré être la dernière, et apprend maintenant à administrer un district avec l’acharnement qu’il mettait à réviser.',
    },
    'career-in-district-collector': {
      title: 'Préfet de district',
      description: 'Administre un district de trois millions d’habitants depuis un bureau centenaire, et la file du matin devant la porte croit — le plus souvent à raison — que vous pouvez tout résoudre.',
    },
    'career-in-research-assistant': {
      title: 'Assistant de recherche',
      description: 'Compte des choses dans l’herbe mouillée à l’aube pour l’article de quelqu’un d’autre, et adore chaque minute.',
    },
    'career-in-tiger-reserve-biologist': {
      title: 'Biologiste en réserve de tigres',
      description: 'Étudie la réserve pour laquelle tout le pays fait la queue, et tutoie une tigresse extrêmement photographiée.',
    },
    'career-in-writers-room-assistant': {
      title: 'Assistant scénariste',
      description: 'Écrit des scènes de mariage jusqu’à quatre heures du matin pour un feuilleton qui ne saute jamais un épisode, pendant que le vrai scénario dort dans un tiroir.',
    },
    'career-in-tv-serial-writer': {
      title: 'Scénariste de feuilleton',
      description: 'Enfin au générique. La paie est un dé, l’audience du jeudi peut annuler toute la série sans prévenir, et l’épisode du mariage revient chaque année, à vie.',
    },
    'career-in-veterinarian': {
      title: 'Vétérinaire',
      description: 'Rassure un éleveur inquiet tout en réduisant tranquillement la patte d’un buffle, et n’échangerait ce cabinet contre aucune chaîne de cliniques imaginable.',
    },
    'career-in-university-professor': {
      title: 'Professeur d’université',
      description: 'Donne cours le mardi, se dispute en salle des profs le mercredi, fait changer les avis d’ici vendredi, et a refusé deux fois le décanat.',
    },
  },

  houses: {
    'house-in-ancestral-village-house': {
      name: 'Maison de famille au village',
      description: 'Une cour, un manguier, et un acte de propriété portant le nom de trois frères et sœurs. Vendre exige un conseil de famille ; posséder n’exige que de l’amour.',
    },
    'house-in-one-bhk-flat': {
      name: 'Deux-pièces de banlieue',
      description: 'Une chambre, un séjour, une cuisine, et le train de banlieue au bout de la ruelle. L’annonce disait « 2 min de la gare » et, pour une fois, c’était vrai.',
    },
    'house-in-row-house': {
      name: 'Maison mitoyenne de province',
      description: 'Deux étages dans une résidence fermée, un mur mitoyen, un abri de voiture, et des voisins qui envoient à manger à chaque fête, c’est-à-dire presque tous les jours.',
    },
    'house-in-mill-loft': {
      name: 'Loft dans une filature',
      description: 'Un étage d’ancienne filature de coton avec des piliers en fonte, six mètres sous plafond, et un ventilateur de plafond d’un autre siècle, magnifiquement bruyant.',
    },
    'house-in-duplex': {
      name: 'Duplex avec les parents en bas',
      description: 'Vos parents prennent le rez-de-chaussée, vous le premier étage, et les négociations autour de la cuisine commencent le jour même des cartons.',
    },
    'house-in-goa-villa': {
      name: 'Villa à Goa',
      description: 'Des murs de latérite rouge, une véranda faite pour ne rien faire de très bien, et une annonce de location qui couvre les frais de l’année pendant votre absence.',
    },
    'house-in-city-farmhouse': {
      name: 'Ferme aux portes de la ville',
      description: 'Des grilles, une pelouse de la taille d’un terrain de cricket, et pas une seule culture, jamais. Ce qu’on y fait pousser, ce sont des mariages.',
    },
    'house-in-sea-facing-flat': {
      name: 'Appartement vue mer',
      description: 'Le dix-huitième étage, toute la mer d’Arabie, et une mousson qui arrive à votre fenêtre en premier. Les mots « vue mer » sont toute la raison du prix.',
    },
    'house-in-south-city-penthouse': {
      name: 'Penthouse des quartiers sud',
      description: 'Tout le dernier étage au-dessus du vieux quartier des bungalows. L’ascenseur ouvre sur le salon, et le salon domine les embouteillages dans lesquels vous ne vous asseyez plus.',
    },
  },

  stocks: {
    'stock-in-dairy': {
      name: 'Coopérative Laitière Everyday',
      description: 'Trois millions d’éleveurs, une marque sur chaque table de petit-déjeuner du pays, et un dividende aussi régulier que la sonnette du matin.',
    },
    'stock-in-solar': {
      name: 'Parcs Solaires du Désert de Thar',
      description: 'Des panneaux jusqu’à l’horizon dans un désert qui compte trois cent trente jours de soleil, et versent un dividende ennuyeux et magnifique.',
    },
    'stock-in-pictures': {
      name: 'Marine Lines Pictures',
      description: 'À un blockbuster de week-end de fête de la gloire, à un four à trois milliards de roupies du journal télévisé.',
    },
    'stock-in-fintech': {
      name: 'Bazar Sans Espèces',
      description: 'Chaque charrette à légumes du pays fait scanner son QR code ; que cela devienne un jour un profit dépend entièrement de la circulaire du régulateur de ce trimestre.',
    },
    'stock-in-rocketry': {
      name: 'Fusées Péninsulaires',
      description: 'Des petits satellites avec un budget minuscule depuis un pas de tir au bord de la mer — soit la prochaine fierté nationale, soit une fusée de fête très chère.',
    },
  },

  lifeTiles: {
    'tile-in-mumbai-marathon': { title: 'Couru le marathon de Mumbai' },
    'tile-in-railway-novel': { title: 'Écrit le best-seller des quais de gare' },
    'tile-in-street-dog': { title: 'Adopté le chien des rues qui vous a choisi' },
    'tile-in-kovalam-surf': { title: 'Appris à surfer à Kovalam' },
    'tile-in-curry-leaves': { title: 'Fait pousser du curry sur le balcon' },
    'tile-in-biryani': { title: 'Maîtrisé le biryani de votre grand-mère' },
    'tile-in-himalayan-circuit': { title: 'Parcouru le circuit himalayen' },
    'tile-in-fusion-album': { title: 'Sorti un album de fusion indé' },
    'tile-in-mango-treehouse': { title: 'Bâti une cabane dans le manguier' },
    'tile-in-street-food-map': { title: 'Votre carte des snacks est devenue virale' },
    'tile-in-goa-triathlon': { title: 'Terminé le triathlon de Goa' },
    'tile-in-lane-dogs': { title: 'Nourri tous les chiens de la ruelle' },
    'tile-in-sugarcane-empire': { title: 'Bâti un empire du jus de canne' },
    'tile-in-underpass-mural': { title: 'Peint la fresque du passage sous les rails' },
    'tile-in-solo-flight': { title: 'Volé en solo au-dessus du Deccan' },
    'tile-in-cricket-podcast': { title: 'Lancé un podcast cricket à succès' },
    'tile-in-solar-cooler': { title: 'Breveté un refroidisseur d’eau solaire' },
    'tile-in-fantasy-cricket': { title: 'Gagné la ligue de cricket fantasy' },
    'tile-in-temple-kitten': { title: 'Sauvé un chaton du temple' },
    'tile-in-base-camp': { title: 'Marché jusqu’au camp de base de l’Everest' },
    'tile-in-blue-pottery': { title: 'Vendu de la poterie bleue dans le monde entier' },
    'tile-in-colony-cricket': { title: 'Entraîné l’équipe de cricket de la résidence' },
    'tile-in-film-song': { title: 'Écrit une chanson de film numéro un' },
    'tile-in-bottle-gourd': { title: 'Fait pousser une calebasse primée' },
    'tile-in-bengaluru-startup': { title: 'Financé la start-up d’un ami à Bengaluru' },
    'tile-in-grandfathers-motorcycle': { title: 'Restauré la moto de votre grand-père' },
    'tile-in-society-diwali': { title: 'Organisé le Diwali de la résidence' },
    'tile-in-pickle-contest': { title: 'Gagné le concours de pickles' },
    'tile-in-konkan-sail': { title: 'Navigué le long de la côte de Konkan' },
    'tile-in-neighbourhood-park': { title: 'Transformé une décharge en parc' },
    'tile-in-monsoon-puppies': { title: 'Recueilli six chiots de mousson' },
    'tile-in-sweets-for-building': { title: 'Offert des douceurs à tout l’immeuble' },
    'tile-in-yoga-class': { title: 'Donné un cours de yoga complet sur le toit' },
    'tile-in-valley-of-flowers': { title: 'Marché dans la vallée des Fleurs' },
    'tile-in-single-screen': { title: 'Restauré le vieux cinéma de quartier' },
    'tile-in-new-butterfly': { title: 'Donné son nom à un papillon des Ghats' },
  },

  economy: {
    tuitionNotes: [
      'La place au quota interne coûte ce que la brochure n’a jamais imprimé, et une année de cours de rattrapage vient s’ajouter par-dessus.',
      'Les cours préparatoires, les tentatives au concours et la place elle-même reviennent exactement au budget prévu.',
      'Une bourse au mérite et sur critères sociaux couvre une plus grosse part des quatre ans que prévu.',
      'Un rang national assez bon pour une exonération totale — le genre de résultat que la famille ne cesse jamais de mentionner.',
    ],
    marriage: {
      rescued: 'Oui à la deuxième tentative — et l’installation se fait avec trois cartes de crédit au plafond, un crédit en cours sur un téléphone d’avant-avant, et une attitude très détendue vis-à-vis des deux.',
      outcomes: [
        'Le mariage a gagné une cérémonie par semaine : les fiançailles, la soirée musicale, le cocktail, le cheval, la fanfare, et les deux familles qui exigent la plus grande salle.',
        'Une cérémonie au temple à l’aube et un bon déjeuner. Soixante invités, le discours d’un oncle qui touche juste, et les enveloppes ont tout couvert.',
        'Deux salaires sous le même toit, et le loyer du trois-pièces a soudain l’air deux fois plus petit.',
        'Trois villages entiers débarquent, chacun est généreux, et il se trouve que votre conjoint alimentait discrètement un plan d’épargne depuis son premier salaire.',
      ],
    },
  },
}
