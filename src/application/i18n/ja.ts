import type { NarrationOverlay } from './en'

/**
 * LIFE JOURNEY — the engine's own sentences, in Japanese.
 *
 * The same rule the Japan board's overlay states and the chrome catalogue
 * repeats: write the sentence the English was *reaching for*, in the words the
 * thing is actually called, and let the explanation go. 「ルーレットが回った」
 * over a wheel already on screen is narrating the furniture; 「出た目のぶんだけ
 * 稼いだ」 is the news.
 *
 * Plain form (常体), short sentences, no 敬語. A board game printed in Japanese
 * does not address its players politely — it states things.
 *
 * The one exception is the line under an *option*, which is the only place the
 * game speaks to the player rather than about them — "keep the cash", "borrow
 * this and pay that back". Those take です・ます, because that is what a rule
 * card sounds like in Japanese and 常体 aimed at a reader reads as barking.
 * The rule is the register, not the key: a stakes line printed over the wheel
 * is narration and stays 常体 even though it sits on an option, and a
 * description that continues the *edition's* own sentence keeps the edition's
 * voice. A decision prompt keeps its question mark, because it is asking.
 *
 * ## The three voices, kept apart
 *
 * The English keeps a narration, a log line and a chip in three different
 * registers, and so does this:
 *
 * - **Narration** (`…Narration`) is the host at the table. It gets the joke,
 *   the exclamation, the sentence a player actually reads. 「おめでとう」
 *   「一気に上だ」
 * - **A log line** (`…Log`) is a ledger somebody skims later. Third person,
 *   体言止め where it tightens, no exclamation, ends flat. 「マトが4を出して
 *   昇進、月給42万円。」
 * - **A note** (`…Note`) is a chip. No sentence around it, no verb where a
 *   noun will do. 「退職順 2位」
 *
 * A translation that flattens the three into one polite register has lost the
 * thing that made the English readable, even if every word is correct.
 *
 * ## What is not translated
 *
 * The wordmark LIFE JOURNEY, and LIFE tile — both are printed on the physical
 * pieces this board imagines. Money never passes through here at all: every
 * figure arrives already formatted by the edition's own `CurrencySpec`.
 */
export const JA: NarrationOverlay = {
  common: {
    spin: 'まわす',
    someone: 'あるプレイヤー',
  },

  format: {
    /*
     * The edition names its salary period in English; this is where that name
     * becomes a word a Japanese reader has. 'payday' is 給料日 rather than a
     * gloss of the mechanic, and an unrecognised unit falls through unchanged
     * so a country shipping a new period reads in English rather than blank.
     */
    unit: (raw) => (raw === 'payday' ? '給料日' : raw === 'month' ? '月' : raw === 'share' ? '株' : raw),
    /*
     * 「◯あたり」 rather than 「◯給」. The unit is edition data and can be
     * either 給料日 or 月, and while 「月35万円」 is natural, 「給料日$121,400」
     * is not Japanese at all. 「あたり」 takes both without reading as a
     * translation, which is the whole bargain of a parameterised entry.
     */
    perPeriod: (money, unit) => `${unit}あたり${money}`,
    everyPeriod: (money, unit) => `${unit}あたり${money}。`,
    paydayReceipt: (rate, periods, unit, total) => `${rate}×${periods}${unit}＝${total}`,
    paydayWorking: (rate, periods, unit) => `${rate}×${periods}${unit}`,
    raiseFlat: (newSalary) => `給料が${newSalary}に上がった`,
    /*
     * The English opens on the edition's own adjective ("Monthly pay up …").
     * Japanese builds it off the period noun instead — 月給, 年収 — so the
     * adjective is not used here. It stays in the signature because the
     * catalogue's shape is the English one and a locale may not change it.
     */
    raiseByPeriod: (_adjective, delta, rate, unit) => `${unit}の給料が${delta}上がって、${rate}に`,
  },

  roll: {
    breaksEven: 'ちょうどゼロ',
    fullRide: '全額免除',
    missed: '今回は無し',
    rungOf: (rung, height) => `${height}段中${rung}段目`,
    noChild: '今年は子どもなし',
    oneChild: (gift) => `子ども1人、祝い金＋${gift}`,
    twins: (gift) => `双子、祝い金＋${gift}`,
    manyChildren: (children, gift) => `子ども${children}人、祝い金＋${gift}`,
  },

  landing: {
    quietNarration: (name) => `${name}にとっては静かな一区間。景色でも眺めていればいい。`,
    landsOnLog: (name, title) => `${name}が${title}に止まる。`,
  },

  money: {
    gainBigNarration: (amount, name) => `${amount}が${name}の懐へ。これは順位が動く。`,
    gainNarration: (name) => `そのまま${name}の懐へ。`,
    lossBigNarration: (amount, name) => `いたい。${amount}が${name}の財布から出ていった。`,
    lossNarration: (name) => `${name}は払って、そのまま歩き出す。`,
    log: (name, reason, amount) => `${name}：${reason}（${amount}）`,
  },

  payday: {
    salaryNarration: (name) => `給料日。${name}は封筒を持って退社。`,
    salaryLog: (name, receipt) => `${name}が給料を受け取る：${receipt}。`,
    casualStakes: '無職の期間。日雇いで食いつなぐ。',
    unsteadyStakes: (trade) => `${trade}。稼げる週と稼げない週がある。`,
    yourTrade: 'この商売',
    cardTitle: '給料日',
    waitingNarration: (name) => `${name}が今週の稼ぎを決めにいく。`,
    waitingLog: (name) => `${name}の給料はルーレット待ち。`,
    casualRateNote: (perPip) => `無職の日雇い。出た目1につき${perPip}。`,
    tradeRateNote: (trade, perPip) => `${trade}。出た目1につき${perPip}。`,
    casualNarration: (name) => `空いた日もなし。${name}は入る仕事を全部拾った。`,
    unsteadyNarration: (name) => `${name}の今週はこれだけ。来週はまた別の数字になる。`,
    casualLog: (name, spin, amount) => `${name}が日雇いで働く。${spin}が出て${amount}。`,
    unsteadyLog: (name, spin, amount) => `${name}が給料を受け取る。${spin}が出て${amount}。`,
    /*
     * 「◯回ぶん」 rather than the English "3x": a sweep past three paydays is
     * three separate weeks, and Japanese counts them with a counter rather
     * than a multiplication sign.
     */
    passedSalaryLog: (name, times, receipt, balance) =>
      `${name}が給料日を${times > 1 ? `${times}回ぶん` : ''}通過：${receipt}。残高${balance}。`,
    passedCasualLog: (name, times, spins, amount, balance) =>
      `${name}が給料日を${times > 1 ? `${times}回ぶん` : ''}通過。日雇いで${spins}を出して${amount}。残高${balance}。`,
    passedUnsteadyLog: (name, times, spins, amount, balance) =>
      `${name}が給料日を${times > 1 ? `${times}回ぶん` : ''}通過。${spins}を出して${amount}。残高${balance}。`,
    /*
     * 「4」「3と8」「3、8、2」 — Japanese lists with 、 and needs no word for
     * "and" before the last item, so the English three-way split collapses to
     * two cases.
     */
    spinList: (spins) => (spins.length === 1 ? `${spins[0]}` : spins.join('、')),
  },

  raise: {
    noJobNarration: (name) => `職がないのに昇給もない。${name}、次の就職フェアに期待だ。`,
    noJobLog: (name) => `${name}はまだ無職なので、昇給はない。`,
    narration: (name) => `${name}が昇給。ここから先の給料日は全部これになる。`,
    logWithNote: (name, note) => `${name}：${note}。`,
    logFlat: (name, salary) => `${name}の給料が${salary}に上がる。`,
  },

  tuition: {
    narration: (name) => `${name}が学費の請求書を開く。`,
    log: (name) => `${name}がルーレットへ。学費はいくらになるか。`,
    cardTitle: '学費の請求',
    fullRideNote: '学費なし。全額免除。',
    billLog: (name, spin, bill) => `${name}が${spin}を出す。学費は${bill}。`,
    billCharged: (amount) => amount,
    billPaid: (amount) => `むしろ${amount}の支給`,
    billFullRide: '全額免除',
  },

  promotion: {
    noJobNarration: (name) => `職がなければ昇進もない。${name}、まずは就職から。`,
    noJobLog: (name) => `${name}は無職なので、査定するものがない。`,
    callingNote: (title) => `${title}の上に役職はない。最初からそういう仕事だ。`,
    callingNarration: (name) =>
      `${name}に昇進はない。それがこの仕事で、それでいい。かわりにLIFEタイルと昇給。`,
    callingLog: (name, title, pay) => `${name}が${title}としての腕を上げる：LIFEタイル1枚、給料は${pay}。`,
    topNarration: (name) => `${name}はもう自分が上。だから自分で数字を書き換える。`,
    topLog: (name, title, pay) => `${name}は${title}として既に頂点。給料が${pay}に上がる。`,
    stakes: (reason, needed, faces, nextTitle) =>
      `${reason} ${faces}面のうち${needed}以上で${nextTitle}に昇進。外しても昇給はある。`,
    narration: (name) => `${name}の査定の日。`,
    log: (name, nextTitle) => `${name}の査定。${nextTitle}の席がかかっている。`,
    cardTitle: '査定',
    raiseAnywayNote: (salary) => `昇給はあり：${salary}`,
    missedNarration: (name) => `${name}、今回は見送り。ただし部屋を出るときに昇給の話はついてくる。`,
    missedLog: (name, spin, nextTitle, pay) =>
      `${name}が${spin}を出して${nextTitle}を逃す。給料は${pay}に。`,
    doubleNarration: (name, title) =>
      `最高目。一段飛ばしで${name}は${title}。会議室の全員が何が起きたのか分かっていない。`,
    promotedNarration: (name, title) => `昇進。${name}は今日から${title}だ。`,
    promotedLog: (name, spin, title, pay) => `${name}が${spin}を出して${title}に昇進：${pay}。`,
  },

  lifeTile: {
    narration: (name) => `${name}がLIFEタイルを1枚。最後の集計で全部効いてくる。`,
    log: (name, titles) => `${name}がLIFEタイルを獲得：${titles}。`,
  },

  school: {
    degreeNote: '学位を取得',
    degreeNarration: (name) => `帽子が宙を舞う。${name}は卒業生、大きな仕事の口が開いた。`,
    degreeLog: (name) => `${name}が卒業し、学位を取得。`,
    doctorateNote: '博士号を取得',
    doctorateNarration: (name) => `${name}博士。長い年月だった。他の誰にもできない仕事が開いている。`,
    doctorateLog: (name) => `${name}が博士号を取得。`,
  },

  career: {
    betweenJobsIncome: (wage) => `いまは無職で、日雇いは出た目1につき${wage}です。`,
    currentIncome: (money, unit, title) => `いまは${title}で、${unit}あたり${money}もらっています。`,
    fairPrompt: '進む道を選ぶ',
    fairPromptWithIncome: (income) => `進む道を選ぶ。${income}`,
    fairNarration: (name) => `${name}、机の上に内定が二つ。どちらが自分のものか、まわして決めよう。`,
    fairLog: (name) => `${name}が職を決めるためにまわす。`,
    gateStakes: 'ほとんどの人は通らない。',
    stayLabel: (title) => `${title}を続ける`,
    stayCallingDescription: 'これが天職です。引き抜きの話は他の人に回してもらいましょう。',
    stayDescription: '仕事も、いまの段も、上に残っている段も、そのままです。',
    crossingLine: '入口が二つ。どちらもこれまでの年数を数えてくれない。',
    sameLevelLine: '別の商売が二つ、いまと同じ段で迎えてくれる。',
    gatePrompt: (gate, income) => `全国で二つだけの席。審査は${gate}以上で通る。${income}`,
    offerPrompt: (opening, income) => `${opening} ${income}`,
    forcedPrompt: (income) => `仕事が変わる。次を選ぶ。${income}`,
    gateMissNote: '外しても何も変わらない。仕事も、段も、金もそのまま。',
    crossingNote: '採るのは一番下の段だけ。そこしか空いていない。',
    sameRungNote: '今日の段も金も同じ。ただし上に伸びる梯子が別物になる。',
    gateNarration: (name) => `席は二つ、審査は一度、応募は全国から。${name}がそこに座る。`,
    offerNarration: (name) => `${name}の前に内定が二つ。どちらも取れとは誰も言っていない。`,
    forcedNarration: (name) => `新しい話が来た。${name}は好むと好まざるとにかかわらず転職だ。`,
    gateLog: (reason, name) => `${reason} ${name}が試験を受ける。`,
    offerLog: (reason, name) => `${reason} ${name}が内定を二つ天秤にかける。`,
    forcedLog: (reason, name) => `${reason} ${name}は新しい職を選ばされる。`,
    stayCardTitle: '残留',
    stayNote: (title, pay) => `${title}のまま、${pay}。`,
    stayNarration: (name) => `${name}は両方断る。ここが気に入っているし、上にはまだ道がある。`,
    stayLog: (name, title) => `${name}は${title}のまま。`,
    gateMissCardTitle: '結果',
    gateMissEmployedNote: (title, pay) => `${title}のまま、${pay}。`,
    gateMissJoblessNote: '無職のまま。来年また受けられる。',
    gateMissNarration: (name) => `今回は無し。合格者は貼り出され、そこに${name}の名前はない。他は何も変わらない。`,
    gateMissLog: (name, spin) => `${name}が${spin}を出して不採用。`,
    hiredCardTitle: '転職',
    switchedNarration: (name, previous, title) =>
      `古い名刺は捨てる。${name}は${previous}の暮らしを畳んで${title}になった。`,
    hiredNarration: (name, title) => `${name}が${title}として採用。ここから給料日が数え始める。`,
    hiredLog: (name, spin, title) => `${name}が${spin}を出して${title}になる。`,
  },

  layoff: {
    noJobNarration: (name) => `持っていない職は失えない。${name}は肩をすくめて歩き出す。`,
    noJobLog: (name) => `${name}はもとから無職。`,
    callingNote: (title) => `${title}のまま。これは誰にも取り上げられない。`,
    callingNarration: (name) => `${name}は解雇できない。これは天職で、返す社員証もない。`,
    callingLog: (name, title) => `${name}は${title}という天職を失わない。`,
    permanentNote: (title) => `${title}のまま。終身の職とはこういうことだ。`,
    permanentNarration: (name) => `通知が建物を一周して${name}の扉で止まる。この席は雇う側が終わらせられない。`,
    permanentLog: (name, title) => `${name}は${title}の終身職を守る。`,
    note: (lost, perPip) => `${lost}ではなくなった。日雇いは出た目1につき${perPip}。`,
    narration: (name) =>
      `解雇。${name}は無職になった。ここから給料日は日雇いで、いい週かどうかはルーレットが決める。`,
    log: (name, lost) => `${name}が${lost}の職を失う。`,
  },

  marriage: {
    alreadyNarration: (name) => `${name}にはもう相手がいる。幸せそうな二人に手を振って通り過ぎる。`,
    alreadyLog: (name) => `${name}はすでに結婚している。`,
    stakes: (needed, faces) =>
      `${faces}面のうち${needed}以上で、その場で「はい」。下回っても、もう一度だけ優しく聞ける。`,
    narration: (name) => `${name}が片膝をつく。`,
    log: (name) => `${name}がルーレットへ。結婚できるか。`,
    cardTitle: '結婚式',
    refusedNote: (spin) => `もう一度聞いて${spin}。今年も、来年もない。`,
    refusedSecondNote: '独身。この先の道は全部自分のもの。子どもも、ファミリーレーンも、その上のボーナスも、まだ全部開いている。',
    refusedNarration: (name) =>
      `${name}に式はない。そのぶん一年を丸ごと自分に使って、話としてはそちらの方がよほど面白い。`,
    refusedLog: (name, asked, askedAgain) =>
      `${name}が${asked}と${askedAgain}を出す。結婚はなし、かわりにLIFEタイル1枚。`,
    rescuedNote: (spin) => `もう一度聞いて${spin}。今度は、はい。`,
    giftNote: (payer, gift) => `${payer}がご祝儀${gift}。`,
    windfallNote: (amount) => `収入が二つ：${amount}`,
    costNote: (amount) => `一式の請求：${amount}`,
    costlyNarration: (amount, name) => `${name}、結婚。そしてもう${amount}の赤字だ。そこは誰も教えてくれない。`,
    quietNarration: (name) => `${name}に結婚の鐘。小さな式だったが、とても幸せな式だった。`,
    lavishNarration: (name) => `${name}、今年一番の式だ。この卓の全員が費用を持つ。`,
    marriedNarration: (name) => `${name}に結婚の鐘。他の全員、ご祝儀袋を出すこと。`,
    costlyLog: (name, amount) => `${name}が結婚し、${amount}のマイナス。`,
    marriedLog: (name) => `${name}が結婚。`,
  },

  household: {
    singleNarration: (name) => `今月の金について、${name}は誰にも説明しなくていい。`,
    singleLog: (name) => `${name}は自分にだけ責任がある。`,
    stakes: (reason) => `${reason} 二人ぶんの収入に対する、二人ぶんの支出。`,
    narration: (name) => `${name}が共同口座の明細を開く。`,
    log: (name) => `${name}がルーレットへ。共同口座はどうだったか。`,
    cardTitle: '共同口座',
    downNarration: (name) => `${name}、連れ合いが買い物に行っていた。今月はこれで終わりだ。`,
    evenNarration: '共同口座は出発点ぴったりに着地。この言い争いに勝者はいない。',
    upNarration: (name) => `${name}、収入が二つ、しかも今月は当たり。悪くない。`,
    downLog: (name, spin, amount) => `${name}の共同口座が凹む。${spin}が出て${amount}。`,
    upLog: (name, spin, amount) => `${name}の家計が浮く。${spin}が出て${amount}。`,
  },

  tradeYear: {
    noJobNarration: (name) => `${name}にはこの一年を過ごす商売がない。その一年は他の誰かに起きる。`,
    noJobLog: (name) => `${name}は無職なので、この一年は素通り。`,
    stakes: (reason, title) => `${reason} 別の仕事の話は来ていない。この仕事で、${title}としてもう一年。`,
    narration: (name) => `${name}がこの一年の商売を振り返る。`,
    log: (name) => `${name}がルーレットへ。どんな一年だったか。`,
    cardTitle: '商売の一年',
    noTradeNarration: (name) => `${name}にはこの一年を過ごす商売がない。`,
    sameRungNote: (title) => `${title}のまま、同じ段。`,
    goodLog: (name, title, spin, amount) => `${name}は${title}としていい年。${spin}が出て${amount}。`,
    badLog: (name, title, spin, amount) => `${name}は${title}として悪い年。${spin}が出て${amount}。`,
  },

  baby: {
    stakes: '今年、家族が増えるかどうか。',
    narration: (name) => `${name}がルーレットへ。来年この家にいるのは誰か。`,
    log: (name) => `${name}が新しい家族のためにまわす。`,
    cardTitle: '出産',
    /*
     * The house rule, carried over intact: state it, do not soften it. No
     * 「残念ながら」, no consolation. Two faces in six are a year in which no
     * child arrived, which is a thing that happens and is not a losing roll.
     */
    noneNarration: '今年は子どもなし。家の大きさは変わらない。',
    noneLog: (name) => `${name}に今年は子どもなし。`,
    noneSpunLog: (name, face) => `${name}が${face}を出す。今年は子どもなし。`,
    oneNarration: (name) => `おめでとう、${name}。家族が増えた。`,
    twinsNarration: (name) => `一度に二人。${name}の家族が一気に大きくなった。`,
    arrivalNote: (children) => `子ども＋${children}人`,
    giftNote: (gift) => `祝い金${gift}`,
    arrivedLog: (name, children, gift) => `${name}に子どもが${children}人、祝い金${gift}。`,
    arrivedSpunLog: (name, face, children, gift) =>
      `${name}が${face}を出す。子どもが${children}人、祝い金${gift}。`,
  },

  house: {
    buyPrompt: 'いま家を買って、引退時に売る',
    keepRentingLabel: 'いまは借家のまま',
    keepRentingDescription: '現金を手元に残します。引退時に売るものは持ちません。',
    optionDescription: (description, resale) => `${description} 引退時の売値は${resale}。`,
    huntNarration: (name) => `${name}、家を見に行く時間だ。玄関をひとつ選ぼう。`,
    huntLog: (name) => `${name}が家を探している。`,
    noneToUpgradePrompt: '買い替える家がない。まず一軒目を買って、引退時に売る？',
    noneToUpgradeNarration: (name) => `買い替える家がまだない。かわりに買いに行こう、${name}。`,
    noneToUpgradeLog: (name) => `${name}は買い替える家がないので、家探しへ。`,
    bestNarration: (name) => `これ以上いい家はない。${name}はもう町で一番いい住所を持っている。`,
    bestLog: (name) => `${name}はすでに最上の家を持っている。`,
    upgradePrompt: (current) => `${current}から買い替える？ 高い家ほど高く売れる`,
    stayLabel: (current) => `${current}に住み続ける`,
    stayDescription: 'いまの家のままです。引退時の売値も変わりません。',
    tradeInNote: (current, price) => `${current}は買い替えに${price}ぶん充てられる。`,
    upgradeNarration: (name) => `${name}、買い替えの時期だ。どうする。`,
    upgradeLog: (name) => `${name}に上の家の話が来る。`,
    cardTitle: '家探し',
    boughtCardTitle: '新居',
    stayNarration: (name, house) => `${name}は${house}が十分気に入っている。ありがたいことに。`,
    keepRentingNarration: (name) => `${name}は借家のまま。その現金は他で効くかもしれない。`,
    stayLog: (name, house) => `${name}は${house}に住み続ける。`,
    keepRentingLog: (name) => `${name}はいまは借家のまま。`,
    tradeInCreditNote: (price) => `前の家は${price}で下取り。`,
    tradedUpNarration: (name, previous, house) => `暮らしが一段上がる。${name}は${previous}から${house}へ。`,
    boughtNarration: (name, house) => `${name}が${house}の鍵を受け取る。ついに自分の家だ。`,
    tradedUpLog: (name, house) => `${name}が${house}に買い替える。`,
    boughtLog: (name, house) => `${name}が${house}を買う。`,
  },

  stock: {
    optionLabel: (name, ticker) => `${name}（${ticker}）`,
    optionDescription: (description, low, high) => `${description} 引退時に1株あたり${low}〜${high}。`,
    shareUnit: '株',
    declineLabel: '現金のままにする',
    declineDescription: '何も使いません。引退時に入ってくるものもありません。',
    prompt: 'いま買って、引退時に受け取る？',
    narration: (name) => `${name}、取引所が開いている。ひと勝負どうだ。`,
    log: (name) => `${name}に株の話が来る。`,
    cardTitle: '取引所',
    declinedNarration: (name) => `${name}は金を懐に入れたまま。そうしていて損をした者はいない。`,
    declinedLog: (name) => `${name}は株を見送る。`,
    boughtNote: (shares) => `${shares}株を購入。`,
    payoutNote: (low, high) => `1株は引退時に${low}〜${high}で現金化される。`,
    boughtNarration: (name, ticker) => `${name}が${ticker}を買った。慧眼か蛮勇かは引退時に分かる。`,
    boughtLog: (name, shares, ticker, cost) => `${name}が${ticker}を${shares}株、${cost}で買う。`,
    dividendNoneNarration: (name) => `配当の日。ただし${name}は一株も持っていない。受け取るものはなし。`,
    dividendNoneLog: (name) => `${name}は株を持っていないので、配当はなし。`,
    dividendNote: (shares, perShare) => `${shares}株 × ${perShare}`,
    dividendNarration: (name, payout) => `配当の日。${name}の持ち株が${payout}を吐き出す。`,
    dividendLog: (name, shares, payout) => `${name}が${shares}株ぶんの配当を受け取る：${payout}。`,
  },

  insurance: {
    policyLabel: (kind) => (kind === 'home' ? '火災保険' : kind === 'auto' ? '自動車保険' : '生命保険'),
    /*
     * English needs a lowercase form for mid-sentence use; Japanese does not
     * inflect a noun for its position, so this hands back the same word. The
     * key stays because the *English* sentence needs the distinction.
     */
    policyInline: (kind) => (kind === 'home' ? '火災保険' : kind === 'auto' ? '自動車保険' : '生命保険'),
    hazard: (hazard) => (hazard === 'fire' ? '火事' : '事故'),
    troubleFire: '火事',
    troubleCrash: '事故',
    oddsFire: '一生に一度も遭わない人がほとんどです',
    oddsCrash: '遭う人はそれなりにいます',
    coverNone: (trouble) => `この先に${trouble}で請求してくるマスはありません。もう通った道への保険になります。`,
    coverAhead: (count, worst, trouble, odds) =>
      `この先、${trouble}で最大${worst}を請求してくるマスが${count}か所あります。${odds}。保険料はどちらにしても払います。`,
    lifeFund: (floor, ceiling) => `保険というより積立です。最後にルーレットで決まり、${floor}から${ceiling}のあいだ。`,
    declineLabel: '賭けに出る',
    declineDescription: '保険料は払いません。たいていの人生は無事に済み、済まなかった人生は全額を払います。',
    prompt: 'いま保険料を払うか、起きたときに全額払うか',
    narration: (name) => `${name}、保険の窓口が開いている。いまの保険料が後で大金を救うかもしれない。`,
    log: (name) => `${name}に保険の話が来る。`,
    alreadyNarration: (name) => `${name}はここで買えるものには全部入っている。素通りだ。`,
    alreadyLog: (name) => `${name}はここではすでに加入済み。`,
    cardTitle: '保険の窓口',
    declinedNarration: (name) => `${name}は賭けに出て、無保険のまま外に出た。祈っておこう。`,
    declinedLog: (name) => `${name}が保険を断る。`,
    lifeNote: '引退時に満期。そのまま最終集計に入る。',
    coverNote: (kind) => `これで${kind === 'home' ? '火事' : '交通事故'}にあっても支払いはゼロ。`,
    boughtNarration: (name) => `${name}は保険に入った。この保険料、終わってみれば大手柄かもしれない。`,
    boughtLog: (name, policy, premium) => `${name}が${policy}に${premium}で加入。`,
    coversItNote: (policy) => `${policy}でまかなえる。`,
    coveredNarration: (hazard, name) => `保険あり。その${hazard}は${name}から一円も取れなかった。`,
    coveredLog: (name, policy, amount) => `${name}は保険あり：${policy}が${amount}を肩代わり。`,
  },

  bank: {
    loanLabel: '借りる',
    loanDescription: (principal, settlement) =>
      `いま${principal}借りて、引退時に${settlement}返します。家にも株にも、払えない請求にも使える現金です。`,
    repayLabel: '繰り上げ返済する',
    repayDescription: (early, settlement, saved) =>
      `いま${early}払えば一件片づきます。引退時なら${settlement}。差の${saved}が最終集計に残ります。`,
    declineLabel: '素通りする',
    declineDescription: '今日の現金もなし、引退時の新しい借金もなし。',
    prompt: 'いまの現金か、引退時の請求を軽くするか',
    narration: (name) => `${name}、銀行が開いている。借りるか、返すか、素通りするか。`,
    log: (name) => `${name}が銀行に寄る。`,
    cardTitle: '銀行',
    declinedNarration: (name) => `${name}は銀行の前を素通り。借金なし、面倒なし。`,
    declinedLog: (name) => `${name}は何も持たずに銀行を出る。`,
    carryingNote: (loans) => `借入は現在${loans}件。`,
    borrowedNarration: (principal, name) => `銀行の金が${principal}、${name}の手に。よく使うこと、向こうは上乗せして取り返す。`,
    borrowedLog: (name, principal) => `${name}が${principal}を借りる。`,
    outstandingNote: (loans) => `残り${loans}件。`,
    debtFreeNarration: (name) => `借金なし。${name}は最後の一件を返して、胸を張って銀行を出た。`,
    repaidNarration: (name) => `${name}が借金をひとつ削る。引退時に返すより安く済む。`,
    repaidLog: (name, amount) => `${name}が${amount}で繰り上げ返済。`,
  },

  children: {
    timesNote: (children, amount) => `${children}人 × ${amount}`,
    noneToPayNarration: (name) => `子どもがいなければ請求もない。${name}はそのまま通り過ぎる。`,
    noneToPayLog: (name) => `${name}に子どもはいないので、支払いはない。`,
    payNarration: (amount) => `${amount}が出ていく。家族を持つのは安くない。`,
    payLog: (name, amount, children) => `${name}が子ども${children}人ぶん、${amount}を払う。`,
    noneToClaimNarration: (name) => `申請する子どもがいないので、${name}には今回なし。`,
    noneToClaimLog: (name) => `${name}に子どもはいないので、受け取るものはない。`,
    collectNarration: (amount) => `${amount}が入ってくる。家族が効くこともある。`,
    collectLog: (name, amount, children) => `${name}が子ども${children}人ぶん、${amount}を受け取る。`,
  },

  divorce: {
    singleNarration: (name) => `${name}には別れる相手がいない。そのまま歩き出す。`,
    singleLog: (name) => `${name}は結婚していないので、終わらせるものがない。`,
    settlementNote: (amount) => `財産分与：${amount}`,
    childrenNote: (children) => `子ども${children}人は相手と一緒に出ていく。`,
    narration: (name) => `${name}の結婚が終わり、家はずいぶん静かになった。`,
    log: (name, amount) => `${name}が離婚し、${amount}を財産分与。`,
  },

  upset: {
    payerDownToNote: (payer, balance) => `${payer}は${balance}に。`,
    collectNarration: (name) => `全員が払う。${name}の集金だ。`,
    collectLog: (name, amount) => `${name}が他の全員から${amount}ずつ集める。`,
    recipientUpToNote: (recipient, balance) => `${recipient}は${balance}に。`,
    payEachNarration: (name) => `この一杯は${name}のおごり。他の全員に金が入る。`,
    payEachLog: (name, amount) => `${name}が他の全員に${amount}ずつ払う。`,
    swapAheadNarration: (name) => `${name}はもう先頭。交換するものがない。`,
    swapNobodyNarration: (name) => `財布を交換する相手がもういない。${name}は一円残らず手元に。`,
    swapNobodyLog: (name) => `${name}には金を交換する相手がいない。`,
    swapNote: (mine, theirs) => `財布を交換：${mine} ↔ ${theirs}`,
    swapNarration: (name, leader) => `交換。${name}が${leader}の財布を取り、盤面の形が丸ごと変わった。`,
    swapLog: (name, leader, amount) => `${name}が${leader}と金を交換。${amount}が動く。`,
    stealNoneNarration: (name) => `他に誰もLIFEタイルを持っていない。${name}は手ぶらで去る。`,
    stealNoneLog: (name) => `${name}が取れるLIFEタイルはなかった。`,
    stealNote: (value) => `最終集計で${value}。`,
    stealNarration: (name, tile, victim) => `${name}が${victim}の手から「${tile}」をかすめ取った。`,
    stealLog: (name, tile, victim) => `${name}が${victim}からLIFEタイル「${tile}」を奪う。`,
  },

  spinForMoney: {
    narration: (name) => `${name}がまわしにいく。`,
    log: (name, reason) => `${name}がまわす：${reason}`,
    cardTitle: 'ルーレット',
    resultNarration: (name) => `ルーレットが答えを出し、${name}がそれを受け取る。`,
    resultLog: (reason, name, spin, amount) => `${reason} ${name}が${spin}を出して${amount}。`,
  },

  retire: {
    rankNote: (rank) => `退職順 ${rank}位`,
    narration: (name) => `${name}は上がり。足を投げ出していい、しんどいところは終わった。`,
    log: (name) => `${name}が引退。`,
  },

  fire: {
    takeLabel: 'ここで人生を締める',
    takeDescription: '今日で働くのをやめ、次の引退順を取ります。この先の給料日は全部捨てることになります。',
    declineLabelAffordable: 'まだ働く',
    declineLabel: '働き続ける',
    declineDescriptionAffordable:
      '歩き続けて残りの給料日を拾い、最後の一区間に何があってもそれを受け取ります。',
    declineDescription: '歩き続けて、稼ぎ続けます。',
    promptAffordable: (balance) => `手元は${balance}。これで足りるか？`,
    promptShort: (target, balance) => `目標は${target}。手元は${balance}。`,
    noteAffordable: '積立が残りの人生を買い戻せるか、買い戻せないか。一回まわして決まる。',
    noteShort: (target) => `ここで抜けるには手元に${target}が要る。`,
    narrationAffordable: (name) => `${name}が台所で計算する。もう止まれるのか、それともあと一年か。`,
    narrationShort: (name) => `${name}が台所で計算し、まだ続けろという答えが出た。`,
    logAffordable: (name) => `${name}が引退するかどうかを計算する。`,
    logShort: (name) => `${name}は目標に届かず、そのまま進む。`,
    cardTitle: '目標額',
    declinedNarration: (name) => `${name}は目標を先送りにした。道はまだ残っているし、道は金になる。`,
    declinedLog: (name) => `${name}は働き続ける。`,
    bonusNote: (payout) => `受取：${payout}`,
    stakeNote: (target) => `そこまでに積立へ入れたのは${target}。`,
    rankNote: (rank) => `退職順 ${rank}位。この先の給料日はもう他人のものだ。`,
    goodNarration: (name) => `積立は大きく戻ってきて、${name}は二度と働かない。こうやるのが正解だ。`,
    badNarration: (name) => `積立は入れた額より少なく戻ってきた。${name}は一年早く止まった。もう戻れない。`,
    evenNarration: (name) => `${name}は完全に働くのをやめた。給料日はもうない。請求書ももうない。`,
    retiredLog: (name, target, spin, payout) =>
      `${name}が早期引退：積立に${target}、${spin}が出て${payout}が戻る。`,
  },

  move: {
    unnamedRoad: '新しい道',
    forkPrompt: 'どちらへ進む？',
    forkPromptWithSteps: (steps) => `どちらへ進む？ その道を${steps}マス進むことになる。`,
    takesRoadLog: (name, road) => `${name}が${road}を選ぶ。`,
    roadAhead: 'この先の道',
    headsTowardLog: (name, destination) => `${name}が${destination}へ向かう。`,
    forkLog: (name, spin, road) => `${name}が${spin}を出す。分かれ道は${road}へ。`,
    forkWithStepsLog: (name, spin, road, steps) =>
      `${name}が${spin}を出す。分かれ道は${road}へ、そこから${steps}マス。`,
    spinLog: (name, spin) => `${name}が${spin}を出す。`,
    pullsUpAtForkLog: (name, title) => `${name}が${title}で止まる。道が分かれている。`,
  },

  turn: {
    welcomeLog: (names) => `LIFE JOURNEY へようこそ。プレイヤー：${names.join('、')}。`,
    nextLog: (name) => `${name}の番。`,
    nextPlayer: '次のプレイヤー',
    everybodyRetiredLog: '全員が引退。何が残ったのかを数える時間だ。',
  },

  settlement: {
    housePrompt: (name) => `${name}の家`,
    houseStakes: (house) => `${house}が売りに出る。`,
    theHouse: 'その家',
    policyPrompt: (name) => `${name}の生命保険`,
    policyStakes: '保険が満期になる。一生かけて払ったものが、そのまま戻ってくる額になる。',
    sharesPrompt: (name) => `${name}の株`,
    sharesStakes: (shares, companies) => `${companies}社の株${shares}株が、その日の終値で現金になる。`,
    houseLog: (face, name, amount) => `${face}が出て、${name}の家は${amount}で売れた。`,
    marketLog: (face, name, amount) => `${face}が出て、${name}の株は${amount}で現金化。`,
    policyLog: (face, name, amount) => `${face}が出て、${name}の生命保険は${amount}で満期。`,
    oneStarLog: (name, bonus) => `${name}の子どものひとりが大成した。最終集計に${bonus}。`,
    starsLog: (stars, name, bonus) => `${name}の子どものうち${stars}人が大成した。最終集計に${bonus}。`,
    gameOverLog: (winner, total) => `ゲーム終了。${winner}が${total}で勝利。`,
  },
}
