import type { StyleId } from '@/types';

export type StyleCategory = 'hot' | 'business' | 'social' | 'anime' | 'illustration' | 'id_photo' | 'couple';

export interface StyleCategoryDef {
  id: StyleCategory | 'all';
  zh: string;
  en: string;
  ja: string;
}

export const STYLE_CATEGORIES: StyleCategoryDef[] = [
  { id: 'all',          zh: '全部',   en: 'All',       ja: '全て' },
  { id: 'hot',          zh: '热门',   en: 'Hot',       ja: '人気' },
  { id: 'business',     zh: '商务',   en: 'Business',  ja: 'ビジネス' },
  { id: 'social',       zh: '社交',   en: 'Social',    ja: 'SNS' },
  { id: 'anime',        zh: '动漫',   en: 'Anime',     ja: 'アニメ' },
  { id: 'illustration', zh: '插画',   en: 'Art',       ja: 'イラスト' },
  { id: 'id_photo',     zh: '证件照', en: 'ID Photo',  ja: '証明写真' },
  { id: 'couple',       zh: '情侣',   en: 'Couple',    ja: 'カップル' },
];

export const STYLE_CATEGORY_MAP: Record<StyleId, StyleCategory[]> = {
  anime_basic:      ['hot', 'social', 'anime'],
  soft_cartoon:     ['social', 'illustration'],
  cute_pet:         ['social'],
  simple_icon:      ['social', 'illustration'],
  '3d_cartoon':     ['hot', 'social'],
  anime_pro:        ['hot', 'anime'],
  soft_storybook:   ['illustration'],
  cyberpunk:        ['social', 'illustration'],
  comic_hero:       ['illustration', 'social'],
  fashion_avatar:   ['hot', 'social'],
  business_profile: ['business', 'id_photo'],
  pet_portrait_pro: ['social'],
  couple_avatar:    ['couple', 'social'],
  kawaii_icon:      ['hot', 'social'],
  ghibli:           ['hot', 'anime'],
  oil_painting:     ['illustration'],
  pixel_art:        ['social', 'illustration'],
  pop_art:          ['social', 'illustration'],
  pencil_sketch:    ['illustration'],
  van_gogh:         ['illustration'],
  lego_figure:      ['hot', 'social'],
  action_figure:    ['hot', 'social'],
  claymation:       ['social'],
  sumi_e:           ['illustration'],
  dark_fantasy:     ['social', 'illustration'],
  kpop_idol:        ['hot', 'social'],
  neon_portrait:    ['social'],
  vintage_film:     ['social'],
  ukiyo_e:          ['illustration'],
  tarot_card:       ['illustration'],
  webtoon:          ['hot', 'anime'],
  sticker_art:      ['social'],
  '3d_clay':        ['hot', 'social'],
  impressionist:    ['illustration'],
};

export const STYLE_USE_CASE: Record<StyleId, { zh: string; en: string; ja: string }> = {
  anime_basic:      { zh: '社交头像 · 个人主页',   en: 'Social · Profile',         ja: 'SNS・プロフィール' },
  soft_cartoon:     { zh: '社交头像 · 温暖风格',   en: 'Social · Warm Style',       ja: 'SNS・ほっこり系' },
  cute_pet:         { zh: '宠物 · 社交头像',       en: 'Pet · Social Avatar',       ja: 'ペット・SNSアバター' },
  simple_icon:      { zh: '品牌图标 · 徽标',       en: 'Brand · Logo Icon',         ja: 'ブランド・ロゴ' },
  '3d_cartoon':     { zh: '游戏头像 · 3D 形象',    en: 'Gaming · 3D Avatar',        ja: 'ゲーム・3Dアバター' },
  anime_pro:        { zh: '动漫 IP · 虚拟主播',    en: 'Anime IP · VTuber',         ja: 'アニメIP・VTuber' },
  soft_storybook:   { zh: '绘本风 · 儿童插图',     en: 'Storybook · Children',      ja: '絵本・子ども向け' },
  cyberpunk:        { zh: '赛博朋克 · 科幻风',     en: 'Cyberpunk · Sci-Fi',        ja: 'サイバーパンク' },
  comic_hero:       { zh: '漫画英雄 · 创意头像',   en: 'Comic Hero · Creative',     ja: 'コミックヒーロー' },
  fashion_avatar:   { zh: '时尚写真 · 杂志封面',   en: 'Fashion · Magazine Cover',  ja: 'ファッション・雑誌' },
  business_profile: { zh: '职场头像 · 简历照',     en: 'Business · Resume Photo',   ja: 'ビジネス・履歴書' },
  pet_portrait_pro: { zh: '宠物艺术写真',          en: 'Fine Art Pet Portrait',     ja: 'ペット芸術写真' },
  couple_avatar:    { zh: '情侣头像套装',          en: 'Couple Avatar Set',         ja: 'カップルアバター' },
  kawaii_icon:      { zh: '可爱风 · 小红书封面',   en: 'Kawaii · Social Media',     ja: 'かわいい・SNS映え' },
  ghibli:           { zh: '动漫风 · 温暖头像',    en: 'Anime · Warm Avatar',        ja: 'アニメ・温かみ系' },
  oil_painting:     { zh: '艺术肖像 · 收藏品',    en: 'Art Portrait · Collectible', ja: '芸術肖像・コレクション' },
  pixel_art:        { zh: '游戏头像 · 复古风',    en: 'Gaming · Retro Style',       ja: 'ゲーム・レトロ系' },
  pop_art:          { zh: '个性头像 · 艺术装饰',  en: 'Creative · Art Print',       ja: '個性系・アートプリント' },
  pencil_sketch:    { zh: '素描风 · 艺术写真',    en: 'Minimal · Art Portrait',     ja: 'スケッチ・芸術系' },
  van_gogh:         { zh: '艺术风 · 个性头像',    en: 'Fine Art · Creative',        ja: 'アート系・個性派' },
  lego_figure:      { zh: '趣味头像 · 礼物',      en: 'Fun · Gift Idea',            ja: 'おもしろ系・プレゼント' },
  action_figure:    { zh: '手办风 · 礼物',        en: 'Figure · Gift Art',          ja: 'フィギュア系・プレゼント' },
  claymation:       { zh: '定格动画风',            en: 'Claymation Style',           ja: 'クレイアニメ系' },
  sumi_e:           { zh: '水墨风 · 东方艺术',    en: 'East Asian Ink Art',         ja: '水墨画・東洋アート' },
  dark_fantasy:     { zh: '游戏角色 · 暗黑系',    en: 'RPG Character · Dark',       ja: 'RPGキャラ・ダーク系' },
  kpop_idol:        { zh: '韩系美颜 · 偶像风',    en: 'K-beauty · Idol Style',      ja: 'K美容・アイドル系' },
  neon_portrait:    { zh: '夜店风 · 赛博感',      en: 'Retrowave · Neon Vibe',      ja: 'ネオン・シンセウェーブ系' },
  vintage_film:     { zh: '复古胶片 · 怀旧风',    en: 'Vintage · Nostalgic Film',   ja: 'ヴィンテージ・レトロ系' },
  ukiyo_e:          { zh: '浮世绘 · 和风艺术',    en: 'Japanese Art · Edo Style',   ja: '浮世絵・和風アート' },
  tarot_card:       { zh: '神秘风 · 魔法系',      en: 'Mystical · Magic Theme',     ja: '神秘系・魔法テーマ' },
  webtoon:          { zh: '韩漫风 · SNS头像',     en: 'Manhwa · K-style Avatar',    ja: 'マンファ・K系SNS' },
  sticker_art:      { zh: '贴纸风 · 社交头像',    en: 'Sticker · SNS Avatar',       ja: 'スタンプ・SNSアバター' },
  '3d_clay':        { zh: '黏土风 · 创意头像',    en: '3D Clay · Creative Avatar',  ja: '3Dクレイ・クリエイティブ' },
  impressionist:    { zh: '印象派 · 艺术头像',    en: 'Fine Art · Impressionist',   ja: '印象派・ファインアート' },
};

export interface UseCaseDef {
  id: string;
  zh: string;
  en: string;
  ja: string;
  styleId: StyleId;
}

export const USE_CASES: UseCaseDef[] = [
  { id: 'social',   zh: '社交头像', en: 'Social',   ja: 'SNS',        styleId: 'anime_basic' },
  { id: 'business', zh: '职场头像', en: 'Business', ja: 'ビジネス',   styleId: 'business_profile' },
  { id: 'fashion',  zh: '杂志风',   en: 'Fashion',  ja: 'ファッション', styleId: 'fashion_avatar' },
  { id: 'anime',    zh: '动漫风',   en: 'Anime',    ja: 'アニメ',      styleId: 'anime_pro' },
  { id: 'cute',     zh: '可爱风',   en: 'Kawaii',   ja: 'かわいい',   styleId: 'kawaii_icon' },
  { id: 'couple',   zh: '情侣',     en: 'Couple',   ja: 'カップル',   styleId: 'couple_avatar' },
];

export const QUICK_REFINEMENTS: { zh: string; en: string; ja: string }[] = [
  { zh: '更像本人',     en: 'Look more like me',       ja: '本人らしく' },
  { zh: '背景更高级',   en: 'Premium background',      ja: '背景をリッチに' },
  { zh: '皮肤更自然',   en: 'Natural skin tone',       ja: '肌をナチュラルに' },
  { zh: '换商务西装',   en: 'Business suit',           ja: 'スーツ姿に' },
  { zh: '增强五官立体', en: 'Enhance facial features', ja: '顔立ちを際立てて' },
];
