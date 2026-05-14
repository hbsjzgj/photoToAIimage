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
