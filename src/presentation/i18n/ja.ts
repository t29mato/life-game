import type { UiOverlay } from './en'

/**
 * LIFE JOURNEY — the interface in Japanese.
 *
 * Same rule the Japan board's own overlay states in its header, applied to
 * the chrome: write the sentence the English was *reaching for*, in the words
 * the thing is actually called, and let the explanation go. "Hall of Records"
 * is 殿堂, not 「記録の殿堂」; "Paid by the die" is 「出目で決まる給料」, not a
 * gloss of the mechanic. A label that has to explain itself is a label that
 * has not been translated yet.
 *
 * Plain form (常体), short sentences, no 敬語 anywhere. A board game printed
 * in Japanese does not address its players in polite form — it states things.
 * The one exception is that a *question* keeps its question mark, because the
 * setup flow is genuinely asking.
 *
 * Two things are deliberately left in English: the wordmark LIFE JOURNEY —
 * it is a logo, not a sentence — and the key names Enter / Space, which are
 * what is physically printed on the keys.
 */
export const JA: UiOverlay = {
  common: {
    close: '閉じる',
    back: 'もどる',
    backToTitle: 'タイトルへ',
    continue: 'つづける',
    gotIt: 'わかった',
    settings: '設定',
    cpu: 'CPU',
    human: '人間',
    empty: '空',
    turn: (turn) => `${turn}ターン目`,
  },

  format: {
    /*
     * 「1位」 is already the whole phrase — the rank and the word "place" in
     * two characters — which is why `ordinalPlace` below hands it straight
     * back rather than appending anything. English needs "1st place" because
     * "1st" alone does not say what it is first *at*; Japanese does not.
     */
    ordinal: (n) => `${n}位`,
    ordinalPlace: (ordinal) => ordinal,
    unit: (raw) => (raw === 'payday' ? '給料日' : raw === 'month' ? '月' : raw === 'share' ? '株' : raw),
    salary: (money, period) => `${money}／${period}`,
    range: (low, high) => `${low}〜${high}`,
    onTheDie: (range) => `${range}、ダイス次第`,
    dateLocale: 'ja-JP',
    unknownTime: '時刻不明',
    unknownDate: '日付不明',
  },

  app: {
    log: 'ログ',
    save: 'セーブ',
    quit: 'やめる',
    settings: '設定',
    gameBoard: 'ゲーム盤',
    computerTag: '・コンピュータ',
    playersMove: (name) => `${name}の番`,
    chooseSaveSlot: 'セーブ先を選ぶ',
    slot: (n) => `スロット${n}`,
    slotDetail: (turn, names) => `${turn}ターン目・${names.join('、')}`,
    autosaveHint: (slot) => `毎ターン、スロット${slot}に自動保存される。`,
    forkAhead: '分かれ道。この一回しで道が決まる',
    onRoad: (road) => `${road}を進んでいる — もう一度まわして進む距離を決める`,
    rollAgainHint: 'もう一度まわして進む距離を決める',
  },

  title: {
    eyebrow: '運と野心のボードゲーム',
    tagline: 'サイコロを振って、コマを進めて、自慢できる人生を組み立てる。',
    continue: 'つづきから',
    newGame: 'はじめから',
    handbook: 'ハンドブック',
    hallOfRecords: '殿堂',
    whatsNew: '更新履歴',
    continueAria: '保存したゲームを続ける',
    continueAriaEmpty: 'つづきから：保存データはまだない',
    hint: '三つ選べば、もう盤の上。',
    hintEmpty: '保存データはまだない。三つ選べば、もう盤の上。',
    buildTitle: 'このビルドの元になったコミット',
    defaultPlayerName: (n) => `プレイヤー${n}`,
  },

  step: {
    back: 'もどる',
    of: (step, count) => `ステップ${step}／${count}`,
  },

  backTo: {
    title: 'タイトルへもどる',
    saves: 'セーブ一覧へもどる',
    players: 'プレイヤーにもどる',
    country: '国にもどる',
    life: '人生の選択にもどる',
    difficulty: '難易度にもどる',
  },

  players: {
    heading: 'だれが遊ぶ？',
    lead: '席は二つから四つ。名前をつけて、コマを選んで、好きな席はコンピュータに任せられる。',
    next: '次は国',
    chooseToken: 'コマを選ぶ',
    count: (n, max) => `${n} / ${max}`,
    nameLabel: (n) => `プレイヤー${n}の名前`,
    colourLabel: (n) => `プレイヤー${n}の色`,
    seatTypeLabel: (n) => `プレイヤー${n}の席の種類`,
    recentLabel: (n) => `プレイヤー${n}の最近の顔ぶれ`,
    recent: '最近',
    removeLabel: (n) => `プレイヤー${n}を外す`,
    addPlayer: '席を足す',
  },

  country: {
    heading: 'どの国で生きる？',
    lead: '国ごとに数える通貨も、払われる賃金もちがう。どの盤も、まるごと一つのゲーム。',
    next: '次は難易度',
    nextLife: '次はどの人生か',
    groupLabel: '版',
    cardAria: (name, blurb) => `${name}版。${blurb}`,
    countsIn: (symbol) => `${symbol}で数える`,
    blurb: (symbol, start) => `${symbol}で数える — 手持ち${start}から。`,
    blurbWithSalaries: (symbol, start, low, high, period) =>
      `${symbol}で数える — 手持ち${start}から。賃金は${period}あたり${low}〜${high}。`,
    alsoResearcher: '研究者の盤もある。',

    tableCaption: '国の盤の比べもの：手持ち、賃金、研究者の盤の有無',
    columnCountry: '国',
    columnStart: '手持ち',
    columnSalaries: '賃金',
    columnResearcher: '研究者の盤',
    researcherYes: 'あり',
    /*
     * 「なし」ではなく「まだ」。三つの国は研究者の盤がまだ書かれていないだけで、
     * 次のステップが出てこない理由はそれ以上でも以下でもない。
     */
    researcherNotYet: 'まだ',
  },

  life: {
    heading: (place) => `${place}で、どの人生を？`,
    lead: (place) =>
      `同じ国、同じ通貨で、生き方だけがちがう。どちらもまるごと一つのゲームで、${place}はどちらでも${place}らしく回る。`,
    next: '次は難易度',
    groupLabel: '人生',
    classicName: 'いつもの人生',
    classicHint: (place) => `${place}を、書かれたとおりに`,
    classicDetail: (salaries) => `進学か就職か、仕事、家、家族。${salaries}`,
    researcherName: '研究者の人生',
    researcherHint: '同じ国、ちがう仕事',
    researcherDetail: (place, salaries) =>
      `同じ${place}の盤で、研究の道を行く。職も分かれ道も別物で、賭ける相手もちがう。${salaries}`,
    cardAria: (name, place, detail) => `${place}の${name}。${detail}`,
    salariesRun: (low, high, period) => `賃金は${period}あたり${low}〜${high}。`,
    careersUnwritten: 'この盤の職はまだ書かれていない。',
  },

  difficulty: {
    heading: 'どれだけ厳しい人生に？',
    lead: '同じ盤を、やさしくも、むごくも。下の数字はどれも実際に回して測ったもの。',
    start: 'ゲーム開始',
    groupLabel: '難易度',
    normalLabel: 'ノーマル',
    normalHint: 'まっとうな人生',
    normalDetail: 'ふつうの道のり。つまずきはあるが、身を持ち崩すほどではない。',
    normalAria: 'ノーマル：つまずきはあるが、身を持ち崩すほどではない',
    hardLabel: 'ハード',
    hardHint: '金が回らない',
    hardDetail: 'つまずきはノーマルの倍。十人に一人はマイナスのまま引退する。',
    hardAria: 'ハード：つまずきは倍、十人に一人はマイナスのまま引退する',
    veryHardLabel: 'ベリーハード',
    veryHardHint: '生き延びれば勝ち',
    veryHardDetail:
      'ほぼ毎ターンつまずく。黒字で終われるかどうかはコイン投げに近い。何か残して引退できたら、それはもう自慢していい。',
    veryHardAria: 'ベリーハード：黒字で終われるかどうかはコイン投げに近い',
    playtime: (span, seats) => `${seats}で、だいたい${span}分。`,
    humanSeats: (n) => `人間${n}席`,
    cpuSeats: (n) => `CPU${n}席`,
    seatJoin: (parts) => parts.join('と'),
  },

  continueStep: {
    heading: 'つづきから',
    lead: '途中で置いていった卓を、どれでも拾い上げられる。',
    autosave: '自動保存',
    slot: (n) => `スロット${n}`,
    empty: '空',
    emptyAria: (title) => `${title}、空`,
    occupiedAria: (title, names, edition, turn, saved) =>
      `${title}を続ける：${names.join('と')}${
        edition === null ? '' : `、${edition}の盤`
      }、${turn}ターン目、保存 ${saved}`,
    players: (names) => names.join('・'),
    meta: (edition, turn, saved) =>
      `${edition === null ? '' : `${edition}・`}${turn}ターン目・${saved}`,
  },

  board: {
    captionGraduate: '卒業',
    captionMarried: '結婚',
    captionBaby: '出産',
    captionNewHome: '新居',
    captionRetire: '引退',
    captionStart: 'スタート',
    recentreTo: (name) => `${name}の車にもどる`,
    recentreActive: '動いている車にもどる',
    theBoard: '盤の上',
    carOn: (car, space) => `${car}、${space}にいる`,
    zoomGroup: '地図の拡大',
    zoomIn: '拡大',
    zoomOut: '縮小',
    zoomReset: '全体表示にもどす',
  },

  passengers: {
    partner: '連れ合いを隣に',
    children: (n) => `子ども${n}人`,
    alone: (name) => `${name}、ひとりで運転中`,
    with: (name, seats) => `${name}、${seats.join('と')}乗せて運転中`,
  },

  wheel: {
    spin: 'まわす',
    spinning: 'まわっている…',
    spinWithLast: (last) => `まわす — 前回は ${last}`,
    clickToSpin: 'クリックでまわす',
    tapToSpin: 'タップでまわす',
    spaceKey: 'Space',
    landedOn: (face) => `${face}で止まった`,
  },

  moveCounter: {
    aria: (n) => `残り${n}マス`,
    toGo: 'マス',
  },

  turn: {
    playersTurn: (name) => `${name}の番`,
    imReady: '準備できた',
    showEveryTurn: '毎ターン表示する',
  },

  legend: {
    kind: '盤の読み方',
    title: '一つの絵に、一つの意味',
    lede:
      'この盤の印は、どれも意味がひとつだけ。ここに全部ある。出てくるのはこの一度きりで、控えはハンドブックにある。',
    coinName: 'コイン',
    coinRule: '給料日。止まっても、通り過ぎても給料が入る。',
    upName: '上向きの矢印',
    upRule: 'お金が入る。',
    downName: '下向きの矢印',
    downRule: 'お金が出る。',
    triangleName: '三角',
    triangleRule: '災難 — 暴落、火事、修理代。',
    bankName: '銀行',
    bankRule: '借りるか、返すか。市場ではない。',
    chartName: 'チャート',
    chartRule: '市場。買える株と、受け取る配当。',
    shieldName: '盾',
    shieldRule: '保険と、それが守ってくれる範囲。',
    starName: '星',
    starRule: 'LIFEタイル。思い出の一枚で、最後に本物の金額になる。',
    milestonesName: '節目の絵',
    milestonesRule: '角帽、ハート、ベビーカー、家、夕日。このゲームが描く五つの瞬間。',
    stripeName: '赤白のしま',
    stripeRule:
      'このマスは必ず起きる。止まっても、通り過ぎても。中にはそこでターンを止めてしまうものもある。',
    gainName: '緑の切り口',
    gainRule: 'もらえるマス。',
    costName: '赤の切り口',
    costRule: '払うマス。',
    choiceName: '紫の切り口',
    choiceRule: '何かを訊かれる。家か、ローンか、仕事か。',
    milestoneName: '金の縁',
    milestoneRule: '人生の節目。紙吹雪つき。',
  },

  tile: {
    kindStart: 'スタート',
    kindNormal: 'マス',
    kindPayday: '給料日',
    kindEvent: '節目',
    kindStop: '決断',
    kindRetirement: '引退',
  },

  effect: {
    none: 'なにも起きない。',
    payEach: (amount) => `他の全員に${amount}`,
    collectFromEach: (amount) => `他の全員から${amount}`,
    payPerChild: (amount) => `子ども一人につき${amount}`,
    collectPerChild: (amount) => `子ども一人につき${amount}`,
    stockDividend: (amount) => `持ち株一株につき${amount}`,
    insurable: (amount) => `${amount} — 保険に入っていればゼロ`,
    payday: '給料。止まっても通り過ぎても入る。',
    payRaise: '給料が上がる。',
    promotion: '昇進をかけて振る。届かなければ昇給で済む。',
    tradeYear: 'その道の一年をダイスで。当たり年が外れ年の損を埋める。',
    chooseCareer: '新しい仕事。どれになるかはダイスが決める。',
    careerChangeForced: '転職。これは断れない。',
    careerChangeOffered: '別の職を二つ提示される。今の仕事に残るのも答え。',
    loseCareer: '失業。次のフェアで拾われるまで収入はない。',
    tuitionFree: 'ゼロ',
    graduate: '卒業。これ以降のフェアは大卒の梯子から配られる。',
    doctorate: '博士号と、それで開く職の棚。',
    getMarried: 'プロポーズをダイスで決着。決まれば全員から祝儀。',
    household: '共同口座をダイスで清算。既婚者だけ。',
    haveChildren: (children, gifts) => `${children}、そして祝いに${gifts}`,
    childCount: (n) => `子ども+${n}人`,
    /*
     * 「子ども+1人」と言い切れるのは、どの目でも同じ数だけ来る場合だけ。
     * 六分の二の目で誰も来ない盤で言い切れば、マスが果たせない約束になる。
     */
    childrenOnTheDie: (least, most, gifts) =>
      `出目次第で子ども${least}〜${most}人、祝いは最大${gifts}`,
    divorce: (amount) => `別れ話：${amount}、子どもは相手についていく。`,
    buyHouse: '家を買う。ターンはここで止まる。',
    upgradeHouse: '持ち家があるなら、もっといい家に買い替え。',
    buyStock: '市場の言い値で株が買える。',
    buyInsurance: '保険。この盤のいちばん悪いマスに備えて。',
    bank: (principal) => `銀行：${principal}借りるか、ローンを返すか。`,
    lifeTiles: (n) => `LIFEタイル +${n}`,
    stealLifeTile: 'LIFEタイルを一番持っている人から一枚もらう。',
    swapMoneyWithLeader: '先頭の人と財布ごと取り替える。',
    retire: '道の終わり。一番乗りが一番大きいボーナス。',
    retireEarly: 'その額さえ持っていれば、何十年も早く働くのをやめられる。',
  },

  card: {
    milestone: '人生の節目',
    passing: '通りがかり',
    rolled: '出目',
    paid: '支払い',
    borrowed: '借入',
    loanTerms: (loans, amount) => `ローン${loans}件 — 引退時に${amount}返済`,
    continue: 'つづける',

    /*
     * 表の見出しが「通過」と言うので、各行はマスの名前だけでいい。行ごとに
     * 「〜を通過」と書き足すのは、見出しを行の数だけ写しているのと同じ。
     */
    passedAria: 'ここに来るまでに通り過ぎたもの',
    passedColumn: '通過',
    amountColumn: '金額',
    passedLabel: (title, times) => `${title}${times > 1 ? ` ×${times}` : ''}`,
  },

  decision: {
    kindBranch: '分かれ道',
    kindHouse: '家探し',
    kindStock: '取引所',
    kindInsurance: '保険窓口',
    kindBank: '銀行',
    kindRetire: 'その額',
    kindValueSpin: 'ダイス',
    theComputer: 'コンピュータ',
    isChoosing: (name) => `${name}が考えている…`,
    thinking: '思案中 — 操作は要らない。',
    browse: 'で移動',
    choose: 'で決定',
    or: 'または',
    enterKey: 'Enter',
    spaceKey: 'Space',
    per: (unit) => `${unit}あたり`,
    lanePaydayHeavy: '給料日が多い',
    laneEventHeavy: 'イベントが多い',
    laneMixed: 'ほどよく混在',
  },

  spin: {
    passingThrough: '通りがかり',
    theWheel: 'ルーレット',
  },

  rollTable: {
    caption: 'ダイスの目ごとに何がもらえるか',
    roll: '出目',
    career: '職業',
    per: (period) => `${period}あたり`,
    rung: '段',
    outcome: '結果',
  },

  log: {
    panel: 'ゲームログ',
    heading: 'ログ',
    close: 'ログを閉じる',
    empty: 'まだ何も起きていない。',
    upset: '番狂わせ',
  },

  strip: {
    aria: 'プレイヤー — 詳しい状況を開く',
    worth: '資産',
    retired: '引退',
    status: '状況',
    rankOn: (ordinal, worth) => `純資産${worth}で${ordinal}`,
    cash: (amount) => `現金${amount}`,
    loansToSettle: (loans, amount) => `ローン${loans}件、清算に${amount}`,
    plusTheRest: 'ほかに家・株・タイル・家族',
    breakdownJoin: (parts) => parts.join('／'),
    loansTitle: (loans, amount) => `ローン${loans}件 — 引退時に${amount}返済`,
  },

  panel: {
    unemployed: '無職',
    nowPlaying: '手番',
    retired: '引退',
    retiredRank: (rank) => `引退 #${rank}`,
    cash: '現金',
    netWorth: '純資産',
    sameAsCash: '現金と同じ',
    worthTitle:
      '現金に家・株・LIFEタイル・子どもボーナスを足して、ローンの返済を引いた額 — いまゲームが終わったときの得点',
    onAverage: (salary) => `${salary}（平均）`,
    fixedPayNote: (title) => `${title}：給料日ごとに同じ額。`,
    variablePayNote: (title, perPip) => `${title}：給料日ごとに、出目1につき${perPip}。`,
    casualNote: (perPip) => `無職のあいだ：給料日ごとに、出目1につき${perPip}。`,
    casualShifts: (perPip) => `日雇い：出目1につき${perPip}`,
    graduate: '大卒',
    married: '既婚',
    tiles: (n) => `タイル${n}枚`,
    kids: (n) => `子ども${n}人`,
    loans: (n) => `ローン${n}件`,
    shares: (n) => `${n}株`,
    atRetirement: (amount) => `引退時に${amount}`,
    loanTitle: (principal, payoff) => `借入${principal}・引退時に${payoff}`,
    policy: (kind) => `${kind}保険`,
  },

  status: {
    heading: 'プレイヤーの状況',
    aria: 'プレイヤーの状況',
    playerAria: (name) => `${name}の状況`,
    computer: 'コンピュータ',
    nowPlaying: '手番',
    retired: '引退',
    retiredRank: (rank) => `引退 #${rank}`,
    netWorth: '純資産',
    ifGameEndedNow: 'いま終わったとしたら',
    fullBreakdown: '内訳をすべて見る',
    ledgerCaption: (name) => `${name}の純資産の内訳`,
    holdingColumn: '持ちもの',
    worthColumn: '評価額',
    insured: '加入中',
    cash: '現金',
    house: (name) => `家 — ${name}`,
    sharesLine: '株 — 配当の幅の真ん中で見積もり',
    stockLine: (name, ticker, shares) => `${name}（${ticker}） — ${shares}株`,
    lifeTilesLine: (n) => `LIFEタイル — ${n}枚`,
    childrenLine: (n) => `子ども — ${n}人、最後の一振りの平均で`,
    loansLine: (n) => `ローン — ${n}件、引退時に清算`,
    unemployed: '無職',
    casualShifts: '日雇い',
    single: '独身',
    married: '既婚',
    graduate: '大卒',
    children: (n) => `子ども${n}人`,
    shares: (n) => `${n}株`,
    lifeTiles: (n) => `LIFEタイル${n}枚`,
    loans: (n) => `ローン${n}件`,
  },

  results: {
    eyebrow: '最終順位',
    heading: 'ゲーム終了',
    playAgain: 'もう一度',
    tableAria: '最終順位',
    personalBest: '自己ベスト',
    firstGame: '殿堂の一戦目。',
    newHighScore: (total) => `この卓の新記録 — ${total}。`,
    firstWin: (name) => `${name}、初勝利。`,
    personalBestFor: (name) => `${name}の自己ベスト。`,
    cash: '現金',
    lifeTiles: 'LIFEタイル',
    house: '家',
    shares: '株',
    insurance: '保険',
    kids: '子ども',
    retirement: '引退',
    loans: 'ローン',
  },

  records: {
    eyebrow: 'この卓が遊んだ全試合',
    heading: '殿堂',
    emptyTitle: 'まだ一戦も終わっていない',
    emptyBody:
      '一局まるごと遊べば、殿堂が結果を覚えている — 誰が、どれだけの差で、どれだけの時間で勝ったか。最初のコマが引退マスを越えたら、また来てほしい。',
    tableLeaders: '卓の勝ち星',
    winsAria: 'プレイヤー別の勝ち星',
    historyAria: '対戦の記録',
    wins: (n) => `${n}勝`,
    turns: (n) => `${n}ターン`,
  },

  notes: {
    eyebrow: 'ここまでに変わってきたこと',
    heading: '更新履歴',
    historyAria: 'バージョンの履歴',
    version: (version) => `バージョン ${version}`,
    whatsNew: '新しく入ったもの',
    changed: '変わったもの',
    fixed: '直したもの',
  },

  manual: {
    eyebrow: '箱の中身、ぜんぶ説明',
    heading: 'ハンドブック',
    contentsAria: '目次',
    contentsTurns: 'ターン',
    contentsBoard: '盤',
    contentsCareers: '職業',
    contentsGlossary: '用語',
    turnHeading: 'ターンの流れ',
    boardHeading: '盤の読み方',
    marksHeading: '印の意味',
    careersHeading: '世界の職業',
    careersLede:
      'どの盤のどの職も、梯子ごとに、一国ずつ。フェアが雇うのは一番左の段だけで、その上は自分で登る。',
    pickCountry: '国を選ぶ',
    editionCareers: (name) => `${name}の職業`,
    editionMeta: (symbol, trades) => `${symbol}で数える・${trades}職`,
    wordsHeading: 'このゲームの言葉',

    step1Title: 'ダイスを振る',
    step1Body:
      'ターンは必ず一振りから、1から6。分かれ道だけは二回振る。一回目が道を決め — 1〜3で片方、4〜6でもう片方 — 二回目がその道をどこまで進むかを決める。',
    step2Title: '道を進む',
    step2Body:
      '通り過ぎただけの給料日や節目も、ちゃんと起きる。止まる場所に着く前に、通りがかりに一枚ずつカードが出る。',
    step3Title: '止まったマスを片づける',
    step3Body:
      '止まったマスが動き出す。お金が動くか、ダイスが何かを決めるか、本物の決断を突きつけられるか。',
    step4Title: 'ダイスを次へ',
    step4Body:
      '全員のコマが引退にたどり着くまで、順に回る。そこで点数の清算 — 家も株もLIFEタイルも入れて。',

    kindPaydayName: '給料日',
    kindPaydayRule: '止まっても、そのまま通り過ぎても給料が入る。',
    kindMilestoneName: '節目',
    kindMilestoneRule: '止まっても通り過ぎても起きる。大きな出目を途中で切ることはない。',
    kindOrdinaryName: 'ふつうのマス',
    kindOrdinaryRule: 'コマが実際に止まったときだけ何かが起きる。',
    kindStopName: '停止',
    kindStopRule: '歩数が余っていても必ずここで止まる。じっくり考える価値のある決断が待っている。',
    kindRetirementName: '引退',
    kindRetirementRule: '道の終わり。着いたコマは引退する。一番乗りが一番大きいボーナス。',

    poolBasicLabel: 'フェアから直接',
    poolBasicHint: '学位は要らない',
    poolGraduateLabel: '大卒の棚',
    poolGraduateHint: '学位が要る',
    poolDoctorateLabel: '博士の棚',
    poolDoctorateHint: '博士号が要る',

    tagCalling: '天職',
    tagRung: (rung, height) => `${height}段中${rung}段目`,
    tagPaidByDie: '出目で決まる給料',
    climbOn: (spin) => `${spin}以上で`,

    glossaryLadderTerm: '梯子',
    glossaryLadderMeaning:
      '段で書かれた職 — 見習い、スタイリスト、店のオーナー。フェアが雇うのは一番下の段だけ。その上は査定のたびに登るもので、上の段ほど大きな出目が要る。',
    glossaryCallingTerm: '天職',
    glossaryCallingMeaning:
      '上に段がない仕事。昇りもしないし、失業に奪われることもない。査定のたびに、肩書きの代わりにLIFEタイルがつく。',
    glossaryTilesTerm: 'LIFEタイル',
    glossaryTilesMeaning:
      '道すがら拾う思い出 — 完走したフルマラソン、書き上げた小説、引き取った犬。どれも最後の清算で本物の金額になる。',
    glossaryPerPipTerm: '出目で決まる給料',
    glossaryPerPipMeaning:
      'いい週も悪い週もある仕事がある。この印のついた職は、決まった給料ではなく、給料日ごとに出目×レートで払われる。表示されている賃金は、その平均。',
    glossaryDegreeTerm: '学位',
    glossaryDegreeMeaning:
      '大学レーンの賞品。学費は先払いで、卒業後のフェアはすべて大卒の梯子から配られる — 請求書と引き換えの底上げ。',
    glossarySeniorityTerm: '年功',
    glossarySeniorityMeaning:
      '失業で失うのは一段だけで、登った分が丸ごと消えるわけではない。次のフェアは、稼いだ段の一つ下から雇ってくれる — 別の職に移っても。',
    glossaryNumberTerm: 'その額',
    glossaryNumberMeaning:
      '決まったマスで十分な現金を持っていれば、何十年も早く働くのをやめられる。そんなに早く引き出すことの代償を、ダイスで問われる。',
  },

  editions: {
    usa: 'アメリカ',
    bolivia: 'ボリビア',
    france: 'フランス',
    india: 'インド',
    japan: '日本',
    'japan-researcher': '研究者 — 日本',
    'france-researcher': '研究者 — フランス',
  },

  families: {
    kitchen: '食と市場',
    field: '畑と収穫',
    works: '職人と運輸',
    office: '机と帳簿',
    studio: '工房と舞台',
    care: 'ケアと診療',
    science: '実験室と発射台',
    pitch: 'スポーツの道',
  },

  insurance: {
    home: '住宅',
    auto: '自動車',
    life: '生命',
  },

  settings: {
    heading: '設定',
    escHint: 'Escで閉じる。',
    language: '言語',
    languageAria: '言語',
  },

  audio: {
    group: '音の設定',
    music: '音楽',
    sfx: '効果音',
    on: 'オン',
    off: 'オフ',
  },

  update: {
    ready: '新しいバージョンが用意できている。',
    action: '更新する',
  },

  coin: {
    you: '自分',
  },
}
