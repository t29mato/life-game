import type { EditionTranslation } from '../../i18n/types'

/**
 * The USA edition in Japanese.
 *
 * The English board's voice rule — short sentences, plain words, any joke
 * stated rather than implied — carries over as plain-form (常体) narration in
 * the present tense: the register a Japanese board game actually prints on its
 * tiles, rather than the textbook politeness a translation drifts into. The
 * lanes are named in コース, which is what a Japanese life game calls the road
 * you pick at a fork.
 *
 * What is deliberately *not* localised: the country. This is still the American
 * board, so the money is still dollars, the recruiters still line a quad and
 * the courier still crosses an American town. A tile only reads as Japanese in
 * the sense that a Japanese reader understands it on the first pass.
 */
export const USA_JA: EditionTranslation = {
  locale: 'ja',
  editionId: 'usa',

  spaces: {
    start: {
      title: '人生のスタート',
      description: '財布は軽く、未来だけが果てしなく広い。ここから旅が始まる。',
    },
    'college-1': {
      title: '入寮の日',
      description: '狭い寮の一室に段ボールを運び込み、今日からここが我が家になる。',
      harsher: {
        description: '狭い寮の一室に段ボールを運び込む。その途中で、寮務課が保証金の話を切り出してくる。',
        reason: '寮の保証金',
      },
    },
    'college-2': {
      title: '授業料の請求',
      description: '教務課から届いた請求書の額が、とにかく高い。これを払わないことには誰も入学できない。',
      reason: '大学の授業料',
    },
    'college-4': {
      title: '学内バイト',
      description: '図書館のワークスタディが、そこそこの勤務時間と、本当にありがたい給料になる。',
      reason: '学内バイトの給料',
    },
    'college-overdraft': {
      title: '口座マイナス手数料',
      description: '口座が一日だけ残高を割る。自分より先に銀行が気づく。',
      reason: '当座貸越の手数料',
    },
    'college-6': {
      title: '奨学金に当選',
      description: '誰も期待していなかった小論文が奨学金を射止め、請求書のかなりの部分をまかなう。',
      reason: '奨学金',
    },
    'college-7': {
      title: '期末試験週間',
      description: '四日で五科目。カップ麺だけで生き延びる。',
      harsher: {
        description: '四日で五科目。いちばん苦手な一科目のために、慌てて家庭教師を雇う。',
        reason: '駆け込みの家庭教師代',
      },
    },
    'college-8': {
      title: '卒業式',
      description: '角帽とガウンに袖を通す。これで正式に卒業生だ。',
    },
    'college-9': {
      title: '荷物をまとめる',
      description: '寮の部屋を空けて鍵を返す。持ち帰る教科書は、思っていたより一箱ぶん少ない。',
    },
    'grad-fair': {
      title: '大卒向け就職説明会',
      description: '中庭に採用担当がずらりと並び、新卒を採りたくてうずうずしている。',
    },
    'first-job-fair': {
      title: '初めての就職説明会',
      description: '地元の会社がブースを構え、やる気のある新人を探している。金曜には採用が決まる。',
    },
    'work-1': {
      title: '初任給',
      description: '生まれて初めての給料が振り込まれる。とんでもない大金に見える。',
      reason: '初任給',
      footnote: 'ひと月まるごとではなく、その途中から働き始めた分。まるひと月分が入るのは次の「給料日」のマス。',
    },
    'work-payday-1': {
      title: '給料日',
      description: 'まるひと月働いた。友人たちがまだ寮にいるうちに、振り込みが届く。',
      harsher: {
        title: '給料は翌月払い',
        description: '初月の給料が一か月遅れで払われることは誰も教えてくれなかったし、冷蔵庫は事情を汲んでくれない。',
        reason: '無収入のひと月',
      },
    },
    'work-2': {
      title: '独り立ち',
      description: '稼いでいる以上、自分の住まいを持つものとされる。敷金、前家賃、そして自分で組み立てるベッド。',
      reason: '敷金と前家賃',
    },
    'work-first-night': {
      title: '最初の夜',
      description: '天井の電球がまだ切れたままなので、スタンドの明かりで荷ほどきをする。',
    },
    'work-uniform': {
      title: '制服の保証金',
      description: 'シャツ二枚と名札、そして二度と戻ってこない気がする保証金。',
      reason: '制服の保証金',
    },
    'work-payday-2': {
      title: '給料日',
      description: 'ひと月働いてまた振り込み。いまだに誰も卒業証書を見せろとは言わない。',
      harsher: {
        title: 'シフト削減',
        description: '日曜に貼り出されたシフト表で、自分の名前が先週の半分しかない。',
        reason: '半月分のシフト',
      },
    },
    'work-payday-3': {
      title: '給料日',
      description: '働き始めて三か月。振り込みにもう驚かなくなった。',
    },
    'main-early-review': {
      title: '試用期間の面談',
      description: '入社から半年、上司が用紙を手に向かいに座り、調子はどうかと尋ねる。振ろう。',
      reason: '試用期間の終わり',
    },
    'grad-1': {
      title: '博士課程の学費',
      description: '入学金、実験費、そして四年ぶんの家賃を、給料の入らないまま抱える。そのうちいくらが自分持ちになるかは、奨学金の通知が決める。',
      reason: '博士課程の学費',
    },
    'grad-2': {
      title: '深夜の研究室',
      description: '建物は六時に空になるのに、あなたは一時になってもまだそこにいる。そして、ほかのどこにもいたくない。',
      harsher: {
        description: '建物は六時に空になるのに、あなたは一時になってもまだそこにいる。装置の三度目の作り直しは自腹だ。',
        reason: '装置の作り直し',
      },
    },
    'grad-3': {
      title: 'ティーチング手当',
      description: '週に二コマ、一年生が四十人、そして月末の金曜に振り込まれる小さな手当。',
      reason: 'ティーチング手当',
    },
    'grad-4': {
      title: '研究助成',
      description: '二度書き直した申請が三度目で採択され、審査委員会がその旨を文書で伝えてくる。',
      reason: '研究助成金',
    },
    'grad-5': {
      title: '公聴会',
      description: 'その分野を最もよく知る人たちと小さな部屋で三時間。終わったとき、彼らはあなたを博士と呼ぶ。',
    },
    'grad-6': {
      title: '着任',
      description: '紙の辞令が届く。十年かけて手に入れた肩書きが、そこに永久に刻まれている。',
      reason: '博士号が開く仕事',
    },
    'stay-1': {
      title: '穏やかな一年',
      description: '波風も激変もなく、周囲が当てにし始めるくらいには静かに仕事ができている。',
    },
    'stay-payday': {
      title: '給料日',
      description: '知り合いの誰かが助成金の申請書を書いている頃、あなたの口座には振込が入る。',
    },
    'stay-3': {
      title: '夜間講座',
      description: '週に一晩、博士号は付いてこないが、結局は持っていてよかったと思える修了証が残る。',
      reason: '夜間講座の受講料',
    },
    'main-bank': {
      title: '銀行に立ち寄る',
      description: '支店長がコーヒーを差し出し、お金の具合はどうですかと聞いてくる。',
    },
    'main-insurance': {
      title: '保険代理店',
      description: 'カーディガン姿の担当者が、起こりうる災難をひとつ残らず、和やかに、延々と説明してくれる。',
    },
    'main-6': {
      title: '給料日',
      description: '給与の振込通知。今週いちばんうれしい通知だ。',
    },
    'main-stock-tip': {
      title: '株の耳より情報',
      description: '友人がどこかで読んだ銘柄を熱心に勧めてくる。証券会社は六時まで開いている。',
    },
    'main-fender-bender': {
      title: '交通事故',
      description: '雨の交差点、止まらない車、そしてフェンダーとドアとヘッドライトの交換。',
      reason: '板金修理代',
    },
    'main-pileup': {
      title: '高速道路の多重事故',
      description: '霧、ブレーキランプ、そして入口ランプでひしゃげた四台。全員無事に歩いて帰れたが、請求書は帰らない。',
      reason: '多重事故の修理代',
    },
    'main-dentist': {
      title: '歯医者の請求',
      description: '詰め物ひとつ、フロスの説教ひとつ、そしてドリルよりよほど沁みる請求書ひとつ。',
      reason: '歯の治療費',
    },
    'main-9': {
      title: '思わぬ拾いもの',
      description: '覚えておきたくなる小さな出来事に出くわす。',
    },
    'main-crossroads': {
      title: '入社五年目',
      description: '同じ机で五年。転職エージェントのメールを、なぜかまだ消していない。道はここで分かれる。',
    },
    'ladder-raise': {
      title: '勤続の長さ',
      description: 'この部署はここ十年、誰も辞めていない。上のポストは誰かが辞めて初めて空く。今年がその年かどうか、振ってみよう。',
      reason: '上のポストが空いた',
    },
    'hopper-lookout': {
      title: 'こっそり転職活動',
      description: '昼休みに職務経歴書を更新し、社内では絶対に聞かれない場所で電話を取り始める。',
    },
    'hopper-move': {
      title: '条件を提示する',
      description: '次の内定にサインしてから退職届を出す。新しい肩書きには、新しい金額がついてくる。',
      reason: 'よそで条件を通した',
    },
    'hopper-bonus': {
      title: '契約金',
      description: '新しい会社が退職までの期間を買い取ってくれ、まるまる一か月分の給料のような振り込みが届く。',
    },
    'main-review': {
      title: '人事考課',
      description: '小さな会議室、こちらの資料を開いた二人、そして質問はひとつ。上のポストを任せて大丈夫か。振って、返事を聞こう。',
      reason: '考課の順番が回ってきた',
    },
    'main-tax-audit': {
      title: '税務調査',
      description: '丁寧な文面の通知、領収書の詰まった靴箱と過ごす長い午後、そして最後に書かれた金額。',
      reason: '税務調査の追徴',
    },
    'main-hours-cut': {
      title: '契約満了',
      description: '誰もが更新されると思っていた契約が、ごく静かに、更新されない。',
      reason: '契約が更新されなかった',
    },
    'main-layoff': {
      title: '解雇通知',
      description: 'フロア全員がひとつの会議室に集められ、その後、社員証が反応しなくなる。',
      reason: '解雇された',
    },
    'main-career-fair': {
      title: '転職フェア',
      description: 'ブースだらけの会場、配られるボールペン、そして二つのうちどちらかを選ばなければならない。',
      reason: '転職フェアで仕切り直し',
    },
    'main-gifts': {
      title: '年末の贈り物',
      description: '全員にひとつずつ。予算よりも気持ちのほうを多くかけて選んだ。食事の席で誰かが学び直すつもりだと口にし、道はここで分かれる。',
      reason: '全員へのプレゼント',
    },
    marriage: {
      title: '結婚式',
      description: '誓いの言葉、こぼれる涙、そして晴れて夫婦になる。',
    },
    'family-1': {
      title: '子ども部屋の準備',
      description: '子ども部屋を明るい黄色に塗り、真夜中にベビーベッドを組み立てる。',
      reason: '子ども部屋の準備',
    },
    'family-2': {
      title: '赤ちゃん誕生',
      description: '予備の部屋を黄色く塗り、ベビーベッドを組み立てた。この一年がどうなるかは、こちらの都合では決まらない。',
    },
    'family-childcare': {
      title: '保育料',
      description: '家じゅうの小さい人をぜんぶ終日保育に預ける。月額の合計は二度読み返すことになる。',
      reason: '子ども一人あたりの保育料',
    },
    'family-school-fees': {
      title: '学校の費用',
      description: '制服、遠足、そして一人一本のリコーダー。請求書はもちろん、まとめて届く。',
      reason: '子ども一人あたりの学費',
    },
    'family-4': {
      title: '学芸会',
      description: 'わが子が主役をみごとに演じきり、三列目でこちらが泣く。',
    },
    'family-6': {
      title: '双子',
      description: '検査技師が急に黙り、画面をこちらに向けて、二人ぶんを指さす。',
    },
    'fast-3': {
      title: '給料日',
      description: '残業代がやっと給与明細に載る。',
    },
    'fast-headhunted': {
      title: '今年という一年',
      description: '早朝出勤と終電の十二か月。その先に出てくる数字は、一月の時点では社内の誰にも予想できなかったものだ。',
      reason: '長時間労働の一年と、その結果。',
    },
    'fast-burnout': {
      title: '燃え尽きて休職',
      description: '診断書で六週間の休み。復帰したときには、給料がずいぶん軽くなっている。',
      reason: '無給休職',
    },
    'fast-payday-severance': {
      title: '年末の給与',
      description: '一年が終わりに近づく。何もかもがまた変わる前に、今の仕事の給料がもう一度だけ振り込まれる。',
    },
    'fast-restructure': {
      title: 'あの組織再編',
      description: '会社が一夜で解体され、組み直される。ドアの名前はそのままで、この一年のそれ以外は何ひとつ同じではない。',
      reason: '上の誰も想定していなかった一年。',
    },
    'fast-trading-floor': {
      title: 'トレーディングフロア',
      description: 'ボーナスを使いたくてうずうずしている。取引フロアはまだ怒鳴り声でいっぱいだ。',
    },
    'fast-6': {
      title: '給料日',
      description: 'また二週間が過ぎ、また振り込みが入る。',
      harsher: {
        title: 'ボーナス返還',
        description: '別の建物にいる誰かが去年のボーナスを見直し、新しい金額はより低い。',
        reason: 'ボーナスの返還',
      },
    },
    'fast-payday-3': {
      title: '引き留めの条件',
      description: 'よそから声がかかっていると軽く漏らす。昼前には対抗条件が出てくる。',
    },
    'midtown-trading-floor': {
      title: 'トレーディングフロア',
      description: '画面だらけ、怒鳴り声だらけ、そして今回だけは違うと言い張る営業担当。',
    },
    'midtown-insurance': {
      title: '保険代理店',
      description: '家の鍵を渡す前に、補償について少し話をさせてほしい人がいる。',
    },
    'midtown-payday': {
      title: '給料日',
      description: '家の頭金を払う週に、給料の振り込みが届く。',
    },
    'midtown-party': {
      title: '共同口座',
      description: '口座をひとつにまとめる。他人の出費が、否応なく自分の出費でもある日々が始まる。',
      reason: '共同口座の精算',
    },
    'midtown-phone-call': {
      title: '学校からの電話',
      description: '会議の最中に学校から電話が来る。けが人はなし。全員が叱られ、教室のうしろにあった何かは弁償になる。',
      reason: '壊したものの弁償、子ども一人につき',
    },
    'midtown-bonus': {
      title: '年末賞与',
      description: '年末賞与が振り込まれる。約束の額ではなく稼ぎに応じた額なので、全員の金額が違う。',
    },
    'midtown-raise': {
      title: '昇給',
      description: '短い立ち話、新しい金額、そして部屋を出ぎわの握手。',
    },
    'midtown-rate-rise': {
      title: '金利上昇',
      description: '木曜の朝に金利が悪いほうへ動き、毎月の数字がそろって道連れになる。',
      reason: '金利が悪いほうへ動いた',
    },
    'home-buying': {
      title: '家さがし',
      description: '週末じゅう内見をはしごし、頭の中ではもう家具を運び込んでいる。',
    },
    'risky-1': {
      title: 'スタートアップに出資',
      description: '友人の会社に貯金をつぎ込む。いくら返ってくるかはサイコロ次第。',
      reason: '出資の払い戻し',
    },
    'risky-2': {
      title: 'ハズレの銘柄',
      description: '「確実」だったはずの株が一週間で大半の価値を失う。詫びに全員へ夕食をおごる。',
      reason: 'ハズレ銘柄のお詫び',
    },
    'risky-3': {
      title: 'ポーカーの夜',
      description: '一晩じゅう、ツキがこちらから離れない。',
      reason: 'ポーカーの勝ち分',
    },
    'risky-5': {
      title: '相場の暴落',
      description: '相場が大きく沈み、持ち株がまとめて顔をしかめる。',
      reason: '相場の暴落',
    },
    'risky-aftershock': {
      title: '二番底',
      description: '相場は誰も想定していなかった底をさらに掘り当てる。しかも一日の午後で。',
      reason: '相場のさらなる下落',
    },
    'risky-6': {
      title: '宝くじ',
      description: '一ドルのくじ、運のいい削り方、そして当選額はサイコロで決まる。',
      reason: '宝くじの当選金',
    },
    'risky-payday': {
      title: '給料日',
      description: '投資のほうが荒れている最中に、給料が振り込まれる。',
    },
    'risky-swap': {
      title: '首位と交換',
      description: '握手ひとつ、署名ひとつ。首位の相手と口座の残高をそっくり入れ替える。',
      reason: '首位との取引',
    },
    'safe-1': {
      title: 'クーポン集め',
      description: 'ためこんだクーポンの束が、レジで本当に効く。',
      reason: 'クーポンの節約分',
    },
    'safe-payday': {
      title: '給料日',
      description: 'いつもと同じ日に、いつもどおり振り込まれる。',
      harsher: {
        title: '給与の支払い遅延',
        description: 'どこかの表計算のセルひとつのせいで、今月の給料は来月に届くことになる。',
        reason: 'ひと月ぶんの給与保留',
      },
    },
    'safe-excess': {
      title: '保険の自己負担',
      description: '慎重な道にも保険金の請求書はある。免責分はいつだって自腹だ。',
      reason: '保険の免責額',
    },
    'safe-3': {
      title: '家計の勝利',
      description: '珍しく予算を守りきる。これが思いのほか気持ちいい。',
      reason: '家計の節約',
    },
    'safe-7': {
      title: '還付金',
      description: '期待するのを忘れたころに、税金の還付が届く。',
      reason: '税の還付',
    },
    'safe-8': {
      title: '地道な貯金',
      description: '劇的なことは何も起きない。貯金箱が静かに重くなるだけだ。',
      reason: '地道な貯金',
    },
    'safe-payday-2': {
      title: '給料日',
      description: 'また振り込み、また静かな一週間。この道はそれでいい。',
    },
    'safe-dividend': {
      title: '配当の日',
      description: '手堅いほうの持ち株が、手堅い額をきちんと出してくる。',
      reason: '四半期配当',
    },
    'sunset-number': {
      title: '必要な額',
      description: '二度と働かずに済むにはいくら要るのか、封筒の裏で誰かが計算する。その額は、恐れていたよりずっと小さい。',
    },
    'sunset-upgrade': {
      title: '住み替え',
      description: '不動産屋から電話。もっと広くて明るくて、ぎりぎり手が届く物件の話だ。',
    },
    'sunset-fire': {
      title: '住宅火災',
      description: '鍋ひとつ、ふきん一枚、そしてタイルから作り直しになる台所。',
      reason: '火災の損害',
    },
    'sunset-care': {
      title: '介護の費用',
      description: '大切な人に介護が要る。値段などつけたくないが、請求書は平気でつけてくる。',
      reason: '家族の介護費',
    },
    'sunset-2': {
      title: '給料日',
      description: '数えるほどしか残っていない給料の、そのひとつが振り込まれる。',
    },
    'sunset-swap': {
      title: '首位と交換',
      description: '最後の大胆な取引。首位の相手は、自分の財産が歩いて出ていくのを見送ることになる。',
      reason: '土壇場の交換',
    },
    'sunset-benefit': {
      title: '子どもからの仕送り',
      description: '大きくなった子どもたちが老後の資金にそれぞれ出してくれる。合わせるとなかなかの額だ。',
      reason: '子ども一人ひとりからの援助',
    },
    'sunset-sticky': {
      title: 'つい手が伸びる',
      description: '首位の相手から、いちばんいい思い出話を譲るよう説得にかかる。',
      reason: '思い出がひとつ移る',
    },
    'sunset-handshake': {
      title: '最後の昇進',
      description: '説得できれば、退職前にもうひとつだけ肩書きがつく。振って、人生最後の考課に決めてもらおう。',
      reason: '人生最後の考課',
    },
    'sunset-payday-2': {
      title: '給料日',
      description: 'こちらは何回目か忘れたが、振り込みのほうは忘れていない。',
    },
    'sunset-tax': {
      title: '最後の納税',
      description: 'オフィスの扉が背中で永遠に閉まる前に、茶封筒がもう一通だけ届く。',
      reason: '最後の税金',
    },
    'sunset-3': {
      title: '最後の一年',
      description: '一生続けてきた仕事を、もう一年だけ。それが終われば鍵を返す。どんな一年だったのか、みんなが知りたがっている。',
      reason: 'この道での最後の一年。',
    },
    retirement: {
      title: '引退',
      description: 'オフィスの扉を最後に閉め、引退の日々へ踏み出す。',
    },
  },

  lanes: {
    'College Lane': {
      name: '大学コース',
      summary: '四年ぶんを今払って、四十年ぶんをきちんと受け取る。請求書は一銭も稼がないうちに前払いで全額。買えるのは巨額ではなく、堅実な給料だ。',
    },
    'Straight to Work': {
      name: '就職コース',
      summary: '相手が寮の荷ほどきをしている間に、金曜から稼ぎ始める。授業料もなければ安全網もない。はしごの一段目は厳しいが、てっぺんはこの卓のどの大卒よりも上だ。',
    },
    'Grad School': {
      name: '大学院コース',
      summary: 'さらに四年戻り、この卓の誰にも就けない仕事の資格を得て出てくる。学費はまた前払い、そして中にいる間に逃した給料日は、全部その人たちが受け取っている。',
    },
    'Keep Working': {
      name: '在職継続コース',
      summary: '今の仕事を続ける。博士より額は小さいが、入り続ける。相手が図書館にこもる四年のあいだも、ずっとだ。',
    },
    'Company Road': {
      name: '社内昇進コース',
      summary: '残る。昇給はここに残っていたから回ってくるし、いい年の分け前ももらえる。ただし、どこに住むかは会社が決める。',
    },
    'Job-Hopper Alley': {
      name: '転職コース',
      summary: '出る。その場で足を止め、退職届を出し、給料表を丸ごと引き直す。最初の引きが悪かったなら痛快、良かったなら本物の賭けだ。',
    },
    'Family Lane': {
      name: '家族コース',
      summary: 'にぎやかな家、最後に子どもの数だけ入るボーナス、そして誰にも奪えない思い出の棚。給料日はぐっと減り、請求書は人数ぶん増える。',
    },
    'Fast Track': {
      name: '出世コース',
      summary: '給料日、昇給、そして角部屋。夜と週末を机で払って手に入れる。本当の代償は、差し出した私生活のほうだ。',
    },
    'Risky Road': {
      name: '一攫千金コース',
      summary: 'スタートアップ、信用取引、そしてやたら自信のある営業担当。家の時点で後ろにいるなら来るべきだし、前にいるならよく考えたほうがいい。',
    },
    'Safe Street': {
      name: '堅実コース',
      summary: 'クーポン、利息、そして満杯の食料棚。ここで大金持ちになった者はいないが、破滅した者もいない。すでに勝っているなら、それは相当な値打ちだ。',
    },
  },

  careers: {
    'career-salon-apprentice': {
      title: '美容室の見習い',
      description: '床を掃き、シャンプーをし、いいハサミの行方を鷹の目で追う。',
    },
    'career-stylist': {
      title: 'スタイリスト',
      description: '自分の椅子を持ち、予約は三週間先まで埋まり、どこへ移っても付いてくる常連がいる。',
    },
    'career-salon-owner': {
      title: '美容室オーナー',
      description: 'おしゃべりにもいい髪型にも事欠かない、にぎやかな店を切り盛りしている。',
    },
    'career-commis-baker': {
      title: 'パン職人見習い',
      description: '四時に入って昼に上がる。折り込み生地の腕は、誰も認めたがらないがすでに上だ。',
    },
    'career-pastry-chef': {
      title: 'パティシエ',
      description: '食べる前に写真を撮られるクロワッサンで、ショーウィンドウを埋める。',
    },
    'career-head-pastry-chef': {
      title: 'シェフパティシエ',
      description: 'メニューを書き、店の人間を育て、それでも出す前に全部の焼き上がりを味見する。',
    },
    'career-line-cook': {
      title: '調理スタッフ',
      description: 'コンロ六口、伝票のレール一本、そして一週間の値打ちを決める昼のピーク。',
    },
    'career-food-truck-owner': {
      title: 'キッチンカーの店主',
      description: '完璧な場所に停めて、昼休みをちょっとした祭りに変える。',
    },
    'career-restaurant-owner': {
      title: 'レストラン経営者',
      description: '一晩四十卓、看板のチリがひとつ、そして毎朝九時に鳴りだす予約の電話。',
    },
    'career-site-labourer': {
      title: '建設作業員',
      description: '運び、掘り、練り、持ち上げる。現場の道具がどこにあるかを本当に知っている人。',
    },
    'career-site-supervisor': {
      title: '現場主任',
      description: '朝礼と入場名簿、そして足場屋との言い合いを仕切る。',
    },
    'career-construction-foreman': {
      title: '工事現場監督',
      description: '丸めた図面を、梁一本ずつ着実に建物へ変えていく。見積もりもきちんと出す。',
    },
    'career-delivery-courier': {
      title: '配達員',
      description: '街を走り回り、近所じゅうの食事と荷物を届け続ける。',
    },
    'career-depot-dispatcher': {
      title: '配車担当',
      description: 'バイクを降りて配車ボードの前へ。街じゅうのバンが、名前入りのマグネットになって並ぶ。',
    },
    'career-distribution-lead': {
      title: '物流責任者',
      description: '一晩で十万個を動かし、そのからくりに誰も気づかないうちに帰宅する。',
    },
    'career-apprentice-mechanic': {
      title: '整備見習い',
      description: '三年間、ライトを持ち、工具を渡し続けた。そして自分にもエンジンの不調が聞こえる気がしてきた。',
    },
    'career-motorcycle-mechanic': {
      title: 'バイク整備士',
      description: '持ち主が言い終える前に、バイクの不平を聞き取ってしまう。',
    },
    'career-workshop-owner': {
      title: '整備工場オーナー',
      description: 'リフト四基、順番待ちの列、そしてトレーラーで運び込まれてきたバイクの写真が並ぶ壁。',
    },
    'career-session-musician': {
      title: 'スタジオミュージシャン',
      description: '誰もが百回は口ずさんだベースラインを弾いている。ジャケットに名前は載らない。',
    },
    'career-touring-player': {
      title: 'ツアーミュージシャン',
      description: '九か国、機材ケースひとつ、そしてポスターの隅にやっと載った名前。',
    },
    'career-record-producer': {
      title: '音楽プロデューサー',
      description: 'ガラスの向こうで「もう一回、もっと楽しそうに」と言う。そしてなぜかいつも正しい。',
    },
    'career-radio-runner': {
      title: 'ラジオの雑用係',
      description: 'コーヒーを買いに走り、ゲストに合図を出し、番組の作り方を静かに覚えていく。',
    },
    'career-podcast-host': {
      title: 'ポッドキャストの司会',
      description: 'マイク三本と、とびきりいい質問ひとつを、何千人もの火曜の習慣に変える。',
    },
    'career-network-owner': {
      title: '番組ネットワーク経営者',
      description: '十一本の番組を回し、うち一本には自分で出て、十二本ぶんの広告を売る。',
    },
    'career-second-shooter': {
      title: 'セカンドカメラマン',
      description: '式場のうしろ側と、ほかの全員が撮り逃したスピーチの一節を押さえる。',
    },
    'career-portrait-photographer': {
      title: 'ポートレート写真家',
      description: '家族全員を同じ瞬間に笑わせる。コツはそれに尽きる。',
    },
    'career-lettings-negotiator': {
      title: '賃貸仲介',
      description: '毎週土曜に十一部屋を案内し、どの部屋にカビの問題があったかを覚えている。',
    },
    'career-real-estate-agent': {
      title: '不動産営業',
      description: 'まず台所を売り、次に庭を売り、通勤時間の話は決してしない。',
    },
    'career-agency-owner': {
      title: '不動産会社オーナー',
      description: '四百軒の前に自分の名前の看板が立つ。当たり年が一度あれば、静かな三年を支えられる。',
    },
    'career-warehouse-picker': {
      title: '倉庫のピッキング',
      description: '一勤務で十数キロ歩き、暗闇でも四十番通路にたどり着ける。',
    },
    'career-warehouse-lead': {
      title: '倉庫のリーダー',
      description: 'サッカー場四面ぶんの建物を、コーヒーとバインダーだけで回している。',
    },
    'career-grooming-assistant': {
      title: 'トリマー助手',
      description: 'タオルとおやつ、そしてとても大きな犬に品定めされる間じっとしていられる度胸。',
    },
    'career-pet-groomer': {
      title: 'トリマー',
      description: '毛のもつれた保護犬を、泡風呂ひとつずつでランウェイのモデルに変えていく。',
    },
    'career-youth-coach': {
      title: '少年サッカーのコーチ',
      description: '土曜の練習を仕切り、切ったオレンジを配り、全員の名前を覚えている。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-market-gardener': {
      title: '直売農家',
      description: '朝七時には行列ができるトマトを作っている。増産の話は、これまで全部断ってきた。',
    },
    'career-surgical-resident': {
      title: '外科研修医',
      description: '六年ぶんの当直、鉤を持ち続けた手、そして「次はどうする」と問われ続けた日々。',
    },
    'career-surgeon': {
      title: '外科医',
      description: 'ぶれない手と、それ以上にぶれない胆力で人を救う。',
    },
    'career-junior-associate': {
      title: 'アソシエイト弁護士',
      description: 'パートナーが肝心の一段落だけ読めるように、九百ページを読む。',
    },
    'career-corporate-lawyer': {
      title: '企業弁護士',
      description: '上等な鞄と、それより鋭い論理で役員会の戦いを制する。',
    },
    'career-architectural-assistant': {
      title: '建築設計助手',
      description: '階段の詳細図を十一回描き、最初の十回より十一回目から多くを学ぶ。',
    },
    'career-architect': {
      title: '建築家',
      description: 'ありふれた街並みを名所に変えるスカイラインを描く。',
    },
    'career-junior-engineer': {
      title: '新人エンジニア',
      description: '誰もやりたがらない小さなバグを直し、その途中で大きいほうを見つける。',
    },
    'career-software-engineer': {
      title: 'ソフトウェアエンジニア',
      description: 'インターネットの半分を静かに動かし続けるコードを書いている。',
    },
    'career-junior-designer': {
      title: 'ゲームデザイナー見習い',
      description: '四か月かけてチュートリアルを調整し、見知らぬ人がそこを抜けていくのを見守る。',
    },
    'career-game-designer': {
      title: 'ゲームデザイナー',
      description: '夜更かししてでも探検したくなる世界を作る。',
    },
    'career-robotics-graduate': {
      title: 'ロボット工学の新卒',
      description: '一年かけてアームに靴下を拾わせる。本人はそれを有意義な一年だと思っている。',
    },
    'career-robotics-engineer': {
      title: 'ロボット技術者',
      description: '洗濯物をたたむアームを作り、それから一年かけて靴下について教え込む。',
    },
    'career-investment-analyst': {
      title: '投資アナリスト',
      description: '部署じゅうが言い合いになる表を作る。当たっているのは半分くらい。',
    },
    'career-fund-manager': {
      title: 'ファンドマネージャー',
      description: '他人のお金を画面の上で動かし、外れるより少しだけ多く当てる。',
    },
    'career-actuarial-trainee': {
      title: 'アクチュアリー研修生',
      description: '試験十五科目を、暖房のにおいがする部屋で一つずつ片づけていく。',
    },
    'career-insurance-actuary': {
      title: '保険数理士',
      description: 'あなたの屋根が飛ぶ確率を正確に知っていて、昼前には値段をつけている。',
    },
    'career-research-assistant': {
      title: '研究助手',
      description: '他人の論文のために冷たい海で数を数える。その一分一分が楽しくて仕方ない。',
    },
    'career-marine-biologist': {
      title: '海洋生物学者',
      description: 'サンゴ礁を研究し、ときどき好奇心の強いイルカと仲よくなる。',
    },
    'career-jobbing-writer': {
      title: 'フリーライター',
      description: '広告コピー、カタログ、隔週のコラム。本命の原稿は引き出しの中で待っている。',
    },
    'career-novelist': {
      title: '小説家',
      description: '集まりのたびに友人へ押しつけられる、あの本を書いている。',
    },
    'career-veterinarian': {
      title: '獣医',
      description: '不安そうな飼い主をなだめながら、とても小さな骨折を静かに処置する。いくら積まれてもチェーン展開はしない。',
    },
    'career-university-professor': {
      title: '大学教授',
      description: '火曜に講義し、水曜に同僚と論争し、金曜には相手の考えを変えている。学部長の椅子は二度断った。',
    },
  },

  houses: {
    'house-tiny-cabin': {
      name: '小さな小屋',
      description: '一部屋、ハンモックひとつ、そしてのんびりした朝のためのポーチ。',
    },
    'house-cozy-bungalow': {
      name: '居心地のいい平屋',
      description: '手ごろな最初の一軒。庭には、誰も買った覚えのない小人の置物がいる。',
    },
    'house-suburban-townhouse': {
      name: '郊外のタウンハウス',
      description: '二階建て、隣と共有の塀、そして毎朝手を振ってくれる隣人。',
    },
    'house-converted-loft': {
      name: 'リノベーションしたロフト',
      description: '元はボタン工場。レンガの壁、大きな窓、そしてやたらうるさい暖房が一台。',
    },
    'house-modern-duplex': {
      name: 'モダンな二世帯住宅',
      description: 'すっきりした造り、屋上デッキ、そして一フロアを貸せるだけの広さ。',
    },
    'house-lakeside-villa': {
      name: '湖畔の別荘',
      description: '目覚めれば水面が広がり、夜明けには水鳥の声がする。',
    },
    'house-lavish-estate': {
      name: '豪邸',
      description: '門、噴水、そしてとびきり大げさな昔話のために作られた大食堂。',
    },
    'house-cliffside-retreat': {
      name: '崖の上の隠れ家',
      description: '三面ガラス、眼下に海、そして客が嬉々として文句を言う上り道。',
    },
    'house-skyline-penthouse': {
      name: '最上階のペントハウス',
      description: '最上階まるごと、専用エレベーター、そして夜には宝石をぶちまけたように見える街。',
    },
  },

  stocks: {
    'stock-noodle-chain': {
      name: '深夜ヌードル商会',
      description: '深夜二時にスープを出す小さな店が四十軒。家賃を滞納したことは一度もない。',
    },
    'stock-green-energy': {
      name: 'ブライトリッジ電力',
      description: '尾根道に並ぶ風車が、退屈で美しい配当を回し続ける。',
    },
    'stock-studio-pictures': {
      name: 'ランタン通り映画社',
      description: '夏の大ヒットひとつで栄光、コケひとつでワゴンセール。どちらになるかは誰にも分からない。',
    },
    'stock-robot-farms': {
      name: 'トラクター&ボルト農場',
      description: '谷ひとつを養うロボット収穫機。雨とソフトウェアが行儀よくしていれば、の話だが。',
    },
    'stock-orbital-freight': {
      name: 'オービタル貨物',
      description: '低予算で作られた貨物ロケット。物流の未来か、とても高価な花火か。',
    },
  },

  lifeTiles: {
    'tile-ran-a-marathon': { title: 'フルマラソン完走' },
    'tile-wrote-a-novel': { title: '小説を書き上げた' },
    'tile-adopted-a-rescue-dog': { title: '保護犬を引き取った' },
    'tile-learned-to-surf': { title: 'サーフィンを覚えた' },
    'tile-started-a-vegetable-garden': { title: '家庭菜園を始めた' },
    'tile-won-a-cooking-contest': { title: '料理コンテストで優勝' },
    'tile-backpacked-three-countries': { title: '三か国をバックパック旅行' },
    'tile-released-an-indie-album': { title: 'インディーズ盤を出した' },
    'tile-built-a-backyard-treehouse': { title: '庭にツリーハウスを作った' },
    'tile-ran-a-viral-food-blog': { title: 'バズるグルメブログを運営' },
    'tile-finished-a-triathlon': { title: 'トライアスロン完走' },
    'tile-volunteered-at-a-shelter': { title: '保護施設でボランティア' },
    'tile-opened-a-lemonade-empire': { title: 'レモネード帝国を築いた' },
    'tile-painted-a-downtown-mural': { title: '街なかに壁画を描いた' },
    'tile-earned-a-pilots-license': { title: '操縦免許を取った' },
    'tile-launched-a-hit-podcast': { title: '人気ポッドキャストを始めた' },
    'tile-patented-a-clever-gadget': { title: '気の利いた発明で特許' },
    'tile-won-the-fantasy-league': { title: 'ファンタジーリーグ優勝' },
    'tile-rescued-a-stray-kitten': { title: '子猫を保護した' },
    'tile-climbed-a-famous-peak': { title: '名峰に登頂' },
    'tile-sold-pottery-worldwide': { title: '陶器を世界に売った' },
    'tile-coached-a-youth-team': { title: '少年チームを指導した' },
    'tile-wrote-a-hit-jingle': { title: 'ヒットCMソングを書いた' },
    'tile-grew-a-prize-pumpkin': { title: '巨大カボチャで入賞' },
    'tile-backed-a-friends-startup': { title: '友人の起業に出資した' },
    'tile-restored-a-vintage-motorcycle': { title: '旧車バイクをレストア' },
    'tile-threw-the-best-block-party': { title: '最高の町内パーティを開いた' },
    'tile-won-the-chili-cook-off': { title: 'チリ料理大会で優勝' },
    'tile-sailed-the-whole-coast': { title: '沿岸を船で走破' },
    'tile-designed-a-city-park': { title: '市民公園を設計した' },
    'tile-fostered-a-whole-litter': { title: '子犬を一腹まるごと預かった' },
    'tile-baked-for-the-whole-town': { title: '町じゅうにパンを焼いた' },
    'tile-taught-a-sold-out-class': { title: '満席の講座を教えた' },
    'tile-hiked-the-long-trail': { title: 'ロングトレイルを歩き通した' },
    'tile-restored-an-old-theatre': { title: '古い劇場を再建した' },
    'tile-named-a-new-beetle': { title: '新種の甲虫に名前をつけた' },
  },

  economy: {
    tuitionNotes: [
      '奨学金の通知は一学期遅れで届き、その頃には差額は自腹になっている。',
      '授業料は、パンフレットに書いてあったとおりの額で収まる。',
      '学科の奨学金が、当てにしていたより多くを埋めてくれる。',
      '全額免除。学部長室からお祝いの電話まで来る。知り合いには一人も起きたことのない話だ。',
    ],
    marriage: {
      rescued: '二度目でようやく「はい」。相手は自動車ローンとカードの残高、そしてそのどちらにもきわめておおらかな態度を持って引っ越してきた。',
      outcomes: [
        '披露宴が勝手に大きくなっていく。会場、花、カメラマン、そして両家そろっていいワインを頼む。',
        '小さくて堅実な式。四十人、いいスピーチがひとつ、ご祝儀で足りた。',
        'ひとつ屋根の下に収入が二つ。家賃が急に半分に見えてくる。',
        '郡じゅうが集まり、誰もが気前よく、しかも相手は何年も黙って貯金していたことが判明する。',
      ],
    },
  },
}
