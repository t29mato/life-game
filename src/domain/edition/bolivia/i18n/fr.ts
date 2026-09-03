import type { EditionTranslation } from '../../i18n/types'

/**
 * The Bolivia edition in French.
 *
 * Bolivia is foreign to both target languages, so this overlay keeps every
 * gloss the English tile carries: the January fair where you buy your dreams
 * in miniature and have them blessed at noon, the mirrored cholet whose ground
 * floor pays its own rent, the leather cup of five dice, the thirteenth wage
 * December pays by law. The explaining is the joke, exactly as in English.
 *
 * The edition's own rule holds here too: a market stall is an ambition, never
 * a hardship. Nothing is rendered as poverty — the misfortunes on this board
 * are hail, traffic and paperwork, and the stall is a business somebody is
 * proud of.
 *
 * Spanish words survive only where French already uses them or where the
 * sentence teaches them (la salteña, le cholet); vouvoiement, present tense,
 * typographic apostrophes.
 */
export const BOLIVIA_FR: EditionTranslation = {
  locale: 'fr',
  editionId: 'bolivia',

  spaces: {
    'bo-start': {
      title: 'Début de la vie',
      description: 'Le voyage commence un matin clair et froid, sur le rebord de la ville haute, toute la vallée de lumières en contrebas et la montagne qui vous surveille.',
    },
    'bo-uni-move-in': {
      title: 'Une chambre en ville',
      description: 'Votre première chambre louée contient un lit, une plaque chauffante, une affiche de l’équipe nationale, et toutes vos ambitions.',
      harsher: {
        description: 'Un lit et une plaque chauffante — et la propriétaire voudrait deux mois d’avance, plus une recommandation de quelqu’un qu’elle connaît déjà.',
        reason: 'Deux mois d’avance',
      },
    },
    'bo-uni-entrance': {
      title: 'Le concours d’entrée',
      description: 'Un lundi matin, trois mille candidats, un gymnase entier de pupitres. Vous passez — et viennent ensuite cinq ans de droits, de photocopies, de matériel et de loyer en ville, dus avant qu’on vous montre la bibliothèque.',
      reason: 'Cinq ans d’études',
    },
    'bo-uni-lab-keys': {
      title: 'Les clés du labo',
      description: 'Vous corrigez les devoirs de première année, gardez les clés du labo et faites marcher le projecteur que personne d’autre ne sait démarrer — et la faculté vous paie vraiment pour ça.',
      reason: 'Heures d’assistant de faculté',
    },
    'bo-uni-lost-carnet': {
      title: 'La carte d’identité perdue',
      description: 'Votre carte d’identité disparaît quelque part dans un minibus, et la refaire demande deux administrations, quatre files d’attente, un notaire, et des frais à chaque guichet.',
      reason: 'Refaire tous les papiers',
    },
    'bo-uni-scholarship': {
      title: 'La bourse au mérite',
      description: 'Vos notes vous valent la meilleure bourse de la faculté, et elle couvre une bonne part des années qui restent.',
      reason: 'Bourse au mérite',
    },
    'bo-uni-finals': {
      title: 'Semaine d’examens',
      description: 'Cinq épreuves en quatre jours, et les notes photocopiées de trois générations différentes étalées sur un seul lit.',
      harsher: {
        description: 'Cinq épreuves en quatre jours, et un stage intensif acheté dans la panique pour la matière dont le professeur note le plus durement.',
        reason: 'Le stage intensif',
      },
    },
    'bo-uni-defence': {
      title: 'La soutenance',
      description: 'Trois professeurs, un projecteur, et toute votre famille élargie dans les derniers rangs, habillée comme pour un mariage. Vous passez, et les fleurs arrivent avant la fin du verdict.',
    },
    'bo-uni-farewell': {
      title: 'La chambre vide',
      description: 'Vous rangez quatre ans dans deux cartons et rendez la clé à la propriétaire qui vous a nourri la moitié du temps.',
    },
    'bo-grad-fair': {
      title: 'Le forum des diplômés',
      description: 'Le diplôme est encadré et le titre précédera votre nom pour toujours. Deux cabinets le veulent sur leur papier à en-tête.',
    },
    'bo-market-monday': {
      title: 'Lundi au marché',
      description: 'Votre tante a un étal, et l’étal d’à côté a besoin d’une paire de bras. Dès vendredi vous connaissez tous les prix de la halle et vous êtes payé — des années avant que les étudiants gagnent quoi que ce soit.',
    },
    'bo-work-first-pay': {
      title: 'La recette de la semaine',
      description: 'Votre premier vrai argent arrive dans votre main, plié tout petit. Selon l’usage, vous offrez le déjeuner du dimanche à la famille, et ils vous laissent payer avec une fierté visible.',
      reason: 'La recette de la première semaine',
      footnote: 'Une semaine au stand, pas un mois — l’argent d’un mois entier, c’est la prochaine case « Jour de paie ».',
    },
    'bo-work-payday-1': {
      title: 'Jour de paie',
      description: 'Un mois entier de travail dans la poche pendant que vos camarades font encore la queue pour s’inscrire.',
      harsher: {
        title: 'Payé en fin de mois',
        description: 'Personne n’avait précisé que le premier mois est payé à la fin du deuxième, et la plaque chauffante s’en moque.',
        reason: 'Un mois à vivre de rien',
      },
    },
    'bo-work-moving-out': {
      title: 'Premier logement',
      description: 'Vous gagnez votre vie, donc on vous attend dehors : une caution, un mois d’avance, un matelas, et un réchaud à deux feux que vous montez vous-même sur quatre étages.',
      reason: 'Caution et premier mois',
    },
    'bo-work-first-night': {
      title: 'Première nuit',
      description: 'Vous déballez à la bougie, parce que la propriétaire n’a toujours pas fait refaire l’électricité de votre étage.',
    },
    'bo-work-association': {
      title: 'Le droit d’association',
      description: 'Personne ne vend sur cette rangée sans adhérer à l’association des commerçants : un droit d’entrée, un dossier plein de tampons, et une cotisation mensuelle que le trésorier vient encaisser en personne.',
      reason: 'Adhésion à l’association',
    },
    'bo-work-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois, encore une liasse pliée, et toujours personne pour demander un diplôme.',
      harsher: {
        title: 'Semaine de barrage',
        description: 'Un barrage routier ferme le col pendant huit jours. Rien n’arrive, rien ne se vend, et tout le monde reste devant son étal à en discuter longuement.',
        reason: 'Une semaine de routes fermées',
      },
    },
    'bo-work-payday-3': {
      title: 'Jour de paie',
      description: 'Trois mois plus tard, la liasse pliée n’a plus rien d’une surprise.',
    },
    'bo-main-probation': {
      title: 'Fin de période d’essai',
      description: 'Trois mois plus tard, la patronne vous regarde travailler toute une matinée sans rien dire du tout. Puis elle dit quelque chose.',
      reason: 'La fin de la période d’essai',
    },
    'bo-main-bank': {
      title: 'Passage à la banque',
      description: 'La file fait deux fois le tour du pâté de maisons, avance incroyablement lentement, et la guichetière demande chaleureusement comment l’argent vous traite.',
    },
    'bo-main-insurance': {
      title: 'Agence d’assurance',
      description: 'Le courtier déroule une carte plastifiée de votre quartier marquée pour la grêle, les glissements de terrain et la foudre. Elle est complète, récente, et discrètement terrifiante.',
    },
    'bo-main-payday-1': {
      title: 'Jour de paie',
      description: 'L’argent du mois arrive, et pour une fois rien n’a été retenu dessus. Le meilleur moment de la semaine.',
    },
    'bo-main-stock-tip': {
      title: 'Tuyau boursier',
      description: 'Un cousin ne jure que par une action lue dans le bus de nuit. La maison de courtage est ouverte jusqu’à dix-huit heures.',
    },
    'bo-main-intersection': {
      title: 'Le carrefour',
      description: 'Un minibus et votre flanc droit tiennent une négociation courte et bruyante à un carrefour sans feux, et le devis du carrossier arrive plus vite que la police ne le ferait jamais.',
      reason: 'Facture de carrosserie',
    },
    'bo-main-motorway-pileup': {
      title: 'Brouillard sur la voie',
      description: 'Le brouillard passe le rebord de la ville haute, les feux stop s’allument, et quatre véhicules s’encastrent sur la route à péage. Tout le monde repart à pied ; les factures, non.',
      reason: 'Réparations du carambolage',
    },
    'bo-main-dentist': {
      title: 'Note du dentiste',
      description: 'Un plombage, une couronne en or que votre tante tient pour un placement, et une facture qui pique nettement plus que la fraise.',
      reason: 'Soins dentaires',
    },
    'bo-main-alasita': {
      title: 'La foire des miniatures',
      description: 'À la foire de janvier, vous achetez vos rêves en miniature — une petite maison, un petit diplôme, une petite liasse de billets — et vous les faites bénir à midi pile. Tout le monde jure que ça marche, et personne ne l’explique.',
    },
    'bo-crossroads': {
      title: 'Cinq ans de travail',
      description: 'Cinq ans de travail régulier, et deux voix au déjeuner du dimanche : votre mère dit de garder la fiche de paie et la retraite, votre cousin dit que personne ne s’est jamais enrichi en travaillant pour un autre. La route se sépare ici.',
    },
    'bo-payroll-seniority': {
      title: 'Le tableau d’ancienneté',
      description: 'Personne n’a quitté ce bureau depuis dix ans, alors la place au-dessus ne se libère que le jour où quelqu’un part enfin à la retraite.',
      reason: 'La place au-dessus s’est libérée',
    },
    'bo-own-lookout': {
      title: 'Le bouche-à-oreille',
      description: 'Vous glissez un mot à la fin de chaque visite, et les rappels commencent à arriver avant même que le badge soit rendu.',
    },
    'bo-own-account': {
      title: 'À votre compte',
      description: 'Vous rendez le badge avec la suite déjà prévue. Votre mère est horrifiée ; votre cousin paie la première tournée. Le nouveau travail arrive avec un nouveau chiffre.',
      reason: 'Vous vous êtes mis à votre compte',
    },
    'bo-own-first-contract': {
      title: 'Le premier gros contrat',
      description: 'Votre premier client à votre compte paie à la livraison, en entier, en liquide — et cela tombe comme un mois de salaire dont personne au-dessus de vous n’a pris sa part.',
    },
    'bo-main-review': {
      title: 'L’entretien',
      description: 'Une petite arrière-salle, deux personnes avec le livre de comptes de l’année ouvert entre elles, et une seule question : êtes-vous prêt à gérer plus que vous ne gérez ?',
      reason: 'Votre entretien est arrivé',
    },
    'bo-main-tax-audit': {
      title: 'Contrôle fiscal',
      description: 'Une lettre très formelle, un long après-midi avec une boîte à chaussures de reçus, et un chiffre tout en bas qui était manifestement déjà décidé.',
      reason: 'Redressement fiscal',
    },
    'bo-main-contract-ends': {
      title: 'Fin de contrat',
      description: 'Le contrat dont tout le monde jurait qu’il serait renouvelé en janvier ne l’est, très discrètement, pas. Le gâteau d’adieu est excellent.',
      reason: 'Contrat non renouvelé',
    },
    'bo-main-layoff': {
      title: 'La restructuration',
      description: 'Tout l’étage est convoqué dans une même réunion avec un consultant venu de la capitale, et ensuite votre badge ne fonctionne plus.',
      reason: 'Poste supprimé',
    },
    'bo-main-notice-period': {
      title: 'Jour de paie',
      description: 'La paie de fin de mois tombe pour tous ceux que le consultant a laissés sur la liste, dans la même enveloppe que toujours.',
    },
    'bo-main-career-fair': {
      title: 'Le forum de l’emploi',
      description: 'Un hall de stands, des stylos gratuits, une fanfare qui s’échauffe dehors pour une raison sans rapport, et deux offres à votre nom.',
      reason: 'Un nouveau départ au forum de l’emploi',
    },
    'bo-main-godparent': {
      title: 'Parrain de tout',
      description: 'Cette année on vous nomme parrain d’un baptême, d’une remise de diplôme et d’une pose de toiture — un honneur à chaque fois, et un cadeau à chaque fois, pour tout le monde autour de la table.',
      reason: 'Un honneur, et un cadeau, à chaque fois',
    },
    'bo-wedding': {
      title: 'Jour du mariage',
      description: 'La mairie le jeudi, l’église le samedi, puis la fiesta — où chaque invité parraine quelque chose, du gâteau à l’orchestre, et où l’on annonce à voix haute qui a offert quoi, sous les applaudissements.',
    },
    'bo-family-nursery': {
      title: 'La chambre du bébé',
      description: 'Vous peignez la chambre d’un jaune joyeux, montez un lit à barreaux à minuit, et acceptez une montagne de vêtements impossiblement petits, tricotés à la main par toutes les tantes à la fois.',
      reason: 'Aménagement de la chambre',
    },
    'bo-family-new-baby': {
      title: 'Naissance',
      description: 'La chambre est peinte et le berceau monté. Quatre grands-mères ont déjà commencé à tricoter, ce qu’elles jugent un pari raisonnable.',
    },
    'bo-family-childcare': {
      title: 'Frais de garde',
      description: 'Une place en crèche pour chaque petite personne de la maison, et un total mensuel que vous relisez deux fois.',
      reason: 'Garde d’enfant, par enfant',
    },
    'bo-family-school-list': {
      title: 'La liste de rentrée',
      description: 'L’uniforme, la blouse blanche, la tenue de sport, et une liste de fournitures de quarante et un articles — le nom de chaque enfant à coudre, pas à écrire, sur chacun d’eux avant lundi.',
      reason: 'La liste de rentrée, par enfant',
    },
    'bo-family-parade': {
      title: 'Le défilé civique',
      description: 'Votre enfant est choisi pour porter la bannière de l’école au défilé de l’indépendance, et vous filmez les quatre-vingt-dix secondes entières où on le voit.',
    },
    'bo-family-twins': {
      title: 'Des jumeaux',
      description: 'L’échographiste se tait, tourne l’écran vers vous, et lève deux doigts. Quatre grands-mères se mettent à tricoter simultanément dans quatre quartiers.',
    },
    'bo-fast-payday-1': {
      title: 'Jour de paie',
      description: 'Les heures supplémentaires apparaissent enfin dans l’enveloppe.',
    },
    'bo-fast-headhunted': {
      title: 'Approché',
      description: 'Une entreprise rivale s’est renseignée sur vous au salon professionnel, et l’appel arrive avec deux offres, une date limite, et votre salaire actuel déjà connu au centavo près.',
      reason: 'Approché pour autre chose',
    },
    'bo-fast-burnout': {
      title: 'Arrêt pour burn-out',
      description: 'Six semaines d’arrêt avec certificat médical, et l’enveloppe est nettement plus légère le jour où vous repassez la porte.',
      reason: 'Congé sans solde',
    },
    'bo-fast-payday-severance': {
      title: 'Paie de fin d’année',
      description: 'L’année s’achève, et ce que ce poste paie tombe une dernière fois sur votre compte avant que tout change encore.',
    },
    'bo-fast-reorg': {
      title: 'La réorganisation',
      description: 'Un consultant débarque pour une semaine, l’organigramme est redessiné en un week-end, et le lundi votre nom est dans une autre case avec un autre titre dessous. On ne vous a rien demandé ; on n’a rien demandé à personne.',
      reason: 'Réaffecté après réorganisation',
    },
    'bo-fast-brokerage': {
      title: 'L’appel du courtier',
      description: 'La prime vous démange, et le courtier laisse des messages vocaux avec des points d’exclamation dedans.',
    },
    'bo-fast-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois de passé, encore une enveloppe qui rentre.',
      harsher: {
        title: 'Prime reprise',
        description: 'La prime de l’an dernier est réévaluée par un auditeur d’une autre ville, et réévaluée à la baisse.',
        reason: 'Prime reprise',
      },
    },
    'bo-fast-retention': {
      title: 'Contre-offre',
      description: 'Vous glissez, l’air de rien, au déjeuner, que quelqu’un d’autre vous a contacté. La contre-offre arrive avant la soupe.',
    },
    'bo-midtown-brokerage': {
      title: 'La maison de courtage',
      description: 'Des écrans partout, une file de retraités au guichet, et un courtier qui jure que celle-ci est différente.',
    },
    'bo-midtown-insurance': {
      title: 'Agence d’assurance',
      description: 'Avant qu’on vous confie un trousseau de clés, quelqu’un aimerait vous parler garanties — et déroule une carte des risques de votre versant, complète, récente, et discrètement terrifiante.',
    },
    'bo-midtown-shared-purse': {
      title: 'La bourse commune',
      description: 'L’argent est mis en commun désormais : le salaire, la recette de l’étal, et l’enveloppe de dollars scotchée derrière l’armoire qui officiellement n’existe pas. Solder le mois est un sommet diplomatique.',
      reason: 'La bourse commune, soldée',
    },
    'bo-midtown-window': {
      title: 'La vitre cassée',
      description: 'Un ballon, la fenêtre du voisin, et un voisin qui reste extrêmement calme — ce qui, comme tout le quartier le sait, est bien pire.',
      reason: 'Ce qu’ils ont cassé, par enfant',
    },
    'bo-midtown-aguinaldo': {
      title: 'Décembre paie double',
      description: 'Le treizième salaire tombe avec les fêtes, calibré sur ce que chacun gagne plutôt que sur des promesses, et tout le pays fait ses courses le même week-end.',
    },
    'bo-midtown-raise': {
      title: 'Augmentation',
      description: 'Un mot discret près de l’ascenseur, un nouveau chiffre, et une poignée de main d’une fermeté exactement assortie en repartant.',
    },
    'bo-midtown-dollar-jump': {
      title: 'Le dollar s’envole',
      description: 'Le dollar cesse d’être un fait et devient une rumeur : le taux de la rue laisse le taux officiel derrière lui, et tout ce qui est importé change de prix avant jeudi.',
      reason: 'Tout ce qui est importé change de prix',
    },
    'bo-buying-walls': {
      title: 'Acheter les murs',
      description: 'Un samedi de visites, de la cour en adobe au cholet aux miroirs, avec tout le monde qui vous conseille en même temps. Ici, on achète d’abord les murs, et le rêve grandit d’un étage à la fois.',
    },
    'bo-risky-container': {
      title: 'Le pari du conteneur',
      description: 'Votre cousin connaît quelqu’un au port franc sur la côte, et vos économies remplissent un conteneur partagé.',
      reason: 'Le conteneur arrive',
    },
    'bo-risky-bad-tip': {
      title: 'Mauvais tuyau',
      description: 'La « valeur sûre » que vous aviez annoncée à toute la table pendant la soirée dés perd la moitié de sa valeur en une semaine, et l’honneur exige que vous offriez le dîner à tout le monde.',
      reason: 'Mauvais tuyau boursier',
    },
    'bo-risky-cacho': {
      title: 'Soirée dés',
      description: 'Le gobelet en cuir, cinq dés, et le jeu de bar national joué pour des enjeux amicaux — et vous sortez le quinté à l’instant précis où cela compte le plus.',
      reason: 'Gains de la soirée dés',
    },
    'bo-risky-boom-ends': {
      title: 'La fin du boom',
      description: 'La matière première dont dépend tout votre portefeuille passe de mode sur trois continents en un trimestre, et vous perdez de l’argent vite.',
      reason: 'La fin du boom',
    },
    'bo-risky-aftershock': {
      title: 'Réplique',
      description: 'Le marché trouve un plancher plus bas que personne ne le croyait possible, et il le trouve en un seul après-midi.',
      reason: 'Le marché rechute',
    },
    'bo-risky-lottery': {
      title: 'La loterie de Noël',
      description: 'Vous faites la queue au kiosque que tout le monde jure porte-bonheur, parce que le kiosque porte-bonheur est fameusement porte-bonheur.',
      reason: 'Le tirage de Noël',
    },
    'bo-risky-payday': {
      title: 'Jour de paie',
      description: 'L’argent du mois arrive pendant que vos placements font n’importe quoi.',
    },
    'bo-risky-swap': {
      title: 'Échange de fortunes',
      description: 'Une poignée de main sur un long déjeuner, une signature avant le café, et vous échangez votre solde bancaire avec celui du meneur.',
      reason: 'Un accord avec le meneur',
    },
    'bo-safe-market-timing': {
      title: 'L’arithmétique du marché',
      description: 'Vous savez quel après-midi les prix baissent, quel étal arrondit vers le bas, et quel vendeur vous doit un service. Cette semaine, ce savoir paie le panier entier.',
      reason: 'Connaître le marché',
    },
    'bo-safe-payday': {
      title: 'Jour de paie',
      description: 'L’argent du mois arrive le jour où il arrive toujours, et c’est tout l’intérêt.',
      harsher: {
        title: 'Salaire retenu',
        description: 'Une cellule dans un tableur quelque part fait que le salaire de ce mois-ci arrivera le mois prochain.',
        reason: 'Un mois de salaire retenu',
      },
    },
    'bo-safe-excess': {
      title: 'La franchise',
      description: 'La route prudente a ses formulaires de sinistre elle aussi, et les petits caractères du vôtre cachent une franchise — qui est loin d’être petite.',
      reason: 'Franchise d’assurance',
    },
    'bo-safe-notebook': {
      title: 'Le cahier de comptes',
      description: 'Vous tenez les comptes de la maison dans un cahier réglé pendant un an entier, colonne après colonne, et le cahier gagne tranquillement.',
      reason: 'Le cahier finit dans le vert',
    },
    'bo-safe-neighbour-repays': {
      title: 'Le voisin rembourse',
      description: 'Un prêt consenti dans une année difficile et jamais mentionné une seule fois retraverse la cour, enveloppé dans un linge, avec un gâteau posé dessus.',
      reason: 'Une vieille gentillesse revient',
    },
    'bo-safe-mattress-dollars': {
      title: 'L’enveloppe s’épaissit',
      description: 'Rien de spectaculaire : l’enveloppe de dollars scotchée derrière l’armoire s’épaissit tranquillement, comme depuis le jour où votre grand-mère vous a montré où la scotcher.',
      reason: 'Épargne tranquille',
    },
    'bo-safe-payday-2': {
      title: 'Jour de paie',
      description: 'Encore un mois, encore une liasse pliée tranquillement. La régularité est une stratégie.',
    },
    'bo-safe-dividend': {
      title: 'Jour de dividende',
      description: 'La moitié sage de votre portefeuille verse son sage petit chèque, plus la caisse offerte aux actionnaires par la brasserie.',
      reason: 'Dividende trimestriel',
    },
    'bo-sunset-number': {
      title: 'Le calcul du soir',
      description: 'Un soir, vous étalez tout sur la table : le relevé de retraite, ce que le commerce vaudrait, l’enveloppe de dollars. Le chiffre au bas de la feuille est plus petit que vous ne le craigniez — et il ne se retire pas tout seul.',
    },
    'bo-sunset-one-more-floor': {
      title: 'Encore un étage',
      description: 'Le maçon qui a fait le dernier étage appelle pour le suivant : les colonnes le supporteront, la vue serait magnifique, et il se trouve justement libre.',
    },
    'bo-sunset-storeroom-fire': {
      title: 'Le magasin',
      description: 'Dix ans de stock, un vieux fusible, et un magasin à refaire depuis les étagères.',
      reason: 'Incendie du magasin',
    },
    'bo-sunset-parents': {
      title: 'S’occuper des parents',
      description: 'Quelqu’un qui vous a autrefois porté sur quatre étages d’escaliers du marché a maintenant besoin d’être porté. Vous refuseriez de compter. La facture compte quand même.',
      reason: 'Aider un proche',
    },
    'bo-sunset-payday-1': {
      title: 'Jour de paie',
      description: 'L’une des toutes dernières enveloppes arrive.',
    },
    'bo-sunset-swap': {
      title: 'Échange de fortunes',
      description: 'Un dernier coup audacieux sur un très long déjeuner, et la fortune du meneur finit dans votre poche plutôt que dans la sienne.',
      reason: 'L’échange de dernière minute',
    },
    'bo-sunset-children-send': {
      title: 'Les enfants pourvoient',
      description: 'Chaque enfant devenu grand arrive au déjeuner du dimanche avec quelque chose pour la maison — et celle qui travaille à l’étranger vire sa part avec un message vocal plus long que le virement.',
      reason: 'De chaque enfant',
    },
    'bo-sunset-sticky': {
      title: 'Doigts collants',
      description: 'Autour du bon café, vous entreprenez de convaincre le meneur de vous céder sa plus belle histoire.',
      reason: 'Une histoire change de mains',
    },
    'bo-sunset-last-title': {
      title: 'Un dernier titre',
      description: 'L’association veut vous faire président d’honneur avant votre départ, si le vote passe.',
      reason: 'La dernière élection de votre vie',
    },
    'bo-sunset-payday-2': {
      title: 'Jour de paie',
      description: 'Vous avez cessé de compter les jours de paie il y a des années ; le calendrier, non.',
    },
    'bo-sunset-final-tax': {
      title: 'Dernier avis d’impôt',
      description: 'Une dernière enveloppe très formelle du fisc arrive avant que le rideau de fer descende pour de bon.',
      reason: 'Dernier avis d’imposition',
    },
    'bo-sunset-ahead': {
      title: 'Le couchant approche',
      description: 'Depuis le toit, la montagne vire au rose et à l’or au crépuscule, comme chaque soir où vous étiez trop occupé pour regarder.',
    },
    'bo-retirement': {
      title: 'Départ à la retraite',
      description: 'Vous rendez les clés — du bureau, de l’étal, ou des deux — vous êtes couvert de confettis par des gens qui vous aiment, et vous vous réveillez au premier lundi en quarante ans où vous n’êtes attendu nulle part.',
    },
  },

  lanes: {
    'University Lane': {
      name: 'Filière Université',
      summary: 'Cinq ans, un concours d’entrée, et une thèse soutenue devant toute votre famille endimanchée. Le prix, ce sont les années elles-mêmes, payées avant d’avoir gagné quoi que ce soit — et le titre qu’elles achètent précédera votre nom pour toujours. Fiable, jamais énorme.',
    },
    'Straight to Work': {
      name: 'Direct au marché',
      summary: 'Le marché vous prend le lundi et vous paie le vendredi, des années avant les étudiants. Aucun filet, et un métier qui est en réalité un commerce à trois tailles — le bas est du dur labeur, et le haut gagne plus que n’importe quel diplômé de cette table.',
    },
    'Payroll Road': {
      name: 'La voie salariée',
      summary: 'Rester déclaré. La retraite s’accumule, décembre paie double par la loi, et les augmentations viennent à l’ancienneté, lentement et sans faute. L’entreprise décide aussi dans quelle ville vous vivez.',
    },
    'Own-Account Alley': {
      name: 'À son compte',
      summary: 'Se mettre à son compte, comme la majorité du pays avant vous. Vous échangez la retraite contre le prix entier de votre propre travail — jubilatoire si le premier tirage était mauvais, vrai risque s’il ne l’était pas.',
    },
    'Family Lane': {
      name: 'Voie de la Famille',
      summary: 'Listes de rentrée, leçons de charango et une maison pleine de bruit, avec chaque enfant devenu grand qui rend quelque chose à la fin. Beaucoup moins de jours de paie, et chaque facture arrive multipliée.',
    },
    'Career Track': {
      name: 'Voie Rapide',
      summary: 'Les augmentations sont réelles, et les primes, le siège au conseil et le bureau d’angle avec vue sur la montagne aussi. Ce que vous avez laissé pour tout cela est écrit sur l’autre voie.',
    },
    'The Dollar Road': {
      name: 'La route du dollar',
      summary: 'Des conteneurs, de l’effet de levier, des dollars gardés sous le matelas et un cousin qui a un plan. Qui est derrière au moment de la maison devrait venir ici ; qui est devant devrait bien y réfléchir.',
    },
    'Steady Street': {
      name: 'Rue Tranquille',
      summary: 'Le cahier, la tontine, le dépôt à terme, et l’enveloppe scotchée derrière l’armoire. Personne ne s’est jamais enrichi ici, ni ruiné — ce qui vaut très cher quand on est déjà en tête.',
    },
  },

  careers: {
    'career-bo-market-runner': {
      title: 'Porteur au marché',
      description: 'Charrie les cageots avant l’aube, apprend par cœur tous les prix de la halle, et se voit confier trois étals à la fois dès sept heures.',
    },
    'career-bo-stall-holder': {
      title: 'Tenancière d’étal',
      description: 'A son propre étal, des habitués qui reçoivent le petit supplément à chaque vente, et une comptabilité mentale plus précise que n’importe quelle caisse.',
    },
    'career-bo-market-matriarch': {
      title: 'Matriarche de la halle',
      description: 'Tient toute une rangée du marché, fait banque pour la moitié, et règle des différends que personne n’aurait l’idée de porter ailleurs.',
    },
    'career-bo-saltena-junior': {
      title: 'Commis à la salteña',
      description: 'Arrivé à quatre heures, tout vendu à midi. Deux ans à pincer la pâte avant qu’on vous laisse approcher la recette du bouillon, qui est toute la raison d’être de la boutique.',
    },
    'career-bo-saltena-baker': {
      title: 'Artisan salteñero',
      description: 'Ferme une pâte qui retient une cuillerée de soupe sans fuir, et mange toujours debout et penché en avant — comme on apprend à le faire après la première chemise perdue.',
    },
    'career-bo-saltena-house-owner': {
      title: 'Patron de salteñería',
      description: 'Possède la file de fin de matinée de tout le quartier, et ferme à treize heures parce qu’il ne reste rien à vendre. Il ne reste jamais rien à vendre.',
    },
    'career-bo-grill-hand': {
      title: 'Commis au gril',
      description: 'Tient le gril de nuit au coin de la rue, lit la foule d’après-fête comme une carte météo, et ne fait jamais tomber une brochette.',
    },
    'career-bo-anticucho-cart': {
      title: 'Patron de charrette à brochettes',
      description: 'Pousse la charrette-gril au même coin à la tombée du jour et transforme brochettes de cœur de bœuf et sauce cacahuète en petite fête nocturne. La file d’attente est le dé.',
    },
    'career-bo-lunch-house-owner': {
      title: 'Patron de cantine',
      description: 'Sert un seul menu du jour, soupe d’abord, à une salle qui se remplit deux fois avant midi et demi. Les tours de bureaux se vident quotidiennement dans votre salle à manger.',
    },
    'career-bo-hod-carrier': {
      title: 'Porteur de briques',
      description: 'Monte briques et mortier à l’échelle toute la journée, à une altitude dont les équipes de football en visite se plaignent, et n’en parle jamais.',
    },
    'career-bo-bricklayer': {
      title: 'Maçon',
      description: 'Pose à l’œil, droite et de niveau, la brique rouge dont la moitié de la ville est faite, et laisse les fers du toit dressés — ici, chaque maison compte grandir d’un étage.',
    },
    'career-bo-master-builder': {
      title: 'Maître d’œuvre',
      description: 'Chiffre un immeuble entier sur une serviette en papier, le construit étage par étage à mesure que l’argent arrive, et ne s’est jamais trompé sur la serviette.',
    },
    'career-bo-fare-caller': {
      title: 'Crieur de minibus',
      description: 'Se penche par la portière coulissante en chantant tout l’itinéraire d’une seule traite, rend la monnaie d’un poing de pièces, et remplit le bus à la seule force de la voix.',
    },
    'career-bo-minibus-driver': {
      title: 'Chauffeur de minibus',
      description: 'Faufile quotidiennement un quatorze places transportant dix-neuf personnes dans des rues faites pour des ânes, à l’heure, avec un tableau de bord couvert de saints.',
    },
    'career-bo-route-owner': {
      title: 'Propriétaire de ligne',
      description: 'Possède quatre minibus sur la ligne la plus fréquentée de la ville et siège au conseil du syndicat des transports, qui décide plus de choses que la mairie.',
    },
    'career-bo-apprentice-mechanic': {
      title: 'Apprenti mécanicien',
      description: 'Trois ans à tendre au patron la bonne clé avant qu’il la demande, et le soupçon grandissant que les minibus se confient à vous.',
    },
    'career-bo-minibus-mechanic': {
      title: 'Mécanicien de minibus',
      description: 'Maintient en vie des fourgons de trente ans à des altitudes que leurs ingénieurs n’ont jamais imaginées, avec des pièces venues de trois continents et d’un seul tiroir.',
    },
    'career-bo-workshop-owner': {
      title: 'Patron d’atelier',
      description: 'Quatre ponts, une liste d’attente que tout le syndicat des transports respecte, et un mur de photos de véhicules arrivés au bout d’une corde.',
    },
    'career-bo-band-trumpeter': {
      title: 'Trompettiste de fanfare',
      description: 'Joue mariages, fêtes patronales et remises de diplômes à plein volume et à pleine altitude, et attend près du téléphone entre deux. La saison des fêtes est le dé.',
    },
    'career-bo-touring-band': {
      title: 'Musicien de tournée',
      description: 'Neuf départements, une caisse de vol cabossée, et un nom enfin imprimé sur l’affiche du festival — en petits caractères, mais imprimé.',
    },
    'career-bo-bandleader': {
      title: 'Chef d’orchestre',
      description: 'Dirige soixante musiciens dont le son arrive une rue entière avant eux, et réserve le carnaval deux ans à l’avance.',
    },
    'career-bo-radio-runner': {
      title: 'Assistant de radio',
      description: 'Va chercher le café, lance les dédicaces, trie les messages des auditeurs, et apprend tranquillement comment se dirige une station avant que quiconque songe à le lui cacher.',
    },
    'career-bo-morning-host': {
      title: 'Animateur de la matinale',
      description: 'Réveille la moitié de la ville à cinq heures avec les prix du marché, les fêtes patronales et les dédicaces, et se fait reconnaître partout à la voix et nulle part au visage.',
    },
    'career-bo-station-owner': {
      title: 'Patron de station',
      description: 'Possède la fréquence sur laquelle tous les minibus de la ville sont réglés, et vend la publicité du matin à la minute, en liquide, à une file d’attente.',
    },
    'career-bo-second-shooter': {
      title: 'Second photographe',
      description: 'Couvre le fond de la salle et l’instant exact où le parrain de la fête cesse de faire semblant de ne pas pleurer.',
    },
    'career-bo-fiesta-photographer': {
      title: 'Photographe de fiesta',
      description: 'Août est réservé deux ans à l’avance, et le carême n’apporte aucun travail — le calendrier des fêtes est le dé, et les parrains décident de l’année.',
    },
    'career-bo-import-stall-trader': {
      title: 'Revendeur d’import',
      description: 'Vend de l’électronique depuis un étal de deux mètres de large, sait exactement ce que chaque article a coûté à importer, au centavo près, et casse les prix des boutiques rien qu’en le sachant.',
    },
    'career-bo-container-importer': {
      title: 'Importateur au conteneur',
      description: 'Prend le bus de nuit jusqu’au port franc sur la côte, remplit un conteneur à l’instinct, et découvre au marché si l’instinct tenait.',
    },
    'career-bo-galleria-owner': {
      title: 'Propriétaire de galerie marchande',
      description: 'Possède la galerie que louent les étals, trois étages, bâtie une bonne année après l’autre. Une forte saison d’import en porte trois calmes.',
    },
    'career-bo-depot-hand': {
      title: 'Manutentionnaire à la brasserie',
      description: 'Empile jusqu’au plafond les caisses de la bière nationale toute la journée, et sait chiffrer une fiesta rien qu’à la taille de sa commande.',
    },
    'career-bo-depot-foreman': {
      title: 'Chef de dépôt',
      description: 'Fait tourner un entrepôt grand comme un stade avec des porte-blocs et des surnoms criés, et n’a jamais perdu une seule caisse.',
    },
    'career-bo-kennel-assistant': {
      title: 'Assistant de chenil',
      description: 'Des serviettes, des friandises, et le sang-froid de ne pas bouger pendant qu’un tout petit chien en pull tricoté très chaud décide ce qu’il pense de vous.',
    },
    'career-bo-pet-groomer': {
      title: 'Toiletteur',
      description: 'Toilette les chiens de salon choyés du sud verdoyant de la ville, dont chacun possède plus de tricots que la plupart des gens.',
    },
    'career-bo-football-coach': {
      title: 'Entraîneur du club de foot',
      description: 'Mène les entraînements du samedi sur un terrain à quatre kilomètres d’altitude, où les équipes en visite suffoquent et où vos gamins, non. Il n’y a pas de promotion là-dedans, et il n’y en a jamais eu.',
    },
    'career-bo-quinoa-farmer': {
      title: 'Cultivatrice de quinoa',
      description: 'Plante les rangs de ses voisins la semaine où ils plantent les siens — l’entraide rendue en entraide, la plus vieille banque de la montagne — et a éconduit trois fois les hommes de l’export, chaque fois plus poliment.',
    },
    'career-bo-surgical-resident': {
      title: 'Interne en chirurgie',
      description: 'Six ans de gardes au CHU, d’écarteurs tenus, et l’apprentissage de ce que veut dire opérer là où l’air lui-même est rare.',
    },
    'career-bo-hospital-surgeon': {
      title: 'Chirurgien hospitalier',
      description: 'Opère à une altitude que les manuels de médecine évoquent à peine, avec des mains sûres — et des médecins viennent du monde entier étudier comment le corps fonctionne ici.',
    },
    'career-bo-junior-associate': {
      title: 'Collaborateur junior',
      description: 'Lit neuf cents pages d’un litige foncier pour qu’un associé puisse lire le seul paragraphe qui tranche, dans un cabinet au-dessus de la vieille place.',
    },
    'career-bo-corporate-lawyer': {
      title: 'Avocat d’affaires',
      description: 'Conclut les contrats de la ceinture du soja dans la ville en plein boom des basses terres, où l’argent est neuf, les costumes bien coupés, et les contrats très longs.',
    },
    'career-bo-architectural-assistant': {
      title: 'Assistant d’architecte',
      description: 'Dessine onze fois l’escalier de la salle de bal pour une cliente qui sait exactement ce qu’elle veut, et apprend plus de la onzième que des dix premières.',
    },
    'career-bo-new-andean-architect': {
      title: 'Architecte néo-andin',
      description: 'Dessine des façades vertes et dorées que la vieille école juge impossibles et que toute la ville haute trouve désormais parfaitement normales. Vos bâtiments se voient depuis le téléphérique, et c’est bien l’idée.',
    },
    'career-bo-junior-developer': {
      title: 'Développeur débutant',
      description: 'Corrige le petit bug dont personne ne voulait, et le documente si soigneusement que le correctif devient le guide d’intégration des nouveaux.',
    },
    'career-bo-software-engineer': {
      title: 'Ingénieur logiciel',
      description: 'Livre du code pour des clients à trois fuseaux horaires depuis un bureau avec vue sur la montagne, et prend les réunions à l’heure que les clients croient qu’il est.',
    },
    'career-bo-field-agronomist': {
      title: 'Agronome de terrain',
      description: 'Arpente les rangs de soja jusqu’à l’horizon avec un carnet et une trousse à sol, et annonce la récolte à deux pour cent près rien qu’à l’odeur du champ.',
    },
    'career-bo-seed-agronomist': {
      title: 'Agronome semencier',
      description: 'Sélectionne la variété que la moitié des basses terres plantera la saison prochaine, et en répond personnellement à chaque ferme de trois provinces.',
    },
    'career-bo-junior-geologist': {
      title: 'Géologue débutant',
      description: 'Décrit des carottes sur un salar si vaste et si blanc que l’horizon disparaît, et considère cela comme le meilleur bureau de l’hémisphère.',
    },
    'career-bo-lithium-geologist': {
      title: 'Géologue du lithium',
      description: 'Lit la saumure sous le plus grand salar du monde, où une fraction non négligeable de chaque batterie future est pour l’instant un étang parfaitement immobile.',
    },
    'career-bo-microcredit-analyst': {
      title: 'Analyste microcrédit',
      description: 'Arpente les rangées du marché en évaluant des prêts sur un stock que personne n’a jamais écrit nulle part, et a raison plus souvent que les modèles de garantie.',
    },
    'career-bo-microfinance-manager': {
      title: 'Directeur de microfinance',
      description: 'Dirige l’agence qui banque les étals que les grandes banques n’ont jamais appris à voir, et connaît le commerce de chaque emprunteur mieux que sa famille.',
    },
    'career-bo-junior-civil-engineer': {
      title: 'Ingénieur civil débutant',
      description: 'Vérifie les plans de buses d’une route de montagne, et apprend que dans ces montagnes, c’est souvent la roche qui donne tort au plan.',
    },
    'career-bo-highway-engineer': {
      title: 'Ingénieur routier',
      description: 'Construit des routes qui descendent deux kilomètres à la verticale en un après-midi, et a mis à la retraite celle que les guides appelaient la plus dangereuse du monde.',
    },
    'career-bo-research-assistant': {
      title: 'Assistant de recherche',
      description: 'Compte des choses dans une eau très froide et très haute pour l’article de quelqu’un d’autre, et adore chaque minute.',
    },
    'career-bo-lake-biologist': {
      title: 'Biologiste du lac Titicaca',
      description: 'Étudie le plus haut grand lac du monde et sa grenouille géante, qui respire par la peau et n’est pressée par absolument rien.',
    },
    'career-bo-stringer-journalist': {
      title: 'Pigiste',
      description: 'Écrit à la pièce depuis là où se trouve l’actualité, et le mois paie ce que l’actualité a décidé de faire. Certaines semaines le téléphone ne s’arrête pas ; d’autres, il ne démarre pas.',
    },
    'career-bo-foreign-correspondent': {
      title: 'Correspondant',
      description: 'Explique les Andes à trois rédactions étrangères à la fois, chacune payant à l’article, aucune sur le même bouclage. La signature est la partie stable ; le revenu, c’est le dé.',
    },
    'career-bo-veterinarian': {
      title: 'Vétérinaire',
      description: 'Réduit la patte d’un lama le matin et celle d’un chien de salon l’après-midi, et n’échangerait ce cabinet contre une chaîne de cabinets à aucun prix imaginable.',
    },
    'career-bo-university-professor': {
      title: 'Professeur d’université',
      description: 'Donne cours le mardi, siège aux soutenances le vendredi devant des familles entières en larmes, et a refusé deux fois le décanat.',
    },
  },

  houses: {
    'house-bo-adobe-village-house': {
      name: 'Maison d’adobe au village',
      description: 'D’épais murs de brique de terre qui gardent la chaleur du jour toute la nuit, une cour, et une vue sur les montagnes qui ne se répète jamais deux fois.',
    },
    'house-bo-red-brick-starter': {
      name: 'Maison de brique rouge',
      description: 'Un étage fini et des fers à béton dressés pleins d’espoir sur le toit — pas inachevée, ambitieuse. Ici, chaque maison compte grandir.',
    },
    'house-bo-suburban-row-house': {
      name: 'Maison mitoyenne de banlieue',
      description: 'Deux étages sur la plus récente rocade de la ville, identique à ses voisines jusqu’au portail, avec un manguier plus vieux que toute la rue.',
    },
    'house-bo-colonial-courtyard': {
      name: 'Appartement colonial sur cour',
      description: 'La moitié d’une maison coloniale blanchie à la chaux, plus ancienne que la république, enroulée autour d’une cour commune, avec des balcons que le service du patrimoine essaie toujours de réglementer.',
    },
    'house-bo-shopfront-house': {
      name: 'Maison avec boutique',
      description: 'Vous vivez à l’étage ; le rez-de-chaussée est une boutique qui se paie toute seule. Le trajet fait un escalier, et le bâtiment part travailler avec vous.',
    },
    'house-bo-lakeside-villa': {
      name: 'Villa au bord du lac',
      description: 'Vous réveille avec le plus haut grand lac du monde à la fenêtre, des barques de roseaux à l’aube, et un air si clair que la rive d’en face semble à portée de main.',
    },
    'house-bo-garden-estate': {
      name: 'Propriété de la vallée',
      description: 'En bas, dans la vallée du printemps éternel : un jardin clos qui donne des fruits toute l’année, une longue véranda, et une table faite pour des histoires qui grandissent à chaque fois qu’on les raconte.',
    },
    'house-bo-canyon-ridge-house': {
      name: 'Maison sur la crête',
      description: 'Du verre sur trois côtés dans le profond canyon sud de la ville, des aiguilles de roche couleur de lune en contrebas, et une allée si longue que chaque invité plaisante sur la montée.',
    },
    'house-bo-cholet-crown': {
      name: 'La couronne du cholet',
      description: 'Six étages de vert et d’or en miroir : des boutiques en bas, une salle de bal à lustres réservée tous les week-ends, et votre propre maison posée sur le toit comme une couronne.',
    },
  },

  stocks: {
    'stock-bo-brewery': {
      name: 'Brasserie des Hauts Plateaux',
      description: 'La bière que verse chaque fête du pays, à toute altitude, à chaque remise de diplôme. Voilà tout l’argumentaire, et il n’a jamais raté.',
    },
    'stock-bo-cement': {
      name: 'Ciments du Condor',
      description: 'Un pays qui bâtit ses maisons un étage à la fois, à mesure que l’argent arrive, n’arrête jamais d’acheter du ciment. Ennuyeux, magnifique, ensaché par millions.',
    },
    'stock-bo-costume-works': {
      name: 'Ateliers de Costumes de Fête',
      description: 'Brode les grands défilés de carnaval de paillettes et de fil d’or. À une année record de la gloire, à une saison noyée sous la pluie d’un entrepôt bien plein.',
    },
    'stock-bo-quinoa-export': {
      name: 'Coopérative d’Export du Quinoa Royal',
      description: 'Nourrit les bols de petit-déjeuner du monde depuis les hauts plateaux — tant que les pluies et les modes alimentaires de trois continents se tiennent bien.',
    },
    'stock-bo-lithium': {
      name: 'Lithium du Salar',
      description: 'La moitié de chaque batterie future dort sous le salar sous forme de saumure. Soit la plus grande réussite économique du siècle pour le pays, soit le bassin d’évaporation le plus photogénique du monde.',
    },
  },

  lifeTiles: {
    'tile-bo-marathon-3600': { title: 'Couru un marathon à 3 600 mètres' },
    'tile-bo-altiplano-novel': { title: 'Publié un roman des hauts plateaux' },
    'tile-bo-plaza-dog': { title: 'Adopté un chien de la place' },
    'tile-bo-sandboard-dunes': { title: 'Appris le surf des dunes' },
    'tile-bo-potato-plot': { title: 'Lyophilisé votre propre récolte de pommes de terre' },
    'tile-bo-saltena-contest': { title: 'Gagné le concours de salteñas' },
    'tile-bo-choro-trail': { title: 'Parcouru la route inca jusqu’à la jungle' },
    'tile-bo-charango-album': { title: 'Enregistré un album de charango' },
    'tile-bo-cable-car-day': { title: 'Pris toutes les lignes du téléphérique en un jour' },
    'tile-bo-street-food-fame': { title: 'Votre étal au journal du matin' },
    'tile-bo-titicaca-triathlon': { title: 'Terminé le triathlon du lac Titicaca' },
    'tile-bo-animal-refuge': { title: 'Bénévole au refuge animalier' },
    'tile-bo-api-stand': { title: 'Tenu le stand de boisson chaude tout l’hiver' },
    'tile-bo-el-alto-mural': { title: 'Peint une fresque dans la ville haute' },
    'tile-bo-salar-flight': { title: 'Survolé le salar en petit avion' },
    'tile-bo-minibus-radio': { title: 'Lancé l’émission que passent tous les minibus' },
    'tile-bo-solar-heater': { title: 'Breveté un chauffe-eau solaire de toit' },
    'tile-bo-cacho-league': { title: 'Gagné la ligue de dés du quartier' },
    'tile-bo-market-kitten': { title: 'Sauvé un chaton du toit du marché' },
    'tile-bo-huayna-potosi': { title: 'Gravi le sommet de 6 000 mètres d’à côté' },
    'tile-bo-artisan-ceramics': { title: 'Vos céramiques ont fait salle comble' },
    'tile-bo-barrio-team': { title: 'Entraîné l’équipe de foot du quartier' },
    'tile-bo-cumbia-hit': { title: 'Écrit une cumbia que tout le pays fredonne' },
    'tile-bo-record-potato': { title: 'Fait pousser une pomme de terre record' },
    'tile-bo-friends-startup': { title: 'Financé la start-up d’un ami des basses terres' },
    'tile-bo-vintage-jeep': { title: 'Restauré une vieille jeep pour le salar' },
    'tile-bo-carnaval-dancer': { title: 'Dansé le grand défilé du carnaval' },
    'tile-bo-chairo-cookoff': { title: 'Gagné le concours de soupe trois ans de suite' },
    'tile-bo-titicaca-sail': { title: 'Traversé le lac Titicaca à la voile' },
    'tile-bo-plaza-garden': { title: 'Replanté le jardin de la place' },
    'tile-bo-puppy-litter': { title: 'Recueilli six chiots d’un coup' },
    'tile-bo-bunuelo-morning': { title: 'Fait des beignets pour toute la fête de quartier' },
    'tile-bo-weaving-class': { title: 'Donné un cours de tissage complet' },
    'tile-bo-cordillera-hike': { title: 'Parcouru toute la cordillère Blanche' },
    'tile-bo-town-cinema': { title: 'Rouvert le cinéma du quartier' },
    'tile-bo-yungas-orchid': { title: 'Donné son nom à une orchidée de la forêt de nuages' },
  },

  economy: {
    tuitionNotes: [
      'La prépa au concours ne fonctionne vraiment qu’à la deuxième tentative, et l’année supplémentaire de matériel et de frais de vie s’ajoute par-dessus.',
      'Cinq ans de prépa, de photocopies, de matériel et la soutenance reviennent exactement au budget prévu.',
      'Une bourse de l’université publique couvre une plus grosse part des cinq ans que prévu.',
      'Exonération totale — les cinq années entières, effacées, et la famille organise la fête quand même.',
    ],
    marriage: {
      rescued: 'Oui à la deuxième tentative — et l’installation se fait avec les traites encore dues sur un pick-up importé, et une attitude très détendue à leur sujet.',
      outcomes: [
        'La fiesta a duré un deuxième jour et réclamé une deuxième fanfare, et la générosité des parrains s’est épuisée quelque part vers le feu d’artifice.',
        'Une cérémonie civile, une bénédiction à l’église, et un long déjeuner. Les parrains ont couvert le gâteau, l’orchestre et la salle, et les enveloppes ont couvert le reste.',
        'Deux revenus sous le même toit — et il s’avère que l’étal de votre conjoint dégage discrètement plus que votre salaire.',
        'Tout le village descend de la campagne, chaque parrain surenchérit sur le précédent, et votre conjoint tient une tontine d’une main de fer depuis l’école.',
      ],
    },
  },
}
