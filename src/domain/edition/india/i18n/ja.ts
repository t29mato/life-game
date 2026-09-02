import type { EditionTranslation } from '../../i18n/types'

/**
 * The India edition in Japanese.
 *
 * India is foreign to both target languages, so unlike `japan/i18n/ja.ts` or
 * `france/i18n/fr.ts` this overlay keeps every gloss the English tile carries —
 * the coaching classes, the paying-guest room, the shagun envelope that ends in
 * one extra rupee, the two-crore forward in the family group chat. Each is
 * named and explained in the same breath, which is exactly what the English
 * does; the reader is meant to learn the thing while reading the joke.
 *
 * One thing does need care that the English does not: Indian money is counted
 * in lakh and crore, and a Japanese reader has no feel for either. Where a sum
 * is *prose* rather than a number the engine prints, it is rendered in the
 * Japanese reader's own units (二千万ルピー rather than 2 crore) so the tile
 * still lands. Amounts on the tiles themselves are the engine's business and
 * are untouched.
 *
 * Plain form (常体), present tense, short sentences.
 */
export const INDIA_JA: EditionTranslation = {
  locale: 'ja',
  editionId: 'india',

  spaces: {
    'in-start': {
      title: '人生のスタート',
      description: '六月の合格発表の朝、成績表を手に旅が始まる。近所じゅうがもう「次はどうするの」と聞いてくる。',
    },
    'in-uni-hostel': {
      title: '学生寮の部屋',
      description: '初めて家を出た部屋にはベッドが二つ、動く扇風機が一台、そしてベッドの下に持ち物すべてを詰めたトランクがひとつ。',
      harsher: {
        description: 'ベッド二つに動く扇風機が一台。そして寮監が求めてくるのは保証金と食堂の前払い、さらに「施設拡充費」という名の、要するに大学が受け取って返さないお金。',
        reason: '保証金・食堂前払い・施設拡充費',
      },
    },
    'in-uni-admission': {
      title: '入学の日',
      description: '二年間の受験予備校が、日曜の朝ひとつに集約される。受験生で埋まった試験会場、聞こえるのは鉛筆の音と試験監督の靴のきしみだけ。合格順位が届く。そして図書館を案内される前に、窓口で学費を払うことになる。',
      reason: '入学金と授業料',
    },
    'in-uni-tuition-classes': {
      title: '家庭教師のアルバイト',
      description: '毎晩、借りた一室で子どもたちに数学を教える。親は必ず月初に払ってくれる。この副収入は何世代もの学生の生活費をまかなってきた。',
      reason: '夜の家庭教師代',
    },
    'in-uni-credit-card': {
      title: '学生向けクレジットカード',
      description: '大学の門前で愛想のいい勧誘員に作らされたカードは、細かい字の中に高い金利が隠れていた。今月、ついに払うことになる。',
      reason: 'カードの利息',
    },
    'in-uni-scholarship': {
      title: '成績優秀者の奨学金',
      description: '誰も名前を知らない財団から本物の奨学金が出る。何かを売りつけられていないか、通知を三度読み返した。学費のかなりの部分がこれで消える。',
      reason: '成績優秀者奨学金',
    },
    'in-uni-placement-season': {
      title: '就職活動の季節',
      description: '最終学年が始まる。フォーマルシャツ一枚、借りたネクタイ一本、同じ内容の履歴書が四十通、そして朝七時からの適性検査。自分のは書体だけ少しいい。',
      harsher: {
        description: '最終学年が始まる。フォーマルシャツ、地味な靴、いい紙に印刷した履歴書、適性検査の対策講座。すべて別売りだと知る。',
        reason: '就活の一式',
      },
    },
    'in-uni-convocation': {
      title: '学位授与式',
      description: '四年と、卒業研究の報告書一冊と、母が今週中に額に入れるであろう丸めた学位記。これで正式に卒業生だ。',
    },
    'in-uni-farewell': {
      title: '寮の引き払い',
      description: '四年ぶんをトランク二つに詰め、寮監に鍵を返す。',
    },
    'in-campus-placement': {
      title: '学内の採用選考',
      description: '一週間の適性検査とグループディスカッション、そして同期全員が何度も見に行く掲示板。自分の名前が入った内定通知は二通。どちらかを選ぶ。',
    },
    'in-joining-day': {
      title: '入社の日',
      description: '叔父の知り合いに人手が要る。金曜には社員証と勤務表と給料がある。大学組が一ルピーでも稼ぐ二年前の話だ。',
    },
    'in-work-first-salary': {
      title: '初任給',
      description: '生まれて初めての給料はとんでもない大金に見える。習わしどおり通りじゅうに菓子を配り、最初の一枚を母の手に握らせる。母はそれを一生とっておく。',
      reason: '初任給',
    },
    'in-work-payday-1': {
      title: '給料日',
      description: 'まるひと月、名簿に載って働いた。同級生がまだ講義室の席取りに並んでいるうちに、口座に入る。',
      harsher: {
        title: '給料は来週',
        description: '経理は来週だと言う。前回とまったく同じ台詞だ。こちらは今日の食費が要る。',
        reason: '無収入のひと月',
      },
    },
    'in-work-pg-room': {
      title: '下宿の部屋',
      description: '稼いでいる以上、自分の住まいを持つものとされる。保証金と二か月分の前家賃、そして家の決まりが二ページ目まで続く大家さんつきの下宿。',
      reason: '保証金と二か月分の前家賃',
    },
    'in-work-first-night': {
      title: '最初の夜',
      description: '裸電球ひとつの明かりで荷ほどきをする。蛍光灯はまだ来週の買い物リストの上だ。',
    },
    'in-work-uniform': {
      title: '制服の保証金',
      description: '制服二着、名札、安全靴、そして二度と戻ってこない気がする保証金。',
      reason: '制服の保証金',
    },
    'in-work-payday-2': {
      title: '給料日',
      description: 'ひと月働いてまた入金。いまだに誰も学位記を見せろとは言わない。',
      harsher: {
        title: 'シフト削減',
        description: '日曜に貼り出された勤務表で、自分の名前が先週の半分しかない。',
        reason: '半月分のシフト',
      },
    },
    'in-work-payday-3': {
      title: '給料日',
      description: '三回目の給料日。通帳の残高が習慣らしい顔をしはじめた。',
    },
    'in-main-probation': {
      title: '試用期間の面談',
      description: '入社から半年、三枚複写の用紙を持った人が向かいに座り、調子はどうかと尋ねる。振ろう。',
      reason: '試用期間の終わり',
    },
    'in-main-bank': {
      title: '銀行の窓口',
      description: '番号札を取り、扇風機の下で待ち、別の窓口に回され、そこからまた最初の窓口へ、たいへん愛想よく戻される。',
    },
    'in-main-insurance': {
      title: '保険の勧誘',
      description: '保険を売っている親戚が、この会話をこちらの生まれたときから待っていた。書類鞄とラミネートの図表を携え、生年月日はすでに記入済みで現れる。',
    },
    'in-main-payday-1': {
      title: '給料日',
      description: '月末最終営業日の九時ちょうどに入金される。今月いちばんいい通知音だ。',
    },
    'in-main-whatsapp-tip': {
      title: '家族グループの銘柄情報',
      description: '親戚のグループチャットが、ロケットの絵文字を十一個つけた黄色い画像で銘柄を転送してくる。取引所は三時半まで開いている。',
    },
    'in-main-roundabout': {
      title: 'ロータリー',
      description: 'ロータリーでの合流、道を譲る気のないバス、そしてどちらかが想定よりもっと乱暴に道を譲る。修理工場の見積書は社用便箋で届く。',
      reason: '板金修理代',
    },
    'in-main-pileup': {
      title: '高速道路の多重事故',
      description: '冬の高速の霧、ブレーキランプ、そして料金所でひしゃげた四台。全員無事に歩いて帰れたが、請求書は帰らない。',
      reason: '多重事故の修理代',
    },
    'in-main-root-canal': {
      title: '根管治療',
      description: '詰め物ひとつ、被せものひとつ、甘い物についての説教ひとつ、そしてドリルよりよほど沁みる請求書。',
      reason: '歯の治療費',
    },
    'in-main-first-rain': {
      title: '最初の雨',
      description: '二か月の猛暑のあと、ついに空が破れる。オフィスじゅうが屋上に流れ出し、誰かが新人を揚げ物の買い出しにやる。今日はもう何も進まない。それでいい。',
    },
    'in-crossroads': {
      title: '入社五年目',
      description: '同じ机で五年、昇給通知は予定どおり、そして転職エージェントのメッセージをなぜかまだ消していない。道はここで分かれる。',
    },
    'in-loyal-seniority': {
      title: '年功序列名簿',
      description: 'この部署はここ十年、誰も辞めていない。上のポストは誰かが定年を迎えて初めて空く。今年がその年かどうか、振ってみよう。',
      reason: '上のポストが空いた',
    },
    'in-switch-lookout': {
      title: 'こっそり転職活動',
      description: '定時後にSNSの職歴を更新し、隣の席に絶対に聞こえない場所で電話を取り始める。',
    },
    'in-switch-hike': {
      title: '四十パーセントの昇給',
      description: '次の内定通知を手にしてから辞表を出す。人事は引き留めの面談を組み、さらにもう一度組む。対抗条件は、どうでもよくなったちょうど一日後に届く。',
      reason: 'よそで昇給を勝ち取った',
    },
    'in-switch-joining-bonus': {
      title: '入社ボーナス',
      description: '新しい会社が退職までの期間を買い取ってくれ、待たずに来た祭りの賞与のような振り込みが届く。',
    },
    'in-main-appraisal': {
      title: '人事評価',
      description: '小さな会議室、自己評価シートを挟んで座る上司が二人、そしてチーム全員と並べて順位づけされる評点。振って、自分がどこに落ち着くか聞こう。',
      reason: '評価の時期が回ってきた',
    },
    'in-main-tax-notice': {
      title: '税務署の通知',
      description: 'たいへん丁寧な通知、領収書の詰まった靴箱と会計士と過ごす長い午後、そして最後に書かれた、明らかにもう決まっていた金額。',
      reason: '税務通知の追徴',
    },
    'in-main-rolled-off': {
      title: '案件から外れる',
      description: '四月には更新されると誰もが言い切っていた客先の案件が、ごく静かに更新されない。案件のない「待機」扱いになり、給料は出たまま次を待つ。会社のほうが先に待つのをやめるまでは。',
      reason: '待機のすえ契約終了',
    },
    'in-main-restructuring': {
      title: 'リストラ',
      description: '会社が「希望退職」の制度を発表し、その希望者の名簿に自分の名前が載っている。',
      reason: '希望した、ことになっている',
    },
    'in-main-job-portal': {
      title: '転職サイト',
      description: '深夜にプロフィールを「積極的に求職中」に切り替えると、朝食の頃には二社が経歴を気に入っている。どちらかを選ぶ。',
      reason: '転職サイトで仕切り直し',
    },
    'in-main-diwali-hampers': {
      title: 'ディワリの贈答',
      description: '全員にドライフルーツの詰め合わせ。カタログの中からたいへん慎重に選ぶ。カタログはだいたい円形に並べたカシューナッツである。',
      reason: '見事に詰め合わせた贈答品を全員に',
    },
    'in-wedding': {
      title: '結婚式',
      description: '三日間、五つの儀式、白馬一頭、ブラスバンド一組。招待客は全員、しきたりどおり金額の末尾が一ルピーだけ多い飾り封筒を差し出す。',
    },
    'in-family-nursery-setup': {
      title: '子ども部屋の準備',
      description: '子ども部屋を明るい黄色に塗り、真夜中にベビーベッドを組み立てる。その間、両家の祖母からの助言が赤ん坊より早く到着する。',
      reason: '子ども部屋の準備',
    },
    'in-family-new-baby': {
      title: '赤ちゃん誕生',
      description: '小さな同居人がやってくる。そして親戚一同もやってくる。菓子と意見と、会場を借りないと収まらない命名式を携えて。',
    },
    'in-family-admission': {
      title: '学校の入学審査',
      description: '「いい学校」が面接するのは子どもではなく親のほうだ。面接は通る。そして裏面に印刷された学費の一覧が、口座を空にする。',
      reason: '子ども一人あたりの学費',
    },
    'in-family-school-list': {
      title: '入学用品リスト',
      description: '制服は指定の一店、教科書は別の一店、そして火曜までに手書きで名前を入れる四十一点。通学かばんは最初の携帯より高く、その携帯より長持ちする。',
      reason: '子ども一人あたりの制服と教科書',
    },
    'in-family-sports-day': {
      title: '運動会',
      description: 'わが子の組がリレーで勝つ。同じ体操着の別の子を大半撮っていたが、声援は本物だった。',
    },
    'in-family-twins': {
      title: '双子',
      description: '検査技師が急に黙り、画面をこちらに向けて、指を二本立てる。',
    },
    'in-fast-payday-1': {
      title: '給料日',
      description: '深夜まで働いた分が、やっと給与明細に載る。',
    },
    'in-fast-headhunted': {
      title: 'ヘッドハンティング',
      description: '月曜の朝会の最中に私用の携帯が鳴る。エージェントは案件を二つ抱え、待つ気はまるでない。',
      reason: '引き抜きの話が来た',
    },
    'in-fast-burnout': {
      title: '燃え尽きて休職',
      description: '診断書で六週間の休み。社員証をかざして戻るころには、給与明細がずいぶん軽くなっている。',
      reason: '無給休職',
    },
    'in-fast-payday-severance': {
      title: '年度末の給与',
      description: '会計年度が締まる。組織図が引き直される前に、今の仕事の給料がもう一度だけ口座に届く。',
    },
    'in-fast-reorg': {
      title: '組織改編',
      description: '一夜で組織図が引き直され、自分の名前がまったく別の枠に入っている。誰にも聞かれなかった。組織改編とはそういうものだ。',
      reason: '組織改編で配置換え',
    },
    'in-fast-trading-app': {
      title: '取引アプリ',
      description: 'ボーナスを使いたくてうずうずしている。アプリはさっきからロケットの絵文字つきの通知を寄こしてくる。',
    },
    'in-fast-payday-2': {
      title: '給料日',
      description: 'また一か月が過ぎ、また入金がある。',
      harsher: {
        title: '変動給の返還',
        description: '別の時間帯にいる誰かが去年の変動給を査定し直す。しかも下方に査定し直す。',
        reason: '変動給の返還',
      },
    },
    'in-fast-counteroffer': {
      title: '引き留めの条件',
      description: 'チャイを前に、よそから声がかかっていると軽く漏らす。対抗条件はチャイより先に出てくる。',
    },
    'in-midtown-brokerage': {
      title: '証券口座',
      description: 'ついに証券口座を開く。話の中では毎年相場に勝っている叔父の指導のもとで。',
    },
    'in-midtown-insurance': {
      title: '保険の窓口',
      description: '家の鍵を渡す前に、補償について少し話をさせてほしい人がいる。広げられた地域の浸水地図は、網羅的で、更新も新しく、そして静かに恐ろしい。',
    },
    'in-midtown-payday': {
      title: '給料日',
      description: 'マンションの申込金を払う週に、給料が振り込まれる。',
    },
    'in-midtown-joint-account': {
      title: '共同口座',
      description: '給料はひとつにまとめられ、自分の分も共同口座に入る。そこから毎月決まった額だけ手元に戻ってくる。家計簿の欄には「小遣い」と書いてある。',
      reason: '家計の精算',
    },
    'in-midtown-festival-bonus': {
      title: '祭りの賞与',
      description: 'ディワリの賞与が振り込まれる。約束の額ではなく月給の何か月分かで決まるので、全員の金額が違う。',
    },
    'in-midtown-raise': {
      title: '昇給',
      description: 'エレベーター前での短い立ち話、新しい金額、そして寸分たがわぬ力加減の握手。',
    },
    'in-midtown-repo-rate': {
      title: '政策金利',
      description: '木曜の朝に中央銀行が金利を動かし、金曜には家じゅうの住宅ローンの毎月の返済額が道連れになっている。',
      reason: '金利が悪いほうへ動いた',
    },
    'in-model-flat': {
      title: 'モデルルーム',
      description: 'レンタル家具のサンプル住戸、共用施設の完成予想図で埋まったパンフレット、そして返済期間が残りの職業人生とぴったり同じ長さの営業担当。',
    },
    'in-risky-startup': {
      title: 'スタートアップに出資',
      description: '友人のベンガルールのスタートアップに貯金をつぎ込む。いくら返ってくるかはサイコロ次第。',
      reason: '出資の払い戻し',
    },
    'in-risky-bad-tip': {
      title: 'ハズレの銘柄',
      description: '三つのグループチャットに転送した「堅い」銘柄が一週間で沈む。あれだけ大勢に勧めた責任として、全員に夕食をおごる。',
      reason: 'ハズレ銘柄のお詫び',
    },
    'in-risky-golf': {
      title: '接待ゴルフ',
      description: '会員制コースで十八ホール、一ホールごとの軽い賭け、そして今日の勝ちが自然に見えるよう、シーズン中ずっと実力より下手に打ってきた成果。',
      reason: '十八回の軽い賭け',
    },
    'in-risky-crash': {
      title: '相場の暴落',
      description: '指数が大きく沈み、持ち株がまともに食らう。父がまた、証券マン一人の不正が市場全体を吹き飛ばした年の話をする。',
      reason: '相場の暴落',
    },
    'in-risky-second-leg': {
      title: '二番底',
      description: '指数は誰も想定していなかった底をさらに掘り当てる。しかも後場のうちに。',
      reason: '相場のさらなる下落',
    },
    'in-risky-lottery': {
      title: '祭りの特別くじ',
      description: 'よく当たると評判の売り場に四十分並ぶ。よく当たると評判なのだから、よく当たるはずだ。並んだ甲斐があったかどうかは、振って決める。',
      reason: '祭りの特別くじの当選金',
    },
    'in-risky-payday': {
      title: '給料日',
      description: '投資のほうが荒れている最中に、給料が振り込まれる。',
    },
    'in-risky-swap': {
      title: '首位と交換',
      description: 'フィルターコーヒー一杯を挟んだ握手ひとつ。首位の相手と口座の残高をそっくり入れ替える。',
      reason: '首位との取引',
    },
    'in-safe-cashback': {
      title: 'ポイント還元の日',
      description: '決済アプリ四つ、はち切れそうなスマホ一台、そしてレジで貯まった還元が買い物かごの全額を飲み込む瞬間。',
      reason: '還元ポイントの入金',
    },
    'in-safe-payday': {
      title: '給料日',
      description: '月末最終営業日に振り込まれる。物心ついてから毎月そうだったように。',
      harsher: {
        title: '給与の支払い遅延',
        description: 'どこかの表計算のセルひとつのせいで、今月の給料は来月に届くことになる。',
        reason: 'ひと月ぶんの給与保留',
      },
    },
    'in-safe-excess': {
      title: '保険の自己負担',
      description: '慎重な道にも保険金の請求書はある。調査員の報告書は、免責分をきっちりその額だけ差し引いてくる。',
      reason: '保険の免責額',
    },
    'in-safe-ledger': {
      title: '家計のノート',
      description: '一年間、律儀に家計のノートをつけ通す。オートリキシャの運賃も玉ねぎ一キロも全部。年末には、思っていたより貯まっている。',
      reason: '家計ノートの黒字',
    },
    'in-safe-old-passbook': {
      title: '古い通帳',
      description: '実家の鉄製の戸棚から子どものころの郵便貯金の通帳が出てくる。中の残高は小学校のころから静かに増え続けていた。',
      reason: '忘れていた口座',
    },
    'in-safe-gold-coins': {
      title: '金貨の引き出し',
      description: '毎年、金を買う縁起のいい祭りの日に、小さな金貨をひとつずつ貸金庫へ入れてきた。今日、宝石商が引き出しごと量る。記憶より多く貯まっていた。',
      reason: '量られた金貨',
    },
    'in-safe-payday-2': {
      title: '給料日',
      description: 'また月末最終営業日、また静かな入金。この道はそれでいい。',
    },
    'in-safe-dividend': {
      title: '配当の日',
      description: '手堅いほうの持ち株が、手堅い額をきちんと出してくる。サモサがとてもおいしい株主総会の案内つきで。',
      reason: '四半期配当',
    },
    'in-sunset-number': {
      title: '老後二千万ルピー問題',
      description: 'どの親戚グループチャットにも、安心して老後を過ごすにはいくら要るかの計算が転送されてくる。どれも二千万ルピーだと言う。自分でざっと計算すると、もう少し多い。そしてその数字は、放っておいても引き出されない。',
    },
    'in-sunset-upgrade': {
      title: '住み替え',
      description: '不動産業者から電話。もっと明るくて、もっと高い階で、ぎりぎり手が届く。新しいタワーに空きが出て、その階には眺めがある。',
    },
    'in-sunset-flood': {
      title: '百年に一度の大雨',
      description: '百年に一度の雨が、この十年で三度目にやってくる。一階で一晩過ごし、片づけを手伝わずに帰っていく。',
      reason: '浸水の被害',
    },
    'in-sunset-parents': {
      title: '親の介護',
      description: 'かつて自分を背負ってくれた人を、今度は背負う番になる。いつか用意するつもりだった部屋へ、二人が移ってくる。費用を数えるつもりはない。病院のほうが勝手に数える。',
      reason: '家族の介護費',
    },
    'in-sunset-payday-1': {
      title: '給料日',
      description: '数えるほどしか残っていない給料の、そのひとつが振り込まれる。',
    },
    'in-sunset-swap': {
      title: '最後の取引',
      description: 'フィルターコーヒーを挟んだ最後の大胆な握手。首位の相手の財産が、代わりに自分と一緒に席を立つ。',
      reason: '土壇場の交換',
    },
    'in-sunset-children-visit': {
      title: '子どもたちの帰省',
      description: '大きくなった子どもたちが、贈り物でいっぱいのスーツケースを提げて帰り、祭壇の間にそっと封筒を置いていく。海外にいる一人は送金にして、代わりに二時間の電話をよこす。',
      reason: '子ども一人ひとりからの封筒',
    },
    'in-sunset-sticky': {
      title: 'つい手が伸びる',
      description: 'いいチャイを出しながら、首位の相手にいちばんいい思い出話を譲るよう説得しはじめる。',
      reason: '思い出がひとつ移る',
    },
    'in-sunset-last-title': {
      title: '最後の肩書き',
      description: '説得できれば、退職前にもうひとつだけ肩書きがつく。振って、人生最後の人事評価に決めてもらおう。',
      reason: '人生最後の人事評価',
    },
    'in-sunset-payday-2': {
      title: '給料日',
      description: '給料日を数えるのはとうにやめたが、月末最終営業日のほうはやめていない。',
    },
    'in-sunset-final-notice': {
      title: '最後の納税通知',
      description: 'オフィスの扉が背中で永遠に閉まる前に、税務当局からの封筒がもう一通だけ届く。',
      reason: '最後の税金',
    },
    'in-sunset-ahead': {
      title: '夕暮れが見える',
      description: '屋上から見ると、近所じゅうの凧が夕闇へ上がっていく。忙しくて見上げなかっただけで、冬の夕方はずっとそうだった。',
    },
    'in-retirement': {
      title: '定年退職',
      description: '肩にかけられたショール、手に持たされたココナッツ、額に入った集合写真。そして四十年で初めて、行く先のない月曜日。',
    },
  },

  lanes: {
    'The College Route': {
      name: '大学コース',
      summary: '二年間の予備校と、すべてを決める日曜朝の試験ひとつ。そして一ルピーも稼がないうちに学費を全額前払いする。学位が買うのは、たいてい上がっていく就職のはしごだ。堅実ではあるが、大きくはならない。',
    },
    'Straight to Work': {
      name: '就職コース',
      summary: '叔父の知り合いに人手が要る。金曜には給料が出る。大学組が稼ぎ出す何年も前の話だ。安全網はなく、職人のはしごは一段目が厳しく、てっぺんはこの卓のどの大卒より稼ぐ。',
    },
    'The Permanent Post': {
      name: '安定雇用コース',
      summary: '動かない。昇給は年功で、遅いが確実に来る。ディワリの賞与は外れたことがない。会社は忠誠を覚えている——たいていは。ついでに、住む街も会社が決める。',
    },
    'The Switch': {
      name: '転職コース',
      summary: '出て、昇給幅を自分で言う。エージェントには好かれ、人事には記録される。最初の引きが悪かったなら痛快、良かったなら本物の賭けだ。',
    },
    'Family Lane': {
      name: '家族コース',
      summary: '学用品リスト、塾、そして騒がしい家。最後には大きくなった子どもの数だけ封筒が届く。給料日はぐっと減り、請求書は人数ぶん増える。',
    },
    'Career Track': {
      name: '出世コース',
      summary: '働く時間は本物で、昇給も賞与も廊下の突き当たりの個室も本物だ。そのために手放したものも、同じくらい本物だが。',
    },
    'Dalal Street': {
      name: '投機コース',
      summary: 'オプション、暗号資産、そしてやたらいいスーツを着た人からの耳より情報。モデルルームの時点で後ろにいるなら来るべきだし、前にいるならよく考えたほうがいい。',
    },
    'Steady Street': {
      name: '堅実コース',
      summary: '定期預金、金貨、スクラッチくじ、そして一ルピー単位の家計ノート。ここで大金持ちになった者も、破滅した者もいない。すでに勝っているなら、それは相当な値打ちだ。',
    },
  },

  careers: {
    'career-in-parlour-apprentice': {
      title: '美容室のアシスタント',
      description: 'ハサミを持たせてもらえるまで二年間、ドライヤーを持ち、床を掃く。糸脱毛の練習台は、辛抱強い妹。',
    },
    'career-in-beautician': {
      title: '美容師',
      description: '自分の椅子を持ち、十一月の予定は七月に埋まり、この人の手でなければ嫌だと街を横断してくる花嫁がいる。',
    },
    'career-in-bridal-salon-owner': {
      title: 'ブライダルサロン経営者',
      description: '三つの地区の結婚式が真っ先に予約する店を切り盛りしている。書き入れ時は四か月だが、それで十二か月ぶんを稼ぐ。',
    },
    'career-in-sweet-shop-apprentice': {
      title: '菓子店の見習い',
      description: '四時に入って十時に上がる。まだシロップには近づかせてもらえない。当面は牛乳をきちんと煮ることが仕事のすべてだ、と言われている。',
    },
    'career-in-sweet-maker': {
      title: '菓子職人',
      description: '大鍋の前に立ち、糖度を読み、澄ましバターの匂いだけで、いつ黙って鍋を見に行くべきかが分かる。',
    },
    'career-in-sweet-shop-owner': {
      title: '菓子店の主',
      description: 'カウンターひとつ、誰にも聞き出されたことのないレシピひとつ、そして祭りの週には警察が丁寧に整理を手伝う行列。',
    },
    'career-in-dosa-griddle-cook': {
      title: 'ドーサの焼き手',
      description: '一メートル超の鉄板ひとつ、生地六種類、そして一週間の値打ちを決めるオフィス街の昼のピーク。',
    },
    'career-in-chaat-cart-owner': {
      title: '軽食屋台の店主',
      description: '五時に市場のわきへ屋台を出し、夕方の人波をちょっとした祭りに変える。行列そのものがサイコロだ。',
    },
    'career-in-dhaba-owner': {
      title: '街道食堂の主',
      description: '編み縄のベッドが四十台、妥協のない豆料理ひとつ、そして国道を走る運転手全員が、この厨房が何時に開くかを正確に知っている。',
    },
    'career-in-site-labourer': {
      title: '建設作業員',
      description: '足場を九階まで荷を担いで上がり、現場の道具がどこにあるかを本当に知っていて、クレーンの操縦士が唯一信用している人。',
    },
    'career-in-site-supervisor': {
      title: '現場主任',
      description: '朝の点呼と出面帳、そしてセメント業者との恒例の言い合いを仕切る。',
    },
    'career-in-building-contractor': {
      title: '建設請負人',
      description: '丸めた図面を、雨季を耐え抜く塔に変えていく。見積もりは建築家が言い終える前に出る。',
    },
    'career-in-delivery-rider': {
      title: '配達員',
      description: 'アプリが「やや混雑」と呼ぶ渋滞をスクーターで縫い、どの建物のエレベーターが止まっているかを客より先に知っている。割増時間帯がサイコロだ。',
    },
    'career-in-hub-dispatcher': {
      title: '配送拠点の配車担当',
      description: 'スクーターを降りて管理画面の前へ。担当区域の配達員が、名前と家族のついた点になって並ぶ。',
    },
    'career-in-logistics-lead': {
      title: '物流責任者',
      description: '大型セール一回ぶんの荷物を夜間仕分けで動かし、そのからくりに牛乳配達が気づく前に帰宅する。',
    },
    'career-in-garage-apprentice': {
      title: '整備見習い',
      description: '三年間、親方に十四ミリのスパナを渡し続けた。そしてスクーターのほうが親方の足音を聞き分けている気がしてきた。',
    },
    'career-in-scooter-mechanic': {
      title: 'スクーター整備士',
      description: '配達スクーターの不平を、乗り手が異音を説明し終える前に聞き取ってしまう。',
    },
    'career-in-garage-owner': {
      title: '整備工場オーナー',
      description: 'ピット四つ、雨季の順番待ち、そしてトラックの荷台で運び込まれてきたバイクの写真が並ぶ壁。',
    },
    'career-in-session-player': {
      title: 'スタジオミュージシャン',
      description: '国じゅうが口ずさんだ映画音楽のフルートを吹いている。誰もクレジットを読まないし、次の仕事までは電話を待つ。',
    },
    'career-in-wedding-band-leader': {
      title: '婚礼バンドのリーダー',
      description: '白と金の制服で金管隊を率い、道の真ん中を進んでいく。その季節の予約数がサイコロだ。',
    },
    'career-in-music-director': {
      title: '音楽監督',
      description: 'ガラスの向こうで「もう一回、もっと切なく」と言う。そしてなぜかいつも正しい。',
    },
    'career-in-radio-runner': {
      title: 'ラジオの雑用係',
      description: 'チャイを買いに走り、ゲストに合図を出し、リスナーの電話をさばき、番組の作り方を静かに覚えていく。',
    },
    'career-in-radio-jockey': {
      title: 'ラジオパーソナリティ',
      description: '午前二時、長距離ドライバーと眠れない受験生のリクエストを読む。顔を知られないまま全国で愛されている。',
    },
    'career-in-station-director': {
      title: '放送局のディレクター',
      description: '十一本の番組を回し、うち一本には今も芸名で出演し、十二本ぶんのスポンサー枠を売る。',
    },
    'career-in-second-shooter': {
      title: 'セカンドカメラマン',
      description: '披露宴会場のうしろ側と、新婦の父が泣くのをやめて隠さなくなる瞬間を押さえる。',
    },
    'career-in-wedding-photographer': {
      title: 'ブライダルカメラマン',
      description: '十一月から二月は二年先まで埋まり、七月は無音。予約表がサイコロで、婚礼シーズンが一年を決める。',
    },
    'career-in-rental-broker': {
      title: '賃貸仲介',
      description: '土曜に一寝室の物件を十一件案内し、どの物件が「地下鉄まで徒歩二分」を全力疾走で測ったかを覚えている。',
    },
    'career-in-property-dealer': {
      title: '不動産業者',
      description: 'まずバルコニーを売り、次に共用施設を売り、片道九十分の通勤の話は決してしない。',
    },
    'career-in-builder': {
      title: 'デベロッパー',
      description: '高架四本の上に自分の名前の広告が出る。販売の当たり年が一度あれば、静かな三年を支えられる。',
    },
    'career-in-warehouse-picker': {
      title: '倉庫のピッキング',
      description: '同じベルトコンベアの脇を一勤務で十数キロ歩き、停電の中でも四十番通路にたどり着ける。',
    },
    'career-in-warehouse-lead': {
      title: '倉庫のリーダー',
      description: 'クリケット場四面ぶんの建物を、小さなグラスのチャイとバインダーだけで、大型セールの期間じゅう回し続ける。',
    },
    'career-in-chai-stall-helper': {
      title: 'チャイ屋台の手伝い',
      description: 'グラスを洗い、四つのオフィスへ盆を運び、盆なしでも六杯を階段で運べる。',
    },
    'career-in-chai-stall-owner': {
      title: 'チャイ屋台の主',
      description: 'オフィスビルの前で、同じ完璧なチャイを一日千杯淹れる。その会社について、役員より詳しい。',
    },
    'career-in-cricket-coach': {
      title: 'クリケット教室のコーチ',
      description: '土のグラウンドで夜明けの練習を仕切り、ボールマシンに手で球を入れ、全員のカバードライブを覚えている。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-in-farmer': {
      title: '農家',
      description: '地区じゅうの市場がそのために開く小麦を作っている。土地開発業者の話は三度断った。断るたびに決定的になった。',
    },
    'career-in-medical-resident': {
      title: '研修医',
      description: '二度目の挑戦で医学部入試を突破し、いまは建物が開く前から行列ができる公立病院で夜勤に入っている。',
    },
    'career-in-hospital-surgeon': {
      title: '外科医',
      description: 'ぶれない手と、それ以上にぶれない胆力で人を救う。外来の患者たちは、この人を身内のように思っている。',
    },
    'career-in-junior-advocate': {
      title: '新人弁護士',
      description: '先輩の書類を抱えて高等裁判所の階段を上り、九百ページを起案し、自分の名で書ける一段落を何年も待つ。',
    },
    'career-in-high-court-advocate': {
      title: '高等裁判所の弁護士',
      description: '仕立てのいい黒い法服と、それより鋭い判例引用、そして誰も予想しなかった期日変更の腕で法廷を制する。',
    },
    'career-in-architectural-assistant': {
      title: '建築設計助手',
      description: '車一台ぶんの間口の家のために階段の詳細図を十一回描き、最初の十回より十一回目から多くを学ぶ。',
    },
    'career-in-architect': {
      title: '建築家',
      description: '無理のある敷地に中庭を落とし込み、六平米のベランダを村の朝のように感じさせる。',
    },
    'career-in-software-trainee': {
      title: 'ソフトウェア研修生',
      description: '三か月の研修キャンパス、社員証一枚、そして誰もが「保守」と呼び、誰も簡単だとは言わない最初の案件。',
    },
    'career-in-software-engineer': {
      title: 'ソフトウェアエンジニア',
      description: '客先の時差に合わせて夜十一時半の会議に出て、リリースを通し、世界の事務処理の半分を静かに動かし続ける。',
    },
    'career-in-associate-product-manager': {
      title: 'アソシエイトプロダクトマネージャー',
      description: 'ベンガルールのアプリのために四か月ユーザーストーリーを書き、地下鉄で見知らぬ人が説明も読まずにその機能を使うのを見る。',
    },
    'career-in-product-manager': {
      title: 'プロダクトマネージャー',
      description: 'ロードマップひとつ、指標ひとつ、そしてメールで済んだはずなのに火曜日を丸ごと食う会議ひとつを預かっている。',
    },
    'career-in-propulsion-graduate': {
      title: '推進工学の新卒',
      description: '宇宙計画のバルブひとつを一年かけて試験する。有意義な一年だったと思っている。実際そのとおりだ。',
    },
    'career-in-spacecraft-engineer': {
      title: '宇宙機エンジニア',
      description: 'よその機関なら打ち上げの祝賀会に使う額で探査機を着陸させる。そして親戚の集まりのたびに同じ質問に答える。',
    },
    'career-in-bank-probationary-officer': {
      title: '銀行の研修行員',
      description: '百万人の受験者を抑えて採用試験を突破し、いまは現金窓口から支店の仕事を、転勤を重ねながら覚えている。',
    },
    'career-in-bank-branch-manager': {
      title: '銀行の支店長',
      description: '通り沿いの商店主が全員口座を持つ支店を任されている。どの親戚より多く結婚式に招かれる。',
    },
    'career-in-civil-service-probationer': {
      title: '国家公務員の研修生',
      description: '二十代の三年をひとつの試験に捧げ、これで最後にすると誓った回で合格した。いまは受験勉強と同じ気迫で、県の運営を覚えている。',
    },
    'career-in-district-collector': {
      title: '県の長官',
      description: '築百年の庁舎から三百万人の県を動かす。朝の陳情の列は、この人なら何でも解決できると信じている。だいたい、その通りだ。',
    },
    'career-in-research-assistant': {
      title: '研究助手',
      description: '他人の論文のために夜明けの濡れた草地で数を数える。その一分一分が楽しくて仕方ない。',
    },
    'career-in-tiger-reserve-biologist': {
      title: '虎保護区の生物学者',
      description: '国じゅうが並ぶ保護区を研究している。とびきり写真を撮られている雌虎一頭とは名前で呼び合う仲だ。',
    },
    'career-in-writers-room-assistant': {
      title: '脚本部屋の助手',
      description: '一話も落とさない連続ドラマのために、午前四時まで結婚式の場面を書く。自分の脚本は引き出しの中で待っている。',
    },
    'career-in-tv-serial-writer': {
      title: '連続ドラマの脚本家',
      description: 'ついに連載枠を持つ。報酬はサイコロ、木曜の視聴率は予告なく番組ごと打ち切りにでき、そして結婚式の回は毎年必ず来る。',
    },
    'career-in-veterinarian': {
      title: '獣医',
      description: '不安そうな農家をなだめながら、水牛の脚を静かに処置する。どんなクリニックチェーンとも、この診療所を取り替えるつもりはない。',
    },
    'career-in-university-professor': {
      title: '大学教授',
      description: '火曜に講義し、水曜に教員室で論争し、金曜には相手の考えを変えている。学部長の椅子は二度断った。',
    },
  },

  houses: {
    'house-in-ancestral-village-house': {
      name: '村の生家',
      description: '中庭、マンゴーの木、そして兄弟三人の名前が載った権利証。売るには一族会議が要る。持ち続けるのに要るのは愛情だけだ。',
    },
    'house-in-one-bhk-flat': {
      name: '郊外の1LDK',
      description: '寝室ひとつ、居間ひとつ、台所ひとつ、そして路地の突き当たりに近郊電車。募集広告の「駅から二分」は、珍しく本当だった。',
    },
    'house-in-row-house': {
      name: '地方都市の連棟住宅',
      description: '共有の壁と車寄せのある、管理された住宅地の二階建て。祭りのたびに料理を届けてくれる隣人つき。祭りはだいたい毎日ある。',
    },
    'house-in-mill-loft': {
      name: '紡績工場のロフト',
      description: '古い紡績工場の一フロア。鉄柱、六メートルの天井、そして前世紀から回り続ける見事にうるさいシーリングファンが一台。',
    },
    'house-in-duplex': {
      name: '親と二世帯の家',
      description: '一階は親、二階は自分。台所をめぐる交渉は、引っ越しの荷物と同じ日に始まる。',
    },
    'house-in-goa-villa': {
      name: 'ゴアの別荘',
      description: '赤いラテライトの壁、何もしないために作られたベランダ、そして留守のあいだの貸し出しで年間の費用がまかなえる立地。',
    },
    'house-in-city-farmhouse': {
      name: '市境のファームハウス',
      description: '門、クリケット場ほどの芝生、そして農作物はただの一度も育てられたことがない。ここが育てるのは結婚式だ。',
    },
    'house-in-sea-facing-flat': {
      name: '海の見えるタワー住戸',
      description: '十八階、アラビア海を丸ごと、そして誰より先に窓へ届く雨季。値段のほとんどは「海が見える」という言葉ぶんだ。',
    },
    'house-in-south-city-penthouse': {
      name: '南地区のペントハウス',
      description: '古い邸宅街を見下ろす最上階まるごと。エレベーターは居間に直結していて、その居間からは、もう並ばなくていい渋滞が見下ろせる。',
    },
  },

  stocks: {
    'stock-in-dairy': {
      name: 'エブリデイ乳業協同組合',
      description: '三百万戸の酪農家、国じゅうの朝食の食卓に載るひとつの銘柄、そして朝の呼び鈴なみに正確な配当。',
    },
    'stock-in-solar': {
      name: 'タール砂漠ソーラーパーク',
      description: '年に三百三十日晴れる砂漠に、地平線までパネルが並ぶ。退屈で美しい配当を回し続ける。',
    },
    'stock-in-pictures': {
      name: 'マリンラインズ映画社',
      description: '祭りの週末の大ヒットひとつで栄光、三十億ルピーのコケひとつでニュースの主役。',
    },
    'stock-in-fintech': {
      name: 'キャッシュレス・バザール',
      description: '国じゅうの野菜の屋台がここのQRコードを読ませている。それが利益になるかどうかは、今期の規制当局の通達しだいだ。',
    },
    'stock-in-rocketry': {
      name: 'ペニンシュラ・ロケット',
      description: '海沿いの射場から、わずかな予算で小型衛星を打ち上げる。次の国民的な誇りか、とても高価な祭りの花火か。',
    },
  },

  lifeTiles: {
    'tile-in-mumbai-marathon': { title: 'ムンバイマラソンを完走' },
    'tile-in-railway-novel': { title: '駅売りのベストセラーを書いた' },
    'tile-in-street-dog': { title: '野良犬に選ばれて家族になった' },
    'tile-in-kovalam-surf': { title: 'コヴァラムでサーフィンを覚えた' },
    'tile-in-curry-leaves': { title: 'ベランダでカレーリーフを育てた' },
    'tile-in-biryani': { title: '祖母のビリヤニを再現しきった' },
    'tile-in-himalayan-circuit': { title: 'ヒマラヤ一周を踏破' },
    'tile-in-fusion-album': { title: 'フュージョンのアルバムを出した' },
    'tile-in-mango-treehouse': { title: 'マンゴーの木に小屋を作った' },
    'tile-in-street-food-map': { title: '屋台グルメの地図がバズった' },
    'tile-in-goa-triathlon': { title: 'ゴアのトライアスロン完走' },
    'tile-in-lane-dogs': { title: '路地の野良犬に全部えさをやった' },
    'tile-in-sugarcane-empire': { title: 'サトウキビジュース帝国を築いた' },
    'tile-in-underpass-mural': { title: '線路下の地下道に壁画を描いた' },
    'tile-in-solo-flight': { title: 'デカン高原を単独飛行した' },
    'tile-in-cricket-podcast': { title: '人気クリケット番組を始めた' },
    'tile-in-solar-cooler': { title: 'ソーラー冷水器で特許' },
    'tile-in-fantasy-cricket': { title: 'ファンタジークリケットで優勝' },
    'tile-in-temple-kitten': { title: '寺の子猫を保護した' },
    'tile-in-base-camp': { title: 'エベレスト基地まで歩いた' },
    'tile-in-blue-pottery': { title: '青い陶器を世界に売った' },
    'tile-in-colony-cricket': { title: '団地のクリケットチームを指導' },
    'tile-in-film-song': { title: '大ヒットした映画音楽を書いた' },
    'tile-in-bottle-gourd': { title: '巨大ヒョウタンで入賞' },
    'tile-in-bengaluru-startup': { title: '友人のベンガルールの起業に出資' },
    'tile-in-grandfathers-motorcycle': { title: '祖父のバイクをレストア' },
    'tile-in-society-diwali': { title: '団地のディワリの会を主催した' },
    'tile-in-pickle-contest': { title: '漬物コンテストで優勝' },
    'tile-in-konkan-sail': { title: 'コンカン海岸を船で走破' },
    'tile-in-neighbourhood-park': { title: 'ごみ捨て場を公園に変えた' },
    'tile-in-monsoon-puppies': { title: '雨季の子犬六匹を預かった' },
    'tile-in-sweets-for-building': { title: '棟じゅうにディワリの菓子を配った' },
    'tile-in-yoga-class': { title: '満席の屋上ヨガ教室を教えた' },
    'tile-in-valley-of-flowers': { title: '花の谷を歩いた' },
    'tile-in-single-screen': { title: '古い一館だけの映画館を再建した' },
    'tile-in-new-butterfly': { title: '西ガーツの新種の蝶に名前をつけた' },
  },

  economy: {
    tuitionNotes: [
      '学校裁量枠の席は募集要項に載っていない額を要求し、さらに一年ぶんの予備校代が上乗せされる。',
      '予備校代も受験料も入学金も、見積もっていたとおりの額で収まる。',
      '成績と家計の両方を見る奨学金が、見込んでいたより長く四年間を支えてくれる。',
      '全額免除に届く全国順位。親戚が一生言い続ける種類の結果だ。',
    ],
    marriage: {
      rescued: '二度目でようやく「はい」。相手は限度額いっぱいのクレジットカード三枚と、二世代前の携帯の分割払いと、そのどちらにもきわめておおらかな態度を持って引っ越してきた。',
      outcomes: [
        '結婚式が週ごとに儀式を増やしていく。婚約式、音楽の夜、カクテルの夕べ、白馬、ブラスバンド、そして両家そろって大きいほうの会場を主張する。',
        '夜明けの寺での式と、いい店での昼食が一度。六十人、心に残る叔父のスピーチがひとつ、ご祝儀で足りた。',
        'ひとつ屋根の下に収入が二つ。二寝室の家賃が急に半分に見えてくる。',
        '三つの村ぶんの客が集まり、誰もが気前よく、しかも相手は初任給のころから黙って積立をしていたことが判明する。',
      ],
    },
  },
}
