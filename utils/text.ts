import type {
  CollectionType,
  StatusType,
  Subject,
  SubjectType,
  WebHookCatalog,
  WebHookCollection,
  WebHookEp,
  WebHookEvent,
  WebHookFriend,
  WebHookGroup,
  WebHookMono,
  WebHookSay,
} from "../types/WebhookCollection";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeUrl(input?: string): string | undefined {
  if (!input) return undefined;

  const value = input.trim();
  if (!value) return undefined;

  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http://")) return `https://${value.slice("http://".length)}`;
  if (value.startsWith("https://")) return value;

  return undefined;
}

function toLargeBangumiCover(image?: string): string | undefined {
  const normalized = normalizeUrl(image);
  if (!normalized) return undefined;

  return normalized.replace("/cover/c/", "/cover/l/");
}

function subjectName(subject: Subject): string {
  return subject.name_cn || subject.name;
}

export function tagText(subjectType: SubjectType, nickname: string): string {
  const tagFormat: Record<SubjectType, string> = {
    1: "$nickname读过的书",
    2: "$nickname的追番",
    3: "$nickname听过的音乐",
    4: "$nickname玩过的游戏",
    6: "$nickname看过的剧",
  };

  return "#" + escapeHtml(tagFormat[subjectType].replace("$nickname", nickname));
}

export function subjectText(subject: Subject, type: CollectionType, nickname: string): string {
  const desireFormats: Record<SubjectType, string> = {
    1: "想读",
    2: "想看",
    3: "想听",
    4: "想玩",
    6: "想看",
  };

  const doneFormats: Record<SubjectType, string> = {
    1: "读过",
    2: "看过",
    3: "听过",
    4: "玩过",
    6: "看过",
  };

  const watchingFormats: Record<SubjectType, string> = {
    1: "在读",
    2: "在看",
    3: "在听",
    4: "在玩",
    6: "在看",
  };

  let actionText = "收藏了";

  switch (type) {
    case 1:
      actionText = desireFormats[subject.type];
      break;
    case 2:
      actionText = doneFormats[subject.type];
      break;
    case 3:
      actionText = watchingFormats[subject.type];
      break;
    case 4:
      actionText = "搁置了";
      break;
    case 5:
      actionText = "抛弃了";
      break;
  }

  return `${escapeHtml(nickname)} ${actionText} <a href="https://bgm.tv/subject/${subject.id}">${escapeHtml(
    subjectName(subject),
  )}</a>`;
}

function resolveNickname(info: WebHookEvent, nicknameOverride?: string): string {
  return nicknameOverride || info.data.user.nickname;
}

function compactText(text: string, maxLength = 80): string {
  const compacted = text.replace(/\s+/g, " ").trim();
  if (!compacted) return "";
  if (compacted.length <= maxLength) return compacted;
  return compacted.slice(0, Math.max(maxLength - 3, 0)) + "...";
}

function episodeAction(subjectType: SubjectType, statusType: StatusType): string {
  const actionMap: Record<SubjectType, Record<StatusType, string>> = {
    1: {
      0: "更新了进度",
      1: "想读",
      2: "读过",
      3: "抛弃了",
    },
    2: {
      0: "更新了进度",
      1: "想看",
      2: "看过",
      3: "抛弃了",
    },
    3: {
      0: "更新了进度",
      1: "想听",
      2: "听过",
      3: "抛弃了",
    },
    4: {
      0: "更新了进度",
      1: "想玩",
      2: "玩过",
      3: "抛弃了",
    },
    6: {
      0: "更新了进度",
      1: "想看",
      2: "看过",
      3: "抛弃了",
    },
  };

  return actionMap[subjectType][statusType];
}

function formatEpProgress(info: WebHookEp): string {
  if (typeof info.data.vols === "number" && info.data.vols > 0) {
    return `第${info.data.vols}卷`;
  }

  if (!info.data.batch) {
    const epId = info.data.ep.id;
    const epName = info.data.ep.name_cn || info.data.ep.name || "";
    const label = epName ? `ep${info.data.eps} ${epName}` : `ep${info.data.eps}`;

    if (typeof epId === "number" && epId > 0) {
      return `<a href="https://bgm.tv/ep/${epId}">${escapeHtml(label)}</a>`;
    }

    return escapeHtml(label);
  }

  const totalEps = info.data.subject.eps;
  if (typeof totalEps === "number" && totalEps > 0) {
    return `${info.data.eps} of ${totalEps} 话`;
  }

  return `第${info.data.eps}话`;
}

function formatCollectionMessage(info: WebHookCollection, nickname: string): string {
  return `${tagText(info.data.subject.type, nickname)}\n${subjectText(
    info.data.subject,
    info.data.type,
    nickname,
  )}`;
}

function formatSayMessage(info: WebHookSay, nickname: string): string {
  const lines: string[] = [];
  const profileUrl = `https://bgm.tv/user/${info.data.user.username}`;
  const timelineUrl = normalizeUrl(info.data.url);

  lines.push(`#${escapeHtml(nickname)}的吐槽`);
  lines.push(
    timelineUrl
      ? `<a href="${profileUrl}">${escapeHtml(nickname)}</a> 发表了新吐槽 <a href="${timelineUrl}">查看时间线</a>`
      : `<a href="${profileUrl}">${escapeHtml(nickname)}</a> 发表了新吐槽`,
  );

  const content = compactText(info.data.content, 240);
  if (content) {
    lines.push(escapeHtml(content));
  }

  return lines.join("\n");
}

function formatEpMessage(info: WebHookEp, nickname: string): string {
  const tag = `#${escapeHtml(nickname)}的进度`;
  const subject = `<a href="https://bgm.tv/subject/${info.data.subject.id}">${escapeHtml(
    subjectName(info.data.subject),
  )}</a>`;
  const progress = formatEpProgress(info);

  if (info.data.batch) {
    return `${tag}\n${escapeHtml(nickname)} 完成了 ${subject} ${progress}`;
  }

  return `${tag}\n${escapeHtml(nickname)} ${episodeAction(
    info.data.subject.type,
    info.data.type,
  )} ${subject} ${progress}`;
}

function formatMonoMessage(info: WebHookMono, nickname: string): string {
  const isCharacter = info.data.mono.id.startsWith("character/");
  const monoTypeText = isCharacter ? "角色" : "人物";
  const monoName = info.data.mono.name_cn || info.data.mono.name;

  return `#${escapeHtml(nickname)}的${monoTypeText}收藏\n${escapeHtml(
    nickname,
  )} 收藏了${monoTypeText} <a href="https://bgm.tv/${info.data.mono.id}">${escapeHtml(monoName)}</a>`;
}

function formatFriendMessage(info: WebHookFriend, nickname: string): string {
  const friend = info.data.friend;
  const friendName = friend.nickname || friend.username;
  const friendUrl = `https://bgm.tv/user/${friend.username}`;

  return `#${escapeHtml(nickname)}的好友动态\n${escapeHtml(nickname)} 加了好友 <a href="${friendUrl}">${escapeHtml(
    friendName,
  )}</a>`;
}

function formatGroupMessage(info: WebHookGroup, nickname: string): string {
  const summary = compactText(info.data.group.content, 120);
  const lines = [
    `#${escapeHtml(nickname)}的小组动态`,
    `${escapeHtml(nickname)} 加入了小组 <a href="https://bgm.tv/group/${info.data.group.id}">${escapeHtml(
      info.data.group.title,
    )}</a>`,
  ];

  if (summary) {
    lines.push(escapeHtml(summary));
  }

  return lines.join("\n");
}

function formatCatalogMessage(info: WebHookCatalog, nickname: string): string {
  const summary = compactText(info.data.catalog.content, 120);
  const lines = [
    `#${escapeHtml(nickname)}的目录收藏`,
    `${escapeHtml(nickname)} 收藏了目录 <a href="https://bgm.tv/index/${info.data.catalog.id}">${escapeHtml(
      info.data.catalog.title,
    )}</a>`,
  ];

  if (summary) {
    lines.push(escapeHtml(summary));
  }

  return lines.join("\n");
}

export function genWebhookMessage(info: WebHookEvent, nicknameOverride?: string): string {
  const nickname = resolveNickname(info, nicknameOverride);

  switch (info.type) {
    case "collection":
      return formatCollectionMessage(info, nickname);
    case "say":
      return formatSayMessage(info, nickname);
    case "ep":
      return formatEpMessage(info, nickname);
    case "mono":
      return formatMonoMessage(info, nickname);
    case "friend":
      return formatFriendMessage(info, nickname);
    case "group":
      return formatGroupMessage(info, nickname);
    case "catalog":
      return formatCatalogMessage(info, nickname);
  }
}

export function getWebhookPreviewImage(info: WebHookEvent): string | undefined {
  switch (info.type) {
    case "collection":
      return toLargeBangumiCover(info.data.subject.image);
    case "ep":
      return toLargeBangumiCover(info.data.subject.image);
    case "mono":
      return normalizeUrl(info.data.mono.cover);
    case "friend":
      return normalizeUrl(info.data.friend.avatar);
    case "group":
      return normalizeUrl(info.data.group.cover);
    case "say":
    case "catalog":
      return undefined;
  }
}
