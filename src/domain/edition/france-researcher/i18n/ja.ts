import type { EditionTranslation } from '../../i18n/types'

/**
 * Researcher: France in Japanese — the board where four French words do the
 * work, and each one had to be decided separately.
 *
 * The English board's voice rule is "the French thing explained in passing
 * rather than named", and it keeps exactly four terms because they are the
 * actual English terms of art. Japanese does not inherit that list: a word
 * that is standard English is not thereby standard Japanese, and a Japanese
 * reader who meets フォンクショネール learns nothing at all. So each term was
 * decided on its own, on one question — does the French word teach a Japanese
 * reader more than the Japanese word would?
 *
 * - **concours → コンクール**, always glossed on contact as 採用試験. Kept
 *   because it is a proper noun on this board: one named gate, sat twice, the
 *   thing the whole lane is about. The country France overlay already made
 *   this call — `career-fr-ministry-attache` reads 「国じゅうがただ「コンクール」と
 *   呼ぶ採用試験」 — and two French boards should not name the same institution
 *   two different ways. The gloss is not optional: 「コンクール」 alone reads as
 *   a piano competition, so every occurrence sits next to 採用試験, 全国一斉,
 *   or ポスト十一・応募者二百人.
 * - **fonctionnaire → 国家公務員 / 任期のない職**, never katakana. This is the
 *   one term where Japanese has the concept exactly, including the part that
 *   matters mechanically: 解雇されない. Transliterating it would have hidden
 *   the single fact the entire gated road is bought with.
 * - **CIFRE → 企業に雇われて書く博士論文**, spelled out, no acronym. The English
 *   tile says "an industrial doctorate" and then explains it in the same
 *   breath rather than assuming it; the Japanese does the same job in the
 *   same place. 産学連携 exists and would have been shorter, but it is a word
 *   about institutions, and this tile is about a payslip.
 * - **grande école → グランゼコール**, with 二年の受験準備課程 standing in for
 *   prépa. Katakana because the country France overlay established it, because
 *   it is a class of institution with no Japanese equivalent (国立大学 and
 *   高専 are both wrong in different directions), and because the summary that
 *   introduces it has room to say what it is.
 *
 * The contrast this board exists to draw has to survive into Japanese, since
 * it is the whole reason two researcher boards were built: **フランスは
 * アカデミアが安全で企業が荒い。日本はその逆。** So the fonctionnaire shelf is
 * written as safety bought at a price — 「解雇されない」 on the rungs,
 * 「グランゼコールの同期の、そのまた部下と同じ給料」 on the top one — and the
 * cadre shelf keeps its ceiling and its exposure. A player who has read the
 * Japanese Researcher: Japan overlay should feel the mirror without being told.
 *
 * Plain form (常体), present tense, short sentences, the cost or the joke
 * landing in the same breath — the same voice as every other Japanese overlay
 * here. Money stays in euros: this is still the French board.
 */
export const RESEARCHER_FRANCE_JA: EditionTranslation = {
  locale: 'ja',
  editionId: 'france-researcher',

  spaces: {
    'frr-start': {
      title: '人生のスタート',
      description: '春の高校の廊下、掲示板の前。誰かが二つの進路を並べて貼り出して、そのまま帰ってしまった。ここから始まる。',
    },
    'frr-uni-arrival': {
      title: '自分の実験台',
      description: 'カードキーと、開かない窓の下の机と、金が続くかぎり自分のものになる実験台一メートル。',
      harsher: {
        description: 'カードキーと机と、学生用の部屋。敷金は二か月ぶん前払いで、仲介業者は必ず何か理由を見つけて、そのいくらかを返さない。',
        reason: '敷金二か月ぶん',
      },
    },
    'frr-uni-thesis-years': {
      title: '博士論文の五年',
      description: '登録料と家賃と、問いひとつの五年。夏に博士課程の運営委員会が自分をどう見たかで、その全部が決まる。',
      reason: '博士論文の五年ぶん',
    },
    'frr-uni-teaching-hours': {
      title: '年に六十四時間',
      description: '一年生の演習を、年に六十四時間。時給に直すといくらになるか、一度だけ計算して、二度と計算しないと決める。',
      reason: '一年ぶんの演習',
    },
    'frr-uni-overdraft': {
      title: '口座マイナスの手数料',
      description: '契約の給料は月末の最終営業日に入り、家賃は一日に出ていく。銀行はそれに気づいていて、気づいた分をきっちり手数料で取る。',
      reason: '当座貸越の手数料',
    },
    'frr-uni-mobility-grant': {
      title: '海外での一年',
      description: '助成金で一年、よその国の研究室へ。ちゃんと払われ、やることが変わり、この先十年どの審査でも必ず見られる一行になる。',
      reason: '助成つきの海外の一年',
    },
    'frr-uni-committee': {
      title: '年に一度の進捗委員会',
      description: '年に一度、指導教員ではない二人がここまでの分を読み、当初の計画はまだ計画のままかと、やさしく聞く。ままではないし、その部屋の全員が知っている。',
      harsher: {
        description: '委員会が四十ページの報告書を出せと言う。書くのに使った二週間は演習をしなかった二週間で、コマ単位で払われる身にはそのまま二週間ぶんの無収入だ。',
        reason: '二週間ぶんの謝金',
      },
    },
    'frr-uni-master': {
      title: '研究修士',
      description: '一年のゼミと、初めての研究室配属と、あと三年ぶんの金を誰かが出すかどうかを決める成績。式典はない。七月に、壁に、名前の一覧が貼り出されるだけだ。',
    },
    'frr-uni-defence': {
      title: '博士論文の審査',
      description: '全員が読んできた審査員を相手に六時間、朝の便で来た主査が一人。終わりに全員が署名する用紙が一枚と、十時から冷やしてあった一本。',
    },
    'frr-uni-first-post': {
      title: '最初の契約',
      description: '春に一覧が出る。ヨーロッパじゅうのポストが並び、どれにも着任日と終了日と、もう書き上がったテーマがついている。二つが採ってくれる。',
    },
    'frr-blvd-first-review': {
      title: '試用期間の終わり',
      description: '入って四か月、用紙を持った人が向かいに座り、あたたかい調子で、このまま続けてもらいますと告げる。',
      reason: '試用期間が終わった',
    },
    'frr-blvd-bank': {
      title: '銀行の面談',
      description: '担当者は三十秒遅れて現れ、非の打ちどころなく丁寧で、三年契約の方は住宅ローンをお考えですかと聞いてくる。',
    },
    'frr-blvd-insurance': {
      title: '保険代理店',
      description: '担当者が近所の浸水リスク地図を広げて説明する。こちらは元になった調査報告のほうを読んでいる。地図より事態は悪い。',
    },
    'frr-blvd-payday-1': {
      title: '給料日',
      description: '二十八日に振り込まれる。二棟先の経理は、これを一度も間違えたことがない。',
    },
    'frr-blvd-spinout-tip': {
      title: 'セミナーのあとの立ち話',
      description: '二つ隣の研究室の人が自分の実験台の特許で会社を作っていて、セミナーのワインを片手に、今の調達枠はまだ閉じていないと言う。',
    },
    'frr-blvd-crash': {
      title: '交通事故',
      description: '調査地からの帰り、濡れたロータリーで、止まらないバンにぶつかられる。全員無事で、全員申し訳なさそうで、板金屋はそのどちらでもない。',
      reason: '板金修理代',
    },
    'frr-blvd-pileup': {
      title: '高速道路の多重事故',
      description: '学会帰りの高速で霧、ブレーキランプ、そして出口ランプでひしゃげた四台。全員が歩いて帰れた。請求書は帰らない。',
      reason: '多重事故の修理代',
    },
    'frr-blvd-dentist': {
      title: '歯科の請求',
      description: '被せもの一本、寝ているあいだの歯ぎしりについての説教一回、そして上乗せの共済保険が丁重にお断りした分。',
      reason: '歯の治療費',
    },
    'frr-blvd-good-week': {
      title: 'うまくいった週',
      description: '誰も来ない土曜に出てくる。四時に、実験が三月にやるはずだったことをやる。',
    },
    'frr-crossroads': {
      title: '契約三本目',
      description: '契約三本目、あるいは同じ会社で五年目。転職エージェントのメッセージをなぜかまだ消していない。道はここで分かれる。',
    },
    'frr-stay-renewal': {
      title: '更新',
      description: '上のポストは、誰かがついに定年を迎えて空く。決める人は、こちらの仕事を六年見てきた。',
      reason: '上のポストが空いた',
    },
    'frr-move-lookout': {
      title: 'こっそり応募する',
      description: '十一ページの業績リストを、エージェントが読める二枚に書き直す。日曜のカフェで、誰にも言わずに。',
    },
    'frr-move-offer': {
      title: '中途採用の市場',
      description: 'エージェントは親切で丁寧で、何を書いてきたかにはまったく関心がない。ただし学位は数えるし、そこからの年数も数える。二社が、いまの等級のまま採ってくれる。',
      reason: '研究室を出た',
    },
    'frr-move-first-salary': {
      title: '初めてのまともな給料',
      description: '月末に満額が振り込まれる。終わりの日付はどこにもついていない。しばらくその数字を見ている。',
    },
    'frr-blvd-review': {
      title: '考課',
      description: '二人、机の上に開かれた自分の資料、そして質問はひとつ。廊下の全員が、それを聞かれることをもう知っている。',
      reason: '考課の順番が回ってきた',
    },
    'frr-blvd-tax': {
      title: '税務調査',
      description: '十一年ぶんの経費と出張精算と、小さな本の印税ひとつについての、たいへん丁寧な手紙。最後に書かれた金額は、明らかにもう決まっている。',
      reason: '税務調査の追徴',
    },
    'frr-leaving-drinks': {
      title: '送別会',
      description: '研究室の誰かが四百キロ先の任期のないポストに決まり、みんなでいい泡のワインと寄せ書きのカードを出し合う。二本目のあたりで、本人がどうやったかを正確に話しはじめる。道はここで分かれる。',
      reason: 'みんなで出し合った餞別',
    },
    'frr-conc-mobility': {
      title: '移動の年月',
      description: '育った研究室では採ってもらえない。だから外国へ出て、それから帰ってくる。引っ越し二回、敷金二回、そして一つの契約が終わって次が始まるまでの、給料のない何か月か。',
      reason: '移動の年月',
    },
    'frr-conc-qualification': {
      title: '応募資格の審査',
      description: '一件でも応募する前に、全国の委員会が「応募していい人だ」と認めなければならない。書類一式、十月の〆切、そして二月に、理由のつかない結果が届く。',
      harsher: {
        description: '審査員の構成に不備があるという形式的な理由で、書類が却下される。公証つきの翻訳まで含めて全部そろえ直し、その全部が自腹だ。',
        reason: '書類を二度そろえた',
      },
    },
    'frr-conc-teaching': {
      title: 'コマ単位の授業',
      description: '街の反対側の大学で演習を九十六時間。予算のことを気にした同僚が回してくれた口だ。三月に請求して、払われるのは十一月。',
      reason: '街の反対側で教えた分',
    },
    'frr-conc-starter-grant': {
      title: '地域圏の助成金',
      description: '地域圏が若手の研究者に二年ぶん出してくれる。三度目の申請でようやく通った。大きな額ではない。自分が考えたことに対して初めてついた金だ。',
      reason: '自分の名前でついた助成金',
    },
    'frr-conc-first-sitting': {
      title: 'コンクール',
      description: '春に一度きりの、全国一斉の採用試験。今年この分野に出るポストは十一。応募資格のある人間はおよそ二百人。十一のうち、二つが自分に合う。',
      reason: 'コンクール、一度目',
    },
    'frr-conc-second-sitting': {
      title: '二度目のコンクール',
      description: '同じ書類が一年ぶん古くなり、審査員が一人だけ入れ替わる。これを過ぎると、どの選考にも黙って書いてある年齢の線が、こちらに不利に働きはじめる。',
      reason: 'コンクール、二度目',
    },
    'frr-eng-steady': {
      title: '平穏な一年',
      description: '試験もなく、書類もなく、十月の〆切もない。そして四つの研究グループが当てにしはじめた静かな腕がある。',
    },
    'frr-eng-payday': {
      title: '給料日',
      description: '知り合いが申請書の十四ページ目を埋めているあいだに、振り込みが届く。',
    },
    'frr-eng-course': {
      title: '夜間の学位',
      description: '社会人のための国立の夜間大学へ、週に一晩、一年間。博士論文は書かない。残るのは統計の修了証一枚で、これが案外役に立つ。',
      reason: '夜間講座の受講料',
    },
    'frr-blvd-not-renewed': {
      title: '契約は更新されない',
      description: '九月には更新されると誰もが言い切っていた契約が、ごく静かに、更新されない。餞別のカードには二十二人が署名している。',
      reason: '契約が更新されなかった',
    },
    'frr-blvd-restructuring': {
      title: '事業所の閉鎖計画',
      description: 'グループが計画を発表し、労使協議会が四か月かけて交渉し、四か月のすえに事業所は結局閉じる。',
      reason: '事業所が閉鎖された',
    },
    'frr-blvd-notice-period': {
      title: '給料日',
      description: '二十八日が来て、二棟先の経理が、まだ契約の残っている全員に振り込む。',
    },
    'frr-blvd-industry-fair': {
      title: '企業の合同説明会',
      description: '何ひとつ間違えなかったのに、国が年に十一しかポストを出さなかった人たちのためのブースが並ぶ。ここで業績リストを読む人はいない。全員が学位を見る。そして、国が任命するしかないポストだけは、どのブースにも置いていない。',
      reason: '年数に見合った等級で仕切り直し',
    },
    'frr-wedding': {
      title: '結婚式',
      description: '十一時に市役所、長い昼食がそのまま長い夕食になり、両家と両方の指導教員と、何年も匿名で互いの論文を査読してきた四人が、同じ部屋にいる。',
    },
    'frr-family-nursery': {
      title: '子ども部屋の準備',
      description: '小さな部屋を黄色に塗り、真夜中にベビーベッドを組み立て、市役所の冊子を読む。博士論文より長く、博士論文よりよく整理されている。',
      reason: '子ども部屋の準備',
    },
    'frr-family-new-baby': {
      title: '赤ちゃんが来た',
      description: '小さな部屋は塗り終え、ベビーベッドも組み上がった。申請の〆切の三週間前。この一年で自分の裁量で決められるのは、その〆切だけだ。',
    },
    'frr-family-creche': {
      title: '保育所の待機',
      description: '枠は六月の委員会が点数で決め、有期契約には点がつかない。順番は十九番目。埋めるあいだは民間で、値段のほうも民間だ。',
      reason: '子ども一人あたりの民間保育料',
    },
    'frr-family-school-year': {
      title: '新学期の学用品',
      description: '子ども一人につき指定の一覧がある。指定どおりのノート、コンパス、そして八月に台所のテーブルで透明フィルムを掛ける十一点。',
      reason: '子ども一人あたりの学用品',
    },
    'frr-family-open-day': {
      title: '子どもを研究室に連れていく日',
      description: '一般公開の日、うちの子が踏み台に乗って、大人の列に液体窒素の説明をしている。大きな声で、だいたい正しく、学会で一度も持てたことのない自信で。',
    },
    'frr-family-twins': {
      title: '双子',
      description: 'エコーの技師が黙り、画面をこちらに向けて、指を二本立てる。画像を読むのは職業柄かなり得意なはずなのに、見えていなかった。',
    },
    'frr-nights-payday-1': {
      title: '給料日',
      description: '誰も記録していない時間が、ようやく明細に載る。まったく別の名前の一行として。',
    },
    'frr-nights-the-year': {
      title: 'この一年',
      description: '始発と終電の十二か月。その先にある数字は、一月の時点では建物じゅうの誰にも読めなかった。',
      reason: '始発と終電の一年と、その結果。',
    },
    'frr-nights-signed-off': {
      title: '休職',
      description: '診断書つきの六週間、産業医との面談がひとつ、そして戻るころにはずいぶん軽くなっている給与明細。',
      reason: '六週間の休職',
    },
    'frr-nights-year-end': {
      title: '十二月の振り込み',
      description: '一年が締まり、会計も締まる。何もかも組み替えられる前に、この職の給料がもう一度だけ届く。',
    },
    'frr-nights-reorganisation': {
      title: '組織再編',
      description: '部署が二つと統合され、新しい略称がつく。扉の表示は別のものになり、この一年、ほかに同じものは何ひとつない。',
      reason: '何階か上で決まった一年。',
    },
    'frr-nights-licensing': {
      title: '実施料の入金',
      description: '技術移転の部署から小さな入金がある。携帯の取引アプリはさっきから、びっくりマークつきの通知を寄こしている。',
    },
    'frr-nights-payday-2': {
      title: '給料日',
      description: 'ひと月終わってまた振り込み。そのうち二週間は一枚の図に使い、その図はいま完璧だ。',
      harsher: {
        title: '間接経費の返還',
        description: '去年の間接経費が事務棟の誰かに計算し直され、しかも下向きに計算し直される。',
        reason: '間接経費の返還',
      },
    },
    'frr-nights-counter-offer': {
      title: '引き止め',
      description: 'コーヒーの前で、よそから声がかかっていると軽く口にする。所長はコーヒーが終わるより早く、手当の一行を見つけてくる。',
    },
    'frr-season-trading': {
      title: '証券会社',
      description: '画面だらけ、窓口には年金生活者の列、そして、こちらがやたら詳しいセンサーの会社について強い意見を持っている担当者。',
    },
    'frr-season-insurance': {
      title: '保険代理店',
      description: '誰かが鍵を渡す前に、補償の話をさせてほしいと言われる。広げられる町の災害リスク地図は網羅的で、更新も新しく、そして静かに恐ろしい。',
    },
    'frr-season-joint-account': {
      title: '共同口座',
      description: '口座をひとつにまとめる。他人の支出が、否応なく自分の支出になる。相手は、そのうちどれだけが本かについて意見がある。',
      reason: '家計の精算',
    },
    'frr-convocation': {
      title: '学校への呼び出し',
      description: 'ゼミの最中に学校から電話が来て、来てくださいと言われる。子どもは無事。中学校の扉は無事ではなく、見積書はもう書き上がっている。',
      reason: '壊したものの弁償、子ども一人につき',
    },
    'frr-season-thirteenth': {
      title: '十三か月目の給与',
      description: '十二月に一か月ぶん多く入る。生まれる前に結ばれた労働協約がそう定めているからで、これに文句を言った人間は一人もいない。',
    },
    'frr-season-raise': {
      title: '昇給',
      description: 'エレベーターの前で短く呼び止められ、新しい号俸を告げられ、ちょうどいい強さの握手をひとつ。',
    },
    'frr-season-rate-rise': {
      title: '金利上昇',
      description: '安い固定金利の時代が一晩で終わる。フランクフルトの建物で下された決定で、家計のすべてが付け替えられる。',
      reason: '金利が逆に動いた',
    },
    'frr-notary': {
      title: '公証人の事務所',
      description: 'レンタルの家具で飾ったモデルルーム、それから長い机のある事務所で、公証人が全ページを声に出して読み上げる。そして愛想よく、契約の終了日はいつですかと聞いてくる。',
    },
    'frr-spin-seed': {
      title: 'シードの調達',
      description: '自分の特許でできた会社に貯金を入れ、公証人の前で書類十一枚に署名する。',
      reason: 'シードの調達',
    },
    'frr-spin-bad-tip': {
      title: '勧めてしまった',
      description: '長い昼食の席で、その場の全員に、あの技術は確かだと言った。技術は確かだった。会社はそうではなく、大声で言った責任を食事でとる。',
      reason: '勧めた責任',
    },
    'frr-spin-consulting': {
      title: '技術顧問の日',
      description: '四社が、月に二日ぶんのこちらの知識を欲しがる。最初に出た金額で頷いたことに、四社とも内心驚いている。こちらは驚いていない。',
      reason: '技術顧問の報酬',
    },
    'frr-spin-down-round': {
      title: 'ダウンラウンド',
      description: '収益まで九年かかるものは一晩で値付けし直される。資本政策表のほうは読んで、科学のほうは読んでいない人たちの手で。',
      reason: 'ダウンラウンド',
    },
    'frr-spin-bridge': {
      title: 'つなぎの調達',
      description: 'あと半年ぶん要る。その枠は、いちばん信じている人にまず声がかかる。あいにくそれは公然の事実で、そしてそれは自分だ。',
      reason: 'また会社をつないだ',
    },
    'frr-spin-acquisition': {
      title: '買収の打診',
      description: 'たいへん大きなグループが二年前からこちらの特許を読んでいて、一度話したいと言ってくる。',
      reason: '買収の話',
    },
    'frr-spin-payday': {
      title: '給料日',
      description: '持ち株が暴れているあいだに、給料が振り込まれる。',
    },
    'frr-spin-swap': {
      title: 'トップとの交換',
      description: '握手ひとつ、株主間契約の一ページの余白に署名ひとつ。首位と口座の残高を丸ごと入れ替える。',
      reason: '首位との取引',
    },
    'frr-livret-service-contract': {
      title: '保守契約',
      description: '三つの研究所が一月に、誰に頼まれるでもなく契約を更新する。この装置は、担当が変わってから一度も止まっていない。',
      reason: '保守契約の更新',
    },
    'frr-livret-payday': {
      title: '給料日',
      description: '二十八日に振り込まれる。この建物が建った年から、ずっとそうだ。',
      harsher: {
        title: '給与の支払い保留',
        description: '事務棟の表計算のセルひとつのせいで、今月の給与は来月に届くことになる。',
        reason: 'ひと月ぶんの給与保留',
      },
    },
    'frr-livret-excess': {
      title: '保険の免責',
      description: '慎重な道にも、三枚複写の保険金請求書はある。免責の分はきっちり自腹だ。',
      reason: '保険の免責額',
    },
    'frr-livret-ledger': {
      title: '予算が合う',
      description: '共用設備の帳簿を一年、一行ずつ正直につける。年度末に残ったのは、信じられる程度に小さな黒字だ。',
      reason: '予算が黒字で締まった',
    },
    'frr-livret-passbook': {
      title: '古い貯蓄口座',
      description: '生まれたときに作ってもらった貯蓄口座の通帳が、実家の引き出しから出てくる。一九九四年から誰も触っていない。そのあいだずっと、国が利息をつけていた。',
      reason: '忘れていた口座',
    },
    'frr-livret-coin-jar': {
      title: '小銭の瓶',
      description: '三年ぶんの二ユーロ硬貨が、pHメーターの上の棚の瓶に入っている。今日その瓶がいっぱいになり、道理に合わないほど重い。',
      reason: '三年ぶんの小銭',
    },
    'frr-livret-payday-2': {
      title: '給料日',
      description: 'また二十八日、また静かな振り込み。ゼミで報告することは何もない。それがこの道のすべてだ。',
    },
    'frr-livret-dividend': {
      title: '配当の日',
      description: '消耗品の会社が、安定した小さな配当を送ってくる。株主向けのピカルディの工場見学の案内つきで、これが正直かなり心を惹く。',
      reason: '年次の配当',
    },
    'frr-emeritus-number': {
      title: '必要な額',
      description: '年金の試算を説明しに来た人事の担当は、いちばん長く続けている実験より若い。金額は本物で、話は一度きりだ。',
    },
    'frr-emeritus-upgrade': {
      title: '住み替え',
      description: 'もっと明るくて高いところが出た、と不動産屋から電話が来る。ポストに終わりの日付がなくなった今なら、どうにか手が届く。',
    },
    'frr-emeritus-fire': {
      title: '煙突からの火事',
      description: '古い煙道が明け方四時に火を噴き、屋根の梁まで持っていく。ずっといい基準で建っている研究棟のほうは無事だ。',
      reason: '火災の損害',
    },
    'frr-emeritus-parents': {
      title: '親の介護',
      description: '通知表を一枚残らず取ってあった人を、こんどはこちらが支える。施設の待機者名簿はパンフレットより長い。こちらは費用を数えない。請求書はきっちり数える。',
      reason: '家族の介護費',
    },
    'frr-emeritus-payday-1': {
      title: '給料日',
      description: 'ほとんど最後の振り込みが届く。引用されるところまでは見届けられない証明を仕上げた、同じ週に。',
    },
    'frr-emeritus-swap': {
      title: 'トップとの交換',
      description: '長い昼食を挟んだ最後の大胆な取り決め。首位は、自分の財産が握手をしてこちらについていくのを見送る。',
      reason: '土壇場の交換',
    },
    'frr-emeritus-children': {
      title: '子どもたちが来る',
      description: '大きくなった子どもたちが連休に、それぞれ市場で買ったものを持って集まる。そのうち一人は、自分の論文を見せに持ってきている。',
      reason: '子ども一人ひとりからの土産',
    },
    'frr-emeritus-sticky': {
      title: '持っていかれる',
      description: '何年も口をきいていない共著者が、旅費が取れなくて行けなかった学会で、こちらの図を出す。会場は、あれが誰のものだったか覚えている。',
      reason: '図が人手に渡る',
    },
    'frr-emeritus-last-grade': {
      title: '最後の特別昇格',
      description: '扉を出る前にもう一段だけ。三十年には値打ちがあると、全国の委員会を説き伏せられるなら。',
      reason: '人生で最後の審査',
    },
    'frr-emeritus-payday-2': {
      title: '給料日',
      description: '三度目の更新のあたりで振り込みを数えるのをやめた。二十八日のほうはやめていない。',
    },
    'frr-emeritus-final-tax': {
      title: '最後の納税',
      description: '十一年ぶんの経費と、小さな印税ひとつについての最後の封筒が、最後の朝、机の上で待っている。',
      reason: '最後の納税',
    },
    'frr-emeritus-last-year': {
      title: '最後のゼミ',
      description: '二十四歳から問い続けてきたことに、もう一年。それから鍵を返し、冷凍庫は誰かほかの人が開ける。どうだったかは、全員が知りたがっている。',
      reason: '実験台で過ごす最後の一年。',
    },
    'frr-retirement': {
      title: '退職の日',
      description: 'セミナー室での最後のあいさつ、よく当てた三人が選んだ贈り物、そして四十年ぶりの、どこでも実験が走っていない朝。',
    },
  },

  lanes: {
    'Stay Where You Are': {
      name: '動かない',
      summary: '動かずに、積み上げたものを効かせる。上のポストは誰かが定年になれば空く。決める人はこちらの仕事を六年見てきたし、自分の値打ちを自分の口から言わされることもない。',
    },
    'The Move to Industry': {
      name: '企業に移る',
      summary: '声のかかったほうへ行く。本物の給料、終わりの日付のない契約、そして論文の話をしない採用担当。ただし学位は数えるし、そこからの年数も数える。だから、いまの等級のまま入れる。',
    },
    'The Concours': {
      name: 'コンクール',
      summary: '外国へ出て、帰ってきて、全国の資格審査を通り、そのうえで採用試験を受ける。ポストは十一、応募者は二百人、出目は五か六。この道で受けられるのは二回まで。通れば、その職は誰にも取り上げられない。二回とも外せば、六月に切れる契約を抱えたまま、四十歳でこの道を降りる。',
    },
    'The Engineer\'s Post': {
      name: '技術職として',
      summary: '毎月払われる職にとどまる。肩書きはゆっくりしか変わらないが、仕事は本物で、この建物の結果の半分はこちらに乗っていて、それを続ける権利のために全国試験を受けろとは誰も言わない。',
    },
    'The Two-Body Problem': {
      name: '二人の職',
      summary: '有期契約に点をくれない保育所の選考、八月に透明フィルムを掛ける学用品の一覧、そして最後に、子どもたちが市場で買ってくるもの。給料日はずっと少なく、請求は全部かけ算で来る。',
    },
    'Nights at the Bench': {
      name: '深夜の実験台',
      summary: '六時に建物が空になっても一時までいるし、ほかにいたい場所もない。昇給は本物、結果も本物。代わりに失ったものの一覧は別紙で、そちらは長い。',
    },
    'The Deep-Tech Spinout': {
      name: '大学発ディープテック',
      summary: '自分の研究室の実施権で会社を興し、市場の評価を聞きに行く。公証人の事務所の時点で負けているならこちらへ。勝っているなら、よく考えたほうがいい。',
    },
    'The Livret A': {
      name: '国の貯蓄口座',
      summary: '生まれたときに誰かが作ってくれた非課税の貯蓄口座、勝手に更新される保守契約、そしてpHメーターの上の小銭の瓶。ここで金持ちになった者はいないし、破滅した者もいない。すでに勝っているなら、それはかなりの値打ちだ。',
    },
  },

  careers: {
    'career-frr-research-engineer': {
      title: '研究開発エンジニア',
      description: '四年後に製品になるものをやる。社員食堂と労使協議会があり、問いを決めるのは自分ではない。',
    },
    'career-frr-rd-manager': {
      title: '研究開発マネージャー',
      description: '十四人、六つのプロジェクト、そして十一月にパリ本社の予算調整を生き延びなければならない予算がひとつ。',
    },
    'career-frr-technical-director': {
      title: '技術本部長',
      description: 'グループが十年後に何を作れるようになっているかを決め、三年後にはいなくなる人たちに、その責任を問われる。',
    },
    'career-frr-clinical-project-manager': {
      title: '臨床試験のプロジェクトマネージャー',
      description: '四か国九病院の治験を回し、そのすべての治験コーディネーターの名前を覚えている。',
    },
    'career-frr-head-of-clinical-operations': {
      title: '臨床開発部長',
      description: '会社のお気に入りの開発品を、年に四つのうち二つ、丁寧に、誰も反論できない数表で止める。',
    },
    'career-frr-patent-engineer': {
      title: '特許技術者',
      description: '発明を読み、その前にある四百件の発明を読み、二か国語で慎重な請求項をひとつ書く。',
    },
    'career-frr-patent-attorney': {
      title: '弁理士',
      description: '会社のいちばんいい着想を、ミュンヘンの競合の弁護士が回り込めない二十行の文章の中に収める。',
    },
    'career-frr-data-scientist': {
      title: 'データサイエンティスト',
      description: '十二年ぶんの工場のログを、役員会が動ける数字ひとつにする。そして二度説明する。',
    },
    'career-frr-lead-data-scientist': {
      title: 'リードデータサイエンティスト',
      description: '部門の四十の案から六つを選んで一年ずつ与え、四半期ごとにその選択を守る。',
    },
    'career-frr-chief-data-officer': {
      title: 'チーフデータオフィサー',
      description: '役員会に座り、「そのデータはうちにありません」と声に出して言い、聞いてもらえる程度には当たっている。',
    },
    'career-frr-systems-engineer': {
      title: 'システムエンジニア',
      description: '十一のサブシステムが高度四百キロで食い違いうるすべての場合を、一つの文書に収めている。',
    },
    'career-frr-programme-chief-engineer': {
      title: 'プログラム主任設計者',
      description: '動きます、と書いた紙に署名する。実際に動く午前三時、その管制室にいる。',
    },
    'career-frr-reactor-physicist': {
      title: '原子炉物理の研究者',
      description: '炉心が何をしているかを、聞いたら怖くなる精度で把握していて、本人はこの話題をひどく落ち着くと思っている。',
    },
    'career-frr-safety-director': {
      title: '安全部長',
      description: '原発を丸ごと止められる規制当局に答える立場で、数字を都合のいいほうに丸めたいと思ったことは一度もない。',
    },
    'career-frr-food-science-engineer': {
      title: '食品開発の技術者',
      description: '二月のリールと八月のマルセイユで同じ味になるビスケットを、一年かけて作り上げる。実際に作り上げる。',
    },
    'career-frr-head-of-product-development': {
      title: '商品開発部長',
      description: '試食室で年に九つの案を殺し、誰も泣かせずにそれをやる術を身につけた。',
    },
    'career-frr-spinout-engineer': {
      title: '大学発ベンチャーのエンジニア',
      description: '十一人、公的研究機関からの実施権ひとつ、そして調達次第の給与。調達はスライド一枚次第だ。',
    },
    'career-frr-spinout-chief-scientist': {
      title: 'ベンチャーの主席研究員',
      description: '科学と、会社の一部を持っている。契約書を査読報告と同じ丁寧さで読めるようになった。',
    },
    'career-frr-scientific-consultant': {
      title: '科学技術コンサルタント',
      description: '自分の知っていることの四か月ぶんを、それが要ると気づいたばかりの会社に売る。当たり年と薄い年ではまるで違う。',
    },
    'career-frr-consulting-partner': {
      title: 'コンサルティングのパートナー',
      description: '仕事を取ってきて、十五歳下の人たちに渡し、その年の売り上げどおりに払われる。',
    },
    'career-frr-lycee-physics-teacher': {
      title: '高校の物理教師',
      description: 'この卓の研究者の半分が、誰のおかげかと聞かれて名前を挙げる人。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-frr-museum-instrument-maker': {
      title: '博物館の機器職人',
      description: '十八世紀の天球儀を、九十年ぶりに、正しく回るように組み直す。もっといい仕事を勧められたことはない。そんなものはないからだ。',
    },
    'career-frr-hourly-lecturer': {
      title: '時間講師',
      description: 'コマ単位で払われ、三つの大学を電車で回る。しかも請求から八か月後の振り込み。全員がひどいと言い、誰も直さない。',
    },
    'career-frr-temporary-lecturer': {
      title: '任期付き講師',
      description: '大学ひとつ、机ひとつ、一年、更新は一度だけ。二百人の一年生は、この人が昔からここにいると思っている。',
    },
    'career-frr-contract-professor': {
      title: '契約教授',
      description: '私立の学校の本物の教授職、本物の契約、そして本物の終了日。全員が礼儀正しくて、誰もその話をしない。',
    },
    'career-frr-postdoc': {
      title: 'ポスドク',
      description: '三年、問いひとつ、そして答えが出るより少しだけ早く切れる予算。次は任期なしだよ、と全員が言う。',
    },
    'career-frr-project-leader': {
      title: 'プロジェクトリーダー',
      description: '自分の予算の行、自分の博士学生、そして助成契約書に印刷された日付で終わる計画。',
    },
    'career-frr-institute-group-leader': {
      title: '研究所のグループリーダー',
      description: '基金のある私立研究所、十一人、そして五年ごとに更新される任期。すでに二度更新されている。',
    },
    'career-frr-station-assistant': {
      title: '観測所の研究補助員',
      description: '他人の論文のために、冷たい水の中で数を数える。年に半年。パリの事務室とは代えない。',
    },
    'career-frr-station-scientist': {
      title: '観測所の研究員',
      description: '一九五八年から毎年続いている調査を回す。当たり年と、船が壊れた年とでは手取りが違う。',
    },
    'career-frr-station-director': {
      title: '観測所長',
      description: '岬の建物と船三隻と、代えのきかない観測記録を守る。主な手段は、地域圏あての手紙だ。',
    },
    'career-frr-clinical-fellow': {
      title: '臨床研究医',
      description: '週四日は患者を診て、五日目に研究を書く。これを週五日と呼ぶのは、かなり前向きな数え方だ。',
    },
    'career-frr-trial-physician': {
      title: '治験責任医師',
      description: 'その治療が本物かどうかを決める試験群を預かり、全ページに署名する。',
    },
    'career-frr-trial-centre-director': {
      title: '治験センター長',
      description: '十一の病院で四十本の試験を回す。この国の患者に声がかかるのは、この人がいるからだ。',
    },
    'career-frr-science-journalist': {
      title: '科学記者',
      description: '二十時のニュースでプレプリントを解説する。プレプリントは翌週に撤回されることがある。映像は撤回されない。',
    },
    'career-frr-science-editor': {
      title: '科学編集者',
      description: '週に二百ある成果のうち、どの四つを国じゅうが聞くかを決める。礼を言われる回数は査読者と同じくらいだ。',
    },
    'career-frr-documentary-producer': {
      title: 'ドキュメンタリーのプロデューサー',
      description: '誰かの十年の野外調査を、先生が二十年見せ続ける九十分に変える。使用料は更新される。発注のほうはされない。',
    },
    'career-frr-private-lab-engineer': {
      title: '民間研究所の研究員',
      description: 'ここでは博士号に値打ちがある。五年間そうでないと言われ続けたあとでは、妙な朝だ。',
    },
    'career-frr-private-lab-manager': {
      title: '研究部門長',
      description: 'グループが大学発ベンチャーごと買った研究所を回し、そこの人間が一人も製品チームに組み替えられないように守る。',
    },
    'career-frr-director-of-research': {
      title: '研究開発本部長',
      description: '従業員六万人の会社が次に何を知ろうとするかを決める。共和国のどの教授よりも稼いでいて、そのことは一度も口にしない。',
    },
    'career-frr-instrument-scientist': {
      title: '装置担当の研究員',
      description: '全員の結果が乗っている装置を、規格の中に保つ。よくて謝辞に一行載る。',
    },
    'career-frr-platform-head': {
      title: '共用設備の責任者',
      description: '装置四台、予約表ひとつ、そして教授の誰ひとり学長に手紙を書かないように回す外交手腕。',
    },
    'career-frr-research-administrator': {
      title: '研究支援の専門職',
      description: 'ヨーロッパじゅうの公募要領を読んでいて、この研究室が実際に取れるのはどの三つかを知っている。',
    },
    'career-frr-laboratory-manager': {
      title: '研究室運営マネージャー',
      description: '九十人を、十一の予算と四つの設置母体のもとで回す。四つが何を言うかは、言われる前に知っている。',
    },
    'career-frr-centre-manager': {
      title: '拠点マネージャー',
      description: '六つのサイトと二つの省庁にまたがる十年の国家プロジェクトをまとめ、要人全員の携帯番号を持っている。',
    },
    'career-frr-sensory-scientist': {
      title: '官能評価の研究者',
      description: '十二人のパネルを訓練して、味について数字で一致させる。うまくいく。分野の外の人は誰も信じない。',
    },
    'career-frr-sensory-lab-head': {
      title: '官能評価研究室長',
      description: '国じゅうの醸造所と乳製品工場の半分が、困りごとを持ち込んでくる。答えはたいてい温度だ。',
    },
    'career-frr-curator-of-beetles': {
      title: '甲虫の学芸員',
      description: '四十万種いて、その一種ずつを誰かが愛さなければならない。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-frr-programme-officer': {
      title: '助成プログラムの担当官',
      description: '年に二百件の申請を読み、十二の夢に予算をつける。そのために自分の研究室を断り、一度も後悔していない。',
    },
    'career-frr-state-research-scientist': {
      title: '国立研究機関の研究員',
      description: '任命は国が出し、任期はなく、決めたのは一日の午後だけ集まった審査会だ。辞令を四回読み、翌朝もう一度読む。',
    },
    'career-frr-state-research-director': {
      title: '国立研究機関の研究主幹',
      description: '十一人を率いていて、給料はグランゼコールの同期の、そのまた部下と同じ額だ。それでも、この問いをどちらの仕事とも交換する気はない。',
    },
    'career-frr-university-lecturer': {
      title: '大学准教授',
      description: '年に百九十二時間の授業、夕方からの研究、そして共和国のどんな組織再編でも取り上げられない職。',
    },
    'career-frr-full-professor': {
      title: '大学教授',
      description: '研究室を回し、委員会の議長をし、年に四つ別の街の審査に出て、そして六人ぶんの名前を自分より先に載せる。',
    },
    'career-frr-staff-research-engineer': {
      title: '国立研究機関の技術職員',
      description: '装置に本当に必要だった任期のないポスト。八十人が応募した採用試験で取った。以来、装置は一度も止まっていない。',
    },
    'career-frr-principal-research-engineer': {
      title: '主任研究技術職員',
      description: '三つの研究室が次の十年をその上に載せる装置を設計し、図面に自分で署名する。',
    },
    'career-frr-assistant-astronomer': {
      title: '天文台の観測研究員',
      description: '天文台の任期のないポスト。観測業務と、教育の義務と、契約上訪れる義務のある山がひとつ。',
    },
    'career-frr-astronomer': {
      title: '天文台の主任研究員',
      description: '装置ひとつ、十年ぶんの夜、そして名前に番号のついたカタログを持っている。委員会に向かって、辛抱強く、九度目に、その誤差棒が何を意味するのかを説明する。',
    },
    'career-frr-hospital-researcher': {
      title: '大学病院の研究医',
      description: '病棟がひとつ、教育回診がひとつ、研究日が一日。どれにも任期がなく、どれも静かではない。',
    },
    'career-frr-head-of-department': {
      title: '診療科長',
      description: 'よその病院が送ってくる症例を引き受け、その顛末を論文にし、真夜中に当直表に署名する。',
    },
  },

  houses: {
    'house-frr-cevennes-ruin': {
      name: 'セヴェンヌの廃屋',
      description: '二部屋、栗の木の屋根、そして一キロ先まで隣家がない。毎年八月は壁の目地を詰め直して過ごし、毎年九月にあれは休暇だったと言い張る。',
    },
    'house-frr-tram-terminus-flat': {
      name: 'トラム終点のアパルトマン',
      description: '四十平米、研究室まで三駅、そして椅子ひとつと読むものの山がちょうど載るバルコニー。',
    },
    'house-frr-science-park-terrace': {
      name: '研究団地の連棟住宅',
      description: '研究団地のために一斉に建てられた家。隣と同じ形で、その隣は全員、自分と同じ三棟のどれかで働いている。',
    },
    'house-frr-silk-workshop': {
      name: '改装した絹織物の工房',
      description: '天井四メートル、かつて織機のために作られ、いまは製図台のためにある窓。暖房費もその容積なりだ。',
    },
    'house-frr-campus-duplex': {
      name: 'キャンパス脇の新築メゾネット',
      description: '二階建て、ガレージ、そして毎年三月の管理組合の総会で、四年続けて生け垣の話を持ち出す人がいる。',
    },
    'house-frr-estuary-longhouse': {
      name: '河口の平屋',
      description: '低く長い石造り、臨海研究所の桟橋まで十二分。眺めは永遠で、嵐よけの鎧戸は毎年の仕事だ。',
    },
    'house-frr-vineyard-farmhouse': {
      name: '葡萄畑の農家',
      description: '自分が植えたわけでもないのに引き抜く気になれない一ヘクタールの葡萄と、これまででいちばんいい書斎だと判明した地下蔵。',
    },
    'house-frr-observatory-villa': {
      name: '天文台の上の家',
      description: '標高千五百メートル、ドームへ続く道の途中。この国が四十年前に見えなくなった空がついてくる。',
    },
    'house-frr-boulevard-top-floor': {
      name: '大通りの最上階',
      description: '最上階まるごと、目の高さにプラタナス、そして研究所までの十一分の道のりが、一日でいちばんいい時間だ。',
    },
  },

  stocks: {
    'stock-frr-consumables': {
      name: '研究用消耗品',
      description: 'ヨーロッパじゅうの研究室に緩衝液とチップと抗体を売る。値段を交渉する気力は誰にもない。売り文句はそれだけだ。',
    },
    'stock-frr-instruments': {
      name: '精密機器',
      description: '予約したことのある共用設備には、必ずこの会社の装置がある。装置は二十年もち、保守契約は二十一年もつ。',
    },
    'stock-frr-campus-spinout': {
      name: '大学発ディープテック',
      description: '同じ部屋にいた人が、公的研究機関の実施権で作った会社。航空宇宙グループの発注ひとつで、本物の会社になる。',
    },
    'stock-frr-biotech': {
      name: '九年先のバイオ',
      description: '化合物ひとつ、第二相、承認まであと九年。六年前からずっとあと九年だ。科学のほうは本当に美しい。',
    },
    'stock-frr-fusion': {
      name: '核融合ベンチャー',
      description: '孫の代の国の電源になるか、史上いちばん高い磁石になるか。論文は読んだ。それでもどちらかは言えない。',
    },
  },

  lifeTiles: {
    'tile-frr-first-author': { title: '自分の名前が最初に来る論文' },
    'tile-frr-method-adopted': { title: '自分の手順書がみんなの標準になった' },
    'tile-frr-lab-cat': { title: '搬入口の猫を引き取った' },
    'tile-frr-campaign-at-sea': { title: 'ブレストから出た航海調査' },
    'tile-frr-rooftop-plot': { title: '屋上の試験圃場を育てた' },
    'tile-frr-tasting-panel': { title: '官能評価のパネルの意見をそろえた' },
    'tile-frr-field-season': { title: '何ひとつ壊れなかった調査シーズン' },
    'tile-frr-radio-series': { title: '夏じゅう再放送されたラジオ番組' },
    'tile-frr-built-the-rig': { title: '工作室の端材で組み上げた装置' },
    'tile-frr-student-paper': { title: '自分のより良かった学生の博士論文' },
    'tile-frr-ran-the-congress': { title: '学会を無事故で運営しきった' },
    'tile-frr-open-day': { title: '村に研究室を開けた日' },
    'tile-frr-summer-school': { title: 'アルプスのサマースクールで教えた' },
    'tile-frr-cover-image': { title: '学術誌の表紙をカラーで飾った' },
    'tile-frr-clear-week': { title: '天文台で一週間の快晴' },
    'tile-frr-public-lecture': { title: '入りきらなかった夜の公開講座' },
    'tile-frr-instrument': { title: 'ヨーロッパの半分が発注した装置' },
    'tile-frr-lab-lunch': { title: '四時まで続いた研究室の昼食' },
    'tile-frr-freezer-rescue': { title: '停電の夜に冷凍庫を守った' },
    'tile-frr-replicated': { title: '二つの研究室が再現してくれた' },
    'tile-frr-glassware': { title: 'ついにガラスを自分で吹いた' },
    'tile-frr-science-club': { title: '高校の科学部を指導した' },
    'tile-frr-named-species': { title: '博物館に自分の名前がついたものがある' },
    'tile-frr-prize-crystal': { title: 'ついに育ってくれた結晶' },
    'tile-frr-dataset': { title: 'みんながダウンロードするデータベース' },
    'tile-frr-restored-spectrometer': { title: '地下から出てきた装置を直した' },
    'tile-frr-camera-trap': { title: '森に置き忘れた自動撮影カメラ' },
    'tile-frr-canteen-table': { title: '答えが出た社員食堂のテーブル' },
    'tile-frr-collaboration': { title: '共同研究から友情になった' },
    'tile-frr-museum-room': { title: '博物館の一室を設計した' },
    'tile-frr-four-students': { title: '学生が一人残らずポストに就いた' },
    'tile-frr-twelve-weeks': { title: '八月をまるごと研究室で過ごした' },
    'tile-frr-review-article': { title: 'いつまでも引かれ続ける総説' },
    'tile-frr-long-walk': { title: 'ヴェルコールを歩いていて解けた' },
    'tile-frr-rescued-archive': { title: '廃棄寸前の資料庫を救った' },
    'tile-frr-long-series': { title: '六十年途切れなかった観測記録' },
  },

  economy: {
    tuitionNotes: [
      '契約も助成もなく、指導教員は何とかなると信じている。五年ぶんの夜と週末とコマ払いの授業、そして論文は自分の金で書く。',
      '三年の博士契約と、四年かかる論文。最後の一年は自前で、授業を持って埋める。',
      '最初から最後まで博士契約つき。慎ましい給料と社会保険、そして誰かが忘れずに免除してくれる登録料。',
      '企業に雇われて書く博士論文。会社の中で、社員として給料をもらいながら研究し、会社のほうは研究室にその分を払う。三年の研究のすえ、貯金が残る。',
    ],
    marriage: {
      rescued: '二度目でようやく「はい」。相手のポストは四百キロ先にあり、結婚してからの二年は、金曜の夜の列車と日曜の夜の列車の上で過ぎる。',
      outcomes: [
        '披露宴が勝手に大きくなっていく。村の会場、両家そろっていいシャンパンを頼み、ケータリングは誰も頼んでいない四皿目を足してくる。',
        '共和国の肖像画の下、市役所で十分。そのあと四十人の長い晩餐。助成金の報告書の〆切が月曜だった。ご祝儀で足りた。',
        '相手が同じ街に任命される。どちらも口には出さないが、これはかなり珍しい。給料がふたつ、部屋はひとつ、そして日曜の夜に切符を買う必要は二度とない。',
        '研究室じゅうが来て、両家とも気前がよく、しかも相手は、生まれたときに作ってもらったまま一度も手をつけていない貯蓄口座を持っていた。',
      ],
    },
  },
}
