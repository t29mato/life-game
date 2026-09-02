import type { EditionTranslation } from '../../i18n/types'

/**
 * The France edition in Japanese.
 *
 * The mirror of `fr.ts` next door: that overlay could drop every gloss because
 * a French reader knows what a rupture conventionnelle is, and this one has to
 * keep them all. Japanese has no word for the chambre de bonne, the concours,
 * or the notaire's fee that is really a tax, so each is named and then
 * explained in the same breath — 屋根裏の女中部屋, グランゼコールの入学試験,
 * 公証人 — exactly the way the English tile does it.
 *
 * Plain form (常体), present tense, short sentences, same as the other Japanese
 * overlays. Money stays in euros: this is still the French board.
 */
export const FRANCE_JA: EditionTranslation = {
  locale: 'ja',
  editionId: 'france',

  spaces: {
    'fr-start': {
      title: '新学期',
      description: '九月になると国じゅうが一斉に再出発する。新しい靴、新しい時間割、そして自分の人生も、みんなと同じ朝に始まる。',
    },
    'fr-uni-move-in': {
      title: '屋根裏の一室',
      description: '最初の住まいは屋根裏の九平米、エレベーターなしの七階。狭いが、自分の城だ。',
      harsher: {
        description: 'エレベーターなしの七階、屋根裏の九平米。そして不動産屋は敷金と保証人に加え、部屋を見せただけの手数料まで請求してくる。',
        reason: '敷金と仲介手数料',
      },
    },
    'fr-uni-fees': {
      title: '学費の請求',
      description: '二年間の受験予備校が実を結び、グランゼコールの入学試験に受かる。だが学校そのものは無償ではない。図書館を案内される前に、まず請求書が来る。',
      reason: 'グランゼコールの学費',
    },
    'fr-uni-harvest': {
      title: 'ぶどうの収穫',
      description: '九月の三週間をぶどう畑で過ごす。昼食だけはやたら豪華だ。報酬は現金と筋肉痛と、あとで開けるつもりの一本。',
      reason: '収穫の日当',
    },
    'fr-uni-overdraft': {
      title: '口座マイナス手数料',
      description: '口座がたった一日、残高を割る。銀行はきっちり手数料を取り、家計管理のパンフレットまで同封してくる。',
      reason: '当座貸越の手数料',
    },
    'fr-uni-grant': {
      title: '成績優秀者の奨学金',
      description: '自分にぴったり当てはまる奨学金が存在する。本物かどうか通知を二度読み返した。学費のかなりの部分がこれで消える。',
      reason: '財団の奨学金',
    },
    'fr-uni-exams': {
      title: '試験期間',
      description: '筆記が五科目、そのあと教授三人の前で黒板に向かう口述試験がひとつ。コーヒーだけで生き延びる。',
      harsher: {
        description: '筆記五科目と、教授三人の前の口述試験がひとつ。いちばん苦手な一科目のために、慌てて家庭教師を雇う。',
        reason: '駆け込みの家庭教師代',
      },
    },
    'fr-uni-graduation': {
      title: '学位授与式',
      description: '長くて立派な名前の学位と、役職者との握手、そして一生使える同窓のつながりを手に卒業する。',
    },
    'fr-uni-farewell': {
      title: '部屋の引き払い',
      description: '学生部屋の中身をスーツケース二つに詰め、管理人に鍵を返す。',
    },
    'fr-grad-forum': {
      title: '卒業生の就職フォーラム',
      description: '母校の卒業生たちが一日だけ大講堂を埋め尽くす。握手は力強く、提示する年収の数字はもっと力強い。空きは二つ。どちらかを選ぶ。',
    },
    'fr-apprenticeship-day': {
      title: '見習い就職',
      description: '職業訓練校がその場で就職先を見つけてくる。月曜に契約して、火曜から給料が出る。受験組はまだ入学手続きの列に並んでいる。',
    },
    'fr-work-first-payslip': {
      title: '初めての給与明細',
      description: 'フランスの給与明細には四十行ある。手取りは四種類の社会保険料の下のどこかに埋まっているが、それでも大金に見える。',
      reason: '初任給',
      footnote: 'ひと月まるごとではなく、その途中で契約した分。まるひと月分の明細が出るのは次の「給料日」のマス。',
    },
    'fr-work-payday-1': {
      title: '給料日',
      description: 'まるひと月働いた。友人たちがまだ学生をしているうちに、お金が入ってくる。',
      harsher: {
        title: '給料は翌月払い',
        description: '初月の給料が一か月遅れで払われるとは誰も言わなかった。大家はそんな事情に興味がない。',
        reason: '無収入のひと月',
      },
    },
    'fr-work-moving-out': {
      title: '独り立ち',
      description: '稼ぎ始めた以上、家を出るものとされる。敷金、保証人（親のサインが要る）、そして就職活動より分厚い入居審査の書類一式。',
      reason: '敷金と前家賃',
    },
    'fr-work-first-night': {
      title: '最初の夜',
      description: 'スタンドの明かりで荷ほどきをする。天井の電球はまだ来週の買い物リストの上だ。',
    },
    'fr-work-gear': {
      title: '作業道具の保証金',
      description: '作業着二着、安全靴、社員証、そして二度と戻ってこない気がする保証金。',
      reason: '作業道具の保証金',
    },
    'fr-work-payday-2': {
      title: '給料日',
      description: 'ひと月働いてまた給与明細。いまだに誰も卒業証書を見せろとは言わない。',
      harsher: {
        title: 'シフト削減',
        description: '店主がため息まじりに翌週のシフトを貼り出す。自分の名前は先週の半分しかない。',
        reason: '半月分のシフト',
      },
    },
    'fr-work-payday-3': {
      title: '給料日',
      description: '働き始めて三か月。給料が入ることに、もう驚かなくなった。',
    },
    'fr-main-trial-period': {
      title: '試用期間の終わり',
      description: '今日で試用期間が終わる。用紙を持った人が向かいに座る。何を言われるかは、振って決める。',
      reason: '試用期間の終わり',
    },
    'fr-main-bank': {
      title: '銀行の面談',
      description: '担当者が予約の時間に迎え入れ、コーヒーを出し、お金の具合はどうですかと尋ねる。',
    },
    'fr-main-insurance': {
      title: '保険代理店',
      description: 'フランスでは保険は任意ではない。住宅保険は法律で義務づけられ、公的医療保険の穴を埋める共済保険がもう一本要る。担当者はどちらの書類も用意して待っている。',
    },
    'fr-main-payday-1': {
      title: '給料日',
      description: '毎月二十八日、時計のように正確に入金される。今週いちばんうれしい通知だ。',
    },
    'fr-main-stock-tip': {
      title: '株の耳より情報',
      description: '昼食の席で同僚が、この銘柄は確実だと言い張る。取引所は十七時半まで開いている。',
    },
    'fr-main-fender-bender': {
      title: '交通事故',
      description: '形の変わってしまったボンネットの上で事故報告書を書き、こちらの過失ということで合意する。',
      reason: '板金修理代',
    },
    'fr-main-pileup': {
      title: '環状道路の多重事故',
      description: '環状道路の濃い霧、突然のブレーキランプ、そして出口ランプでひしゃげた四台。けが人はいない。請求書のほうは重い。',
      reason: '多重事故の修理代',
    },
    'fr-main-dentist': {
      title: '歯科の見積書',
      description: '被せもの一本、フロスの説教一回、そして最大の項目が保険適用外の見積書一枚。',
      reason: '歯の治療費',
    },
    'fr-main-lucky-find': {
      title: '思わぬ拾いもの',
      description: '小さな幸運が舞い込む。この先何年も食卓で話すことになる類のできごとだ。',
    },
    'fr-crossroads': {
      title: '入社五年目',
      description: '無期雇用で五年、給料は年功でゆっくり上がる。そして転職エージェントのメールは、まだ未読のまま受信箱にある。道はここで分かれる。',
    },
    'fr-loyal-grid': {
      title: '年功の号俸表',
      description: '給料は毎年一号俸ずつ上がるが、上のポストは誰かが定年で抜けたときにしか空かない。今年がその年かどうか、振ってみよう。',
      reason: '上のポストが空いた',
    },
    'fr-hopper-lookout': {
      title: 'こっそり転職活動',
      description: '昼休みに履歴書を更新し、社内では絶対に聞かれない場所で電話を取り始める。',
    },
    'fr-hopper-exit': {
      title: '合意退職',
      description: '会社と自分が書面で円満に別れることに合意する。この「合意退職」なら退職金も権利も失わず、新しい仕事と新しい給料で仕切り直せる。',
      reason: '合意退職にサインした',
    },
    'fr-hopper-bonus': {
      title: '支度金',
      description: '新しい雇い主が三か月の予告期間を現金で買い取ってくれる。まるまる一か月分の給料が余分に入るようなものだ。',
    },
    'fr-main-annual-review': {
      title: '年次の人事面談',
      description: '小さな会議室、管理職が二人、机の上には自分の資料。質問はひとつ。上のポストを任せて大丈夫か。振って、決定を聞こう。',
      reason: '年次面談の順番が回ってきた',
    },
    'fr-main-tax-audit': {
      title: '税務調査',
      description: '税務署からのたいへん丁寧な手紙が、領収書の詰まった靴箱と過ごす長い午後につながる。そして最後の金額は、どうやら初めから決まっていた。',
      reason: '税務調査の追徴',
    },
    'fr-main-cdd-ends': {
      title: '有期契約の満了',
      description: '無期契約になると誰もが請け合っていた有期契約が、ごく静かに更新されない。餞別のカードだけは、とてもよかった。',
      reason: '契約が更新されなかった',
    },
    'fr-main-redundancy': {
      title: '人員削減計画',
      description: 'フロア全員が、高そうなスーツのコンサルタントのいる会議室に集められる。その後、社員証が反応しなくなる。',
      reason: 'ポストが消えた',
    },
    'fr-main-employment-office': {
      title: '公共職業安定所',
      description: '相談員が書類を確かめ、条件に合う仕事を二つ見つけてくる。どちらかを選ぶ。',
      reason: '職業安定所で仕切り直し',
    },
    'fr-main-gifts': {
      title: 'クリスマスの贈り物',
      description: '全員にひとつずつ贈り物を買う。慎重に選び、店で見事に包んでもらう。',
      reason: '全員へのプレゼント',
    },
    'fr-wedding': {
      title: '結婚式',
      description: '同じ日に二度結婚する。一度目は市役所で市長の前、二度目は伝統どおり夜明けまで続く披露パーティで。招待客は机の上の祝儀箱を埋めていく。',
    },
    'fr-family-nursery-setup': {
      title: '子ども部屋の準備',
      description: '子ども部屋を明るい黄色に塗り、真夜中にベビーベッドを組み立て、国がすでに名前を印字して用意していた健康手帳を受け取る。',
      reason: '子ども部屋の準備',
    },
    'fr-family-new-baby': {
      title: '赤ちゃん誕生',
      description: '小さな家族が増える。準備万端で待ち構えていた国が、ただちに登録と手当と予防接種の予定表を用意する。',
    },
    'fr-family-creche': {
      title: '保育所の待機',
      description: '公立保育所の枠を取るのは入学試験並みに難しい。つなぎで頼む民間のベビーシッターも、同じくらい高い。',
      reason: '子ども一人あたりの保育費',
    },
    'fr-family-school-list': {
      title: '学用品リスト',
      description: '新学期のリストは子ども一人につき十七品目を指定してくる。しかもそのうち一つは、どこも売り切れの特定銘柄のノートだ。',
      reason: '子ども一人あたりの学用品',
    },
    'fr-family-year-end-show': {
      title: '学年末の発表会',
      description: 'わが子が学芸会で二つのセリフを完璧に言い切り、こちらはスマホの壁の向こう、三列目で泣く。',
    },
    'fr-family-twins': {
      title: '双子',
      description: '検査技師が急に黙り、画面をこちらに向けて、指を二本立てる。',
    },
    'fr-fast-payday-1': {
      title: '給料日',
      description: '残業時間はもう誰も数えていないが、給料のほうはちゃんと来る。',
    },
    'fr-fast-headhunted': {
      title: 'ヘッドハンティング',
      description: '会議中に私用の携帯が鳴る。エージェントは案件を二つ抱え、待つ気はまるでない。',
      reason: '引き抜きの話が来た',
    },
    'fr-fast-burnout': {
      title: '燃え尽きて休職',
      description: '医師が六週間の休養を出し、落ち着いた口調で「過労」という言葉を使う。復帰したときには、給料がずいぶん軽くなっている。',
      reason: '無給休職',
    },
    'fr-fast-payday-severance': {
      title: '年末の給与',
      description: '一年が締まる。組織図が引き直される前に、今の仕事の給料がもう一度だけ口座に届く。',
    },
    'fr-fast-reorg': {
      title: '組織再編',
      description: '一夜で組織図が引き直され、自分の名前がまったく別の枠に入っている。誰にも聞かれなかった。組織再編とはそういうものだ。',
      reason: '組織再編で配置換え',
    },
    'fr-fast-trading-desk': {
      title: '証券のフロア',
      description: 'ボーナスを使いたくてうずうずしている。ビジネス街には、その置き場所を喜んで提案してくれる人があふれている。',
    },
    'fr-fast-payday-2': {
      title: '給料日',
      description: 'また一か月が過ぎ、また給料が入る。',
      harsher: {
        title: 'ボーナス返還',
        description: '遠くの事務所にいる監査担当が去年のボーナスを計算し直す。しかも下方に、長い説明つきで。',
        reason: 'ボーナスの返還',
      },
    },
    'fr-fast-retention': {
      title: '引き留めの条件',
      description: 'コーヒーを前に、よそから声がかかっていると軽く漏らす。対抗条件はコーヒーより先に出てくる。',
    },
    'fr-midtown-brokerage': {
      title: '証券会社',
      description: '画面だらけ、窓口には年金生活者の列、そしてこの銘柄だけは違うと言い張る営業担当。',
    },
    'fr-midtown-insurance': {
      title: '保険代理店',
      description: '公証人が鍵を渡す前に保険の証明が要る。担当者は、これから住む通りの浸水リスク地図を丁寧に広げてみせる。',
    },
    'fr-midtown-payday': {
      title: '給料日',
      description: '住まいの頭金を払う週に、給料が振り込まれる。',
    },
    'fr-midtown-joint-account': {
      title: '共同口座',
      description: '正式な面談の場で口座をひとつにまとめる。他人の出費が、否応なく自分の問題でもある日々がここから始まる。',
      reason: '共同口座の精算',
    },
    'fr-midtown-bonus': {
      title: '十三か月目の給与',
      description: '十二月の給与明細に一枚多く紙が挟まっている。稼ぎに応じた賞与なので、卓を囲む全員が違う数字を開くことになる。',
    },
    'fr-midtown-raise': {
      title: '昇給',
      description: 'エレベーター前での短い立ち話、給与明細の新しい数字、そして出ぎわの力強い握手。',
    },
    'fr-midtown-rate-rise': {
      title: '金利上昇',
      description: '木曜の朝に住宅ローンの固定期間が切れ、家じゅうの毎月の支払いがそろって道連れになる。',
      reason: '金利が悪いほうへ動いた',
    },
    'fr-notary': {
      title: '公証人の事務所',
      description: '家は、羽目板張りの事務所で公証人が権利証を全文読み上げるまで正式には自分のものにならない。その報酬は実質的に税金で、これもこちらの負担だ。',
    },
    'fr-risky-startup': {
      title: 'スタートアップに出資',
      description: 'パリの大きなインキュベーターに入った友人の会社へ貯金をつぎ込む。いくら返ってくるかはサイコロ次第。',
      reason: '出資の払い戻し',
    },
    'fr-risky-bad-tip': {
      title: 'ハズレの銘柄',
      description: '「確実」だったはずの株が一週間で沈む。そもそも勧めた責任として、全員に夕食をおごる。',
      reason: 'ハズレ銘柄のお詫び',
    },
    'fr-risky-casino': {
      title: 'カジノの週末',
      description: '海辺のカジノで過ごす週末が完璧に運ぶ。勝っているうちに席を立てた。その店で、誰も成し遂げたことのない芸当だ。',
      reason: '完璧な一夜',
    },
    'fr-risky-crash': {
      title: '相場の暴落',
      description: '相場が大きく沈み、資産がまともに食らう。叔父がまた、土地だけは裏切らないと言い出す。',
      reason: '相場の暴落',
    },
    'fr-risky-aftershock': {
      title: '二番底',
      description: '相場は誰の予想よりさらに下へ落ちていく。しかも、たった一日の午後で。',
      reason: '相場のさらなる下落',
    },
    'fr-risky-lottery': {
      title: '宝くじ',
      description: 'よく当たると評判のタバコ屋で国営宝くじを買う。評判が本物だったかどうかは、振って決める。',
      reason: '全国抽選の当選金',
    },
    'fr-risky-payday': {
      title: '給料日',
      description: '投資のほうが盛大に沈んでいる最中に、給料が振り込まれる。',
    },
    'fr-risky-swap': {
      title: '首位と交換',
      description: '長い昼食、握手ひとつ。首位の相手と口座の残高をそっくり入れ替える。',
      reason: '首位との取引',
    },
    'fr-safe-points': {
      title: 'ポイントの還元',
      description: 'スーパーのポイントカードを一年間まじめに使い続けた。今日はそれが買い物かごの全額をまかなう。',
      reason: 'ポイントの還元',
    },
    'fr-safe-payday': {
      title: '給料日',
      description: 'いつもどおり、二十八日に給料が入る。',
      harsher: {
        title: '給与の支払い遅延',
        description: '手続きの行き違いで今月の給料は来月に届きます、と落ち着いた口調で説明される。正式な謝罪文つきで。',
        reason: 'ひと月ぶんの給与保留',
      },
    },
    'fr-safe-excess': {
      title: '保険の自己負担',
      description: '慎重な道にも保険金の請求が起きることはある。免責分はやはり自腹だ。',
      reason: '保険の免責額',
    },
    'fr-safe-budget': {
      title: '家計の勝利',
      description: '一年間まじめに家計簿をつけ通したら、思っていたより貯まっていたことが分かる。',
      reason: '思ったより貯まっていた',
    },
    'fr-safe-refund': {
      title: '税の還付',
      description: '期待するのを忘れたころに税金の還付が届く。理由を説明する長い手紙つきで。',
      reason: '税の還付',
    },
    'fr-safe-wool-sock': {
      title: 'タンス預金',
      description: '引き出しの奥に押し込んだ古い毛糸の靴下——フランス式のいちばん古い貯金箱——が、年月をかけて静かに膨らんでいた。',
      reason: '靴下の中身',
    },
    'fr-safe-payday-2': {
      title: '給料日',
      description: 'また二十八日、また静かな給料日。この道はそれでいい。',
    },
    'fr-safe-dividend': {
      title: '配当の日',
      description: '手堅くて退屈な持ち株が、手堅くて退屈な配当を出す。高速道路のサービスエリアのカフェで使える割引券つきで。',
      reason: '四半期配当',
    },
    'fr-sunset-number': {
      title: '必要な額',
      description: '封筒の裏でざっと計算してみる。今、自分の意思で早めに仕事をやめるには、いくら要るのか。その額は、恐れていたよりずっと小さい。',
    },
    'fr-sunset-upgrade': {
      title: '住み替え',
      description: '不動産屋から電話。もっと明るくて、もっと上の階で、ぎりぎり手が届く。最上階が空いて、その階には見合うだけの眺めがある。',
    },
    'fr-sunset-fire': {
      title: '住宅火災',
      description: '火にかけたままの鍋、長すぎた電話、そして床から作り直しになる台所。',
      reason: '火災の損害',
    },
    'fr-sunset-care': {
      title: '介護の費用',
      description: 'かつて自分の面倒を見てくれた人に、今度は面倒を見る人が要る。介護施設の待機者名簿は思っていたより長い。いくらでも払うつもりだし、実際、請求額は途方もない。',
      reason: '家族の介護費',
    },
    'fr-sunset-payday-1': {
      title: '給料日',
      description: '数えるほどしか残っていない給料の、そのひとつが振り込まれる。',
    },
    'fr-sunset-swap': {
      title: '首位と交換',
      description: '夕食の席での最後の大胆な取引。首位の相手の財産が、代わりに自分と一緒に席を立つ。',
      reason: '土壇場の交換',
    },
    'fr-sunset-children-visit': {
      title: '子どもたちの来訪',
      description: '大きくなった子どもたちが日曜の昼食に、いい菓子店のケーキを持ってくる。そして、そっと現金入りの封筒を置いていく。',
      reason: '子ども一人ひとりからの封筒',
    },
    'fr-sunset-sticky': {
      title: 'つい手が伸びる',
      description: 'いいブランデーを傾けながら、首位の相手を説得して、何年も前のいちばんいい思い出話を譲ってもらう。',
      reason: '思い出がひとつ移る',
    },
    'fr-sunset-last-title': {
      title: '最後の昇進',
      description: '引退前にもうひとつだけ昇進を取れるかどうか。振って、この最後の面談に決めてもらおう。',
      reason: '人生最後の考課',
    },
    'fr-sunset-payday-2': {
      title: '給料日',
      description: '給料日を数えるのはとうにやめたが、二十八日のほうはやめていない。',
    },
    'fr-sunset-final-tax': {
      title: '最後の納税',
      description: '完全に引退する直前に、税務署からの手紙がもう一通だけ届く。',
      reason: '最後の税金',
    },
    'fr-sunset-ahead': {
      title: '夕暮れが見える',
      description: '旧街道のプラタナスが夕日の中を流れていく。忙しくて見ていなかっただけで、ずっとそうだった。',
    },
    'fr-retirement': {
      title: '定年退職',
      description: '最後の送別会、段ボール箱を抱えたオフィスの最後の一巡り、そして四十年で初めて、行く先のない月曜日。一生かけて守り抜いた年金が、ようやく自分のものになる。',
    },
  },

  lanes: {
    'The Great Schools': {
      name: 'グランゼコールコース',
      summary: '二年間の猛勉強と入学試験ひとつ、そして受かった学校の学費が、一ユーロも稼がないうちに全額前払いで来る。学位が買うのは、たいてい上がっていくキャリアと、一生使える同窓のつながりだ。',
    },
    'Straight to Work': {
      name: '就職コース',
      summary: '受験組がまだ机に向かっているうちに、職業訓練校が就職先を見つけてくる。初日から給料が出て、安全網はない。このはしごのてっぺんは、この卓のどの学位よりも稼ぐ。',
    },
    'The Permanent Contract': {
      name: '無期雇用コース',
      summary: '動かない。無期雇用は年功で給料を上げ、毎年十二月に十三か月目の給与を出す。その代わり、住む場所は会社が決める。',
    },
    'Job-Hopper Alley': {
      name: '転職コース',
      summary: '出る。合意退職にサインし、退職金を受け取り、給料をゼロから引き直す。前の引きが悪かったなら痛快、良かったなら賭けだ。',
    },
    'Family Lane': {
      name: '家族コース',
      summary: '学用品リスト、音楽教室、そして騒がしい家。国から毎月の手当が出て、最後には大きくなった子どもたちが日曜の昼食に帰ってくる。給料日は減り、請求書はどれも高くつく。',
    },
    'The Executive Track': {
      name: '管理職コース',
      summary: '残業代は出なくなる。残業が減るわけではない。昇給も賞与も角部屋も本物だが、そのために手放した生活も同じくらい本物だ。',
    },
    'Speculation Street': {
      name: '投機コース',
      summary: 'スタートアップ、信用取引、そして見事なカフスボタンの営業担当。家を買った時点で後ろにいるなら、追い上げはこの道だ。前にいるなら考え直したほうがいい。',
    },
    'Prudence Street': {
      name: '堅実コース',
      summary: '普通預金、ポイントカード、引き出しの奥の古い毛糸の靴下。ここで金持ちになった者はいないが、破滅した者もいない。すでに勝っているなら、それは大きい。',
    },
  },

  careers: {
    'career-fr-salon-apprentice': {
      title: '美容室の見習い',
      description: '床を掃き、シャンプーをし、そしてカット中の世間話が仕事の半分だと知る。',
    },
    'career-fr-stylist': {
      title: 'スタイリスト',
      description: '自分の椅子を持ち、予約は三週間先まで埋まり、街のどこへ移っても付いてくる常連がいる。',
    },
    'career-fr-salon-owner': {
      title: '美容室オーナー',
      description: '広場に面した店を切り盛りしている。ここでは髪を切るたびに近所の話題が全部ついてくる。',
    },
    'career-fr-apprentice-baker': {
      title: 'パン職人見習い',
      description: '四時に入って昼に上がる。クロワッサンの折り込みの腕は、誰も口には出さないがすでに上だ。',
    },
    'career-fr-village-baker': {
      title: '村のパン屋',
      description: 'シャッターが上がる前から行列ができ、八月の休業は国家行事のように告知される。',
    },
    'career-fr-master-baker': {
      title: 'マスターブーランジェ',
      description: '国家最優秀職人章の襟章をつけていて、それでも出す前に全部の焼き上がりを味見する。',
    },
    'career-fr-commis-chef': {
      title: '見習い料理人',
      description: 'コンロ六口、伝票の列一本、そして一週間の値打ちを決める昼の営業。',
    },
    'career-fr-crepe-stand-owner': {
      title: 'クレープ屋台の店主',
      description: '市場の入口に鉄板を据え、土曜の朝をちょっとした祭りに変える。行列そのものがサイコロだ。',
    },
    'career-fr-bistro-owner': {
      title: 'ビストロの店主',
      description: '四十席、黒板のメニュー一枚、そして通りじゅうが時計代わりにする昼の営業。',
    },
    'career-fr-site-labourer': {
      title: '建設作業員',
      description: '運び、掘り、練り、持ち上げる。現場の道具がどこにあるかを本当に知っている人。',
    },
    'career-fr-site-supervisor': {
      title: '現場主任',
      description: '朝礼と入場名簿、そして足場屋との毎日の言い合いを仕切る。',
    },
    'career-fr-site-foreman': {
      title: '工事現場監督',
      description: '丸めた図面を、どの検査も通る建物へ変えていく。見積もりもきちんと出す。',
    },
    'career-fr-delivery-courier': {
      title: '配達員',
      description: '石畳とバス専用レーンの間をすり抜け、地区じゅうの食事と荷物を届け続ける。十二月がサイコロだ。',
    },
    'career-fr-depot-dispatcher': {
      title: '配車担当',
      description: 'スクーターを降りて配車ボードの前へ。県内のバンを一台ずつ名前で追いかける。',
    },
    'career-fr-distribution-lead': {
      title: '物流責任者',
      description: '一晩で十万個を動かし、それでも夕食には帰宅する。この国では、それは職業上の義務である。',
    },
    'career-fr-apprentice-mechanic': {
      title: '整備見習い',
      description: '三年間、親方のためにライトを持ち続けた。そして古いバンは親方のつぶやきを全部理解している気がしてきた。',
    },
    'career-fr-scooter-mechanic': {
      title: '二輪の整備士',
      description: '配達用スクーターの不平を、乗り手が言い終える前に聞き取ってしまう。',
    },
    'career-fr-garage-owner': {
      title: '整備工場オーナー',
      description: 'リフト四基、車検シーズンの順番待ち、そして積車で運び込まれてきた旧車の写真が並ぶ壁。',
    },
    'career-fr-session-musician': {
      title: 'スタジオミュージシャン',
      description: '国じゅうが結婚式で口ずさんだアコーディオンの旋律を弾いている。ジャケットに名前は載らず、次の仕事までは電話を待つ。',
    },
    'career-fr-touring-player': {
      title: 'ツアーミュージシャン',
      description: '海辺から山まで、ひと夏ぶんのフェスの舞台、機材ケースひとつ、そしてポスターの隅にやっと載った名前。',
    },
    'career-fr-record-producer': {
      title: '音楽プロデューサー',
      description: 'ガラスの向こうで「もう一回、もっと物憂げに」と言う。そしてなぜかいつも正しい。',
    },
    'career-fr-radio-runner': {
      title: 'ラジオの雑用係',
      description: 'エスプレッソを買いに走り、ゲストに合図を出し、朝の番組の作り方を静かに覚えていく。',
    },
    'career-fr-morning-host': {
      title: '朝番組のパーソナリティ',
      description: '朝七時半、この国の台所の半分にはこの声が流れている。残りの半分は抗議して局を変えた。',
    },
    'career-fr-station-owner': {
      title: '放送局オーナー',
      description: '十一本の番組を回し、うち一本には今も夜明けに自分で出て、十二本ぶんの広告枠を売る。',
    },
    'career-fr-second-shooter': {
      title: 'セカンドカメラマン',
      description: '婚姻の間のうしろ側と、助役が式次第の読む場所を見失う正確な瞬間を押さえる。',
    },
    'career-fr-wedding-photographer': {
      title: 'ブライダルカメラマン',
      description: '六月は二年先まで埋まり、一月は無音。予約表がサイコロで、シャトーの季節が一年を決める。',
    },
    'career-fr-lettings-negotiator': {
      title: '賃貸仲介',
      description: '土曜に十一件を案内し、どの申込書に保証人のページが足りなかったかを覚えている。',
    },
    'career-fr-estate-agent': {
      title: '不動産営業',
      description: 'まず台所を売り、次に鎧戸を売り、省エネ性能の評価の話は決してしない。',
    },
    'career-fr-agency-owner': {
      title: '不動産会社オーナー',
      description: '四百軒の前に自分の名前の看板が立つ。当たり年が一度あれば、静かな三年を支えられる。',
    },
    'career-fr-warehouse-picker': {
      title: '倉庫のピッキング',
      description: '同じロボットアームの脇を一勤務で十数キロ歩き、暗闇でも四十番通路にたどり着ける。',
    },
    'career-fr-warehouse-lead': {
      title: '倉庫のリーダー',
      description: 'サッカー場四面ぶんの建物を、自販機のコーヒーとバインダーだけで回している。',
    },
    'career-fr-grooming-assistant': {
      title: 'トリマー助手',
      description: 'タオルとおやつ、そして小さくて意見のはっきりした犬に品定めされる間じっとしていられる度胸。',
    },
    'career-fr-dog-groomer': {
      title: 'トリマー',
      description: '地区じゅうのカフェ犬に毎月のカットを施し、どのテラスでも名前で挨拶される。',
    },
    'career-fr-village-coach': {
      title: '村のサッカーコーチ',
      description: '土曜の練習を市営グラウンドで仕切り、ラインも自分で引き、全員の名前を覚えている。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-fr-market-gardener': {
      title: '直売農家',
      description: '朝八時には日曜市が行列になるトマトを作っている。大手スーパーの買い付けは三度断った。断るたびに丁寧になった。',
    },
    'career-fr-surgical-resident': {
      title: '外科研修医',
      description: '大学病院で六年ぶんの当直、鉤を持ち続けた手、そして「次は教授ならどうする」と問われ続けた日々。',
    },
    'career-fr-hospital-surgeon': {
      title: '外科医',
      description: 'ぶれない手と、それ以上にぶれない胆力で人を救う。昼休みだけは誰にも邪魔させない。',
    },
    'career-fr-junior-associate': {
      title: 'アソシエイト弁護士',
      description: '大通りの裏手の事務所で、パートナーが肝心の一段落だけ読めるように九百ページを読む。',
    },
    'career-fr-corporate-lawyer': {
      title: '企業弁護士',
      description: '上等な鞄と、それより鋭い論理と、二時間かけた会食で役員会の戦いを制する。',
    },
    'career-fr-architectural-assistant': {
      title: '建築設計助手',
      description: '誰も手を触れられない歴史的建造物のために階段の詳細図を十一回描き、最初の十回より十一回目から多くを学ぶ。',
    },
    'career-fr-architect': {
      title: '建築家',
      description: '保存指定の外壁の間にガラスと鉄を通し、景観審査との論争をもう一つの本業にしている。',
    },
    'career-fr-junior-engineer': {
      title: '新人エンジニア',
      description: '誰もやりたがらない小さなバグを直し、その途中で大きいほうを見つける。肩書きにはエンジニア学校の刻印つき。',
    },
    'career-fr-software-engineer': {
      title: 'ソフトウェアエンジニア',
      description: '鉄道の半分と、高速道路の料金所と、とても有名な美術館のチケット行列を静かに動かすコードを書いている。',
    },
    'career-fr-junior-designer': {
      title: 'ゲームデザイナー見習い',
      description: 'モンペリエのスタジオで四か月かけてチュートリアルを調整し、見知らぬ人が一文字も読まずにそこを抜けていくのを見守る。',
    },
    'career-fr-game-designer': {
      title: 'ゲームデザイナー',
      description: 'とてもいいパン屋の上のスタジオから、世界じゅうが夜更かしして遊ぶ世界を作る。',
    },
    'career-fr-aerospace-graduate': {
      title: '航空工学の新卒',
      description: 'トゥールーズで一年かけて主翼のリブを四十グラム軽くする。本人はそれを有意義な一年だと思っている。',
    },
    'career-fr-aerospace-engineer': {
      title: '航空エンジニア',
      description: '世界の半分が乗る翼を作り、窓側の席から毎回それを指さして説明する。',
    },
    'career-fr-investment-analyst': {
      title: '投資アナリスト',
      description: 'ビジネス街の高層階から、部署じゅうが言い合いになる表を作る。当たっているのは半分くらい。',
    },
    'career-fr-fund-manager': {
      title: 'ファンドマネージャー',
      description: '凱旋門の見える画面の上で他人のお金を動かし、外れるより少しだけ多く当てる。',
    },
    'career-fr-ministry-attache': {
      title: '省庁のアタッシェ',
      description: '国じゅうがただ「コンクール」と呼ぶ採用試験に受かり、終身の身分で国家に入る。この盤上の誰とも違い、国家は人を解雇しない。',
    },
    'career-fr-ministry-section-head': {
      title: '省庁の課長',
      description: '翌朝七時に大臣が読み上げる答弁を書く。執務室には創建当時の漆喰装飾があり、暖房の予算はない。',
    },
    'career-fr-research-assistant': {
      title: '研究助手',
      description: '他人の論文のために冷たい大西洋で数を数える。その一分一分が楽しくて仕方ない。',
    },
    'career-fr-marine-biologist': {
      title: '海洋生物学者',
      description: '一日二回、潮で陸から切り離される観測所からブルターニュの海岸を研究している。そこにいる全員がそれを気に入っている。',
    },
    'career-fr-jobbing-writer': {
      title: 'フリーライター',
      description: '広告コピー、カタログ、隔週のコラム。本命の原稿は引き出しの中で九月を待っている。',
    },
    'career-fr-novelist': {
      title: '小説家',
      description: 'ついに出版。ただし同じ秋に出る六百冊の新刊と一緒に。印税はサイコロ次第で、そもそも気づいてもらえるかどうかも、だいたいサイコロ次第だ。',
    },
    'career-fr-veterinarian': {
      title: '獣医',
      description: '不安そうな飼い主をなだめながら、とても小さな骨折を静かに処置する。いくら積まれてもチェーン展開はしない。',
    },
    'career-fr-university-professor': {
      title: '大学教授',
      description: '火曜に講義し、水曜に同僚と論争し、金曜には相手の考えを変えている。学部長の椅子は二度断った。',
    },
  },

  houses: {
    'house-fr-village-cottage': {
      name: '村の石造りの家',
      description: '厚い石壁、井戸、そして誰かに愛されるのを静かに待っていた村。総額に占める公証人費用の割合には驚かされる。',
    },
    'house-fr-suburban-pavilion': {
      name: '郊外の一戸建て',
      description: 'こぎれいな門の奥のこぎれいな小さな家。庭には、前の持ち主が置いていくと言い張った小人の置物。',
    },
    'house-fr-terraced-townhouse': {
      name: '長屋づくりの町家',
      description: '二階建て、塗られた鎧戸、そして塗り直しの頻度について意見のある隣人たち。',
    },
    'house-fr-converted-atelier': {
      name: '改装したアトリエ',
      description: '元は家具工房。不動産屋が十一回も口にした北向きの光と、やたらうるさい暖房が一台。',
    },
    'house-fr-modern-duplex': {
      name: 'モダンなメゾネット',
      description: 'すっきりした造り、屋上テラス、そしてチェロがとても上手な学生に一フロア貸せるだけの広さ。',
    },
    'house-fr-riverside-longhouse': {
      name: '川辺の平屋農家',
      description: '川の曲がりに沿った細長い平屋、夜明けのサギ、そして前の持ち主がなぜか満杯のまま残していった地下蔵。',
    },
    'house-fr-country-manor': {
      name: '田舎の館',
      description: '門、砂利敷きの中庭、そして午前二時まで続いて何も解決しない議論のために作られた大食堂。',
    },
    'house-fr-clifftop-villa': {
      name: '崖の上の別荘',
      description: '三面ガラス、眼下に海、そして客が嬉々として文句を言う急な海沿いの上り道。',
    },
    'house-fr-haussmann-top-floor': {
      name: 'オスマン様式の最上階',
      description: '切石造りの建物の最上階まるごと。鍛鉄のバルコニー、ヘリンボーンの寄せ木張り、そして夜には宝石をぶちまけたように見える街。',
    },
  },

  stocks: {
    'stock-fr-toll-roads': {
      name: '高速道路料金連合',
      description: '八月になると国じゅうが、この会社のレジを通って南へ向かう。売り文句はそれだけで、外したことがない。',
    },
    'stock-fr-grid-power': {
      name: 'エグザゴン電力送電',
      description: '川沿いで五十六基の原子炉がうなりを上げ、退屈で美しい配当を回し続ける。',
    },
    'stock-fr-cinema': {
      name: 'ヌーヴェルヴァーグ映画社',
      description: '映画祭の受賞ひとつで栄光、三時間の白黒作品ひとつでワゴンセール。どちらになるかは誰にも分からない。',
    },
    'stock-fr-vineyards': {
      name: 'グラン・クリュ葡萄園',
      description: '八百年ワインを造り続けてきた斜面。四月の霜と流行が行儀よくしていれば、の話だが。',
    },
    'stock-fr-rocket-lines': {
      name: '赤道貨物ロケット',
      description: 'ジャングルの射場から飛ぶ、低予算の貨物ロケット。物流の未来か、とても高価な花火か。',
    },
  },

  lifeTiles: {
    'tile-fr-paris-marathon': { title: 'パリマラソンを完走' },
    'tile-fr-autumn-novel': { title: '秋の新刊で小説を出した' },
    'tile-fr-refuge-dog': { title: '保護犬を引き取った' },
    'tile-fr-biarritz-surf': { title: 'ビアリッツでサーフィンを覚えた' },
    'tile-fr-allotment': { title: '入賞する菜園を育てた' },
    'tile-fr-cassoulet': { title: '村のカスレ大会で優勝' },
    'tile-fr-pilgrim-road': { title: 'ル・ピュイから巡礼路を歩いた' },
    'tile-fr-chanson-album': { title: 'シャンソンのアルバムを出した' },
    'tile-fr-plane-treehouse': { title: 'プラタナスにツリーハウスを作った' },
    'tile-fr-cheese-blog': { title: 'チーズのブログがバズった' },
    'tile-fr-alpine-triathlon': { title: 'アルプスのトライアスロン完走' },
    'tile-fr-animal-refuge': { title: '動物保護施設でボランティア' },
    'tile-fr-crepe-stand': { title: '学校祭のクレープ屋を仕切った' },
    'tile-fr-canal-mural': { title: '運河沿いに壁画を描いた' },
    'tile-fr-glider-licence': { title: 'グライダーの免許を取った' },
    'tile-fr-hit-podcast': { title: 'ポッドキャストが一位になった' },
    'tile-fr-corkscrew-patent': { title: 'よく抜けるコルク抜きで特許' },
    'tile-fr-petanque': { title: '村のペタンク大会で優勝' },
    'tile-fr-rooftop-kitten': { title: '屋根の上の子猫を助けた' },
    'tile-fr-mont-blanc': { title: '夜明けのモンブランに登頂' },
    'tile-fr-market-pottery': { title: '市場で自作の陶器を売った' },
    'tile-fr-minis-coach': { title: '九歳以下チームを指導した' },
    'tile-fr-national-jingle': { title: '国じゅうが口ずさむCM曲を書いた' },
    'tile-fr-prize-pumpkin': { title: '品評会で巨大カボチャが入賞' },
    'tile-fr-startup-backer': { title: '友人のパリの起業に出資した' },
    'tile-fr-barn-find': { title: '納屋で見つけた旧車をレストア' },
    'tile-fr-street-dinner': { title: '通りじゅうの夕食会を開いた' },
    'tile-fr-baguette-prize': { title: '県一番のバゲットを焼いた' },
    'tile-fr-brittany-sail': { title: 'ブルターニュの海岸を船で走破' },
    'tile-fr-village-square': { title: '村の広場を設計し直した' },
    'tile-fr-fostered-litter': { title: '子猫を一腹まるごと預かった' },
    'tile-fr-attic-sale': { title: '村のガレージセールを仕切った' },
    'tile-fr-cooking-class': { title: '満席の料理教室を教えた' },
    'tile-fr-corsica-trail': { title: 'コルシカの縦断路を歩き通した' },
    'tile-fr-village-cinema': { title: '村の古い映画館を再建した' },
    'tile-fr-rose-name': { title: 'バラに自分の名前がついた' },
  },

  economy: {
    tuitionNotes: [
      '請求書には、学校説明会では誰も触れなかった手数料が上乗せされている。しかも少額ではない。',
      '学費は、グランゼコールのパンフレットに書いてあったとおりの額で収まる。',
      '所得に応じた奨学金が、見込んでいたより多くを埋めてくれる。',
      '全額免除。学校がすべて帳消しにし、両親はいまひとつ信じきれずにいる。',
    ],
    marriage: {
      rescued: '二度目でようやく「はい」。相手はリース中の車と、リモージュ近くの速度取り締まりの未払い反則金と、そのどちらにもきわめておおらかな態度を持って引っ越してきた。',
      outcomes: [
        'シャトーでの式が勝手に大きくなっていく。テント、ケータリングの四皿目、そして両家そろっていいシャンパンを頼む。',
        '共和国の肖像画の下、市役所で十分。そのあと四十人の長い晩餐。心に残るスピーチがひとつ、ご祝儀で足りた。',
        'ひとつ屋根の下に収入が二つ。街の家賃が急に半分に見えてくる。',
        '村じゅうが集まり、誰もが気前よく、しかも相手は初聖体拝領のころから手をつけていない貯金口座を持っていた。',
      ],
    },
  },
}
