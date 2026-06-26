import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NpcProfile {
  name: string;
  appearance: string;     // 外貌描述
  personality: string;    // 性格特点
  background: string;     // 背景故事
  dialogue_style: string; // 说话风格/语气
  mood: string;           // 当前情绪
  knows: string;          // 知道的信息/秘密
}

interface WorldTemplate {
  name: string;
  description: string;
  setting: string;
  storyGoal: string;       // 终极目标
  locations: Array<{ name: string; desc: string; exits: Record<string, string>; safe: boolean }>;
  npcs: NpcProfile[];
}

const WORLDS: WorldTemplate[] = [
  {
    name: '艾泽拉斯',
    description: '一个充满魔法与龙的经典奇幻世界。古老的森林、险峻的山脉和神秘的遗迹等待着勇敢的冒险者。',
    setting: 'fantasy',
    storyGoal: '击败盘踞在迷雾山脉的恶龙，解救被囚禁的公主，为王国带来和平。',
    locations: [
      { name: '晨风村', desc: '一个宁静的小村庄，坐落在青翠的山谷中。炊烟袅袅，村民们开始了一天的劳作。', exits: { north: '迷雾森林', east: '古老之路', south: '风吟平原' }, safe: true },
      { name: '迷雾森林', desc: '浓密的雾气笼罩着古老的树木，只有微弱的阳光能穿透层层树冠。', exits: { south: '晨风村', east: '山丘遗迹' }, safe: false },
    ],
    npcs: [
      { name: '铁匠托比', appearance: '魁梧的光头壮汉，围裙上满是铁锈和炭灰', personality: '豪爽直率，嗓门大，热心肠', background: '曾是王都的御用铁匠，因不愿为暴君铸造兵器而逃到晨风村', dialogue_style: '语气粗犷，喜欢拍人肩膀，偶尔冒出几句俚语', mood: '正在专注地敲打一块剑胚', knows: '知道迷雾森林深处藏着古代遗迹，以及一条安全的路线' },
    ],
  },
  {
    name: '青云仙途',
    description: '远古修仙世界，灵气充盈，万族林立。你本是一介凡人，偶得仙缘，从此踏上漫漫修行路。',
    setting: 'xianxia',
    storyGoal: '修复受损的灵根，通过青云宗的考核，最终登上天榜榜首，飞升上界。',
    locations: [
      { name: '青云镇', desc: '坐落于青云山脚下的小镇，空气中弥漫着淡淡的灵气。镇上常有修士往来，各种灵材商铺林立。', exits: { north: '青云山门', east: '妖兽森林', west: '凡人国都' }, safe: true },
      { name: '青云山门', desc: '青云宗的所在地，山门巍峨，云雾缭绕。隐约可见山巅的仙宫楼阁。', exits: { south: '青云镇' }, safe: false },
    ],
    npcs: [
      { name: '云游道人', appearance: '白发长须，身着青色道袍，腰间挂着一个葫芦', personality: '高深莫测，说话说一半，爱打哑谜', background: '据说是青云宗上代长老，因情劫自贬凡间云游百年', dialogue_style: '语调缓慢，句句暗藏玄机，时不时大笑三声', mood: '正倚着镇口的槐树打量你', knows: '知道如何修复你体内受损的灵根，但需要你去试炼山林取一味药' },
    ],
  },
  {
    name: '魂穿之九天仙门',
    description: '你一觉醒来，发现自己魂穿到了一个玄幻世界，附身在一个被逐出师门的废柴弟子身上。这个世界以武为尊，宗门林立，暗流涌动。你必须凭借前世的知识和智慧，在这个弱肉强食的世界中活下去。',
    setting: 'xianxia',
    storyGoal: '查明十年前被逐出师门的真相，洗刷冤屈，重归九天仙门，并揭开隐藏在宗门深处的惊天秘密。',
    locations: [
      { name: '宗门山脚', desc: '巍峨的山门矗立在云雾之中，石阶上长满了青苔。远处的仙宫楼阁若隐若现，但你已被剥夺了佩剑，只能仰望。山脚下的小镇里，贩夫走卒来往不绝。', exits: { north: '外门杂院', east: '小镇坊市', south: '乱葬岗' }, safe: true },
      { name: '外门杂院', desc: '破败的院落，曾经是你修炼的地方。墙上还挂着你被撕碎的入门帖，几个外门弟子在远处窃窃私语。', exits: { south: '宗门山脚' }, safe: false },
    ],
    npcs: [
      { name: '守门老人', appearance: '破旧蓑衣下身形佝偻，但一双眼睛锐利如鹰', personality: '沉默寡言，眼神中藏着故事，偶尔说出一句话就让人震惊', background: '曾是九天仙门的护法长老，因当年那场变故自废修为，甘愿守山百年', dialogue_style: '嗓音沙哑，说话极简，每个字都像是从喉咙里挤出来的', mood: '扫着台阶上的落叶，目光不经意地扫过你', knows: '知道当年你被逐出师门的真相，也知道一条悄悄重返内门的密道' },
    ],
  },
  {
    name: '心动咖啡馆',
    description: '你是一家开在大学城旁的咖啡馆的新店长。每天都有形形色色的客人光临——温柔的常客、高冷的上班族、神秘的调酒师。在这个小小的空间里，爱情悄然萌芽。',
    setting: 'romance',
    storyGoal: '与那个每天下午三点来的神秘客人从陌生到熟悉，解开他心中的秘密，最终收获一段真挚的感情。',
    locations: [
      { name: '咖啡馆内', desc: '暖黄的灯光洒在木质桌面上，空气中飘着咖啡豆的香气。窗外的梧桐树沙沙作响，墙上的黑板写着今日特调。角落里有个人正安静地看着你。', exits: { north: '吧台', east: '大学城', west: '厨房' }, safe: true },
      { name: '大学城步行街', desc: '熙熙攘攘的街道，两边是各种小店。阳光透过梧桐树叶洒下斑驳的光影，远处传来街头艺人的吉他声。', exits: { west: '咖啡馆内' }, safe: true },
    ],
    npcs: [
      { name: '顾沉', appearance: '二十七八岁，深灰色风衣，戴一副金丝眼镜，气质温文尔雅', personality: '表面温柔有礼，偶尔流露出忧郁，似乎藏着心事', background: '每天下午三点准时来，坐在靠窗的位置，只点一杯美式咖啡，一坐就是一个下午。偶尔会在笔记本上写些什么。', dialogue_style: '声音温和低沉，说话时喜欢看着你的眼睛，偶尔会露出若有所思的微笑', mood: '正翻着一本泛旧的书，偶尔抬头看向吧台', knows: '其实是常来店里取材的小说家，正在写的故事似乎和这家咖啡馆有关' },
    ],
  },
  {
    name: '雾镇谜案',
    description: '你是一名刚到雾镇报社实习的记者。这座小镇常年被浓雾笼罩，最近接连发生了三起离奇的失踪案。警方毫无头绪，镇上的人各怀心思。你怀疑这些失踪案背后隐藏着一个更大的秘密。',
    setting: 'mystery',
    storyGoal: '调查三起失踪案背后的真相，揭露雾镇隐藏了二十年的秘密，找到真凶。',
    locations: [
      { name: '雾镇报社', desc: '老旧的报社办公室，打字机的咔嗒声此起彼伏。主编的办公桌上堆满了档案，墙上贴满了失踪者的照片和红线。窗外白雾茫茫，能见度不足十米。', exits: { north: '镇中心广场', east: '档案室' }, safe: true },
      { name: '镇中心广场', desc: '灰暗的广场中央矗立着一座古老的钟楼，大钟已经停摆了多年。广场周围的店铺大多关着门，偶尔有一两个裹紧大衣的行人匆匆穿过雾气。', exits: { south: '雾镇报社', west: '老街' }, safe: false },
    ],
    npcs: [
      { name: '陈主编', appearance: '五十多岁，花白头发，总叼着一根没点燃的烟斗', personality: '表面冷淡但暗中关心你，说话带刺，似乎知道很多内情', background: '在雾镇报社干了三十年，经历过二十年前那件事。从不谈论那段往事。', dialogue_style: '语速快，不耐烦，经常说一半就住口，用「不关你的事」打发你', mood: '坐在办公桌后，眉头紧锁地盯着失踪者的档案', knows: '三起失踪案的共同点是他们都曾调查过二十年前镇上的一起火灾' },
    ],
  },
];

async function main() {
  // 清空旧数据（按外键顺序）
  await prisma.memory.deleteMany();
  await prisma.turn.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.location.deleteMany();
  await prisma.event.deleteMany();
  await prisma.world.deleteMany();

  console.log('🧹 Cleared old data');

  for (const template of WORLDS) {
    const world = await prisma.world.create({
      data: {
        name: template.name,
        description: template.description,
        setting: template.setting,
        rules: { storyGoal: template.storyGoal } as any,
        state: { timeOfDay: 'morning', weather: 'clear', season: 'spring' } as any,
      },
    });

    const firstLoc = await prisma.location.create({
      data: {
        worldId: world.id,
        name: template.locations[0].name,
        description: template.locations[0].desc,
        exits: template.locations[0].exits as any,
        metadata: { isSafe: template.locations[0].safe, population: 80 } as any,
      },
    });

    for (let i = 1; i < template.locations.length; i++) {
      await prisma.location.create({
        data: {
          worldId: world.id,
          name: template.locations[i].name,
          description: template.locations[i].desc,
          exits: template.locations[i].exits as any,
          metadata: { isSafe: template.locations[i].safe } as any,
        },
      });
    }

    for (const npc of template.npcs) {
      await prisma.entity.create({
        data: {
          worldId: world.id,
          name: npc.name,
          type: 'npc',
          locationId: firstLoc.id,
          attributes: {
            appearance: npc.appearance,
            personality: npc.personality,
            background: npc.background,
            dialogue_style: npc.dialogue_style,
            knows: npc.knows,
          } as any,
          state: { mood: npc.mood } as any,
        },
      });
    }

    console.log(`✅ Created: ${template.name}`);
  }

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
