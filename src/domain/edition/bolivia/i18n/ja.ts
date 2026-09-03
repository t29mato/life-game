import type { EditionTranslation } from '../../i18n/types'

/**
 * The Bolivia edition in Japanese.
 *
 * Bolivia is foreign to both target languages, so — like the India overlays —
 * this one keeps every gloss the English tile carries: the miniature fair
 * where you buy your dreams the size of a coin, the mirrored cholet that pays
 * its own rent, the leather cup of five dice, the thirteenth wage December
 * pays by law. The English tile explains each of them while making its joke,
 * and so does this.
 *
 * The edition's own rule is honoured too: a market stall is an ambition, never
 * a hardship. Nothing here renders the informal economy as poverty — the
 * misfortunes on this board are hail, traffic and paperwork, and the stall is
 * a business somebody is proud of.
 *
 * Plain form (常体), present tense, short sentences.
 */
export const BOLIVIA_JA: EditionTranslation = {
  locale: 'ja',
  editionId: 'bolivia',

  spaces: {
    'bo-start': {
      title: '人生のスタート',
      description: '晴れて冷えたある朝、高地の街のふちから旅が始まる。眼下には明かりの谷が広がり、山がこちらを見ている。',
    },
    'bo-uni-move-in': {
      title: '街の一室',
      description: '初めて借りた部屋には、ベッドひとつ、電熱コンロひとつ、代表チームのポスター一枚、そして持っている限りの野心が収まっている。',
      harsher: {
        description: 'ベッドと電熱コンロがひとつずつ。そして大家は二か月分の前払いと、すでに顔見知りの誰かからの紹介状を求めてくる。',
        reason: '二か月分の前払い',
      },
    },
    'bo-uni-entrance': {
      title: '大学入試',
      description: '月曜の朝、三千人の志願者、机で埋まった体育館ひとつ。合格する。そのあとに来るのは五年ぶんの学費、コピー代、教材費、街の家賃。図書館を案内される前に、まずそれを払う。',
      reason: '学位までの五年間',
    },
    'bo-uni-lab-keys': {
      title: '実習室の鍵',
      description: '一年生の課題を採点し、実習室の鍵を預かり、他の誰にも起動できないプロジェクターを動かす。しかも学部はちゃんと報酬を出してくれる。',
      reason: '学部の助手の報酬',
    },
    'bo-uni-lost-carnet': {
      title: '身分証の紛失',
      description: 'ミニバスのどこかで身分証が消える。再発行には役所が二つ、行列が四つ、公証人が一人、そしてどの窓口にも手数料がある。',
      reason: '書類の再発行費用',
    },
    'bo-uni-scholarship': {
      title: '成績優秀者の奨学金',
      description: '成績が学部で一番の奨学金を引き寄せる。残りの年数のかなりの部分が、これでまかなえる。',
      reason: '成績優秀者奨学金',
    },
    'bo-uni-finals': {
      title: '期末試験週間',
      description: '四日で五科目。三世代ぶんのコピーされたノートが、ベッド一面に広げてある。',
      harsher: {
        description: '四日で五科目。いちばん採点の厳しい教授の一科目のために、慌てて短期講座を申し込む。',
        reason: '駆け込みの短期講座',
      },
    },
    'bo-uni-defence': {
      title: '卒論の口頭審査',
      description: '教授三人、プロジェクター一台、そして後方の席には結婚式並みの正装で親族一同。合格。判定が読み上げ終わる前に花束が届く。',
    },
    'bo-uni-farewell': {
      title: '空になった部屋',
      description: '四年ぶんを段ボール二箱に詰め、その半分の期間ごはんを食べさせてくれた大家さんに鍵を返す。',
    },
    'bo-grad-fair': {
      title: '有資格者の就職フェア',
      description: '学位記は額に入り、称号は一生、名前の前につく。二つの会社がそれを自社の便箋に載せたがっている。',
    },
    'bo-market-monday': {
      title: '市場の月曜日',
      description: '叔母が露店を持っていて、その隣の店が人手を欲しがっている。金曜には市場じゅうの相場が頭に入り、しかも給料が出ている。大学組が稼ぎ出す何年も前の話だ。',
    },
    'bo-work-first-pay': {
      title: '最初の週の売り上げ',
      description: '初めての自分のお金が、小さく折りたたまれて手の中に来る。習わしどおり家族の日曜の昼食をおごると、二人は誇らしさを隠さずに払わせてくれる。',
      reason: '最初の週の取り分',
      footnote: '売り場に立った一週間分で、ひと月分ではない。まるひと月分の稼ぎが入るのは次の「給料日」のマス。',
    },
    'bo-work-payday-1': {
      title: '給料日',
      description: 'ひと月ぶんの稼ぎがポケットに入る。同級生はまだ履修登録の列に並んでいる。',
      harsher: {
        title: '支払いは月末',
        description: '初月ぶんが翌々月の末に払われるとは誰も教えてくれなかったし、電熱コンロは事情を汲んでくれない。',
        reason: '無収入のひと月',
      },
    },
    'bo-work-moving-out': {
      title: '独り立ち',
      description: '稼いでいる以上、自分の住まいを持つものとされる。敷金、前家賃、マットレス、そして自分で四階まで担ぎ上げる二口コンロ。',
      reason: '敷金と前家賃',
    },
    'bo-work-first-night': {
      title: '最初の夜',
      description: 'この階の配線を大家がまだ直していないので、ろうそくの明かりで荷ほどきをする。',
    },
    'bo-work-association': {
      title: '組合費',
      description: 'この通りは商業組合に入らないと商売ができない。入会金、印紙だらけの書類ばさみ、そして会計係が直接集めに来る月々の分担金。',
      reason: '組合への加入',
    },
    'bo-work-payday-2': {
      title: '給料日',
      description: 'ひと月働いてまた札束が折りたたまれる。いまだに誰も卒業証書を見せろとは言わない。',
      harsher: {
        title: '道路封鎖の週',
        description: '道路封鎖で峠が八日間ふさがる。何も届かず、何も売れず、みんな自分の店先に立って延々とその話をしている。',
        reason: '道路が閉じていた一週間',
      },
    },
    'bo-work-payday-3': {
      title: '給料日',
      description: '働き始めて三か月。折りたたんだ札束にもう驚かなくなった。',
    },
    'bo-main-probation': {
      title: '試用期間の面談',
      description: '入って三か月、店主が午前中ずっと一言も言わずに仕事ぶりを見ている。そして何か言う。',
      reason: '試用期間の終わり',
    },
    'bo-main-bank': {
      title: '銀行に立ち寄る',
      description: '行列は街区を二周し、信じられないほど進まない。そして窓口の担当者は、お金の具合はどうですかと温かく聞いてくる。',
    },
    'bo-main-insurance': {
      title: '保険代理店',
      description: '担当者が広げるラミネート加工の地図には、この地区の雹害、地滑り、落雷の印がついている。網羅的で、更新も新しく、そして静かに恐ろしい。',
    },
    'bo-main-payday-1': {
      title: '給料日',
      description: '今月ぶんのお金が届く。珍しく、何も差し引かれずに。今週いちばんの瞬間だ。',
    },
    'bo-main-stock-tip': {
      title: '株の耳より情報',
      description: 'いとこが、夜行バスで読んだという銘柄を熱心に勧めてくる。証券会社は六時まで開いている。',
    },
    'bo-main-intersection': {
      title: '交差点',
      description: '信号のない角で、ミニバスとこちらの右側面が短く騒々しい交渉を行う。修理工場の見積書は、警察よりずっと早く届く。',
      reason: '板金修理代',
    },
    'bo-main-motorway-pileup': {
      title: '有料道路の霧',
      description: '霧が高地の街のふちを越えてきて、ブレーキランプが咲き、有料道路で四台がひしゃげる。全員無事に歩いて帰れたが、請求書は帰らない。',
      reason: '多重事故の修理代',
    },
    'bo-main-dentist': {
      title: '歯医者の請求',
      description: '詰め物ひとつ、叔母が投資だと言い張る金の被せものひとつ、そしてドリルよりよほど沁みる請求書ひとつ。',
      reason: '歯の治療費',
    },
    'bo-main-alasita': {
      title: 'ミニチュアの市',
      description: '一月の市では、夢をミニチュアで買う。小さな家、小さな学位記、小さな札束。そして正午きっかりに祝福してもらう。誰もが効くと言い、誰も説明しない。',
    },
    'bo-crossroads': {
      title: '働き始めて五年',
      description: '着実に働いて五年。日曜の昼食の席で声が二つ。母は給与明細と年金を手放すなと言い、いとこは人に雇われて金持ちになった者はいないと言う。道はここで分かれる。',
    },
    'bo-payroll-seniority': {
      title: '年功名簿',
      description: 'この事務所はここ十年、誰も辞めていない。上の席は誰かが定年を迎えて初めて空く。',
      reason: '上の席が空いた',
    },
    'bo-own-lookout': {
      title: '口づてに広がる',
      description: '訪問のたびに最後にひとこと言い添えるようにすると、社員証を返す前から折り返しの電話が来はじめる。',
    },
    'bo-own-account': {
      title: '独立する',
      description: '次の当てをすでに決めてから社員証を返す。母は青ざめ、いとこは最初の一杯をおごる。新しい仕事には、新しい金額がついてくる。',
      reason: '自分の看板で独立した',
    },
    'bo-own-first-contract': {
      title: '最初の大口契約',
      description: '独立して最初の客が、納品と引き換えに全額を現金で払う。上の誰にも取り分を抜かれない、まるまるひと月分の稼ぎだ。',
    },
    'bo-main-review': {
      title: '評価の面談',
      description: '奥の小さな部屋、その年の帳簿を挟んで座る二人、そして質問はひとつ。今より大きく回せるか。',
      reason: '評価の順番が回ってきた',
    },
    'bo-main-tax-audit': {
      title: '税務調査',
      description: 'たいへん形式ばった手紙、領収書の詰まった靴箱と過ごす長い午後、そして最後に書かれた、明らかにもう決まっていた金額。',
      reason: '税務調査の追徴',
    },
    'bo-main-contract-ends': {
      title: '契約満了',
      description: '一月には更新されると誰もが言い切っていた契約が、ごく静かに、更新されない。送別のケーキは絶品だった。',
      reason: '契約が更新されなかった',
    },
    'bo-main-layoff': {
      title: '組織再編',
      description: 'フロア全員が、首都から来たコンサルタントのいる会議室に集められる。その後、社員証が反応しなくなる。',
      reason: '再編で職を失った',
    },
    'bo-main-notice-period': {
      title: '給料日',
      description: '月末の給与計算は、コンサルタントが名簿に残した全員に対して行われ、いつもと同じ封筒で渡される。',
    },
    'bo-main-career-fair': {
      title: '合同就職フェア',
      description: 'ブースだらけの会場、配られるボールペン、外ではまったく無関係の理由でブラスバンドが音出しをしている。そして自分の名前が入った内定が二つ。',
      reason: '就職フェアで仕切り直し',
    },
    'bo-main-godparent': {
      title: '何にでも名付け親',
      description: '今年は洗礼式と卒業式と上棟式の名付け親に指名される。そのたびに名誉であり、そのたびに全員への贈り物が要る。',
      reason: '名誉と、そのたびの贈り物',
    },
    'bo-wedding': {
      title: '結婚式',
      description: '木曜に役所、土曜に教会、そのあとは祝宴。参列者は全員が何かの後見人になっていて、ケーキから楽団まで、誰が何を出したかが拍手とともに読み上げられる。',
    },
    'bo-family-nursery': {
      title: '子ども部屋の準備',
      description: '子ども部屋を明るい黄色に塗り、真夜中にベビーベッドを組み立て、叔母全員から一斉に届く手編みの、ありえないほど小さい服の山を受け取る。',
      reason: '子ども部屋の準備',
    },
    'bo-family-new-baby': {
      title: '赤ちゃん誕生',
      description: '部屋を塗り、ベビーベッドを組み立てた。四人の祖母はもう編み始めている。妥当な賭けだと思っているらしい。',
    },
    'bo-family-childcare': {
      title: '保育料',
      description: '家じゅうの小さい人ぜんぶに保育の枠を確保する。月額の合計は二度読み返すことになる。',
      reason: '子ども一人あたりの保育料',
    },
    'bo-family-school-list': {
      title: '学用品リスト',
      description: '制服、白いスモック、体操着、そして四十一品目の指定リスト。月曜までに、そのすべてに子どもの名前を書くのではなく縫い付けること。',
      reason: '子ども一人あたりの学用品',
    },
    'bo-family-parade': {
      title: '独立記念のパレード',
      description: 'わが子が独立記念パレードで学校の旗手に選ばれる。姿が見えている九十秒を、まるごと撮影する。',
    },
    'bo-family-twins': {
      title: '双子',
      description: '検査技師が急に黙り、画面をこちらに向けて、指を二本立てる。四つの地区で四人の祖母が同時に編み針を握る。',
    },
    'bo-fast-payday-1': {
      title: '給料日',
      description: '残業代がやっと封筒に入る。',
    },
    'bo-fast-headhunted': {
      title: 'ヘッドハンティング',
      description: '同業他社が見本市でこちらのことを聞き回っていた。かかってきた電話には案件が二つ、期限がひとつ、そして今の給料はセンターボ単位まで把握されている。',
      reason: '引き抜きの話が来た',
    },
    'bo-fast-burnout': {
      title: '燃え尽きて休職',
      description: '診断書で六週間の休み。戻ってきたときには、封筒がずいぶん軽くなっている。',
      reason: '無給休職',
    },
    'bo-fast-payday-severance': {
      title: '年末の給与',
      description: '一年が終わりに近づく。何もかもがまた変わる前に、今の仕事の給料がもう一度だけ口座に届く。',
    },
    'bo-fast-reorg': {
      title: '組織再編',
      description: 'コンサルタントが一週間だけ飛んできて、週末のうちに組織図が引き直され、月曜には自分の名前が別の枠に、別の肩書きとともに入っている。誰にも聞かれなかった。誰ひとり聞かれていない。',
      reason: '組織再編で配置換え',
    },
    'bo-fast-brokerage': {
      title: '証券会社からの電話',
      description: 'ボーナスを使いたくてうずうずしている。証券の担当者は、感嘆符つきの留守電を残し続けている。',
    },
    'bo-fast-payday-2': {
      title: '給料日',
      description: 'また一か月が過ぎ、また封筒が入る。',
      harsher: {
        title: 'ボーナス返還',
        description: '別の都市にいる監査担当が去年のボーナスを査定し直す。しかも下方に査定し直す。',
        reason: 'ボーナスの返還',
      },
    },
    'bo-fast-retention': {
      title: '引き留めの条件',
      description: '昼食の席で、よそから声がかかっていると軽く漏らす。対抗条件はスープより先に出てくる。',
    },
    'bo-midtown-brokerage': {
      title: '証券会社',
      description: '画面だらけ、窓口には年金生活者の列、そして今回だけは違うと言い張る営業担当。',
    },
    'bo-midtown-insurance': {
      title: '保険代理店',
      description: '家の鍵を渡す前に、補償について少し話をさせてほしい人がいる。広げられた斜面のハザードマップは、網羅的で、更新も新しく、そして静かに恐ろしい。',
    },
    'bo-midtown-shared-purse': {
      title: '共同の財布',
      description: 'お金はもう一緒だ。給料、露店の売り上げ、そして公式には存在しないことになっている、たんすの裏に貼りつけたドルの封筒。ひと月の精算は首脳会談である。',
      reason: '共同の財布の精算',
    },
    'bo-midtown-window': {
      title: '割れた窓',
      description: 'サッカーボールと、隣家の窓と、それについて実に落ち着いている隣人。通りの誰もが知っているとおり、そのほうがずっと厄介だ。',
      reason: '壊したものの弁償、子ども一人につき',
    },
    'bo-midtown-aguinaldo': {
      title: '十二月は二回払う',
      description: '法定の十三か月目の給与が休暇と一緒に届く。約束の額ではなくそれぞれの稼ぎに応じた額で、国じゅうが同じ週末に買い物に出る。',
    },
    'bo-midtown-raise': {
      title: '昇給',
      description: 'エレベーター前での短い立ち話、新しい金額、そして寸分たがわぬ力加減の握手。',
    },
    'bo-midtown-dollar-jump': {
      title: 'ドルが跳ねる',
      description: 'ドルが事実であることをやめ、噂になる。街の実勢レートが公定レートを置き去りにし、木曜には輸入品がすべて値札を書き換える。',
      reason: '輸入品がすべて値上がりする',
    },
    'bo-buying-walls': {
      title: '壁を買う',
      description: '土曜を丸ごと使って、日干し煉瓦の中庭つきの家から鏡張りの豪邸まで見て回る。周りは全員が同時に助言してくる。ここでは、まず壁を買い、夢は一階ずつ育てていく。',
    },
    'bo-risky-container': {
      title: 'コンテナに賭ける',
      description: 'いとこが海沿いの自由港に知り合いがいると言う。貯金は共同コンテナひとつぶんに変わる。',
      reason: 'コンテナが入港する',
    },
    'bo-risky-bad-tip': {
      title: 'ハズレの銘柄',
      description: 'サイコロの夜に卓じゅうへ宣言した「確実」な株が、一週間で価値を半分失う。面目上、全員に夕食をおごることになる。',
      reason: 'ハズレ銘柄のお詫び',
    },
    'bo-risky-cacho': {
      title: 'サイコロの夜',
      description: '革のカップ、サイコロ五個、そして国民的な酒場の賭けごと。しかも肝心なその瞬間に、五つぞろいが出る。',
      reason: 'サイコロの夜の勝ち分',
    },
    'bo-risky-boom-ends': {
      title: '好況の終わり',
      description: '持ち株の大半が依存している資源が、一四半期のうちに三大陸で流行遅れになる。損失は速い。',
      reason: '好況の終わり',
    },
    'bo-risky-aftershock': {
      title: '二番底',
      description: '相場は誰も想定していなかった底をさらに掘り当てる。しかも一日の午後で。',
      reason: '相場のさらなる下落',
    },
    'bo-risky-lottery': {
      title: 'クリスマスくじ',
      description: '誰もが縁起がいいと言う売店に並ぶ。縁起のいい売店は縁起がいいことで有名だからだ。',
      reason: 'クリスマスの抽選',
    },
    'bo-risky-payday': {
      title: '給料日',
      description: '投資のほうが荒れている最中に、今月ぶんのお金が届く。',
    },
    'bo-risky-swap': {
      title: '首位と交換',
      description: '長い昼食での握手ひとつ、コーヒーの前の署名ひとつ。首位の相手と口座の残高をそっくり入れ替える。',
      reason: '首位との取引',
    },
    'bo-safe-market-timing': {
      title: '市場の勘定',
      description: 'どの午後に値が下がるか、どの店が端数を切ってくれるか、どの売り手に貸しがあるかを知っている。今週はその知識が、買い物かご全部の代金になる。',
      reason: '市場を知っていること',
    },
    'bo-safe-payday': {
      title: '給料日',
      description: '今月ぶんのお金が、いつもと同じ日に届く。この道はそれでいい。',
      harsher: {
        title: '給与の支払い遅延',
        description: 'どこかの表計算のセルひとつのせいで、今月の給料は来月に届くことになる。',
        reason: 'ひと月ぶんの給与保留',
      },
    },
    'bo-safe-excess': {
      title: '保険の自己負担',
      description: '慎重な道にも保険金の請求書はある。しかも契約の細かい字には免責という名の負担が隠れていて、それが少しも小さくない。',
      reason: '保険の免責額',
    },
    'bo-safe-notebook': {
      title: '家計のノート',
      description: '罫線入りのノートに一年ぶん、一項目ずつ律儀に家計をつけ通す。そしてノートのほうが静かに勝つ。',
      reason: '家計ノートの黒字',
    },
    'bo-safe-neighbour-repays': {
      title: '隣人が返しに来る',
      description: '苦しい年に貸して、一度も口に出さなかったお金が、布に包まれてケーキを載せて中庭を渡ってくる。',
      reason: '昔の親切が返ってくる',
    },
    'bo-safe-mattress-dollars': {
      title: '封筒が厚くなる',
      description: '劇的なことは何も起きない。たんすの裏に貼ったドルの封筒が静かに厚くなるだけだ。祖母がどこに貼るべきかを教えてくれた日から、ずっとそうしている。',
      reason: '地道な貯金',
    },
    'bo-safe-payday-2': {
      title: '給料日',
      description: 'またひと月、また静かに札束が折りたたまれる。着実さも立派な戦略だ。',
    },
    'bo-safe-dividend': {
      title: '配当の日',
      description: '手堅いほうの持ち株が、手堅い額をきちんと出してくる。ビール会社の株主優待の一箱つきで。',
      reason: '四半期配当',
    },
    'bo-sunset-number': {
      title: '封筒の裏の計算',
      description: 'ある晩、全部を机に並べてみる。年金の通知、商売を売ったらいくらになるか、ドルの封筒。いちばん下に出た数字は、恐れていたより小さい。そしてその数字は、放っておいても引き出されない。',
    },
    'bo-sunset-one-more-floor': {
      title: 'もう一階',
      description: '前の階を建てた職人から、次の階の話で電話が来る。柱は耐えられるし、眺めは見事になるし、しかも今なら手が空いている。',
    },
    'bo-sunset-storeroom-fire': {
      title: '倉庫',
      description: '十年ぶんの在庫、古いヒューズひとつ、そして棚から作り直しになる倉庫。',
      reason: '倉庫の火災被害',
    },
    'bo-sunset-parents': {
      title: '親の介護',
      description: 'かつて市場の階段を四階まで自分を背負って上がってくれた人を、今度は背負う番になる。費用を数えるつもりはない。請求書のほうが勝手に数える。',
      reason: '家族の介護費',
    },
    'bo-sunset-payday-1': {
      title: '給料日',
      description: '数えるほどしか残っていない封筒の、そのひとつが届く。',
    },
    'bo-sunset-swap': {
      title: '首位と交換',
      description: 'とても長い昼食での最後の大胆な取引。首位の相手の財産が、相手ではなくこちらのポケットに収まる。',
      reason: '土壇場の交換',
    },
    'bo-sunset-children-send': {
      title: '子どもたちが支える',
      description: '大きくなった子どもたちが日曜の昼食に、家に必要な何かを持って集まる。海外で働いている娘は自分の分を送金し、送金より長い音声メッセージを添えてくる。',
      reason: '子ども一人ひとりから',
    },
    'bo-sunset-sticky': {
      title: 'つい手が伸びる',
      description: 'いいコーヒーを出しながら、首位の相手にいちばんいい思い出話を譲るよう説得しはじめる。',
      reason: '思い出がひとつ移る',
    },
    'bo-sunset-last-title': {
      title: '最後の肩書き',
      description: '引退の前に、組合が名誉会長にしたいと言っている。投票が通れば、の話だが。',
      reason: '人生最後の選挙',
    },
    'bo-sunset-payday-2': {
      title: '給料日',
      description: '給料日を数えるのはとうにやめたが、暦のほうはやめていない。',
    },
    'bo-sunset-final-tax': {
      title: '最後の納税',
      description: 'シャッターが永遠に下りる前に、税務当局からの形式ばった封筒がもう一通だけ届く。',
      reason: '最後の税金',
    },
    'bo-sunset-ahead': {
      title: '夕暮れが見える',
      description: '屋上から見ると、山が夕日でバラ色と金色に染まる。忙しくて見ていなかっただけで、毎晩そうだった。',
    },
    'bo-retirement': {
      title: '引退の日',
      description: '事務所の、あるいは店の、あるいは両方の鍵を渡し、自分を慕う人たちに紙吹雪を浴びせられ、そして四十年で初めて、行く先のない月曜日に目が覚める。',
    },
  },

  lanes: {
    'University Lane': {
      name: '大学コース',
      summary: '五年、入学試験ひとつ、そして親族全員が晴れ着で見守る口頭審査。代価はその五年そのもので、一銭も稼がないうちに支払う。買えるのは、一生名前の前につく称号だ。堅実ではあるが、大きくはならない。',
    },
    'Straight to Work': {
      name: '市場コース',
      summary: '市場は月曜に迎え入れ、金曜に払ってくれる。大学組が稼ぎ出す何年も前の話だ。安全網はなく、職人仕事は実質三段階の商売で、下は重労働、てっぺんはこの卓のどの大卒より稼ぐ。',
    },
    'Payroll Road': {
      name: '雇用コース',
      summary: '名簿に残る。年金が積み上がり、十二月は法律により二回払われ、昇給は年功で遅くとも確実に来る。ついでに、住む街も会社が決める。',
    },
    'Own-Account Alley': {
      name: '独立コース',
      summary: 'この国の大半がそうしてきたように、自分の看板で出る。年金と引き換えに、自分の仕事の代金を丸ごと受け取る。最初の引きが悪かったなら痛快、良かったなら本物の賭けだ。',
    },
    'Family Lane': {
      name: '家族コース',
      summary: '学用品リスト、チャランゴの練習、そして騒がしい家。最後には大きくなった子どもたちがそれぞれ何かを返してくれる。給料日はぐっと減り、請求書は人数ぶん増える。',
    },
    'Career Track': {
      name: '出世コース',
      summary: '昇給も賞与も、役員の席も、山の見える角部屋も本物だ。そのために手放したものは、もう一方の道に全部書いてある。',
    },
    'The Dollar Road': {
      name: 'ドルコース',
      summary: 'コンテナ、信用取引、ため込んだドル、そして計画のあるいとこ。家の時点で後ろにいるなら来るべきだし、前にいるならよく考えたほうがいい。',
    },
    'Steady Street': {
      name: '堅実コース',
      summary: 'ノート、頼母子講、定期預金、そしてたんすの裏に貼った封筒。ここで大金持ちになった者も、破滅した者もいない。すでに勝っているなら、それは相当な値打ちだ。',
    },
  },

  careers: {
    'career-bo-market-runner': {
      title: '市場の運び手',
      description: '夜明け前から木箱を運び、市場じゅうの相場を暗記し、七時には三軒ぶんの店番を任されている。',
    },
    'career-bo-stall-holder': {
      title: '露店の店主',
      description: '自分の店を持ち、買うたびに少しおまけをもらえる常連がつき、どのレジより正確な帳簿を頭の中に持っている。',
    },
    'career-bo-market-matriarch': {
      title: '市場の顔役',
      description: '市場の一列を丸ごと仕切り、その半分の金の面倒も見て、ほかのどこにも持ち込まれない揉め事を裁く。',
    },
    'career-bo-saltena-junior': {
      title: 'サルテーニャ工房の見習い',
      description: '四時に入り、昼には売り切れる。生地のひだを閉じるのに二年。店の要であるスープの配合には、まだ近づけない。',
    },
    'career-bo-saltena-baker': {
      title: 'サルテーニャ職人',
      description: 'スープを丸ごと一口ぶん包んで漏らさない生地を閉じられる。そして必ず立ったまま、前かがみで食べる。シャツを一枚だめにすれば、誰でもそうなる。',
    },
    'career-bo-saltena-house-owner': {
      title: 'サルテーニャ店の主',
      description: '地区じゅうの午前中の行列を独占し、一時には売るものがなくなって閉める。売るものは、いつだって残らない。',
    },
    'career-bo-grill-hand': {
      title: '炭焼きの担い手',
      description: '角の夜の炭火を任され、遊び帰りの客足を天気図のように読み、串を一本も落とさない。',
    },
    'career-bo-anticucho-cart': {
      title: '串焼き屋台の店主',
      description: '夕暮れに同じ角へ炭火の屋台を押していき、牛ハツの串とピーナッツソースを毎晩のちょっとした祭りに変える。行列そのものがサイコロだ。',
    },
    'career-bo-lunch-house-owner': {
      title: '定食屋の主',
      description: '日替わりの定食を一種類、スープから順に出す。十二時半には席が二回転している。オフィスビルが毎日この食堂に流れ込んでくる。',
    },
    'career-bo-hod-carrier': {
      title: '資材運び',
      description: '訪れたサッカー代表が音を上げる標高で、一日じゅう煉瓦とモルタルをはしごで運び上げる。そのことを口にはしない。',
    },
    'career-bo-bricklayer': {
      title: '煉瓦積み職人',
      description: 'この街の半分を作っている赤煉瓦を、目分量だけでまっすぐ水平に積む。屋根の鉄筋は立てたままにする。この街の家はみな、あと一階伸びるつもりでいる。',
    },
    'career-bo-master-builder': {
      title: '棟梁',
      description: '紙ナプキン一枚で建物一棟の値段を出し、お金が入るたびに一階ずつ建てていく。そのナプキンが外れたことは一度もない。',
    },
    'career-bo-fare-caller': {
      title: 'ミニバスの呼び込み',
      description: 'スライドドアから身を乗り出し、路線名を一息で歌い上げ、握った小銭で釣りを出し、声だけでバスを満席にする。',
    },
    'career-bo-minibus-driver': {
      title: 'ミニバスの運転手',
      description: 'ロバのために作られた道を、十四人乗りに十九人を乗せて毎日、時間どおりに通す。ダッシュボードは聖人の像でいっぱいだ。',
    },
    'career-bo-route-owner': {
      title: '路線のオーナー',
      description: '街でいちばん混む路線にミニバスを四台持ち、運輸組合の理事席にも座っている。組合は市役所より多くのことを決める。',
    },
    'career-bo-apprentice-mechanic': {
      title: '整備見習い',
      description: '三年間、親方が言う前に正しいスパナを渡し続けた。そしてミニバスのほうが自分に打ち明けている気がしてきた。',
    },
    'career-bo-minibus-mechanic': {
      title: 'ミニバス整備士',
      description: '設計者が想像もしなかった標高で三十年物のバンを生かし続ける。部品は三大陸から、引き出しは一段だけ。',
    },
    'career-bo-workshop-owner': {
      title: '整備工場オーナー',
      description: 'リフト四基、運輸組合じゅうが一目置く順番待ち、そしてロープで引かれて運び込まれてきた車の写真が並ぶ壁。',
    },
    'career-bo-band-trumpeter': {
      title: 'ブラスバンドのトランペット',
      description: '結婚式、聖人の祝日、卒業式を、全開の音量と全開の標高で吹く。仕事の合間は電話を待つ。祭りの季節がサイコロだ。',
    },
    'career-bo-touring-band': {
      title: 'ツアーの奏者',
      description: '九つの県、へこんだ機材ケースひとつ、そしてフェスのポスターにやっと載った名前。小さい活字だが、載っている。',
    },
    'career-bo-bandleader': {
      title: '楽団長',
      description: '音が本人より一街区先に届く六十人の楽団を率い、カーニバルの予約は二年先まで埋まっている。',
    },
    'career-bo-radio-runner': {
      title: 'ラジオの雑用係',
      description: 'コーヒーを買いに走り、リクエストの合図を出し、リスナーのメッセージを仕分けながら、誰も隠そうと思う前に局の回し方を静かに覚えてしまう。',
    },
    'career-bo-morning-host': {
      title: '朝番組のパーソナリティ',
      description: '五時に、相場と聖人の祝日とリクエストで街の半分を起こす。声はどこでも知られていて、顔はどこでも知られていない。',
    },
    'career-bo-station-owner': {
      title: '放送局オーナー',
      description: '街じゅうのミニバスが合わせている周波数を所有し、朝の広告枠を分単位で、現金で、行列に向かって売る。',
    },
    'career-bo-second-shooter': {
      title: 'セカンドカメラマン',
      description: '会場のうしろ側と、祭りの後見人が泣くのをやめて隠さなくなる瞬間を押さえる。',
    },
    'career-bo-fiesta-photographer': {
      title: '祭りのカメラマン',
      description: '八月は二年先まで満杯で、四旬節にはまったく仕事がない。祭りの暦がサイコロで、後見人たちが一年を決める。',
    },
    'career-bo-import-stall-trader': {
      title: '輸入品の露店商',
      description: '幅二メートルの店で電化製品を売る。何がいくらで輸入されたかをセンターボ単位で把握していて、その知識だけで大型店より安く出す。',
    },
    'career-bo-container-importer': {
      title: 'コンテナ輸入業者',
      description: '夜行バスで海沿いの自由港へ行き、勘だけでコンテナひとつを埋め、その勘が当たったかどうかは市場で知る。',
    },
    'career-bo-galleria-owner': {
      title: '商業ビルのオーナー',
      description: '露店が家賃を払っている三階建ての商業ビルを持っている。いい年を一度ずつ積み上げて建てた。輸入の当たり年が一度あれば、静かな三年を支えられる。',
    },
    'career-bo-depot-hand': {
      title: 'ビール倉庫の作業員',
      description: '一日じゅう国民的ラガーの木箱を天井まで積み上げ、注文の大きさだけで祭りの規模を言い当てられる。',
    },
    'career-bo-depot-foreman': {
      title: '倉庫の職長',
      description: 'スタジアムほどの倉庫を、バインダーと叫ばれるあだ名だけで回している。木箱を一つも失くしたことがない。',
    },
    'career-bo-kennel-assistant': {
      title: 'ペットサロンの助手',
      description: 'タオルとおやつ、そしてとても暖かい編みセーターを着たとても小さな犬に品定めされる間じっとしていられる度胸。',
    },
    'career-bo-pet-groomer': {
      title: 'トリマー',
      description: '街の南側の緑豊かな地区で、甘やかされた小型犬たちを手入れする。どの犬も、たいていの人間より多くのニットを持っている。',
    },
    'career-bo-football-coach': {
      title: 'サッカークラブのコーチ',
      description: '標高四千メートルのグラウンドで土曜の練習を仕切る。訪問チームは息を切らし、うちの子たちは平気だ。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-bo-quinoa-farmer': {
      title: 'キヌア農家',
      description: '自分の畑を植えてもらう週に、隣人の畑も植える。労働を労働で返す、山でいちばん古い銀行だ。輸出業者は三度断った。断るたびに丁寧になった。',
    },
    'career-bo-surgical-resident': {
      title: '外科研修医',
      description: '大学病院で六年ぶんの当直、鉤を持ち続けた手、そして空気そのものが薄い場所で手術が何を意味するかを学ぶ日々。',
    },
    'career-bo-hospital-surgeon': {
      title: '外科医',
      description: '医学の教科書がほとんど触れない標高で、ぶれない手で執刀する。ここで体がどう働くかを研究するために、世界中から医師が飛んでくる。',
    },
    'career-bo-junior-associate': {
      title: 'アソシエイト弁護士',
      description: '旧市街の広場を見下ろす事務所で、土地争いの九百ページを読む。パートナーが決め手の一段落だけを読めるように。',
    },
    'career-bo-corporate-lawyer': {
      title: '企業弁護士',
      description: '低地の好景気の街で大豆地帯の取引をまとめる。金は新しく、スーツは仕立てがよく、契約書は長い。',
    },
    'career-bo-architectural-assistant': {
      title: '建築設計助手',
      description: '欲しいものがはっきりしている施主のために、大広間の階段を十一回描き、最初の十回より十一回目から多くを学ぶ。',
    },
    'career-bo-new-andean-architect': {
      title: 'ネオ・アンデス様式の建築家',
      description: '旧来の学派が不可能だと言い、いまや高地の街全体がごく普通だと思っている緑と金のファサードを設計する。自作はロープウェイから見える。それこそが狙いだ。',
    },
    'career-bo-junior-developer': {
      title: '新人開発者',
      description: '誰もやりたがらない小さなバグを直し、あまりに丁寧に記録したせいで、その記録が新人研修の教材になる。',
    },
    'career-bo-software-engineer': {
      title: 'ソフトウェアエンジニア',
      description: '山の見える机から、三つの時差の向こうにいる客のためにコードを書く。会議は、客が何時だと思っていようとその時刻に出る。',
    },
    'career-bo-field-agronomist': {
      title: '現場の農学者',
      description: 'ノートと土壌検査キットを手に、地平線まで続く大豆の畝を歩く。畑のにおいだけで収量を誤差二パーセント以内に言い当てる。',
    },
    'career-bo-seed-agronomist': {
      title: '種苗会社の農学者',
      description: '来季、低地の半分が植えることになる品種を育てる。そして三つの州の農家の門先で、その品種について自分の口で答える。',
    },
    'career-bo-junior-geologist': {
      title: '新人地質技師',
      description: '広大で白く、地平線が消えてしまう塩湖でボーリングコアを記録する。本人は半球一の職場だと思っている。',
    },
    'career-bo-lithium-geologist': {
      title: 'リチウム工場の地質技師',
      description: '世界最大の塩湖の下のかん水を読む。そこでは、これから作られる電池のかなりの部分が、いまはただの静かな池である。',
    },
    'career-bo-microcredit-analyst': {
      title: 'マイクロクレジットの審査担当',
      description: '市場の列を歩き、帳簿に一度も書かれたことのない在庫を担保に融資条件を決める。担保モデルより当たる。',
    },
    'career-bo-microfinance-manager': {
      title: 'マイクロファイナンス支店長',
      description: '大銀行が最後まで見ようとしなかった露店に金を貸す支店を任されている。借り手の商売を、その家族より詳しく知っている。',
    },
    'career-bo-junior-civil-engineer': {
      title: '新人土木技師',
      description: '山岳道路の排水路の図面を確認し、この山では岩のほうが図面より正しいことが多いと知る。',
    },
    'career-bo-highway-engineer': {
      title: '道路技師',
      description: '午後のうちに垂直に二キロ下る道路を造る。ガイドブックが世界一危険と呼んだあの道を引退させたのも、この人だ。',
    },
    'career-bo-research-assistant': {
      title: '研究助手',
      description: '他人の論文のために、とても冷たくとても高いところの水で数を数える。その一分一分が楽しくて仕方ない。',
    },
    'career-bo-lake-biologist': {
      title: 'チチカカ湖の生物学者',
      description: '世界一高い大湖と、そこにすむ巨大なカエルを研究している。皮膚呼吸をするそのカエルは、まったく急いでいない。',
    },
    'career-bo-stringer-journalist': {
      title: '通信員',
      description: '記事のあるところから記事単位で送稿する。ひと月の収入は、その月にニュースが何をしたかで決まる。鳴りやまない週もあれば、一度も鳴らない週もある。',
    },
    'career-bo-foreign-correspondent': {
      title: '特派員',
      description: '三つの外国の編集部にアンデスを同時に説明する。どこも原稿ごとの支払いで、締切はどれも別。安定しているのは署名だけで、収入はサイコロだ。',
    },
    'career-bo-veterinarian': {
      title: '獣医',
      description: '午前はリャマの脚、午後は小型犬の脚を処置する。いくら積まれても、この診療所をチェーンとは取り替えない。',
    },
    'career-bo-university-professor': {
      title: '大学教授',
      description: '火曜に講義し、金曜には泣いている親族一同の前で口頭審査に立ち会う。学部長の椅子は二度断った。',
    },
  },

  houses: {
    'house-bo-adobe-village-house': {
      name: '村の日干し煉瓦の家',
      description: '日中の暖かさを一晩じゅう抱えていられる分厚い土壁、中庭、そして一度も同じ表情を見せない山の眺め。',
    },
    'house-bo-red-brick-starter': {
      name: '赤煉瓦の街の家',
      description: '仕上がっているのは一階だけ、屋根には鉄筋が希望を持って立っている。未完成なのではなく、野心的なのだ。この街の家はみな、伸びるつもりでいる。',
    },
    'house-bo-suburban-row-house': {
      name: '郊外の連棟住宅',
      description: '街のいちばん新しい環状道路沿いの二階建て。門まで隣と同じ造りだが、通りができるより前から立っているマンゴーの木がある。',
    },
    'house-bo-colonial-courtyard': {
      name: '植民地時代の中庭つき住戸',
      description: '共和国より古い白壁の建物の半分。共有の中庭を囲む造りで、バルコニーは景観保護の役所が今も規制しようとし続けている。',
    },
    'house-bo-shopfront-house': {
      name: '店舗つきの家',
      description: '住むのは二階、一階は自分で自分の代金を払ってくれる店。通勤は階段一本で、建物も一緒に働きに出る。',
    },
    'house-bo-lakeside-villa': {
      name: '湖畔の家',
      description: '目覚めれば窓の外は世界一高い大湖。夜明けには葦の舟が浮かび、空気が澄みすぎていて対岸に手が届きそうに見える。',
    },
    'house-bo-garden-estate': {
      name: '谷の庭つき屋敷',
      description: '常春の谷にある。塀に囲まれた庭は一年じゅう実をつけ、長いベランダがあり、食卓は語るたびに大きくなる話のために作られている。',
    },
    'house-bo-canyon-ridge-house': {
      name: '峡谷の尾根の家',
      description: '街の南の深い峡谷、三面ガラス、眼下には月の色をした岩の尖塔。私道が長すぎて、客は全員その上り坂を冗談にする。',
    },
    'house-bo-cholet-crown': {
      name: '「チョレー」の冠',
      description: '緑と金の鏡張り、六階建て。下は貸し店舗、上はシャンデリアのある毎週末予約の入った大広間、そして屋上には冠のように自分の家が乗っている。',
    },
  },

  stocks: {
    'stock-bo-brewery': {
      name: 'ハイランド醸造',
      description: 'この国のどの祭りでも、どの標高でも、どの卒業式でも注がれるラガー。売り文句はそれだけで、一度も外したことがない。',
    },
    'stock-bo-cement': {
      name: 'コンドル・セメント',
      description: 'お金が入るたびに一階ずつ家を建てていく国では、セメントを買うのをやめる日が来ない。退屈で、美しく、百万袋単位で出ていく。',
    },
    'stock-bo-costume-works': {
      name: 'フェスティバル衣装工房',
      description: '大カーニバルの行列をスパンコールと金糸で仕立てる。記録的な一年で栄光、雨で流れた一季で倉庫は満杯。',
    },
    'stock-bo-quinoa-export': {
      name: 'ロイヤルキヌア輸出組合',
      description: '高原から世界の朝食の器を満たす。雨と、三大陸の食のはやりが行儀よくしていれば、の話だが。',
    },
    'stock-bo-lithium': {
      name: 'サラール・リチウム',
      description: 'これから作られる電池の半分は、いま塩湖の下にかん水として眠っている。今世紀最大の成功物語になるか、世界一景色のいい蒸発池になるか。',
    },
  },

  lifeTiles: {
    'tile-bo-marathon-3600': { title: '標高3600メートルでフルマラソン' },
    'tile-bo-altiplano-novel': { title: '高原を描いた小説を出した' },
    'tile-bo-plaza-dog': { title: '広場の野良犬を引き取った' },
    'tile-bo-sandboard-dunes': { title: '砂丘でサンドボードを覚えた' },
    'tile-bo-potato-plot': { title: '自作のジャガイモを凍結乾燥した' },
    'tile-bo-saltena-contest': { title: 'サルテーニャ大会で優勝' },
    'tile-bo-choro-trail': { title: 'インカ道をジャングルまで歩いた' },
    'tile-bo-charango-album': { title: 'チャランゴのアルバムを録音した' },
    'tile-bo-cable-car-day': { title: '一日でロープウェイ全線を制覇' },
    'tile-bo-street-food-fame': { title: '屋台が朝のニュースに出た' },
    'tile-bo-titicaca-triathlon': { title: 'チチカカ湖のトライアスロン完走' },
    'tile-bo-animal-refuge': { title: '動物保護施設でボランティア' },
    'tile-bo-api-stand': { title: '冬じゅう夜明けの温かい飲み物の屋台を出した' },
    'tile-bo-el-alto-mural': { title: '高地の街に壁画を描いた' },
    'tile-bo-salar-flight': { title: '塩湖の上を小型機で飛んだ' },
    'tile-bo-minibus-radio': { title: 'ミニバスが全部かける番組を始めた' },
    'tile-bo-solar-heater': { title: '屋上の太陽熱温水器で特許' },
    'tile-bo-cacho-league': { title: '町内のサイコロ大会で優勝' },
    'tile-bo-market-kitten': { title: '市場の屋根から子猫を助けた' },
    'tile-bo-huayna-potosi': { title: '隣の6000メートル峰に登頂' },
    'tile-bo-artisan-ceramics': { title: '陶器が工芸市で完売した' },
    'tile-bo-barrio-team': { title: '地区のサッカーチームを指導した' },
    'tile-bo-cumbia-hit': { title: '国じゅうが口ずさむクンビアを書いた' },
    'tile-bo-record-potato': { title: '記録的な大きさのジャガイモを育てた' },
    'tile-bo-friends-startup': { title: '低地の友人の起業に出資した' },
    'tile-bo-vintage-jeep': { title: '塩湖用に旧型ジープをレストア' },
    'tile-bo-carnaval-dancer': { title: '大カーニバルの行列で踊った' },
    'tile-bo-chairo-cookoff': { title: 'スープ大会で三年連続優勝' },
    'tile-bo-titicaca-sail': { title: 'チチカカ湖を端から端まで帆走' },
    'tile-bo-plaza-garden': { title: '広場の庭を植え直した' },
    'tile-bo-puppy-litter': { title: '子犬六匹を一度に預かった' },
    'tile-bo-bunuelo-morning': { title: '町内会の全員に揚げ菓子を作った' },
    'tile-bo-weaving-class': { title: '満席の織物教室を教えた' },
    'tile-bo-cordillera-hike': { title: '白い山脈を丸ごと歩き通した' },
    'tile-bo-town-cinema': { title: '地区の映画館を再開させた' },
    'tile-bo-yungas-orchid': { title: '雲霧林の新種のランに名前をつけた' },
  },

  economy: {
    tuitionNotes: [
      '入試予備校は二度目でようやく効き、余分な一年ぶんの教材費と生活費が上に乗る。',
      '予備校、コピー代、教材費、そして口頭審査まで、見積もっていたとおりの額で収まる。',
      '国立大学の給付が、見込んでいたより長く五年間を支えてくれる。',
      '全額免除。五年ぶんがまるごと免除され、それでも家族はお祝いの会を開く。',
    ],
    marriage: {
      rescued: '二度目でようやく「はい」。相手は輸入ピックアップの残りの分割払いと、それにきわめておおらかな態度を持って引っ越してきた。',
      outcomes: [
        '祝宴が二日目とブラスバンド二組目に突入し、後見人たちの気前のよさは花火のあたりで尽きる。',
        '役所での式、教会での祝福、そして長い昼食が一度。ケーキと楽団と会場は後見人が持ち、残りはご祝儀で足りた。',
        'ひとつ屋根の下に収入が二つ。しかも相手の露店は、静かにこちらの給料より稼いでいることが判明する。',
        '田舎から町ぐるみで降りてきて、後見人が互いに張り合い、しかも相手は学生時代から鉄の意志で頼母子講を回していたことが判明する。',
      ],
    },
  },
}
