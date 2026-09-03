import type { EditionTranslation } from '../../i18n/types'

/**
 * The Japan edition in Japanese — the one overlay in this project that is not
 * really a translation.
 *
 * Every tile on this board was written *about* Japan for an English reader, so
 * a literal rendering would come back with the explanations still attached:
 * "a non-refundable payment called gratitude money", "the traditional leather
 * backpack", "a government report calculates what a comfortable retirement
 * requires". A Japanese reader does not need any of that — they need 礼金,
 * ランドセル, 老後2000万円問題. So the rule here is to write the sentence the
 * English tile was *reaching for*, in the words the thing is actually called,
 * and let the explanation go. Where the joke was in the explaining, the joke is
 * rebuilt out of the recognition instead.
 *
 * Plain form (常体), present tense, short sentences — the same voice as the
 * other Japanese overlays, and the register a Japanese board game prints in.
 */
export const JAPAN_JA: EditionTranslation = {
  locale: 'ja',
  editionId: 'japan',

  spaces: {
    'jp-start': {
      title: '人生のスタート',
      description: '四月のある朝、財布は軽く、靴は新しく、そして一生分の時間割が壁に貼り出されている。',
    },
    'jp-uni-move-in': {
      title: '六畳一間',
      description: '初めての一人暮らしの広さは畳で数える。布団と炊飯器と、持っている限りの野心が収まる。',
      harsher: {
        description: '初めての一人暮らしの広さは畳で数える。そして大家は敷金に加えて、貸してやる礼として戻ってこない金を求めてくる。',
        reason: '敷金と礼金',
      },
    },
    'jp-uni-tuition': {
      title: '入学金と授業料',
      description: '二月のある朝が四年を決める。鉛筆六百本と、咳ばらいひとつだけの静かな試験会場。合格。図書館を案内される前に、まず納入期限が来る。',
      reason: '入学金と授業料',
    },
    'jp-uni-konbini-shifts': {
      title: 'コンビニの夜勤',
      description: 'レジ打ち、袋詰め、コーヒー、揚げ物、そして会釈を同時にこなせるようになった。給料もそれなりに積み上がる。',
      reason: 'コンビニのバイト代',
    },
    'jp-uni-phone-trap': {
      title: 'スマホの契約',
      description: '十九歳で結んだ料金プランの小さな字に解約金が埋まっていて、それが今月ついに追いついてくる。',
      reason: '解約手数料',
    },
    'jp-uni-grant': {
      title: '給付型の奨学金',
      description: '思いがけない財団の給付が決まる。本当に返さなくていいのか、要項を二度読み返した。学費のかなりの部分がこれで消える。',
      reason: '財団の給付金',
    },
    'jp-uni-suit-season': {
      title: '就活シーズン',
      description: '就活が始まる。黒いスーツ一着、白いシャツ一枚、認められた髪型ひとつ、そして四万通の同じエントリーシート。自分のは書体だけ少しいい。',
      harsher: {
        description: '就活が始まる。リクルートスーツ、地味な靴、口角を規定の角度で上げた証明写真。すべて別売りだと知る。',
        reason: '就活の一式',
      },
    },
    'jp-uni-graduation': {
      title: '卒業式',
      description: '四年と、卒論一本と、二度と開けない筒入りの卒業証書。これで正式に卒業生だ。',
    },
    'jp-uni-farewell': {
      title: '部屋の引き払い',
      description: '四年ぶんを段ボール二箱に詰め、管理人さんに鍵を返す。',
    },
    'jp-job-hunt': {
      title: '就職活動',
      description: '四万人が同じ週に同じ黒いスーツを買い、同じ適性検査を受ける。開く扉は二つ。',
    },
    'jp-placement-day': {
      title: '学校推薦の就職',
      description: '学校と地元の会社に付き合いがあり、金曜には社員証と作業着と給料がある。大学組が一円でも稼ぐ二年前の話だ。',
    },
    'jp-work-first-envelope': {
      title: '初任給',
      description: '生まれて初めての給料はとんでもない大金に見える。習わしどおり親を食事に連れていくと、二人は誇らしさを隠さずに払わせてくれる。',
      reason: '初任給',
      footnote: 'ひと月まるごとではなく、その途中から働き始めた分。まるひと月分が入るのは次の「給料日」のマス。',
    },
    'jp-work-payday-1': {
      title: '給料日',
      description: 'まるひと月働いた。同級生がまだ講義室の席取りに並んでいるうちに、振り込みが届く。',
      harsher: {
        title: '給料は翌月払い',
        description: '初月の給料が一か月遅れで払われることは誰も教えてくれなかったし、炊飯器は事情を汲んでくれない。',
        reason: '無収入のひと月',
      },
    },
    'jp-work-moving-out': {
      title: '独り立ち',
      description: '稼いでいる以上、自分の住まいを持つものとされる。敷金、大家が存在してくれたことへの礼金一か月分、そして自分で組み立てるベッド。',
      reason: '敷金・礼金・前家賃',
    },
    'jp-work-first-night': {
      title: '最初の夜',
      description: '裸電球ひとつの明かりで荷ほどきをする。シーリングライトはこれから買う。',
    },
    'jp-work-uniform': {
      title: '作業着の保証金',
      description: '作業着二着、名札、安全靴、そして二度と戻ってこない気がする保証金。',
      reason: '作業着の保証金',
    },
    'jp-work-payday-2': {
      title: '給料日',
      description: 'ひと月働いてまた給料。いまだに誰も卒業証書を見せろとは言わない。',
      harsher: {
        title: 'シフト削減',
        description: '日曜に貼り出されたシフト表で、自分の名前が先週の半分しかない。',
        reason: '半月分のシフト',
      },
    },
    'jp-work-payday-3': {
      title: '給料日',
      description: '三回目の給料日。通帳の残高が習慣らしい顔をしはじめた。',
    },
    'jp-main-probation': {
      title: '試用期間の面談',
      description: '入社から半年、三枚複写の用紙を持った人が向かいに座り、調子はどうかと尋ねる。',
      reason: '試用期間の終わり',
    },
    'jp-main-bank': {
      title: '銀行の窓口',
      description: '行員がマニュアルどおりの角度で頭を下げ、お金の具合はいかがですかと穏やかに聞いてくる。',
    },
    'jp-main-insurance': {
      title: '保険の窓口',
      description: '担当者が広げるラミネート加工のハザードマップは、水害も火災も地震も網羅していて、更新も新しく、そして静かに恐ろしい。',
    },
    'jp-main-payday-1': {
      title: '給料日',
      description: '九時ちょうどに振り込まれる。当然のように。今週いちばんうれしい通知だ。',
    },
    'jp-main-stock-tip': {
      title: '株の耳より情報',
      description: '同僚が机の下で取引アプリを開き、この銘柄は堅いと言い切る。大引けは三時。',
    },
    'jp-main-fender-bender': {
      title: '交通事故',
      description: '雨の交差点で、止まらない車にぶつかられる。相手はきっちり四十五度で頭を下げるが、修理工場の見積書はそこまで丁寧ではない。',
      reason: '板金修理代',
    },
    'jp-main-pileup': {
      title: '高速道路の多重事故',
      description: '高速の霧、ブレーキランプ、そしてランプでひしゃげた四台。全員無事に歩いて帰れたが、請求書は帰らない。',
      reason: '多重事故の修理代',
    },
    'jp-main-dentist': {
      title: '歯医者の請求',
      description: '詰め物ひとつ、銀の被せものひとつ、フロスの説教ひとつ、そしてドリルよりよほど沁みる請求書。',
      reason: '歯の治療費',
    },
    'jp-main-blossom-duty': {
      title: '花見の場所取り',
      description: '桜は一週間だけ完璧に咲く。今年の場所取り当番は自分で、朝六時から他社の場所取り当番を横目に空のブルーシートを守る。それでも悪くない。',
    },
    'jp-crossroads': {
      title: '入社五年目',
      description: '同じ机で五年、年功どおりの昇給、そして転職エージェントのメッセージをなぜかまだ消していない。道はここで分かれる。',
    },
    'jp-loyal-seniority': {
      title: '年功序列',
      description: 'この部署はここ十年、誰も辞めていない。上のポストは誰かが定年を迎えて初めて空く。',
      reason: '上のポストが空いた',
    },
    'jp-hopper-lookout': {
      title: 'こっそり転職活動',
      description: '定時後のマンガ喫茶で職務経歴書を更新し、社内では絶対に聞かれない場所で電話を取り始める。',
    },
    'jp-hopper-move': {
      title: '条件を提示する',
      description: '次の内定にサインしてから退職届を出す。人事はその場で辞めると言われたような顔をする。新しい肩書きには、新しい金額がついてくる。',
      reason: 'よそで条件を通した',
    },
    'jp-hopper-bonus': {
      title: '支度金',
      description: '新しい会社が退職までの期間を買い取ってくれ、待たずに来たボーナスのような振り込みが届く。',
    },
    'jp-main-review': {
      title: '人事考課',
      description: '小さな会議室、こちらの資料を挟んで座る課長が二人、そして質問はひとつ。上の席を任せて大丈夫か。',
      reason: '考課の順番が回ってきた',
    },
    'jp-main-tax-audit': {
      title: '税務調査',
      description: 'たいへん丁寧な文面の通知、領収書の詰まった靴箱と過ごす長い午後、そして最後に書かれた、明らかにもう決まっていた金額。',
      reason: '税務調査の追徴',
    },
    'jp-main-contract-ends': {
      title: '契約満了',
      description: '四月には更新されると誰もが言い切っていた契約が、ごく静かに、更新されない。餞別の花束はきれいだった。',
      reason: '契約が更新されなかった',
    },
    'jp-main-restructuring': {
      title: 'リストラ',
      description: '会社が「希望退職」の募集を発表し、その希望者の名簿に自分の名前が載っている。',
      reason: '希望した、ことになっている',
    },
    'jp-main-midcareer-fair': {
      title: '中途採用フェア',
      description: '何ひとつ間違えなかった人たちのための会場。間違えたのは会社のほうだ。二社が経歴を気に入る。',
      reason: '中途採用フェアで仕切り直し',
    },
    'jp-main-seasonal-gifts': {
      title: 'お中元とお歳暮',
      description: '全員に夏と冬の贈り物。カタログの中からたいへん慎重に選ぶ。カタログはだいたいハムである。',
      reason: 'きれいに包まれたハムを全員に',
    },
    'jp-wedding': {
      title: '結婚式',
      description: 'ホテルの披露宴、お色直し二回、そして招待客全員が新札の入った厚いご祝儀袋を差し出す。出席には値段があり、表書きは達筆だ。',
    },
    'jp-family-nursery-setup': {
      title: '子ども部屋の準備',
      description: '子ども部屋を明るい黄色に塗り、真夜中にベビーベッドを組み立て、区役所で母子手帳をもらってくる。手帳のほうがベッドより重い。',
      reason: '子ども部屋の準備',
    },
    'jp-family-new-baby': {
      title: '赤ちゃん誕生',
      description: '部屋を塗り、ベビーベッドを組み立てた。区役所は冊子と保健師さんと一時金を用意して待っている。これからも待っている。',
    },
    'jp-family-waitlist': {
      title: '待機児童',
      description: '認可保育園には、子どもが座れるようになる前から申し込んでいた。順番は四十七番目。空くまでのあいだは認可外を、認可外の値段で使う。',
      reason: '子ども一人あたりの認可外保育料',
    },
    'jp-family-school-bag': {
      title: 'ランドセル',
      description: '一人につきランドセル、制服、体操着、そして火曜までに手書きで名前を入れる四十一点。ランドセルは最初のノートパソコンより高く、車より長持ちする。',
      reason: '子ども一人あたりの入学用品',
    },
    'jp-family-sports-day': {
      title: '運動会',
      description: 'わが子のクラスが大玉転がしで勝つ。撮影の大半は別の子を追っていたが、声援は本物だった。',
    },
    'jp-family-twins': {
      title: '双子',
      description: '検査技師が急に黙り、画面をこちらに向けて、指を二本立てる。',
    },
    'jp-fast-payday-1': {
      title: '給料日',
      description: '残業代がやっと給与明細に載る。',
    },
    'jp-fast-headhunted': {
      title: 'ヘッドハンティング',
      description: '月曜の会議中に私用の携帯が鳴る。エージェントは案件を二つ抱え、待つ気はまるでない。',
      reason: '引き抜きの話が来た',
    },
    'jp-fast-burnout': {
      title: '燃え尽きて休職',
      description: '診断書で六週間の休み。頭を下げて職場に戻るころには、給料がずいぶん軽くなっている。',
      reason: '無給休職',
    },
    'jp-fast-payday-severance': {
      title: '期末の給与',
      description: '年度が締まる。組織図が引き直される前に、今の仕事の給料がもう一度だけ口座に届く。',
    },
    'jp-fast-reorg': {
      title: '組織改編',
      description: '一夜で組織図が引き直され、自分の名前がまったく別の枠に入っている。誰にも聞かれなかった。組織改編とはそういうものだ。',
      reason: '組織改編で配置換え',
    },
    'jp-fast-trading': {
      title: '取引アプリ',
      description: 'ボーナスが手元で疼いている。アプリはさっきから感嘆符つきの通知を寄こしてくる。',
    },
    'jp-fast-payday-2': {
      title: '給料日',
      description: 'また一か月が過ぎ、また振り込みが入る。',
      harsher: {
        title: 'ボーナス返還',
        description: '別の建物にいる誰かが去年の賞与を査定し直し、しかも下方に査定し直す。',
        reason: 'ボーナスの返還',
      },
    },
    'jp-fast-retention': {
      title: '引き留めの条件',
      description: 'お茶を飲みながら、よそから声がかかっていると軽く漏らす。対抗条件はお茶より先に出てくる。',
    },
    'jp-midtown-trading': {
      title: '証券会社',
      description: '画面だらけ、窓口には年金生活者の列、そして今回だけは違うと言い張る営業担当。',
    },
    'jp-midtown-insurance': {
      title: '保険の窓口',
      description: '家の鍵を渡す前に、補償について少し話をさせてほしい人がいる。広げられた地域のハザードマップは、網羅的で、更新も新しく、そして静かに恐ろしい。',
    },
    'jp-midtown-payday': {
      title: '給料日',
      description: 'マンションの頭金を払う週に、給料の振り込みが届く。',
    },
    'jp-midtown-allowance': {
      title: 'お小遣い制',
      description: '口座がひとつにまとまる。給料は全額そちらへ入り、毎月決まった額だけ手元に戻ってくる。家計簿の欄には「小遣い」と書いてある。',
      reason: '家計の精算',
    },
    'jp-midtown-phone-call': {
      title: '担任から電話',
      description: '会議中に担任の先生から電話が来る。子どもは無事。教室の窓は無事ではない。学校としては、静かに片づけたいとのこと。',
      reason: '壊したものの弁償、子ども一人につき',
    },
    'jp-midtown-bonus': {
      title: '冬のボーナス',
      description: '冬の封筒が届く。約束の額ではなく月給の何か月分かで決まるので、全員の金額が違う。',
    },
    'jp-midtown-raise': {
      title: '昇給',
      description: 'エレベーター前での短い立ち話、新しい金額、そして寸分たがわぬ深さの会釈。',
    },
    'jp-midtown-rate-rise': {
      title: '金利上昇',
      description: '変動金利がずっと平らだった時代が、木曜の朝に終わる。家計の毎月の数字がそろって道連れになる。',
      reason: '金利が悪いほうへ動いた',
    },
    'jp-model-room': {
      title: 'モデルルーム',
      description: 'レンタル家具、やわらかい照明、そして返済期間が残りの職業人生とぴったり同じ長さの営業担当。',
    },
    'jp-risky-startup': {
      title: 'スタートアップに出資',
      description: '友人の渋谷のスタートアップに貯金をつぎ込む。',
      reason: '出資の払い戻し',
    },
    'jp-risky-bad-tip': {
      title: 'ハズレの銘柄',
      description: '「堅い」はずの株が一週間で沈む。声高に勧めた責任として、全員に夕食をおごる。',
      reason: 'ハズレ銘柄のお詫び',
    },
    'jp-risky-golf': {
      title: '接待ゴルフ',
      description: '十八ホール、一ホールごとの軽い賭け、そしてシーズン中ずっと実力より悪めに申告してきたハンディキャップ。',
      reason: '十八回の軽い賭け',
    },
    'jp-risky-crash': {
      title: '相場の暴落',
      description: '相場が大きく沈み、持ち株がまとめて顔をしかめる。父がまた、皇居の地価でカリフォルニアが買えた年の話をする。',
      reason: '相場の暴落',
    },
    'jp-risky-aftershock': {
      title: '二番底',
      description: '指数は誰も想定していなかった底をさらに掘り当てる。しかも後場のうちに。',
      reason: '相場のさらなる下落',
    },
    'jp-risky-jumbo': {
      title: '年末ジャンボ',
      description: 'よく当たると評判の売り場に四十分並ぶ。よく当たると評判なのだから、よく当たるはずだ。',
      reason: '年末ジャンボの当選金',
    },
    'jp-risky-payday': {
      title: '給料日',
      description: '投資のほうが荒れている最中に、給料が振り込まれる。',
    },
    'jp-risky-swap': {
      title: '首位と交換',
      description: '握手ひとつ、書面に判子ひとつ。首位の相手と口座の残高をそっくり入れ替える。',
      reason: '首位との取引',
    },
    'jp-safe-points': {
      title: 'ポイント大放出',
      description: 'ポイントカード十三枚、はち切れそうな財布一つ、そしてレジで買い物かごの全額がポイントで消える瞬間。',
      reason: 'ポイントの還元',
    },
    'jp-safe-payday': {
      title: '給料日',
      description: '二十五日に振り込まれる。物心ついてから毎月そうだったように。',
      harsher: {
        title: '給与の支払い遅延',
        description: 'どこかの表計算のセルひとつのせいで、今月の給料は来月に届くことになる。',
        reason: 'ひと月ぶんの給与保留',
      },
    },
    'jp-safe-excess': {
      title: '保険の自己負担',
      description: '慎重な道にも保険金の請求書はある。免責分は自腹で、しかもきっちりその額で。',
      reason: '保険の免責額',
    },
    'jp-safe-ledger': {
      title: '家計簿',
      description: '一年ぶん、一項目ずつ律儀に家計簿をつけ通す。そして家計簿のほうが静かに勝つ。',
      reason: '家計簿の黒字',
    },
    'jp-safe-old-passbook': {
      title: '古い通帳',
      description: '実家の引き出しから子どものころの郵便貯金の通帳が出てくる。中の残高は小学校のころからずっと待っていた。',
      reason: '忘れていた口座',
    },
    'jp-safe-coin-tin': {
      title: '五百円玉貯金',
      description: '三年間、五百円玉はすべてクッキーの缶に入れてきた。今日その缶がいっぱいになる。持ち上げると、道理に合わないほど重い。',
      reason: '三年ぶんの小銭',
    },
    'jp-safe-payday-2': {
      title: '給料日',
      description: 'また二十五日、また静かな振り込み。この道はそれでいい。',
    },
    'jp-safe-dividend': {
      title: '配当の日',
      description: '手堅いほうの持ち株が、手堅い額をきちんと出してくる。株主優待のいいお米つきで。',
      reason: '四半期配当',
    },
    'jp-sunset-number': {
      title: '老後二千万円問題',
      description: '国の報告書が、安心して老後を過ごすにはいくら要るかを計算し、そう言ったことを謝る。封筒の裏で自分で計算するともう少し多い。そして、その数字は放っておいても消えない。',
    },
    'jp-sunset-upgrade': {
      title: '住み替え',
      description: '不動産屋から電話。もっと明るくて、もっと高い階で、ぎりぎり手が届く。タワーに空きが出て、その階には眺めがある。',
    },
    'jp-sunset-earthquake': {
      title: '大地震',
      description: '来ると言われ続けたものが、午前四時にようやく挨拶に来る。食器を全部落とし、その食器が落ちた台所にひびを入れていく。',
      reason: '地震の被害',
    },
    'jp-sunset-parents': {
      title: '親の介護',
      description: 'かつて自分を背負ってくれた人を、今度は背負う番になる。施設の待機者名簿はパンフレットより長い。費用を数えるつもりはない。請求書のほうが勝手に数える。',
      reason: '家族の介護費',
    },
    'jp-sunset-payday-1': {
      title: '給料日',
      description: '数えるほどしか残っていない給料の、そのひとつが振り込まれる。',
    },
    'jp-sunset-swap': {
      title: '首位と交換',
      description: '緑茶を挟んだ最後の大胆な取引。首位の相手は、自分の財産が丁寧に一礼して出ていくのを見送ることになる。',
      reason: '土壇場の交換',
    },
    'jp-sunset-children-visit': {
      title: '子どもたちの帰省',
      description: '大きくなった子どもたちが、開けるのがもったいないほど立派な箱入りの果物を持って帰ってくる。その下には、そっと封筒が置いてある。',
      reason: '子ども一人ひとりからの封筒',
    },
    'jp-sunset-sticky': {
      title: 'つい手が伸びる',
      description: 'いいお茶を出しながら、首位の相手にいちばんいい思い出話を譲るよう説得しはじめる。',
      reason: '思い出がひとつ移る',
    },
    'jp-sunset-last-title': {
      title: '最後の肩書き',
      description: '説得できれば、退職前にもうひとつだけ肩書きがつく。',
      reason: '人生最後の考課',
    },
    'jp-sunset-payday-2': {
      title: '給料日',
      description: '給料日を数えるのはとうにやめたが、二十五日のほうはやめていない。',
    },
    'jp-sunset-final-tax': {
      title: '最後の納税',
      description: 'オフィスの扉が背中で永遠に閉まる前に、税務署からの封筒がもう一通だけ届く。',
      reason: '最後の税金',
    },
    'jp-sunset-ahead': {
      title: '夕暮れが見える',
      description: '車窓から、山が夕日でうっすら赤くなる。忙しくて見ていなかっただけで、毎晩そうだった。',
    },
    'jp-retirement': {
      title: '定年退職',
      description: '机の上の花束、フロアへの深い一礼、そして四十年で初めて、行く先のない月曜日。',
    },
  },

  lanes: {
    'University Lane': {
      name: '大学コース',
      summary: '四年間と、それを決める一日の試験と、一円も稼がないうちに全額前払いの学費。学位が買うのはたいてい上がっていく社内のはしごだ。堅実ではあるが、大きくはならない。',
    },
    'Straight to Work': {
      name: '就職コース',
      summary: '大学組がリクルートスーツを買う前に、学校が就職先まで連れていってくれる。初日から給料が出て、安全網はない。職人のはしごは一段目が厳しく、てっぺんはこの卓のどの大卒より稼ぐ。',
    },
    'Company Loyalty Road': {
      name: '終身雇用コース',
      summary: '動かない。昇給は年功で、遅いが確実に来る。ボーナスは年二回。会社は忠誠を覚えている——たいていは。ついでに、住む場所も会社が決める。',
    },
    'Job-Hopper Alley': {
      name: '転職コース',
      summary: '出て、条件を自分で言う。エージェントには好かれ、人事には記録される。最初の引きが悪かったなら痛快、良かったなら本物の賭けだ。',
    },
    'Family Lane': {
      name: '家族コース',
      summary: 'ランドセル、塾、そして騒がしい家。最後には大きくなった子どもの数だけ封筒が届く。給料日はぐっと減り、請求書は人数ぶん増える。',
    },
    'Career Track': {
      name: '出世コース',
      summary: '残業は本物で、昇給もボーナスも奥の長机も本物だ。そのために手放したものは別の一覧になっていて、そちらは長い。',
    },
    'Speculation Street': {
      name: '投機コース',
      summary: '暗号資産、信用取引、そしてやたらいいスーツを着た人からの耳より情報。モデルルームの時点で後ろにいるなら来るべきだし、前にいるならよく考えたほうがいい。',
    },
    'Steady Street': {
      name: '堅実コース',
      summary: '普通預金、ポイントカード、クーポン、そして五百円玉の詰まったクッキー缶。ここで大金持ちになった者も、破滅した者もいない。すでに勝っているなら、それは相当な値打ちだ。',
    },
  },

  careers: {
    'career-jp-salon-apprentice': {
      title: '美容室のアシスタント',
      description: 'ハサミを持たせてもらえるまで二年間シャンプー。営業後は名前のついたウィッグでカットの練習。',
    },
    'career-jp-stylist': {
      title: 'スタイリスト',
      description: '自分の椅子を持ち、予約は三週間先まで埋まり、どの駅に移っても付いてくる常連がいる。',
    },
    'career-jp-salon-owner': {
      title: '美容室オーナー',
      description: '駅から二分の店を構える。おしゃべりも予約も途切れることがない。',
    },
    'career-jp-rice-apprentice': {
      title: '寿司の見習い',
      description: '五時に入って十時に上がる。まだ魚は触らせてもらえない。シャリこそが仕事のすべてだ、と言われている。',
    },
    'career-jp-sushi-chef': {
      title: '寿司職人',
      description: 'カウンターに立ち、客を読み、その日の機嫌にちょうど合う厚さで切る。',
    },
    'career-jp-sushi-master': {
      title: '大将',
      description: '八席、お品書きなし、予約は毎月一日の零時に開いて零時四分に閉まる。',
    },
    'career-jp-noodle-cook': {
      title: 'ラーメン店の店員',
      description: '寸胴六つ、券売機ひとつ、そして一週間の値打ちを決める昼のピーク。',
    },
    'career-jp-ramen-stall-owner': {
      title: '屋台の主',
      description: '夕暮れに駅前へ屋台を出し、終電前の人波をちょっとした祭りに変える。行列そのものがサイコロだ。',
    },
    'career-jp-ramen-shop-owner': {
      title: 'ラーメン店主',
      description: 'カウンター十一席、妥協のないスープ一種、そして近所の店が時計代わりにする行列。',
    },
    'career-jp-site-labourer': {
      title: '建設作業員',
      description: '八時のラジオ体操を先導し、安全唱和に本気を出し、現場の道具がどこにあるかを本当に知っている。',
    },
    'career-jp-site-supervisor': {
      title: '現場主任',
      description: '朝礼と入場ボード、そして足場屋との恒例の言い合いを仕切る。',
    },
    'career-jp-site-foreman': {
      title: '現場監督',
      description: '丸めた図面を、地震にびくともしない建物へ変えていく。見積もりもきちんと出す。',
    },
    'career-jp-parcel-courier': {
      title: '宅配ドライバー',
      description: '二時間の時間帯指定を分単位で守り、角の丸くなった不在票の束を持ち歩いている。',
    },
    'career-jp-depot-dispatcher': {
      title: '営業所の配車担当',
      description: 'スクーターを降りて配車ボードの前へ。区内じゅうのトラックが、名前入りのマグネットになって並ぶ。',
    },
    'career-jp-distribution-lead': {
      title: '物流センター長',
      description: '夜間仕分けで十万個を動かし、そのからくりに始発が気づく前に帰宅する。',
    },
    'career-jp-apprentice-mechanic': {
      title: '整備見習い',
      description: '三年間、親方のためにライトを持ち続けた。そして軽トラの声が自分にも聞こえる気がしてきた。',
    },
    'career-jp-scooter-mechanic': {
      title: 'バイク整備士',
      description: '配達スクーターの不平を、乗り手が言い終える前に聞き取ってしまう。',
    },
    'career-jp-workshop-owner': {
      title: '整備工場オーナー',
      description: 'リフト四基、車検シーズンの順番待ち、そして積車で運び込まれてきたバイクの写真が並ぶ壁。',
    },
    'career-jp-session-player': {
      title: 'スタジオミュージシャン',
      description: '国じゅうが口ずさんだ演歌のベースを弾いている。ジャケットに名前は載らず、次の仕事までは電話を待つ。',
    },
    'career-jp-touring-player': {
      title: 'ツアーミュージシャン',
      description: '四十七都道府県、機材ケースひとつ、そしてホールのポスターの隅にやっと載った名前。',
    },
    'career-jp-record-producer': {
      title: '音楽プロデューサー',
      description: 'ガラスの向こうで「もう一回、もっと切なく」と言う。そしてなぜかいつも正しい。',
    },
    'career-jp-radio-runner': {
      title: 'ラジオのアシスタント',
      description: 'お茶を出し、ゲストに合図を送り、リスナーのハガキを仕分けながら、番組の作り方を静かに覚えていく。',
    },
    'career-jp-late-night-host': {
      title: '深夜ラジオのパーソナリティ',
      description: '午前二時、長距離ドライバーと眠れない受験生のハガキを読む。起きている人にだけ、絶大に有名だ。',
    },
    'career-jp-programme-director': {
      title: '番組ディレクター',
      description: '十一本の番組を回し、うち一本には今もペンネームで出演し、十二本ぶんのスポンサー枠を売る。',
    },
    'career-jp-second-shooter': {
      title: 'セカンドカメラマン',
      description: '披露宴会場のうしろ側と、新婦の父が泣くのをやめて隠さなくなる瞬間を押さえる。',
    },
    'career-jp-wedding-photographer': {
      title: 'ブライダルカメラマン',
      description: '六月の週末は二年先まで埋まり、二月は無音。予約表がサイコロで、大安と仏滅が一年を決める。',
    },
    'career-jp-rental-agent': {
      title: '賃貸の営業',
      description: '土曜に十一件のワンルームを案内し、どの物件が「駅徒歩」を走って測ったかを覚えている。',
    },
    'career-jp-property-agent': {
      title: '不動産営業',
      description: 'まずキッチンを売り、次にバルコニーを売り、片道九十分の通勤の話は決してしない。',
    },
    'career-jp-agency-owner': {
      title: '不動産会社オーナー',
      description: '四百棟の前に自分の名前の看板が立つ。タワーが一棟当たれば、静かな三年を支えられる。',
    },
    'career-jp-warehouse-picker': {
      title: '倉庫のピッキング',
      description: '同じロボットアームの脇を一勤務で十数キロ歩き、暗闇でも四十番通路にたどり着ける。',
    },
    'career-jp-warehouse-lead': {
      title: '倉庫のリーダー',
      description: '野球場四つぶんの建物を、缶コーヒーとバインダーだけで回している。',
    },
    'career-jp-grooming-assistant': {
      title: 'トリマー助手',
      description: 'タオルとおやつ、そしてとても小さなレインコートを着たとても小さな犬に品定めされる間じっとしていられる度胸。',
    },
    'career-jp-pet-salon-groomer': {
      title: 'トリマー',
      description: '近所のトイプードルに毎月のテディベアカットを施す。そこらのアイドルより写真を撮られている。',
    },
    'career-jp-baseball-coach': {
      title: '少年野球のコーチ',
      description: '土曜の練習を土のグラウンドで仕切り、麦茶を注ぎ、全員の名前を覚えている。ここから上のポストはないし、もともとそんなものはなかった。',
    },
    'career-jp-rice-farmer': {
      title: '米農家',
      description: '朝七時には村じゅうが並ぶ米を作っている。ゴルフ場の話は三度断った。断るたびに丁寧になった。',
    },
    'career-jp-surgical-resident': {
      title: '外科の研修医',
      description: '大学病院で六年ぶんの当直、何時間も続く手術の助手、そして「教授ならどうすると思う」と問われ続けた日々。',
    },
    'career-jp-hospital-surgeon': {
      title: '外科医',
      description: 'ぶれない手と、それ以上にぶれない胆力で人を救う。回診は始発より早い。',
    },
    'career-jp-junior-associate': {
      title: 'アソシエイト弁護士',
      description: '古い堀を見下ろす事務所で、パートナーが肝心の一段落だけ読めるように九百ページを読む。',
    },
    'career-jp-corporate-lawyer': {
      title: '企業弁護士',
      description: '上等な鞄と、それより鋭い論理と、寸分たがわぬ深さの一礼で役員会の戦いを制する。',
    },
    'career-jp-architectural-assistant': {
      title: '建築設計助手',
      description: '車一台ぶんの間口の家のために階段の詳細図を十一回描き、最初の十回より十一回目から多くを学ぶ。',
    },
    'career-jp-architect': {
      title: '建築家',
      description: '打ち放しのコンクリートを無理な隅まで流し込み、六平米の庭を森のように感じさせる。',
    },
    'career-jp-junior-systems-engineer': {
      title: '新人システムエンジニア',
      description: '誰もやりたがらない小さなバグを直し、シートが四十一枚ある表計算に記録する。',
    },
    'career-jp-systems-engineer': {
      title: 'システムエンジニア',
      description: '名刺には「SE」の二文字。国じゅうがその二文字を言い続け、その下では静かなコードが国の半分を動かしている。',
    },
    'career-jp-junior-designer': {
      title: 'ゲームデザイナー見習い',
      description: '京都のスタジオで四か月かけてチュートリアルを調整し、見知らぬ人が一文字も読まずにそこを抜けていくのを見守る。',
    },
    'career-jp-game-designer': {
      title: 'ゲームデザイナー',
      description: '世界じゅうが夜更かしして遊ぶ世界を作る。ずっと日本の輸出品だったものが、今は自分の机の上にある。',
    },
    'career-jp-robotics-graduate': {
      title: 'ロボット工学の新卒',
      description: '一年かけてアームに正しい角度のお辞儀を教える。本人はそれを有意義な一年だと思っている。',
    },
    'career-jp-robotics-engineer': {
      title: 'ロボット技術者',
      description: '高齢化する国のために介護ロボットを関節ひとつずつ作る。親戚が集まるたび、同じ質問に同じ説明をしている。',
    },
    'career-jp-trading-house-trainee': {
      title: '総合商社の新入社員',
      description: '同じ一週間で鉄鉱石と鮭と保険の売り方を学び、海外赴任の物差しにかけられる。',
    },
    'career-jp-trading-house-generalist': {
      title: '総合商社の総合職',
      description: '四十までに三大陸に赴任。何の仕事かは飲み会で誰にも説明できない。本人にもできない。ボーナスは年二回きちんと来る。',
    },
    'career-jp-ministry-recruit': {
      title: '中央省庁の新人',
      description: '国家試験に受かり、省に入り、霞が関の明かりが深夜まで消えない理由を知る。',
    },
    'career-jp-ministry-section-chief': {
      title: '省庁の課長補佐',
      description: '翌朝七時に大臣が読み上げる答弁を書く。残業時間の単位は国家予算だ。',
    },
    'career-jp-research-assistant': {
      title: '研究助手',
      description: '他人の論文のために冷たい海で数を数える。その一分一分が楽しくて仕方ない。',
    },
    'career-jp-aquarium-researcher': {
      title: '水族館の研究員',
      description: '街じゅうが並ぶ大水槽を研究している。とびきり好奇心の強いイルカ一頭とは名前で呼び合う仲だ。',
    },
    'career-jp-manga-assistant': {
      title: '漫画のアシスタント',
      description: '休載しない週刊誌のために午前四時まで背景を入れる。自分の原稿は引き出しの中で待っている。',
    },
    'career-jp-manga-artist': {
      title: '漫画家',
      description: 'ついに連載。印税はサイコロ、読者アンケートはギロチン、そして締切は永遠に毎週来る。',
    },
    'career-jp-veterinarian': {
      title: '獣医',
      description: '不安そうな飼い主をなだめながら、とても小さな骨折を静かに処置する。いくら積まれてもチェーン展開はしない。',
    },
    'career-jp-university-professor': {
      title: '大学教授',
      description: '火曜に講義し、水曜に同僚と論争し、金曜には相手の考えを変えている。学部長の椅子は二度断った。',
    },
  },

  houses: {
    'house-jp-country-farmhouse': {
      name: '田舎の古民家',
      description: '広大な木造の家。自治体が住んでくれと補助金まで出す。空き家は全国に八百万戸。売値は、思い出のぶんだけ。',
    },
    'house-jp-one-room-flat': {
      name: '都心のワンルーム',
      description: '十八平米、駅から四分、浴槽は洗面台も兼ねている。買っているのは、その四分だ。',
    },
    'house-jp-suburban-tract-house': {
      name: '郊外の建売住宅',
      description: '郵便受けまで隣と同じ。職場までは九十分。新築の匂いつき、新築の値段はつかず。',
    },
    'house-jp-warehouse-loft': {
      name: 'リノベーションした蔵',
      description: '古い酒蔵。頭上には太い梁、大きな窓、そして見事にうるさい石油ストーブが一台。',
    },
    'house-jp-two-family-house': {
      name: '二世帯住宅',
      description: '一階に親が住んでいる。これでいくつかの問題が片づき、同じくらいの数の問題が生まれる。',
    },
    'house-jp-seaside-villa': {
      name: '海辺の別荘',
      description: '海の眺めは永遠、台風の保険料は毎年。その計算は市場のほうが先に済ませている。',
    },
    'house-jp-custom-built-house': {
      name: '注文住宅',
      description: '建築家が夢をそのとおりに建ててくれた。読書用の小部屋まで。ただし夢は譲渡できませんと、市場が丁重に申し添える。',
    },
    'house-jp-bayside-tower': {
      name: '湾岸タワー三十八階',
      description: 'コンクリート、コンシェルジュ、そして毎晩の橋の眺め。タワーは戸建てと違って値上がりを許されている。',
    },
    'house-jp-central-penthouse': {
      name: '都心のペントハウス',
      description: '古い堀の街を見下ろす最上階まるごと。エレベーターにソファがあり、そのソファには眺めがある。',
    },
  },

  stocks: {
    'stock-jp-konbini': {
      name: '全国コンビニホールディングス',
      description: '五万八千店。閉まらない、外さない、誰も驚かせない。売り文句はそれだけだ。',
    },
    'stock-jp-rail': {
      name: 'サンライズ鉄道不動産',
      description: '電車は秒単位で定刻。沿線の店はぜんぶこの会社のもので、それでも四十秒の遅れを謝る。',
    },
    'stock-jp-animation': {
      name: 'ランタン・アニメーション',
      description: '世界配信の一発で栄光、一本の制作難航でその顛末のドキュメンタリーの主役。',
    },
    'stock-jp-gacha': {
      name: 'ガチャゲームズ',
      description: '基本プレイ無料、なぜか大黒字。売上は今期の限定キャラが十代にどう受け止められるかで決まる。',
    },
    'stock-jp-robotics': {
      name: 'オービタル・スプリングス・ロボティクス',
      description: '高齢化する国のための人型介護ロボット。次の国策企業か、世界一高価なタオルのたたみ方か。',
    },
  },

  lifeTiles: {
    'tile-jp-tokyo-marathon': { title: '東京マラソンを完走' },
    'tile-jp-visual-novel': { title: '同人ノベルゲームを頒布' },
    'tile-jp-neighbourhood-shiba': { title: '近所の柴犬と仲よくなった' },
    'tile-jp-shonan-surf': { title: '湘南でサーフィンを覚えた' },
    'tile-jp-goya-curtain': { title: 'ベランダにゴーヤカーテン' },
    'tile-jp-gyoza-seal': { title: '餃子のひだを極めた' },
    'tile-jp-pilgrimage': { title: '四国八十八箇所を歩き遍路' },
    'tile-jp-enka-single': { title: '演歌のシングルを出した' },
    'tile-jp-tea-hut': { title: '庭に茶室を建てた' },
    'tile-jp-food-stall-news': { title: '出店が地元ニュースに出た' },
    'tile-jp-island-triathlon': { title: '離島のトライアスロン完走' },
    'tile-jp-cat-shelter': { title: '保護猫カフェでボランティア' },
    'tile-jp-shaved-ice-stall': { title: '祭りのかき氷屋を仕切った' },
    'tile-jp-arcade-mural': { title: '商店街の壁画を描いた' },
    'tile-jp-national-haiku': { title: '俳句が全国紙に載った' },
    'tile-jp-catchphrase': { title: '深夜番組のコーナーが流行語に' },
    'tile-jp-vending-snack': { title: '自販機の新商品を考案' },
    'tile-jp-bon-dance': { title: '町内の盆踊りで優勝' },
    'tile-jp-shrine-cat': { title: '神社の猫を引き取った' },
    'tile-jp-fuji-sunrise': { title: '富士山でご来光を見た' },
    'tile-jp-tea-bowl': { title: '自分の茶碗を焼いた' },
    'tile-jp-junior-baseball': { title: '少年野球チームを指導した' },
    'tile-jp-departure-melody': { title: '駅の発車メロディを作曲' },
    'tile-jp-prize-daikon': { title: '巨大大根で入賞' },
    'tile-jp-shibuya-startup': { title: '友人の渋谷の起業に出資した' },
    'tile-jp-showa-motorcycle': { title: '昭和の名車をレストア' },
    'tile-jp-hanami-spot': { title: '花見で最高の場所を確保' },
    'tile-jp-bento': { title: '食べるのが惜しい弁当を作った' },
    'tile-jp-inland-sea': { title: '瀬戸内海を船で渡った' },
    'tile-jp-village-mascot': { title: 'ご当地キャラをデザインした' },
    'tile-jp-fostered-litter': { title: '子猫を一腹まるごと預かった' },
    'tile-jp-radio-calisthenics': { title: 'ラジオ体操のスタンプを皆勤' },
    'tile-jp-calligraphy-class': { title: '満席の書道教室を開いた' },
    'tile-jp-kumano-kodo': { title: '熊野古道を歩き通した' },
    'tile-jp-town-cinema': { title: '町の名画座を再建した' },
    'tile-jp-bonsai': { title: '盆栽が三つの元号をまたいだ' },
  },

  economy: {
    tuitionNotes: [
      '奨学金の申請書が書類の山に紛れ、さらに一年ぶんの予備校代が請求に上乗せされる。',
      '入学金と授業料は、大学のパンフレットに書いてあったとおりの額で収まる。',
      '県の奨学金が、見込んでいたより長く四年間を支えてくれる。',
      '授業料の全額免除。家に額装される種類の成績表だ。',
    ],
    marriage: {
      rescued: '二度目でようやく「はい」。相手はリボ払いの残高と、もう手放した車のための駐車場と、そのどちらにもきわめておおらかな態度を持って引っ越してきた。',
      outcomes: [
        'ホテルの披露宴が勝手に大きくなっていく。お色直し二回、ドライアイスの入場、そして両家そろっていい酒を頼む。',
        '小さな神前式と、いい店を一軒。四十人、心に残るスピーチがひとつ、ご祝儀で足りた。',
        'ひとつ屋根の下に収入が二つ。2LDKの家賃が急に半分に見えてくる。',
        '地元じゅうが集まり、誰もが気前よく、しかも相手は高校時代から黙って郵便貯金を積んでいたことが判明する。',
      ],
    },
  },
}
