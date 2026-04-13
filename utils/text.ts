import type {
  CollectionType,
  Subject,
  SubjectType,
  WebHookCollection,
} from "../types/WebhookCollection";

export function tagText(subject_type: SubjectType, nickname: string) {
  const tag_format: Record<SubjectType, string> = {
    1: "$nickname读过的书",
    2: "$nickname的追番",
    3: "$nickname听过的音乐",
    4: "$nickname玩过的游戏",
    6: "$nickname看过的剧",
  };

  return "#" + tag_format[subject_type].replace("$nickname", nickname);
}

export function subjectText(subject: Subject, type: CollectionType, nickname: string) {
  const desire_formats: Record<SubjectType, string> = {
    1: "想读",
    2: "想看",
    3: "想听",
    4: "想玩",
    6: "想看",
  };

  const done_formats: Record<SubjectType, string> = {
    1: "读过",
    2: "看过",
    3: "听过",
    4: "玩过",
    6: "看过",
  };

  const watching_formats: Record<SubjectType, string> = {
    1: "在读",
    2: "在看",
    3: "在听",
    4: "在玩",
    6: "在看",
  };

  let action_text = "收藏了";

  switch (type) {
    case 1:
      action_text = desire_formats[subject.type];
      break;
    case 2:
      action_text = done_formats[subject.type];
      break;
    case 3:
      action_text = watching_formats[subject.type];
      break;
    case 4:
      action_text = "搁置了";
      break;
    case 5:
      action_text = "抛弃了";
      break;
  }

  const subject_name = subject.name_cn || subject.name;

  return `${nickname} ${action_text} <a href="https://bgm.tv/subject/${subject.id}">${subject_name}</a>`;
}

export function genFullMessage(info: WebHookCollection, nicknameOverride?: string) {
  const nickname = nicknameOverride || info.data.user.nickname;

  return `${tagText(info.data.subject.type, nickname)}\n${subjectText(
    info.data.subject,
    info.data.type,
    nickname,
  )}`;
}

export function getBangumiImage(info: WebHookCollection) {
  const image = info.data.subject.image;
  if (!image) return undefined;

  return image
    .replace("http://", "https://")
    .replace("/cover/c/", "/cover/l/");
}
