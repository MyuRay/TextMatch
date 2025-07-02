// 日本の大学メールドメインリスト
export const UNIVERSITY_DOMAINS = [
  // 国立大学（旧帝大）
  'u-tokyo.ac.jp',     // 東京大学
  'kyoto-u.ac.jp',     // 京都大学
  'osaka-u.ac.jp',     // 大阪大学
  'nagoya-u.ac.jp',    // 名古屋大学
  'tohoku.ac.jp',      // 東北大学
  'kyushu-u.ac.jp',    // 九州大学
  'hokudai.ac.jp',     // 北海道大学
  
  // 国立大学（その他主要）
  'titech.ac.jp',      // 東京工業大学
  'hit-u.ac.jp',       // 一橋大学
  'tsukuba.ac.jp',     // 筑波大学
  'u.tsukuba.ac.jp',   // 筑波大学（学生）
  's.tsukuba.ac.jp',   // 筑波大学（学生）
  'hiroshima-u.ac.jp', // 広島大学
  'kobe-u.ac.jp',      // 神戸大学
  'chiba-u.jp',        // 千葉大学
  'ynu.ac.jp',         // 横浜国立大学
  'okayama-u.ac.jp',   // 岡山大学
  'kanazawa-u.ac.jp',  // 金沢大学
  
  // 国立大学（その他）
  'kumamoto-u.ac.jp',  // 熊本大学
  'niigata-u.ac.jp',   // 新潟大学
  'nagasaki-u.ac.jp',  // 長崎大学
  'kagoshima-u.ac.jp', // 鹿児島大学
  'yamaguchi-u.ac.jp', // 山口大学
  'gunma-u.ac.jp',     // 群馬大学
  'ibaraki.ac.jp',     // 茨城大学
  'utsunomiya-u.ac.jp', // 宇都宮大学
  'saitama-u.ac.jp',   // 埼玉大学
  'shinshu-u.ac.jp',   // 信州大学
  'shizuoka.ac.jp',    // 静岡大学
  'mie-u.ac.jp',       // 三重大学
  'shiga-u.ac.jp',     // 滋賀大学
  'nara-wu.ac.jp',     // 奈良女子大学
  'wakayama-u.ac.jp',  // 和歌山大学
  'hirosaki-u.ac.jp',  // 弘前大学
  'iwate-u.ac.jp',     // 岩手大学
  'akita-u.ac.jp',     // 秋田大学
  'yamagata-u.ac.jp',  // 山形大学
  'fukushima-u.ac.jp', // 福島大学
  'u-gakugei.ac.jp',   // 東京学芸大学
  'tuat.ac.jp',        // 東京農工大学
  'kaiyodai.ac.jp',    // 東京海洋大学
  'ocha.ac.jp',        // お茶の水女子大学
  'uec.ac.jp',         // 電気通信大学
  'tufs.ac.jp',        // 東京外国語大学
  'geidai.ac.jp',      // 東京芸術大学
  'tmd.ac.jp',         // 東京医科歯科大学
  'nitech.ac.jp',      // 名古屋工業大学
  'kit.ac.jp',         // 京都工芸繊維大学
  'osaka-kyoiku.ac.jp', // 大阪教育大学
  'hyogo-u.ac.jp',     // 兵庫教育大学
  'nara-edu.ac.jp',    // 奈良教育大学
  'kyutech.ac.jp',     // 九州工業大学
  'fukuoka-edu.ac.jp', // 福岡教育大学
  'tottori-u.ac.jp',   // 鳥取大学
  'shimane-u.ac.jp',   // 島根大学
  'tokushima-u.ac.jp', // 徳島大学
  'kagawa-u.ac.jp',    // 香川大学
  'ehime-u.ac.jp',     // 愛媛大学
  'kochi-u.ac.jp',     // 高知大学
  'saga-u.ac.jp',      // 佐賀大学
  'oita-u.ac.jp',      // 大分大学
  'miyazaki-u.ac.jp',  // 宮崎大学
  'u-ryukyu.ac.jp',    // 琉球大学
  
  // 公立大学
  'tmu.ac.jp',         // 東京都立大学
  'yokohama-cu.ac.jp', // 横浜市立大学
  'osaka-cu.ac.jp',    // 大阪市立大学
  'osakafu-u.ac.jp',   // 大阪府立大学
  'kobe-cufs.ac.jp',   // 神戸市外国語大学
  'kpu.ac.jp',         // 京都府立大学
  'sapporo-cu.ac.jp',  // 札幌市立大学
  'aomori-kenritsu-hoken.ac.jp', // 青森県立保健大学
  'iwate-pu.ac.jp',    // 岩手県立大学
  'myu.ac.jp',         // 宮城大学
  'akita-pu.ac.jp',    // 秋田県立大学
  'yamagata-chs.ac.jp', // 山形県立保健医療大学
  'fmu.ac.jp',         // 福島県立医科大学
  'ipu.ac.jp',         // 茨城県立医療大学
  'gpwu.ac.jp',        // 群馬県立女子大学
  'spu.ac.jp',         // 埼玉県立大学
  'pref.chiba.ac.jp',  // 千葉県立保健医療大学
  'sghp.ac.jp',        // 神奈川県立保健福祉大学
  'unii.ac.jp',        // 新潟県立大学
  'tpu.ac.jp',         // 富山県立大学
  'ishikawa-pu.ac.jp', // 石川県立大学
  'fpu.ac.jp',         // 福井県立大学
  'yamanashi-ken.ac.jp', // 山梨県立大学
  'nagano-nurs.ac.jp', // 長野県看護大学
  'gifu-cns.ac.jp',    // 岐阜県立看護大学
  'u-shizuoka-ken.ac.jp', // 静岡県立大学
  'aichi-pu.ac.jp',    // 愛知県立大学
  'mcn.ac.jp',         // 三重県立看護大学
  'usp.ac.jp',         // 滋賀県立大学
  'kcua.ac.jp',        // 京都市立芸術大学
  'u-hyogo.ac.jp',     // 兵庫県立大学
  'u-shimane.ac.jp',   // 島根県立大学
  'oka-pu.ac.jp',      // 岡山県立大学
  'onomichi-u.ac.jp',  // 尾道市立大学
  'yamaguchi-pu.ac.jp', // 山口県立大学
  'kagawa-puhs.ac.jp', // 香川県立保健医療大学
  'ehealth.ac.jp',     // 愛媛県立医療技術大学
  'u-kochi.ac.jp',     // 高知県立大学
  'fwu.ac.jp',         // 福岡女子大学
  'nagasaki-pu.ac.jp', // 長崎県立大学
  'pu-kumamoto.ac.jp', // 熊本県立大学
  'oita-nhs.ac.jp',    // 大分県立看護科学大学
  'mpu.ac.jp',         // 宮崎県立看護大学
  'okigei.ac.jp',      // 沖縄県立芸術大学
  'meio-u.ac.jp',      // 名桜大学
  'kitakyushu-u.ac.jp', // 北九州市立大学
  'hiroshima-cu.ac.jp', // 広島市立大学
  
  // 私立大学（関東）
  'waseda.jp',         // 早稲田大学
  'keio.jp',           // 慶應義塾大学
  'sophia.ac.jp',      // 上智大学
  'meiji.ac.jp',       // 明治大学
  'aoyama.ac.jp',      // 青山学院大学
  'rikkyo.ac.jp',      // 立教大学
  'chuo-u.ac.jp',      // 中央大学
  'hosei.ac.jp',       // 法政大学
  'gakushuin.ac.jp',   // 学習院大学
  'seikei.ac.jp',      // 成蹊大学
  'seijo.ac.jp',       // 成城大学
  'meijigakuin.ac.jp', // 明治学院大学
  'kokugakuin.ac.jp',  // 國學院大學
  'musashi.ac.jp',     // 武蔵大学
  'nihon-u.ac.jp',     // 日本大学
  'toyo.ac.jp',        // 東洋大学
  'komazawa-u.ac.jp',  // 駒澤大学
  'senshu-u.ac.jp',    // 専修大学
  'asia-u.ac.jp',      // 亜細亜大学
  'daito.ac.jp',       // 大東文化大学
  'teikyo-u.ac.jp',    // 帝京大学
  'kokushikan.ac.jp',  // 国士舘大学
  'takushoku-u.ac.jp', // 拓殖大学
  'tokai.ac.jp',       // 東海大学
  'kanagawa-u.ac.jp',  // 神奈川大学
  'kanto-gakuin.ac.jp', // 関東学院大学
  'bunkyo.ac.jp',      // 文教大学
  'dokkyo.ac.jp',      // 獨協大学
  'reitaku-u.ac.jp',   // 麗澤大学
  'takuzen.ac.jp',     // 拓殖大学北海道短期大学
  'soka.ac.jp',        // 創価大学
  'tokyokeizai.ac.jp', // 東京経済大学
  'tsuru.ac.jp',       // 都留文科大学
  'takushin.ac.jp',    // 高千穂大学
  'jissen.ac.jp',      // 実践大学
  'lakeland.ac.jp',    // レイクランド大学ジャパン・キャンパス
  'tfd.ac.jp',         // 東京富士大学
  'yokohama-art.ac.jp', // 横浜美術大学
  'musabi.ac.jp',      // 武蔵野美術大学
  'tamabi.ac.jp',      // 多摩美術大学
  'joshibi.ac.jp',     // 女子美術大学
  'zokei.ac.jp',       // 東京造形大学
  'rissho.ac.jp',      // 立正大学
  'bunka.ac.jp',       // 文化学園大学
  'ishiwara.ac.jp',    // 石巻専修大学
  'tamacc.chuo-u.ac.jp', // 中央大学多摩キャンパス
  'surugadai-u.ac.jp', // 駿河台大学
  'shoin-u.ac.jp',     // 松蔭大学
  'keiwa-c.ac.jp',     // 敬和学園大学
  'hakuoh.ac.jp',      // 白鴎大学
  'shonan-it.ac.jp',   // 湘南工科大学
  'shukutoku.ac.jp',   // 淑徳大学
  'jinai.ac.jp',       // 聖隷クリストファー大学
  'toyoeiwa.ac.jp',    // 東洋英和女学院大学
  'tais.ac.jp',        // 大正大学
  'aoyama.ac.jp',      // 青山学院大学
  'goo.ac.jp',         // 立正大学地球環境科学部
  'tokiwa.ac.jp',      // 常磐大学
  'hiu.ac.jp',         // 広島国際大学
  
  // 女子大学
  'u-sacred-heart.ac.jp', // 聖心女子大学
  'shirayuri.ac.jp',   // 白百合女子大学
  'tsuda.ac.jp',       // 津田塾大学
  'twcu.ac.jp',        // 東京女子大学
  'jwu.ac.jp',         // 日本女子大学
  'kyoritsu-wu.ac.jp', // 共立女子大学
  'otsuma.ac.jp',      // 大妻女子大学
  'jissen.ac.jp',      // 実践女子大学
  'swu.ac.jp',         // 昭和女子大学
  'seisen-u.ac.jp',    // 清泉女子大学
  'ferris.ac.jp',      // フェリス女学院大学
  
  // 理工系大学
  'tus.ac.jp',         // 東京理科大学
  'kogakuin.ac.jp',    // 工学院大学
  'shibaura-it.ac.jp', // 芝浦工業大学
  'dendai.ac.jp',      // 東京電機大学
  'it-chiba.ac.jp',    // 千葉工業大学
  'nodai.ac.jp',       // 東京農業大学
  'nvlu.ac.jp',        // 日本獣医生命科学大学
  'azabu-u.ac.jp',     // 麻布大学
  'kitasato-u.ac.jp',  // 北里大学
  'hoshi.ac.jp',       // 星薬科大学
  'my-pharm.ac.jp',    // 明治薬科大学
  
  // 医科大学
  'jichi.ac.jp',       // 自治医科大学
  'uoeh-u.ac.jp',      // 産業医科大学
  'iuhw.ac.jp',        // 国際医療福祉大学
  'saitama-med.ac.jp', // 埼玉医科大学
  'dokkyomed.ac.jp',   // 獨協医科大学
  'kanazawa-med.ac.jp', // 金沢医科大学
  'aichi-med-u.ac.jp', // 愛知医科大学
  'fujita-hu.ac.jp',   // 藤田医科大学
  'kmu.ac.jp',         // 関西医科大学
  'kindai.ac.jp',      // 近畿大学
  'hyo-med.ac.jp',     // 兵庫医科大学
  'kawasaki-m.ac.jp',  // 川崎医科大学
  'kurume-u.ac.jp',    // 久留米大学
  'fukuoka-u.ac.jp',   // 福岡大学
  
  // 私立大学（関西）
  'doshisha.ac.jp',    // 同志社大学
  'ritsumei.ac.jp',    // 立命館大学
  'kansai-u.ac.jp',    // 関西大学
  'kwansei.ac.jp',     // 関西学院大学
  'kindai.ac.jp',      // 近畿大学
  'ryukoku.ac.jp',     // 龍谷大学
  'kyoto-su.ac.jp',    // 京都産業大学
  'konan-u.ac.jp',     // 甲南大学
  'setsunan.ac.jp',    // 摂南大学
  'kobegakuin.ac.jp',  // 神戸学院大学
  'kansaigaidai.ac.jp', // 関西外国語大学
  'kufs.ac.jp',        // 京都外国語大学
  'mail.kobe-c.ac.jp', // 神戸女学院大学
  'dwc.doshisha.ac.jp', // 同志社女子大学
  'kyoto-wu.ac.jp',    // 京都女子大学
  'mukogawa-u.ac.jp',  // 武庫川女子大学
  'konan-wu.ac.jp',    // 甲南女子大学
  'kobe-wu.ac.jp',     // 神戸女子大学
  
  // 私立大学（中部）
  'nanzan-u.ac.jp',    // 南山大学
  'meijo-u.ac.jp',     // 名城大学
  'chukyo-u.ac.jp',    // 中京大学
  'aichi-u.ac.jp',     // 愛知大学
  'agu.ac.jp',         // 愛知学院大学
  'ait.ac.jp',         // 愛知工業大学
  'chubu.ac.jp',       // 中部大学
  'n-fukushi.ac.jp',   // 日本福祉大学
  'kinjo-u.ac.jp',     // 金城学院大学
  'sugiyama-u.ac.jp',  // 椙山女学園大学
  'nagoya-wu.ac.jp',   // 名古屋女子大学
  'aasa.ac.jp',        // 愛知淑徳大学
  
  // 私立大学（九州）
  'fukuoka-u.ac.jp',   // 福岡大学
  'seinan-gu.ac.jp',   // 西南学院大学
  'kurume-u.ac.jp',    // 久留米大学
  'fit.ac.jp',         // 福岡工業大学
  'kyusan-u.ac.jp',    // 九州産業大学
  'nakamura-u.ac.jp',  // 中村学園大学
  'fukujo.ac.jp',      // 福岡女学院大学
  'chikushi-u.ac.jp',  // 筑紫女学園大学
  'kwuc.ac.jp',        // 九州女子大学
  
  // 芸術大学・音楽大学
  'geidai.ac.jp',      // 東京藝術大学
  'tamabi.ac.jp',      // 多摩美術大学
  'musabi.ac.jp',      // 武蔵野美術大学
  'joshibi.ac.jp',     // 女子美術大学
  'zokei.ac.jp',       // 東京造形大学
  'toho-music.ac.jp',  // 東邦音楽大学
  'kunitachi.ac.jp',   // 国立音楽大学
  'musashino-music.ac.jp', // 武蔵野音楽大学
  'toho-music.ac.jp',  // 昭和音楽大学
  'senzoku.ac.jp',     // 洗足学園音楽大学
  
  // その他
  'icu.ac.jp',         // 国際基督教大学
  'soka.ac.jp',        // 創価大学
  'obirin.ac.jp',      // 桜美林大学
  'tamagawa.ac.jp',    // 玉川大学
  'kyorin-u.ac.jp',    // 杏林大学
  
  // 短期大学ドメイン（必要に応じて）
  'bunkyo.ac.jp',      // 文教大学短期大学部
  'kaetsu.ac.jp',      // 嘉悦大学短期大学部
  
  // 海外大学・.ac.jp以外の教育機関ドメイン
  'mit.edu',           // MIT
  'harvard.edu',       // Harvard University
  'stanford.edu',      // Stanford University
  'berkeley.edu',      // UC Berkeley
  'caltech.edu',       // California Institute of Technology
  'yale.edu',          // Yale University
  'princeton.edu',     // Princeton University
  'columbia.edu',      // Columbia University
  'cornell.edu',       // Cornell University
  'upenn.edu',         // University of Pennsylvania
  'uchicago.edu',      // University of Chicago
  'northwestern.edu',  // Northwestern University
  'duke.edu',          // Duke University
  'dartmouth.edu',     // Dartmouth College
  'brown.edu',         // Brown University
  'rice.edu',          // Rice University
  'vanderbilt.edu',    // Vanderbilt University
  'wustl.edu',         // Washington University in St. Louis
  'emory.edu',         // Emory University
  'georgetown.edu',    // Georgetown University
  'cmu.edu',           // Carnegie Mellon University
  'nyu.edu',           // New York University
  'usc.edu',           // University of Southern California
  'ucla.edu',          // University of California, Los Angeles
  'ucsd.edu',          // University of California, San Diego
  'ucsb.edu',          // University of California, Santa Barbara
  'uci.edu',           // University of California, Irvine
  'ucdavis.edu',       // University of California, Davis
  'gatech.edu',        // Georgia Institute of Technology
  'utexas.edu',        // University of Texas at Austin
  'umich.edu',         // University of Michigan
  'wisc.edu',          // University of Wisconsin-Madison
  'illinois.edu',      // University of Illinois at Urbana-Champaign
  'washington.edu',    // University of Washington
  'uw.edu',            // University of Washington
  'psu.edu',           // Pennsylvania State University
  'osu.edu',           // Ohio State University
  'umn.edu',           // University of Minnesota
  'msu.edu',           // Michigan State University
  'purdue.edu',        // Purdue University
  'indiana.edu',       // Indiana University
  'rutgers.edu',       // Rutgers University
  'umd.edu',           // University of Maryland
  'vt.edu',            // Virginia Tech
  'tamu.edu',          // Texas A&M University
  'arizona.edu',       // University of Arizona
  'colorado.edu',      // University of Colorado Boulder
  'utah.edu',          // University of Utah
  'oregonstate.edu',   // Oregon State University
  'ncsu.edu',          // North Carolina State University
  'clemson.edu',       // Clemson University
  'virginia.edu',      // University of Virginia
  'unc.edu',           // University of North Carolina at Chapel Hill
  'miami.edu',         // University of Miami
  'boston.edu',        // Boston University
  'northeastern.edu',  // Northeastern University
  'tufts.edu',         // Tufts University
  'brandeis.edu',      // Brandeis University
  'wpi.edu',           // Worcester Polytechnic Institute
  'rpi.edu',           // Rensselaer Polytechnic Institute
  'case.edu',          // Case Western Reserve University
  'jhu.edu',           // Johns Hopkins University
  
  // カナダの大学
  'utoronto.ca',       // University of Toronto
  'ubc.ca',            // University of British Columbia
  'mcgill.ca',         // McGill University
  'uwaterloo.ca',      // University of Waterloo
  'queensu.ca',        // Queen's University
  'mcmaster.ca',       // McMaster University
  'ualberta.ca',       // University of Alberta
  'ucalgary.ca',       // University of Calgary
  'sfu.ca',            // Simon Fraser University
  'concordia.ca',      // Concordia University
  'yorku.ca',          // York University
  'carleton.ca',       // Carleton University
  'uottawa.ca',        // University of Ottawa
  'dal.ca',            // Dalhousie University
  'mun.ca',            // Memorial University of Newfoundland
  
  // イギリスの大学
  'ox.ac.uk',          // University of Oxford
  'cam.ac.uk',         // University of Cambridge
  'imperial.ac.uk',    // Imperial College London
  'ucl.ac.uk',         // University College London
  'kcl.ac.uk',         // King's College London
  'lse.ac.uk',         // London School of Economics
  'ed.ac.uk',          // University of Edinburgh
  'gla.ac.uk',         // University of Glasgow
  'st-andrews.ac.uk',  // University of St Andrews
  'manchester.ac.uk',  // University of Manchester
  'bristol.ac.uk',     // University of Bristol
  'warwick.ac.uk',     // University of Warwick
  'birmingham.ac.uk',  // University of Birmingham
  'leeds.ac.uk',       // University of Leeds
  'sheffield.ac.uk',   // University of Sheffield
  'nottingham.ac.uk',  // University of Nottingham
  'southampton.ac.uk', // University of Southampton
  'durham.ac.uk',      // Durham University
  'york.ac.uk',        // University of York
  'exeter.ac.uk',      // University of Exeter
  'bath.ac.uk',        // University of Bath
  'lancaster.ac.uk',   // Lancaster University
  'lboro.ac.uk',       // Loughborough University
  'surrey.ac.uk',      // University of Surrey
  'sussex.ac.uk',      // University of Sussex
  'cardiff.ac.uk',     // Cardiff University
  'qub.ac.uk',         // Queen's University Belfast
  
  // オーストラリアの大学
  'anu.edu.au',        // Australian National University
  'unimelb.edu.au',    // University of Melbourne
  'sydney.edu.au',     // University of Sydney
  'unsw.edu.au',       // University of New South Wales
  'uq.edu.au',         // University of Queensland
  'monash.edu.au',     // Monash University
  'adelaide.edu.au',   // University of Adelaide
  'uwa.edu.au',        // University of Western Australia
  'uts.edu.au',        // University of Technology Sydney
  'rmit.edu.au',       // RMIT University
  'qut.edu.au',        // Queensland University of Technology
  'curtin.edu.au',     // Curtin University
  'griffith.edu.au',   // Griffith University
  'deakin.edu.au',     // Deakin University
  'macquarie.edu.au',  // Macquarie University
  'wsu.edu.au',        // Western Sydney University
  'unisa.edu.au',      // University of South Australia
  'flinders.edu.au',   // Flinders University
  'murdoch.edu.au',    // Murdoch University
  'utas.edu.au',       // University of Tasmania
  'cdu.edu.au',        // Charles Darwin University
  
  // ニュージーランドの大学
  'auckland.ac.nz',    // University of Auckland
  'otago.ac.nz',       // University of Otago
  'canterbury.ac.nz',  // University of Canterbury
  'victoria.ac.nz',    // Victoria University of Wellington
  'waikato.ac.nz',     // University of Waikato
  'massey.ac.nz',      // Massey University
  'lincoln.ac.nz',     // Lincoln University
  'aut.ac.nz',         // Auckland University of Technology
  
  // ドイツの大学
  'tum.de',            // Technical University of Munich
  'lmu.de',            // Ludwig Maximilian University of Munich
  'kit.edu',           // Karlsruhe Institute of Technology
  'rwth-aachen.de',    // RWTH Aachen University
  'uni-heidelberg.de', // Heidelberg University
  'uni-freiburg.de',   // University of Freiburg
  'uni-tuebingen.de',  // University of Tübingen
  'uni-goettingen.de', // University of Göttingen
  'uni-bonn.de',       // University of Bonn
  'uni-hamburg.de',    // University of Hamburg
  'fu-berlin.de',      // Free University of Berlin
  'hu-berlin.de',      // Humboldt University of Berlin
  'tu-berlin.de',      // Technical University of Berlin
  'uni-koeln.de',      // University of Cologne
  'uni-muenster.de',   // University of Münster
  'uni-wuerzburg.de',  // University of Würzburg
  'uni-konstanz.de',   // University of Konstanz
  'uni-mannheim.de',   // University of Mannheim
  'uni-stuttgart.de',  // University of Stuttgart
  'tu-dresden.de',     // Technical University of Dresden
  
  // フランスの大学
  'sorbonne-universite.fr', // Sorbonne University
  'ens.fr',            // École Normale Supérieure
  'polytechnique.edu', // École Polytechnique
  'sciences-po.fr',    // Sciences Po
  'u-psl.fr',          // PSL University
  'universite-paris-saclay.fr', // University of Paris-Saclay
  'univ-lyon1.fr',     // University of Lyon 1
  'univ-grenoble-alpes.fr', // University of Grenoble Alpes
  'univ-amu.fr',       // Aix-Marseille University
  'univ-toulouse.fr',  // University of Toulouse
  'univ-lille.fr',     // University of Lille
  'univ-nantes.fr',    // University of Nantes
  'univ-rennes1.fr',   // University of Rennes 1
  'univ-bordeaux.fr',  // University of Bordeaux
  'univ-montpellier.fr', // University of Montpellier
  'univ-nice.fr',      // University of Nice Sophia Antipolis
  'univ-paris1.fr',    // Panthéon-Sorbonne University
  'univ-paris-diderot.fr', // University of Paris Diderot
  'univ-paris-est.fr', // University of Paris-Est
  'univ-paris13.fr',   // University of Paris 13
  
  // その他の国の主要大学
  'ntu.edu.sg',        // Nanyang Technological University (Singapore)
  'nus.edu.sg',        // National University of Singapore
  'smu.edu.sg',        // Singapore Management University
  'sutd.edu.sg',       // Singapore University of Technology and Design
  'hku.hk',            // University of Hong Kong
  'cuhk.edu.hk',       // Chinese University of Hong Kong
  'ust.hk',            // Hong Kong University of Science and Technology
  'cityu.edu.hk',      // City University of Hong Kong
  'polyu.edu.hk',      // Hong Kong Polytechnic University
  'kaist.ac.kr',       // Korea Advanced Institute of Science and Technology
  'snu.ac.kr',         // Seoul National University
  'yonsei.ac.kr',      // Yonsei University
  'korea.ac.kr',       // Korea University
  'postech.ac.kr',     // Pohang University of Science and Technology
  'tsinghua.edu.cn',   // Tsinghua University
  'pku.edu.cn',        // Peking University
  'fudan.edu.cn',      // Fudan University
  'sjtu.edu.cn',       // Shanghai Jiao Tong University
  'zju.edu.cn',        // Zhejiang University
  'ustc.edu.cn',       // University of Science and Technology of China
  'nus.edu.tw',        // National University of Singapore Taiwan
  'ntu.edu.tw',        // National Taiwan University
  'nctu.edu.tw',       // National Chiao Tung University
  'ncu.edu.tw',        // National Central University
  'ncku.edu.tw',       // National Cheng Kung University
  'iitb.ac.in',        // Indian Institute of Technology Bombay
  'iitd.ac.in',        // Indian Institute of Technology Delhi
  'iitk.ac.in',        // Indian Institute of Technology Kanpur
  'iitm.ac.in',        // Indian Institute of Technology Madras
  'iisc.ac.in',        // Indian Institute of Science
  'iimb.ac.in',        // Indian Institute of Management Bangalore
  'iima.ac.in',        // Indian Institute of Management Ahmedabad
  'iimk.ac.in',        // Indian Institute of Management Kozhikode
  'iitg.ac.in',        // Indian Institute of Technology Guwahati
  'iith.ac.in',        // Indian Institute of Technology Hyderabad
  'iitbhu.ac.in',      // Indian Institute of Technology (BHU) Varanasi
  'epfl.ch',           // École Polytechnique Fédérale de Lausanne
  'ethz.ch',           // ETH Zurich
  'unige.ch',          // University of Geneva
  'unil.ch',           // University of Lausanne
  'unibas.ch',         // University of Basel
  'uzh.ch',            // University of Zurich
  'unibe.ch',          // University of Bern
  'unisg.ch',          // University of St. Gallen
  'kth.se',            // KTH Royal Institute of Technology
  'lu.se',             // Lund University
  'gu.se',             // University of Gothenburg
  'su.se',             // Stockholm University
  'uu.se',             // Uppsala University
  'liu.se',            // Linköping University
  'chalmers.se',       // Chalmers University of Technology
  'uio.no',            // University of Oslo
  'ntnu.no',           // Norwegian University of Science and Technology
  'uib.no',            // University of Bergen
  'uit.no',            // University of Tromsø
  'nmbu.no',           // Norwegian University of Life Sciences
  'dtu.dk',            // Technical University of Denmark
  'ku.dk',             // University of Copenhagen
  'au.dk',             // Aarhus University
  'cbs.dk',            // Copenhagen Business School
  'ruc.dk',            // Roskilde University
  'sdu.dk',            // University of Southern Denmark
  'abo.fi',            // Åbo Akademi University
  'aalto.fi',          // Aalto University
  'helsinki.fi',       // University of Helsinki
  'utu.fi',            // University of Turku
  'tuni.fi',           // Tampere University
  'jyu.fi',            // University of Jyväskylä
  'uef.fi',            // University of Eastern Finland
  'oulu.fi'            // University of Oulu
]

// メールアドレスが大学ドメインかどうかをチェック
export const isUniversityEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  
  const lowercaseEmail = email.toLowerCase()
  return UNIVERSITY_DOMAINS.some(domain => 
    lowercaseEmail.endsWith(`@${domain}`)
  )
}

// 大学ドメインのバリデーション用エラーメッセージ
export const getEmailValidationError = (email: string): string | null => {
  if (!email) return "メールアドレスを入力してください"
  
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "有効なメールアドレスを入力してください"
  }
  
  // 大学ドメインチェックを無効化
  // if (!isUniversityEmail(email)) {
  //   return "大学等の教育機関のメールアドレスを入力してください"
  // }
  
  return null
}

// 大学名からドメインを推測する関数（オプション）
export const suggestEmailDomain = (universityName: string): string | null => {
  const domainMapping: { [key: string]: string } = {
    '筑波大学': 'u.tsukuba.ac.jp',
    '東京大学': 'u-tokyo.ac.jp',
    '京都大学': 'kyoto-u.ac.jp',
    '大阪大学': 'osaka-u.ac.jp',
    '名古屋大学': 'nagoya-u.ac.jp',
    '東北大学': 'tohoku.ac.jp',
    '九州大学': 'kyushu-u.ac.jp',
    '北海道大学': 'hokudai.ac.jp',
    '東京工業大学': 'titech.ac.jp',
    '一橋大学': 'hit-u.ac.jp',
    '早稲田大学': 'waseda.jp',
    '慶應義塾大学': 'keio.jp',
    '上智大学': 'sophia.ac.jp',
    '明治大学': 'meiji.ac.jp',
    '青山学院大学': 'aoyama.ac.jp',
    '立教大学': 'rikkyo.ac.jp',
    '中央大学': 'chuo-u.ac.jp',
    '法政大学': 'hosei.ac.jp',
    // 必要に応じて追加
  }
  
  return domainMapping[universityName] || null
}