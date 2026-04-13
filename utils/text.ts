import type {
  CollectionType,
  StatusType,
  Subject,
  SubjectType,
  User,
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

function userLink(user: User, nicknameOverride?: string): string {
  const nickname = nicknameOverride || user.nickname;
  return `<a href="https://bgm.tv/user/${user.username}">${escapeHtml(nickname)}</a>`;
}

function compactText(text: string, maxLength = 120): string {
  const compacted = text.replace(/\s+/g, " ").trim();
  if (!compacted) return "";
  if (compacted.length <= maxLength) return compacted;
  return compacted.slice(0, Math.max(maxLength - 3, 0)) + "...";
}

function subjectAction(subjectType: SubjectType, collectionType: CollectionType): string {
  const desireMap: Record<SubjectType, string> = {
    1: "想读",
    2: "想看",
    3: "想听",
    4: "想玩",
    6: "想看",
  };

  const doneMap: Record<SubjectType, string> = {
    1: "读过",
    2: "看过",
    3: "听过",
    4: "玩过",
    6: "看过",
  };

  const watchingMap: Record<SubjectType, string> = {
    1: "在读",
    2: "在看",
    3: "在听",
    4: "在玩",
    6: "在看",
  };

  switch (collectionType) {
    case 1:
      return desireMap[subjectType];
    case 2:
      return doneMap[subjectType];
    case 3:
      return watchingMap[subjectType];
    case 4:
      return "搁置了";
    case 5:
      return "抛弃了";
  }
}

function epAction(subjectType: SubjectType, statusType: StatusType): string {
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

function formatCollectionMessage(info: WebHookCollection, nicknameOverride?: string): string {
  const lines: string[] = [];
  const subject = `<a href="https://bgm.tv/subject/${info.data.subject.id}">${escapeHtml(
    subjectName(info.data.subject),
  )}</a>`;

  lines.push(
    `${userLink(info.data.user, nicknameOverride)} ${subjectAction(
      info.data.subject.type,
      info.data.type,
    )} ${subject}`,
  );

  const comment = compactText(info.data.comment, 240);
  if (comment) {
    lines.push(escapeHtml(comment));
  }

  return lines.join("\n");
}

function formatSayMessage(info: WebHookSay, nicknameOverride?: string): string {
  const lines: string[] = [];
  const replyUrl = normalizeUrl(info.data.url);

  if (replyUrl) {
    lines.push(`${userLink(info.data.user, nicknameOverride)} 发表了新吐槽 <a href="${replyUrl}">回复</a>`);
  } else {
    lines.push(`${userLink(info.data.user, nicknameOverride)} 发表了新吐槽`);
  }

  const content = compactText(info.data.content, 300);
  if (content) {
    lines.push(escapeHtml(content));
  }

  return lines.join("\n");
}

function formatEpProgress(info: WebHookEp): string {
  if (typeof info.data.vols === "number" && info.data.vols > 0) {
    return `第${info.data.vols}卷`;
  }

  if (info.data.batch) {
    const totalEps = info.data.subject.eps;
    if (typeof totalEps === "number" && totalEps > 0) {
      return `${info.data.eps} of ${totalEps} 话`;
    }
    return `第${info.data.eps}话`;
  }

  const epName = info.data.ep.name_cn || info.data.ep.name || "";
  const label = epName ? `ep${info.data.eps} ${epName}` : `ep${info.data.eps}`;
  if (typeof info.data.ep.id === "number" && info.data.ep.id > 0) {
    return `<a href="https://bgm.tv/ep/${info.data.ep.id}">${escapeHtml(label)}</a>`;
  }

  return escapeHtml(label);
}

function formatEpMessage(info: WebHookEp, nicknameOverride?: string): string {
  const lines: string[] = [];
  const subject = `<a href="https://bgm.tv/subject/${info.data.subject.id}">${escapeHtml(
    subjectName(info.data.subject),
  )}</a>`;

  if (info.data.batch) {
    lines.push(`${userLink(info.data.user, nicknameOverride)} 完成了 ${subject} ${formatEpProgress(info)}`);
    return lines.join("\n");
  }

  if (typeof info.data.vols === "number" && info.data.vols > 0) {
    lines.push(
      `${userLink(info.data.user, nicknameOverride)} ${epAction(
        info.data.subject.type,
        info.data.type,
      )} ${subject} ${formatEpProgress(info)}`,
    );
    return lines.join("\n");
  }

  lines.push(
    `${userLink(info.data.user, nicknameOverride)} ${epAction(
      info.data.subject.type,
      info.data.type,
    )} ${formatEpProgress(info)}`,
  );
  lines.push(subject);

  return lines.join("\n");
}

function formatMonoMessage(info: WebHookMono, nicknameOverride?: string): string {
  const isCharacter = info.data.mono.id.startsWith("character/");
  const monoType = isCharacter ? "角色" : "人物";
  const monoName = info.data.mono.name_cn || info.data.mono.name;
  const monoUrl = `https://bgm.tv/${info.data.mono.id}`;

  return `${userLink(info.data.user, nicknameOverride)} 收藏了${monoType} <a href="${monoUrl}">${escapeHtml(
    monoName,
  )}</a>`;
}

function formatFriendMessage(info: WebHookFriend, nicknameOverride?: string): string {
  const friendName = info.data.friend.nickname || info.data.friend.username;
  const friendUrl = `https://bgm.tv/user/${info.data.friend.username}`;

  return `${userLink(info.data.user, nicknameOverride)} 将 <a href="${friendUrl}">${escapeHtml(
    friendName,
  )}</a> 加为了好友`;
}

function formatGroupMessage(info: WebHookGroup, nicknameOverride?: string): string {
  const lines: string[] = [];

  lines.push(
    `${userLink(info.data.user, nicknameOverride)} 加入了 <a href="https://bgm.tv/group/${
      info.data.group.id
    }">${escapeHtml(info.data.group.title)}</a> 小组`,
  );

  const summary = compactText(info.data.group.content, 140);
  if (summary) {
    lines.push(escapeHtml(summary));
  }

  return lines.join("\n");
}

function formatCatalogMessage(info: WebHookCatalog, nicknameOverride?: string): string {
  const lines: string[] = [];

  lines.push(
    `${userLink(info.data.user, nicknameOverride)} 收藏了目录： <a href="https://bgm.tv/index/${
      info.data.catalog.id
    }">${escapeHtml(info.data.catalog.title)}</a>`,
  );

  const summary = compactText(info.data.catalog.content, 140);
  if (summary) {
    lines.push(escapeHtml(summary));
  }

  return lines.join("\n");
}

export function genWebhookMessage(info: WebHookEvent, nicknameOverride?: string): string {
  switch (info.type) {
    case "collection":
      return formatCollectionMessage(info, nicknameOverride);
    case "say":
      return formatSayMessage(info, nicknameOverride);
    case "ep":
      return formatEpMessage(info, nicknameOverride);
    case "mono":
      return formatMonoMessage(info, nicknameOverride);
    case "friend":
      return formatFriendMessage(info, nicknameOverride);
    case "group":
      return formatGroupMessage(info, nicknameOverride);
    case "catalog":
      return formatCatalogMessage(info, nicknameOverride);
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
