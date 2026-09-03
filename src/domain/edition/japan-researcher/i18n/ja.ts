import type { EditionTranslation } from '../../i18n/types'

/**
 * Researcher: Japan in Japanese — the overlay this whole board was waiting for.
 *
 * Every other overlay in this project translates a board written *about*
 * somewhere for an English reader. This one translates a board written about a
 * life its readers are standing inside. The route file says so itself: its
 * voice rule is "the Japanese thing explained in passing rather than named",
 * and it keeps that promise beautifully — "a fixed-term contract", "a rule that
 * says whoever keeps renewing you past ten years owes you one that never ends",
 * "one recruitment season, one start date shared with four hundred other
 * people", "a post is advertised nationally". Every one of those is an
 * explanation standing in for a word, and the word exists: 任期付き, 十年ルール,
 * 新卒一括採用, 公募. Also 学振, 科研費, 若手研究, ポスドク, 助教, 特任, 非常勤,
 * 業績, 公聴会, 教授会, 雇止め.
 *
 * So the rule is the country Japan board's rule, turned up: write the sentence
 * the English tile was *reaching for*, in the words the thing is actually
 * called, and delete the explanation — because here the explanation is not
 * merely unnecessary, it is the one thing that would make a researcher stop
 * believing the tile. Where the English joke lived in the explaining, the
 * Japanese joke lives in the name. 「十年ルール」 needs no setup: anybody who has
 * ever counted their own years already knows the punchline, and knew it before
 * the tile was drawn.
 *
 * The length and the beat stay. Plain form (常体), present tense, short
 * sentences, the cost or the joke landing in the same breath — the same voice
 * as the other Japanese overlays, and the register a Japanese board game prints
 * in.
 */
export const RESEARCHER_JAPAN_JA: EditionTranslation = {
  locale: 'ja',
  editionId: 'japan-researcher',

  spaces: {
    'jpr-start': {
      title: '人生のスタート',
      description: '四月のある朝、大教室で誰かが早口に、これからの四年が何のためにあるのかを説明している。ここから始まる。',
    },
    'jpr-doc-bench': {
      title: '自分の実験台',
      description: 'カードキーと、開かない窓の下の机と、これから五年ぶん自分のものになる実験台一メートルを与えられる。',
      harsher: {
        description: 'カードキーと机と実験台一メートル。そして最初のひと月に自腹で揃えるものの一覧が渡される。',
        reason: '実験台の備品を自腹で',
      },
    },
    'jpr-doc-stipend-years': {
      title: '博士課程の五年',
      description: '授業料と家賃と研究費の五年。三月に学振の審査がこちらをどう見たかで、その全部が決まる。同期はもう三年目の給料をもらっていて、そのうち一人が悪気なくそう言ってくる。',
      reason: '博士課程の五年ぶん',
    },
    'jpr-doc-teaching': {
      title: 'TAのコマ',
      description: '一年生四十人、週に一コマの学生実験、そして一度だけ時給に直して計算し、二度と計算しないと決めた謝金。',
      reason: 'TAの謝金',
    },
    'jpr-doc-conference-fees': {
      title: '学会の参加費',
      description: '学会は札幌、参加費に学生割引はなく、指導教員は本当に申し訳なさそうに、その予算は三月で締まったと言う。',
      reason: '自腹で払った参加費',
    },
    'jpr-doc-fellowship': {
      title: '学振に通る',
      description: '学振が決まる。毎月の研究奨励金、自分の名前でつく研究費、そしてこの先十年、どの審査でも必ず見られる一行。',
      reason: '学振の研究奨励金',
    },
    'jpr-doc-qualifying': {
      title: '予備審査',
      description: '筆記が二つ、口頭が一つ。審査員は全員、まだ書いていない論文を読んでいる。コンビニのおにぎりと三階の自販機で二週間を持たせる。',
      harsher: {
        description: '筆記二つと口頭一つ、そのあいだの二週間は何もできない。コマ単位で払われる身には、二週間ぶんの謝金が消えるということだ。',
        reason: '二週間ぶんの謝金',
      },
    },
    'jpr-doc-masters': {
      title: '修士の学位記',
      description: '二年、大学指定の青い表紙で製本した修論、そして写真のためのレンタルのガウン。この部屋のほとんどは四月から働く。自分は働かない。',
    },
    'jpr-doc-defence': {
      title: '公聴会',
      description: '狭い部屋で三時間、この分野をいちばんよく知っている五人を相手にする。終わると五人が立ち上がって、博士と呼ぶ。',
    },
    'jpr-doc-first-post': {
      title: '最初のポスト',
      description: '全国の公募が並んでいる。どれにも着任日と任期の終わりと、すでに決まった研究テーマがついている。二つが採ってくれる。',
    },
    'jpr-ms-spring-intake': {
      title: '新卒一括採用',
      description: '一度きりの就活、一着のリクルートスーツ、四百人と同じ入社日。配属される研究所はもう決まっていて、初任給はこの部屋の全員と同じ額だ。',
    },
    'jpr-ms-first-envelope': {
      title: '初任給',
      description: '初めての給料はとんでもない大金に見える。それで親を食事に連れていくと、二人は誇らしさを隠さずに払わせてくれる。',
      reason: '初任給',
      footnote: 'ひと月まるごとではなく、その途中から働き始めた分。まるひと月分が入るのは次の「給料日」のマス。',
    },
    'jpr-ms-payday-1': {
      title: '給料日',
      description: 'まるひと月働いた。研究室の同期がまだ分光器と言い争っているうちに、振り込みが届く。',
      harsher: {
        title: '給料は翌月払い',
        description: '初月の給料が一か月遅れで払われることは誰も教えてくれなかったし、部屋の敷金は待ってくれなかった。',
        reason: '無収入のひと月',
      },
    },
    'jpr-ms-company-flat': {
      title: '社宅に入る',
      description: '稼いでいる以上、住まいは構えるものとされる。研究所から十一分の借り上げ社宅、敷金、そして深夜に自分で組み立てるベッド。',
      reason: '敷金と引っ越し代',
    },
    'jpr-ms-first-night': {
      title: '最初の夜',
      description: '段ボール四箱を開ける。うち三箱は本だ。眠るのは二時。どうせ研究所からの終電は零時だ。',
    },
    'jpr-ms-clean-room': {
      title: 'クリーンルームの一式',
      description: '白衣二着、安全靴、線量計のバッジ、そして自腹で申し込んで土曜に受ける講習。',
      reason: '装備と安全講習',
    },
    'jpr-ms-payday-2': {
      title: '給料日',
      description: 'ひと月働いてまた給料。修論の続きが何になるはずだったかは、誰にも一度も聞かれない。',
      harsher: {
        title: '賞与半減',
        description: '事業部が数字を落とし、夏の賞与はこの建物に来たこともない誰かに査定し直される。',
        reason: '半分になった賞与',
      },
    },
    'jpr-ms-payday-3': {
      title: '給料日',
      description: '三回目の給料日。通帳の残高が習慣らしい顔をしはじめた。指導教員は心から喜んでくれて、そのことを長々と言う。',
    },
    'jpr-corridor-first-review': {
      title: '最初の面談',
      description: '入って半年、三枚複写の用紙を持った人が向かいに座り、調子はどうかと尋ねる。',
      reason: '最初の半年が終わった',
    },
    'jpr-corridor-bank': {
      title: '銀行の窓口',
      description: '行員がマニュアルどおりの角度で頭を下げ、任期三年の方は住宅ローンをお考えですか、と穏やかに聞いてくる。',
    },
    'jpr-corridor-insurance': {
      title: '保険の窓口',
      description: '担当者がラミネート加工のハザードマップを広げて説明する。こちらは元になった調査報告のほうを読んでいる。地図より事態は悪い。',
    },
    'jpr-corridor-payday-1': {
      title: '給料日',
      description: '九時ちょうどに振り込まれる。三棟先の給与係は、これを一度も間違えたことがない。',
    },
    'jpr-corridor-spinout-tip': {
      title: 'セミナーのあとの立ち話',
      description: '二つ隣の研究室の人が自分の特許で会社を作っていて、セミナーのサンドイッチを食べながら、今の調達枠にまだ空きがあると言う。',
    },
    'jpr-corridor-crash': {
      title: '交通事故',
      description: '調査地からの帰り、雨の交差点で、止まらない車にぶつかられる。相手はきっちり四十五度で頭を下げる。修理工場の見積書はそこまで丁寧ではない。',
      reason: '板金修理代',
    },
    'jpr-corridor-pileup': {
      title: '高速道路の多重事故',
      description: '学会帰りの高速で霧、ブレーキランプ、そしてランプでひしゃげた四台。全員無事に歩いて帰れたが、請求書は帰らない。',
      reason: '多重事故の修理代',
    },
    'jpr-corridor-dentist': {
      title: '歯医者の請求',
      description: '詰め物ひとつ、銀歯ひとつ、寝ているあいだの歯ぎしりについての説教ひとつ、そしてドリルよりよほど沁みる請求書。',
      reason: '歯の治療費',
    },
    'jpr-corridor-preprint': {
      title: 'うまくいった週',
      description: '火曜の午後、誰も見ていないところで、初めてうまくいく。実験室の床に座り込んで笑う。',
    },
    'jpr-crossroads': {
      title: '任期三本目',
      description: '任期三本目、あるいは同じ部署で五年目。転職エージェントのメッセージをなぜかまだ消していない。道はここで分かれる。',
    },
    'jpr-bench-renewal': {
      title: '更新',
      description: 'この研究室はここ十年、誰も出ていない。上のポストは誰かが定年を迎えて初めて空く。',
      reason: '上のポストが空いた',
    },
    'jpr-leave-lookout': {
      title: 'こっそり応募する',
      description: '十一ページの業績リストを、エージェントが読める二枚の職務経歴書に書き直す。日曜のカフェで、誰にも言わずに。',
    },
    'jpr-leave-move': {
      title: '中途採用の市場',
      description: 'エージェントは親切で丁寧で、何を書いてきたかにはまったく関心がない。二つの部署が採ってくれる。どちらも入口の等級で。',
      reason: '大学を出た',
    },
    'jpr-leave-first-salary': {
      title: '初めてのまともな給料',
      description: '二十五日に満額が振り込まれる。終わりの日付はどこにもついていない。しばらくその数字を見ている。',
    },
    'jpr-corridor-review': {
      title: '審査',
      description: '小さな部屋、こちらの資料を挟んで座る二人、そして質問はひとつ。上のポストを任せて大丈夫か。',
      reason: '審査の順番が回ってきた',
    },
    'jpr-corridor-tax': {
      title: '税務調査',
      description: '十一年ぶんの謝金と旅費と、小さな本の印税ひとつについての、たいへん丁寧な文面の通知。最後に書かれた金額は、明らかにもう決まっている。',
      reason: '税務調査の追徴',
    },
    'jpr-send-off': {
      title: '送別会',
      description: '研究室の誰かがよその街のポストに決まり、花束といい酒をみんなで出し合う。二本目を開けたあたりで、その先に何が待っているかを本人が話しはじめる。道はここで分かれる。',
      reason: '花束といい酒',
    },
    'jpr-ladder-arrival': {
      title: '研究室の立ち上げ',
      description: '流しのついた部屋がひとつ、着任日がひとつ、そして三年後の任期満了日。流しから動く研究室までの距離は、これから丁寧に読むことになる見積書の束だ。',
      reason: '研究室の立ち上げ',
    },
    'jpr-ladder-rejection': {
      title: '最初の不採択',
      description: '不採択。査読は二人が好意的で、一人は理解しておらず、六十件のうち予算がついたのは十一件。十月からまた書き直す。十月とはそういう月だ。',
      harsher: {
        description: '不採択。それでも、その研究のために発注済みだった装置は箱三つで届く。請求書つきで。',
        reason: '取れなかった予算で頼んだ装置',
      },
    },
    'jpr-ladder-evening-classes': {
      title: '非常勤のコマ',
      description: '街の反対側の大学で週に二晩、コマ単位の非常勤。予算のことを気にした同僚が回してくれた口だ。',
      reason: 'コマ単位の謝金',
    },
    'jpr-ladder-small-grant': {
      title: '若手研究',
      description: '三度目の申請で若手研究が通る。大きな額ではない。自分が考えたことに対して、初めて自分の名前でついた金だ。',
      reason: '自分の名前でついた科研費',
    },
    'jpr-ladder-open-call': {
      title: '公募',
      description: '一件の公募が全国に出る。三十一人が出し、四人が面接に呼ばれ、一人が決まり、関わる全員がどこかの学会で顔を合わせている。',
      reason: '公募が出た',
    },
    'jpr-ladder-cliff': {
      title: '十年ルール',
      description: '十年目。数えていた人間は、十年目が何を意味するか知っている。届いた文書には、終わりの日付がどこにもない。二つの部局が来てほしいと言っている。',
      reason: '十年を越えて、任期のない職',
    },
    'jpr-staff-steady': {
      title: '平穏な一年',
      description: '異動もなく、申請の〆切もなく、四つの研究室が当てにしはじめた静かな腕がある。',
    },
    'jpr-staff-payday': {
      title: '給料日',
      description: '知り合いが申請書の十四ページ目を埋めているあいだに、振り込みが届く。',
    },
    'jpr-staff-course': {
      title: '夜間の講座',
      description: '週に一晩、一年間。終わっても博士号はつかない。残るのは統計の修了証一枚で、これが案外役に立つ。',
      reason: '講座の受講料',
    },
    'jpr-after-nonrenewal': {
      title: '雇止め',
      description: '四月には更新されると誰もが言い切っていた契約が、ごく静かに、更新されない。餞別の花束はきれいだった。',
      reason: '契約が更新されなかった',
    },
    'jpr-after-layoff': {
      title: '事業の打ち切り',
      description: '事業が二年早く終わり、フロア全員が一つの会議室に集められる。終わったあと、カードキーはどの扉も開けない。',
      reason: '事業が早く終わった',
    },
    /*
     * 職を失ってから転職フェアまでのひと月。この給料日があるから、雇止めが
     * 実際に痛い（英語側の `main-notice-period` の議論と同じ）。二十五日は、
     * まだ大学の名簿に載っている人にだけ振り込まれる。
     */
    'jpr-after-notice-period': {
      title: '給料日',
      description: '二十五日が来て、三棟向こうの給与担当が、まだ名簿に名前の残っている全員に振り込む。',
    },
    'jpr-after-fair': {
      title: '転職フェア',
      description: '何ひとつ間違えなかったのに、ポストのほうが尽きた人たちのためのブースが並ぶ。ここで業績リストを読む人はいない。二社が二枚の職務経歴書を気に入る。',
      reason: '入口の等級で仕切り直し',
    },
    'jpr-wedding': {
      title: '結婚式',
      description: '誓いと写真、そして両家と両方の指導教員と、何年も匿名で互いの論文を査読してきた四人が同じ部屋にいる。',
    },
    'jpr-family-nursery-setup': {
      title: '子ども部屋の準備',
      description: '子ども部屋を明るい黄色に塗り、深夜にベビーベッドを組み立て、区役所の育児の手引きを読む。博士論文より長い。',
      reason: '子ども部屋の準備',
    },
    'jpr-family-new-baby': {
      title: '赤ちゃんが来た',
      description: '子ども部屋を塗り終え、ベビーベッドも組み上がった。申請の〆切の三週間前。この一年で自分の裁量で決められるのは、その〆切だけだ。',
    },
    'jpr-family-waitlist': {
      title: '保育園の待機',
      description: '認可保育園は点数で決まり、任期付きの契約には点がつかない。順番は四十七番目。埋めるあいだは認可外で、値段のほうも認可外だ。',
      reason: '子ども一人あたりの認可外保育料',
    },
    'jpr-family-school-bag': {
      title: 'ランドセル',
      description: '子ども一人につきランドセル、制服、体操着、そして入学式までに手書きで名前を入れる四十一点。ランドセルは最初のノートパソコンより高く、車より長持ちする。',
      reason: '子ども一人あたりのランドセルと制服',
    },
    'jpr-family-open-day': {
      title: '子どもを研究室に連れていく日',
      description: 'うちの子がほかの子に液体窒素の説明をしている。大きな声で、だいたい正しく、学会で一度も持てたことのない自信で。',
    },
    'jpr-family-twins': {
      title: '双子',
      description: 'エコーの途中で技師が黙り、画面をこちらに向けて、指を二本立てる。画像を読むのは職業柄かなり得意なはずなのに、見えていなかった。',
    },
    'jpr-lab-payday-1': {
      title: '給料日',
      description: '大学には公式には存在しないはずの残業代が、ようやく給与明細に載る。',
    },
    'jpr-lab-the-year': {
      title: 'この一年',
      description: '始発と終電の十二か月。その先にある数字は、四月の時点では建物じゅうの誰にも読めなかった。',
      reason: '始発と終電の一年と、その結果。',
    },
    'jpr-lab-burnout': {
      title: '休職',
      description: '診断書つきの六週間。頭を下げて建物に戻るころには、給料はずいぶん軽くなっている。',
      reason: '無給の休職',
    },
    'jpr-lab-year-end-payroll': {
      title: '年度末の給与',
      description: '年度は三月三十一日で閉じる。この職の給料が、また何もかも組み替えられる前に、もう一度だけ振り込まれる。',
    },
    'jpr-lab-reorganisation': {
      title: '組織改編',
      description: '研究所が一晩で解体されて組み直され、扉の名札が新しくなる。自分の札だけは同じ文字で、それ以外はこの一年、何ひとつ同じではない。',
      reason: '何階か上で決まった一年。',
    },
    'jpr-lab-trading': {
      title: '実施料の入金',
      description: '産学連携の部署から、小さな実施料が振り込まれる。取引アプリはさっきからびっくりマークつきの通知を寄こしている。',
    },
    'jpr-lab-payday-2': {
      title: '給料日',
      description: 'ひと月終わってまた振り込み。そのうち二週間は一枚の図に使い、その図はいま完璧だ。',
      harsher: {
        title: '間接経費の返還',
        description: '去年の間接経費が事務棟の誰かに計算し直され、下向きに計算し直される。',
        reason: '間接経費の返還',
      },
    },
    'jpr-lab-retention': {
      title: '引き止め',
      description: 'お茶を飲みながら、よそから声がかかっていると軽く口にする。専攻長はお茶が冷めるより早く特別な手当を見つけてくる。',
    },
    'jpr-grant-trading': {
      title: '証券会社の窓口',
      description: '壁じゅうの画面、窓口に並ぶ年金世代、そして、こちらがやたら詳しいセンサーの会社について強い意見を持っている担当者。',
    },
    'jpr-grant-insurance': {
      title: '保険の窓口',
      description: '家の鍵を渡す前に、補償の話をさせてほしいと言われる。広げられるハザードマップは網羅的で、更新も新しく、そして静かに恐ろしい。',
    },
    'jpr-grant-joint-account': {
      title: '家計をひとつにする',
      description: '口座をまとめる。他人の支出が否応なく自分の支出になる。相手は、家計に占める本の割合について意見がある。',
      reason: '家計の精算',
    },
    /*
     * 子どもが何かを壊す一マス。英語は担任からの電話で、こちらもそのまま
     * 担任からの電話でいい — 大学の教員が、自分のゼミの最中に子どもの学校
     * から呼び出される、という一枚の絵で足りる。
     */
    'jpr-phone-call': {
      title: '担任から電話',
      description: 'ゼミが始まって二十分、担任の先生から電話が来る。子どもは無事。教室の窓は無事ではなく、残りの話は誰かが代わりに締める。',
      reason: '壊したものの弁償、子ども一人につき',
    },
    'jpr-grant-bonus': {
      title: '冬のボーナス',
      description: '冬の賞与が入る。額は月給の何か月ぶんかで決まり、誰の約束でもない。同じ部屋の全員が違う数字を受け取る。',
    },
    'jpr-grant-raise': {
      title: '昇給',
      description: 'エレベーターの前で短く呼び止められ、新しい数字を告げられ、帰りに寸分たがわぬ深さの一礼を交わす。',
    },
    'jpr-grant-rate-rise': {
      title: '金利上昇',
      description: '変動金利が動かない時代が一晩で終わる。入ったこともない建物で下された決定で、家計のすべてが付け替えられる。',
      reason: '金利が逆に動いた',
    },
    'jpr-model-room': {
      title: 'モデルルーム',
      description: 'レンタルの家具と柔らかい照明のモデルルーム。営業の返済計画は、残りの職業人生とちょうど同じ長さだ。にこやかに、契約の任期はいつまでですかと聞いてくる。',
    },
    'jpr-spinout-seed': {
      title: 'シードの調達',
      description: '自分の特許でできた会社に貯金を入れ、書類十一枚に判を押す。',
      reason: 'シードの調達',
    },
    'jpr-spinout-bad-tip': {
      title: '勧めてしまった',
      description: 'その技術は確かだと、その場の全員に言った。技術は確かだった。会社はそうではなく、大声で言った責任を食事でとる。',
      reason: '勧めた責任',
    },
    'jpr-spinout-consulting': {
      title: '技術顧問の日',
      description: '四社が、月に二日ぶんのこちらの知識を欲しがる。最初に出た金額で頷いたことに四社とも内心驚いている。こちらは驚いていない。',
      reason: '技術顧問の報酬',
    },
    'jpr-spinout-down-round': {
      title: 'ダウンラウンド',
      description: '収益まで九年かかるものへの資金が一晩で止まり、持ち分は、論文を読んでいない人たちの手で値付けし直される。',
      reason: 'ダウンラウンド',
    },
    'jpr-spinout-aftershock': {
      title: 'つなぎの調達',
      description: '会社はあと半年ぶん要ると言い、いちばん信じている人たちに頼む。あいにく、いちばん信じているのは自分だ。',
      reason: 'また会社をつないだ',
    },
    'jpr-spinout-acquisition-talk': {
      title: '買収の打診',
      description: 'たいへん大きな会社が二年前からこちらの特許を読んでいて、一度話したいと言ってくる。',
      reason: '買収の話',
    },
    'jpr-spinout-payday': {
      title: '給料日',
      description: '持ち株が暴れているあいだに、給料が振り込まれる。',
    },
    'jpr-spinout-swap': {
      title: 'トップとの交換',
      description: '握手ひとつ、株主間契約の一ページに判ひとつ。首位と口座の残高を丸ごと入れ替える。',
      reason: '首位との取引',
    },
    'jpr-instrument-service-contract': {
      title: '保守契約',
      description: '三つの研究所が何も言わずに保守契約を更新する。この装置は、担当が変わってから一度も止まっていない。',
      reason: '保守契約の更新',
    },
    'jpr-instrument-payday': {
      title: '給料日',
      description: '二十五日に振り込まれる。この建物が建った年から、ずっとそうだ。',
      harsher: {
        title: '給与の支給遅れ',
        description: '事務棟の表計算のセルひとつのせいで、今月の給与は来月まとめて払われることになる。',
        reason: 'ひと月遅れの給与',
      },
    },
    'jpr-instrument-excess': {
      title: '保険の免責',
      description: '慎重な道にも三枚複写の保険金請求書はある。免責の分はきっちり自腹だ。',
      reason: '保険の免責額',
    },
    'jpr-instrument-ledger': {
      title: '予算が合う',
      description: '共用設備の帳簿を一年、一列ずつ正直につける。年度末に残ったのは、信じられる程度に小さな黒字だ。',
      reason: '予算が黒字で締まった',
    },
    'jpr-instrument-old-passbook': {
      title: '古い通帳',
      description: '実家の引き出しから子どものころの郵便貯金の通帳が出てくる。顕微鏡をねだった年に作った口座で、それからずっと静かに増えている。',
      reason: '忘れていた口座',
    },
    'jpr-instrument-coin-tin': {
      title: '五百円玉貯金',
      description: '三年ぶんの五百円玉が、pHメーターの上の棚のクッキー缶に入っている。今日その缶がいっぱいになり、道理に合わないほど重い。',
      reason: '三年ぶんの小銭',
    },
    'jpr-instrument-payday-2': {
      title: '給料日',
      description: 'また二十五日、また静かな振り込み。ゼミで報告することは何もない。それがこの道のすべてだ。',
    },
    'jpr-instrument-dividend': {
      title: '配当の日',
      description: '試薬会社が安定した小さな配当を送ってくる。株主優待もついてきて、中身は誰も説明してくれない理由で、たいへんいい米だ。',
      reason: '配当金',
    },
    'jpr-emeritus-buyout': {
      title: '早期退職',
      description: '早期退職の条件を説明しに来た人事の担当は、いちばん長く続けている実験より若い。金額は本物で、話は一度きりだ。',
    },
    'jpr-emeritus-upgrade': {
      title: '住み替え',
      description: 'もっと明るくて高いところが出た、と不動産屋から電話が来る。任期のない職についた今なら、どうにか手が届く。',
    },
    'jpr-emeritus-earthquake': {
      title: '地震',
      description: '大きいのが明け方四時にようやく挨拶に来る。皿は全部落ち、落ちた先の台所が割れる。ずっといい基準で建っている実験棟のほうは無事だ。',
      reason: '地震の被害',
    },
    'jpr-emeritus-parents': {
      title: '親の介護',
      description: '通知表を一枚残らず取ってあった人を、こんどはこちらが支える。施設の待機者名簿はパンフレットより長い。こちらは費用を数えない。請求書はきっちり数える。',
      reason: '家族の介護費',
    },
    'jpr-emeritus-payday-1': {
      title: '給料日',
      description: 'ほとんど最後の給料が振り込まれる。引用されるところまでは見届けられない証明を仕上げた、同じ週に。',
    },
    'jpr-emeritus-swap': {
      title: 'トップとの交換',
      description: 'お茶を挟んだ最後の大胆な取り決め。首位は、自分の財産が丁寧に一礼してこちらについていくのを見送る。',
      reason: '土壇場の交換',
    },
    'jpr-emeritus-children-visit': {
      title: '子どもたちが来る',
      description: '大きくなった子どもたちが、開けるのが惜しいほど立派な箱の果物を持って来る。そのうち一人は、自分の論文を見せに持ってきている。',
      reason: '子どもたちからの包み',
    },
    'jpr-emeritus-sticky': {
      title: '持っていかれる',
      description: '何年も口をきいていない共著者が、旅費が取れなくて行けなかった学会で、こちらの図を出す。会場は、あれが誰のものだったか覚えている。',
      reason: '図が人手に渡る',
    },
    'jpr-emeritus-named-chair': {
      title: '最後の教授会',
      description: '扉を出る前にもう一つだけ肩書きを、教授会が頷いてくれるなら。',
      reason: '人生で最後の審査',
    },
    'jpr-emeritus-payday-2': {
      title: '給料日',
      description: '三度目の科研費の更新のあたりで給料日を数えるのをやめた。二十五日のほうはやめていない。',
    },
    'jpr-emeritus-final-tax': {
      title: '最後の税金',
      description: '税務署から最後の封筒が届く。十一年ぶんの謝金についてで、最後の朝、机の上で待っている。',
      reason: '最後の納税',
    },
    'jpr-emeritus-last-year': {
      title: '最後のゼミ',
      description: '一生かけて問い続けてきたことに、もう一年。それから鍵を返し、冷凍庫は誰かほかの人が開ける。どうだったかは、全員が知りたがっている。',
      reason: '実験台で過ごす最後の一年。',
    },
    'jpr-retirement': {
      title: '退職の日',
      description: '机の上の花束、部屋に向けた深い一礼、そして四十年ぶりの、どこでも実験が走っていない朝。',
    },
  },

  careers: {
    'career-jpr-corporate-researcher': {
      title: '企業研究者',
      description: '四年後に製品になるものをやる。コーヒーは無料で、テーマは自分では選べない。',
    },
    'career-jpr-research-group-leader': {
      title: '研究グループ長',
      description: '十一人、四テーマ、そして毎年十月に事業部長を通さなければならない予算がひとつ。',
    },
    'career-jpr-preclinical-scientist': {
      title: '前臨床の研究員',
      description: 'その化合物を人に近づけていいかを決める試験を回し、三部つづりで書き上げる。',
    },
    'career-jpr-head-of-preclinical': {
      title: '前臨床研究部長',
      description: '会社のお気に入りの化合物を、年に四つのうち三つ、丁寧に、データで殺す。',
    },
    'career-jpr-development-engineer': {
      title: '開発技術者',
      description: '四百万台が積むブラケットから数グラム削り、そのことを静かに喜んでいる。',
    },
    'career-jpr-development-lead': {
      title: '開発リーダー',
      description: '日程と試験機と購買との言い合いを引き受け、それでもブラケットを一つずつ名前で覚えている。',
    },
    'career-jpr-application-scientist': {
      title: 'アプリケーションサイエンティスト',
      description: 'よその研究室まで飛んでいって、売った装置にカタログどおりのことをさせる。',
    },
    'career-jpr-applications-manager': {
      title: 'アプリケーション部長',
      description: '国じゅうの客が本当は何を測りたいのかを知っていて、設計に聞かれる前に伝えている。',
    },
    'career-jpr-data-scientist': {
      title: 'データサイエンティスト',
      description: '十二年ぶんの工場のログを、役員が動ける数字ひとつにする。そして二度説明する。',
    },
    'career-jpr-research-manager': {
      title: '研究マネージャー',
      description: '研究所の四十の案から六つを選んで一年ずつ与え、四半期の会議でその選択を守る。',
    },
    'career-jpr-analytical-chemist': {
      title: '分析化学者',
      description: 'ロットを台無しにした十億分の一を見つける。当たる回数が多すぎて、少し恐れられている。',
    },
    'career-jpr-head-of-analysis': {
      title: '分析部門長',
      description: '全社が順番待ちをする装置を預かる。その順番が公平で、それ自体が業績だ。',
    },
    'career-jpr-patent-engineer': {
      title: '特許技術者',
      description: '発明を読み、その前にある四百件の発明を読み、慎重な請求項をひとつ書く。',
    },
    'career-jpr-patent-attorney': {
      title: '弁理士',
      description: '会社のいちばんいい着想を、競合の弁護士が回り込めない二十行の文章の中に収める。',
    },
    'career-jpr-journal-editor': {
      title: '学術誌の編集者',
      description: '月に二百本の投稿を読み、一本ごとに査読者を三人見つける。難しいのは後半だ。',
    },
    'career-jpr-editor-in-chief': {
      title: '編集長',
      description: 'ひとつの分野が何を読むかを決める。礼を言われる回数は査読者と同じくらいだ。',
    },
    'career-jpr-spinout-researcher': {
      title: '大学発ベンチャーの研究員',
      description: '大学が実施権を出し、十一人でその賭けに乗った。給与は調達次第で、調達はスライド一枚次第だ。',
    },
    'career-jpr-spinout-chief-scientist': {
      title: 'ベンチャーの主席研究員',
      description: '科学と会社の一部を持っている。契約書を論文と同じ丁寧さで読めるようになった。',
    },
    'career-jpr-physics-teacher': {
      title: '高校の物理教師',
      description: 'この卓の教授の半分が、誰のおかげかと聞かれて名前を挙げる人。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-jpr-glassblower': {
      title: '理化学ガラス職人',
      description: 'この一品を作れるのは国内に四人で、そのうち一人が自分の工房で弟子を教えている。もっといい仕事を勧められたことはない。そんなものはないからだ。',
    },
    'career-jpr-postdoc': {
      title: 'ポスドク',
      description: '三年、問いひとつ、そして答えが出るより少しだけ早く切れる予算。ポストが用意されるより先に、まず一万人にされた。',
    },
    'career-jpr-assistant-professor': {
      title: '助教',
      description: '自分の学生、自分の実験台、そして年限の書かれた契約。その年限を建物じゅうが黙って把握している。',
    },
    'career-jpr-project-associate-professor': {
      title: '特任准教授',
      description: '本物のグループと本物の予算、そして頭に「特任」がつく肩書き。いつ終わるかは、その二文字で全員がわかる。',
    },
    'career-jpr-station-assistant': {
      title: '観測所の研究補助員',
      description: '他人の論文のために、冷たい水の中で数を数える。年に半年。事務室とは代えない。',
    },
    'career-jpr-station-scientist': {
      title: '観測所の研究員',
      description: '一九六二年から毎年続いている調査を回す。当たり年と、船が壊れた年とでは手取りが違う。',
    },
    'career-jpr-station-director': {
      title: '観測所長',
      description: '岬の建物と船四隻と、代えのきかない観測記録を守る。主な手段は書面だ。',
    },
    'career-jpr-clinical-fellow': {
      title: '臨床研究医',
      description: '週四日は患者を診て、五日目に研究を書く。これを週五日と呼ぶのは、かなり前向きな数え方だ。',
    },
    'career-jpr-trial-physician': {
      title: '治験責任医師',
      description: 'その薬が本物かどうかを決める試験の一群を預かり、全ページに署名する。',
    },
    'career-jpr-trial-centre-director': {
      title: '治験センター長',
      description: '十一の病院で四十本の試験を回す。この国の患者に声がかかるのは、この人がいるからだ。',
    },
    'career-jpr-part-time-lecturer': {
      title: '非常勤講師',
      description: '三つの大学をコマ単位で、移動は電車。宅配が一件いくらで払われるのと同じで、来年四月の見通しも同じだ。',
    },
    'career-jpr-project-lecturer': {
      title: '特任講師',
      description: '大学ひとつ、机ひとつ、自分の人件費が乗っている予算の行がひとつ。一年生は、この人が昔からここにいると思っている。',
    },
    'career-jpr-teaching-professor': {
      title: '教育担当の教授',
      description: '年に九百人を教える。研究のために採られた誰よりも教えるのがうまい。',
    },
    'career-jpr-science-writer': {
      title: 'サイエンスライター',
      description: '生放送でプレプリントを解説する。プレプリントは翌週に撤回されることがある。映像は撤回されない。',
    },
    'career-jpr-exhibition-director': {
      title: '展示ディレクター',
      description: '誰かの十年の野外調査を、七歳が口を開けたまま歩く十一の部屋に変える。',
    },
    'career-jpr-science-producer': {
      title: '科学番組のプロデューサー',
      description: '先生がまず見せる番組を作る。撮影班がとうにいなくなっても、使用料は届き続ける。',
    },
    'career-jpr-instrument-scientist': {
      title: '装置担当の研究員',
      description: '全員の結果が乗っている装置を、規格の中に保つ。よくて謝辞に一行載る。',
    },
    'career-jpr-core-facility-head': {
      title: '共用機器施設長',
      description: '装置四台、予約表ひとつ、そして教授の誰ひとり学部長に駆け込まないように回す外交手腕。',
    },
    'career-jpr-research-administrator': {
      title: 'URA',
      description: '国内の公募をすべて読んでいて、この研究室が実際に取れるのはどの三つかを知っている。',
    },
    'career-jpr-centre-manager': {
      title: 'センターの運営マネージャー',
      description: '百四十人を、終了日が四つある十一本の予算で回す。四つとも暗記している。',
    },
    'career-jpr-centre-director': {
      title: '拠点長',
      description: '申請書に自分の名前が載った十年の国家プロジェクト。更新の年は、つなぎの年の三年ぶんの値打ちがある。今年がどちらかは建物じゅうが知っている。',
    },
    'career-jpr-fermentation-scientist': {
      title: '発酵の研究者',
      description: '冷凍庫に酵母が二百株。今年のいい出来はどの株のおかげか、毎春きちんと言い争いになる。',
    },
    'career-jpr-brewing-research-lead': {
      title: '醸造研究の主任',
      description: '国内の蔵の半分が困りごとを持ち込んでくる。答えはたいてい温度だ。',
    },
    'career-jpr-head-of-research-brewing': {
      title: '醸造研究部長',
      description: '国の研究所の醸造施設を預かり、それで論文を書き、論文になる前にすべて自分で利く。',
    },
    'career-jpr-curator-of-beetles': {
      title: '甲虫の学芸員',
      description: '四十万種いて、その一種ずつを誰かが愛さなければならない。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-jpr-programme-officer': {
      title: 'プログラムオフィサー',
      description: '年に二百件の申請を読み、十二の夢に予算をつける。そのために自分の研究室を断り、一度も後悔していない。',
    },
    'career-jpr-associate-professor': {
      title: '准教授',
      description: '辞令に任期の記載がない。その一行を四回読み、翌朝もう一度読む。',
    },
    'career-jpr-professor': {
      title: '教授',
      description: '研究室を回し、金を取ってきて、筆頭には自分より先に六人ぶんの名前を載せる。',
    },
    'career-jpr-institute-senior-researcher': {
      title: '主任研究員',
      description: '国の研究所、二十年動いている装置、そして明け方四時でも門が開く職員証。',
    },
    'career-jpr-laboratory-head': {
      title: '研究室長',
      description: '研究所の四十の案のどれに一年ずつ与えるかを決め、だいたい半分は外す。',
    },
    'career-jpr-hospital-lecturer': {
      title: '病院講師',
      description: '病棟がひとつ、教育回診がひとつ、研究日が一日。どれにも任期がなく、どれも静かではない。',
    },
    'career-jpr-head-of-clinical-research': {
      title: '臨床研究部長',
      description: 'よその病院が送ってくる症例を引き受け、その顛末を論文にする。',
    },
    'career-jpr-principal-engineer': {
      title: '主任開発員',
      description: '帽子ほどの大きさのノズルに四年かけ、打ち上げ質量を一トン軽くする。',
    },
    'career-jpr-chief-engineer': {
      title: '主任設計者',
      description: 'エンジンは点く、と書いた図面に判を押す。実際に点く午前三時、その部屋にいる。',
    },
    'career-jpr-climate-modeller': {
      title: '気候モデルの研究者',
      description: '一晩で海を百年ぶん走らせ、朝食までに百年ぶんの検潮記録と突き合わせる。',
    },
    'career-jpr-chief-scientist': {
      title: '首席研究官',
      description: '委員会に向かって、辛抱強く、九度目に、その誤差棒が実際には何を意味するのかを説明する。',
    },
  },

  houses: {
    'house-jpr-observatory-cottage': {
      name: '観測所そばの一軒家',
      description: '寒い山の中腹の木造。いちばん近い店まで四十分。県内でいちばんきれいな夜空つき。売値は、思い出のぶんだけ。',
    },
    'house-jpr-campus-gate-flat': {
      name: '正門前のワンルーム',
      description: '十九平米、実験台まで九十秒。十年で計算すると、人生が一年ぶん返ってくる。',
    },
    'house-jpr-institute-tract-house': {
      name: '研究学園都市の建売',
      description: '学園都市のために一斉に建てられた家。隣と同じ形で、その隣は全員同僚。新築の匂いつき、新築の値段はつかず。',
    },
    'house-jpr-warehouse-loft': {
      name: 'リノベーションした蔵',
      description: '古い酒蔵。頭上には太い梁、工作をする場所、そして見事にうるさい石油ストーブが一台。',
    },
    'house-jpr-two-generation-house': {
      name: '二世帯住宅',
      description: '一階に親が住んでいて、学会の週は子どもを見てくれる。これでいくつかの問題が片づき、同じくらいの数の問題が生まれる。',
    },
    'house-jpr-coastal-station-house': {
      name: '臨海実験所の近くの家',
      description: '桟橋と調査船まで十二分。海の眺めは永遠、台風の保険料は毎年。',
    },
    'house-jpr-architect-built-house': {
      name: '建築家に頼んだ家',
      description: '北からの光が入る書斎と、十一メートルの書棚を中心に建っている。ただし夢は譲渡できませんと、市場が丁重に申し添える。',
    },
    'house-jpr-tower-flat': {
      name: '湾岸タワー三十八階',
      description: '契約から終わりの日付が消えた年に買った。コンクリート、コンシェルジュ、そしてタワーは値上がりを許されている。',
    },
    'house-jpr-old-quarter-penthouse': {
      name: '旧市街のペントハウス',
      description: '古い堀の街を見下ろす最上階まるごと。ようやく会員に選んでくれた学士院まで十分。エレベーターにソファがある。',
    },
  },

  stocks: {
    'stock-jpr-reagents': {
      name: 'スタンダード試薬',
      description: '国じゅうの研究室に緩衝液とチップと抗体を売る。値段を交渉する気力は誰にもない。売り文句はそれだけだ。',
    },
    'stock-jpr-instruments': {
      name: '精密機器工業',
      description: '予約したことのある共用機器室には必ずこの会社の装置がある。装置は二十年もち、保守契約は二十一年もつ。',
    },
    'stock-jpr-sensor-spinout': {
      name: '大学発センサーベンチャー',
      description: '同じ研究室にいた人の会社。二人とも言い争ったのを覚えている特許の上に建っている。自動車メーカーの発注ひとつで栄光に届く。',
    },
    'stock-jpr-biotech': {
      name: '九年先のバイオ',
      description: '薬はひとつ、第二相、承認まであと九年。六年前からずっとあと九年だ。科学のほうは本当に美しい。',
    },
    'stock-jpr-fusion': {
      name: '核融合ベンチャー',
      description: '孫の代の国の電源になるか、史上いちばん高い磁石になるか。論文は読んだ。それでもどちらかは言えない。',
    },
  },

  lifeTiles: {
    'tile-jpr-first-author': { title: '初めての筆頭著者論文' },
    'tile-jpr-method-adopted': { title: '自分の手法が標準になった' },
    'tile-jpr-lab-cat': { title: '建物の裏の猫を引き取った' },
    'tile-jpr-cruise': { title: '調査船に六週間乗った' },
    'tile-jpr-rooftop-plot': { title: '屋上の試験圃場を育てた' },
    'tile-jpr-live-demo': { title: '実演がうまくいった発表' },
    'tile-jpr-field-season': { title: '何もかもうまくいった調査シーズン' },
    'tile-jpr-textbook-figure': { title: '自分の図が教科書に載った' },
    'tile-jpr-built-the-rig': { title: 'ありあわせで組んだ装置が動いた' },
    'tile-jpr-student-paper': { title: '学生の初論文が自分のより良かった' },
    'tile-jpr-conference-run': { title: '学会を無事故で運営しきった' },
    'tile-jpr-open-day': { title: '研究室公開を仕切った' },
    'tile-jpr-summer-school': { title: 'サマースクールで教えた' },
    'tile-jpr-cover-image': { title: '自分の画像が表紙になった' },
    'tile-jpr-replicated': { title: '二つの研究室が再現してくれた' },
    'tile-jpr-public-lecture': { title: '満席になった市民講座' },
    'tile-jpr-instrument': { title: 'みんなが持つ装置を発明した' },
    'tile-jpr-lab-dinner': { title: '終わってほしくない研究室の飲み会' },
    'tile-jpr-freezer-rescue': { title: '停電の夜に冷凍庫を守った' },
    'tile-jpr-observing-run': { title: '山の望遠鏡で一週間快晴' },
    'tile-jpr-glassware': { title: 'ついにガラス器具を自分で吹いた' },
    'tile-jpr-science-club': { title: '高校の科学部を指導した' },
    'tile-jpr-named-species': { title: '自分の名前がついた種がいる' },
    'tile-jpr-prize-specimen': { title: '入賞した結晶を育てた' },
    'tile-jpr-dataset': { title: '分野じゅうが使うデータセット' },
    'tile-jpr-restored-instrument': { title: '一九五〇年代の分光器を直した' },
    'tile-jpr-camera-trap': { title: '回収し忘れた自動撮影カメラ' },
    'tile-jpr-lab-lunch': { title: 'ゼミを支えた弁当' },
    'tile-jpr-collaboration': { title: '共同研究から友情になった' },
    'tile-jpr-museum-room': { title: '科学館の一室を設計した' },
    'tile-jpr-fostered-students': { title: '四人の学生が四つのいいポストへ' },
    'tile-jpr-stamp-card': { title: '十二週間ぶっ通しで建物にいた' },
    'tile-jpr-review-article': { title: 'みんなが引く総説を書いた' },
    'tile-jpr-long-walk': { title: '三日歩いて問題を解いた' },
    'tile-jpr-rebuilt-archive': { title: '研究所の資料庫を救った' },
    'tile-jpr-long-series': { title: '六十年続く観測記録' },
  },

  lanes: {
    'The Doctoral Course': {
      name: '博士課程',
      summary: 'まだ誰も答えていない問いひとつのために、学振頼みの五年をもう一度。同じ入試を受けた連中は、もう三年目の給料をもらっている。終えたときには、研究室を任せられる数少ない一人になっている——任せてもらえる研究室があれば。',
    },
    'The Master\'s Exit': {
      name: '修士で出る',
      summary: '修士を取って就職する。ほとんど全員がそうする。本物の装置、本物の給料、四十年ぶん毎月同じ日に入る給与——そして、問いを決めるのは永久に自分ではない。',
    },
    'Stay at the Bench': {
      name: '実験台に残る',
      summary: '動かずに、積み上げたものを効かせる。上のポストは誰かが定年になれば空く。値打ちは周りがわかっているし、それを自分の口から言わされることもない。',
    },
    'Leave for Industry': {
      name: '企業に出る',
      summary: '声のかかったほうへ行く。本物の給料、任期のない契約、そして論文の話をしない面接官。この国の採用の暦には、その論文に使った年数を書く欄がない。どこまで登っていても、始まりは入口からだ。',
    },
    'The Fixed-Term Ladder': {
      name: '任期の階段',
      summary: '年限の書かれたポスト、その次も年限つき、その次も。そして十年ルール——十年を越えて使い続けた側は、任期のない職を負う。この道の給料日はどれも他人のもので、いちばん上にあるものは、誰にも取り上げられない。',
    },
    'The Staff Job': {
      name: '技術職員として',
      summary: '毎月払われる職にとどまる。肩書きは一生変わらない。仕事は本物で、この建物の結果の半分はこちらに乗っていて、それを続けるために申請書を書けとは誰も言わない。',
    },
    'Two Bodies': {
      name: '二人の職',
      summary: 'ランドセル、任期付きに点数のつかない保育園の待機、そして最後に、大きくなった子どもたち一人ずつからの包み。給料日はずっと少なく、請求は全部かけ算で来る。',
    },
    'The Lab at Midnight': {
      name: '深夜の実験室',
      summary: '六時に建物が空になっても一時までいるし、ほかにいたい場所もない。昇給は本物、結果も本物。代わりに失ったものの一覧は別紙で、そちらは長い。',
    },
    'The Spinout': {
      name: '大学発ベンチャー',
      summary: '自分の研究で会社を興し、市場の評価を聞きに行く。モデルルームの時点で負けているならこちらへ。勝っているなら、よく考えたほうがいい。',
    },
    'The Instrument Room': {
      name: '装置室',
      summary: '装置、予約表、勝手に更新される保守契約、そして小銭の入ったクッキー缶。ここで大儲けした人も破産した人もいない。勝っているなら、それにはかなりの値打ちがある。',
    },
  },

  economy: {
    tuitionNotes: [
      '学振は落ち、授業料の免除も通らず、指導教員は当然ここにいられるものと思っている。家賃と授業料と試薬の五年を、非常勤の謝金で支える。',
      '半分の年は授業料が免除になり、残りは家庭教師で埋める。なんとかなる。滞納には一度もならない、という意味では。',
      '授業料は一部免除、指導教員がRAの枠を見つけてくれる。安く食べて、ノートパソコンは自分で買う。',
      '学振に一発で通る。授業料は免除、研究奨励金は毎月、そして二十五歳で自分の名前の研究費がつく。',
    ],
    marriage: {
      rescued: '二度目でようやく「はい」。相手の任期は四時間かかる研究所にあり、結婚してからの二年は夜行バスとビデオ通話の上で過ぎる。',
      outcomes: [
        '披露宴は学会と学会のあいだに入れる。両方の指導教員が来て、同じ話をする。会場は時間貸しだ。',
        '火曜に区役所へ婚姻届、そのあと十一人で食事。報告書の〆切が月曜だった。ご祝儀で足りた。',
        '相手が同じ街のポストに決まる。給料がふたつ、通勤が一本ずつ、そしてどちらか一人では借りられなかった部屋。',
        '専攻の全員が来て、両家とも気前がよく、しかも相手は自分の博士課程のころから黙って貯めていたことが判明する。',
      ],
    },
  },
}
