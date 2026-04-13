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

function toLargeMonoCover(image?: string): string | undefined {
  const normalized = normalizeUrl(image);
  if (!normalized) return undefined;

  // mono cover in webhook payload is commonly /pic/crt/g/... (thumb).
  // Use /pic/crt/l/... as the larger version.
  return normalized.replace("/pic/crt/g/", "/pic/crt/l/").replace("/pic/crt/s/", "/pic/crt/l/");
}

function subjectName(subject: Subject): string {
  return subject.name_cn || subject.name;
}

function userLink(user: User, nicknameOverride?: string): string {
  const nickname = nicknameOverride || user.nickname;
  return `<a href="https://bgm.tv/user/${user.username}">${escapeHtml(nickname)}</a>`;
}

function compactText(text: string, maxLength = 140): string {
  const compacted = text.replace(/\s+/g, " ").trim();
  if (!compacted) return "";
  if (compacted.length <= maxLength) return compacted;
  return compacted.slice(0, Math.max(maxLength - 3, 0)) + "...";
}

function normalizeCatalogIntro(content: string): string {
  return content.replace(/\r?\n+/g, " ").replace(/\s+/g, " ").trim();
}

function clampTextForTelegram(text: string, maxLength = 1200): string {
  const compacted = text.replace(/\s+/g, " ").trim();
  if (!compacted) return "";
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.max(maxLength - 3, 0))}...`;
}

function linkifyPlainTextUrls(text: string): string {
  const urlPattern = /https?:\/\/[^\s<>"']+/g;
  let cursor = 0;
  let result = "";
  let matched: RegExpExecArray | null;

  while ((matched = urlPattern.exec(text)) !== null) {
    const full = matched[0];
    const start = matched.index;
    const end = start + full.length;

    result += escapeHtml(text.slice(cursor, start));

    const clean = full.replace(/[),.;!?，。；！？”’）】]+$/u, "");
    const tail = full.slice(clean.length);
    const href = normalizeUrl(clean);

    if (href) {
      result += `<a href="${escapeHtml(href)}">${escapeHtml(clean)}</a>${escapeHtml(tail)}`;
    } else {
      result += escapeHtml(full);
    }

    cursor = end;
  }

  result += escapeHtml(text.slice(cursor));
  return result;
}

function formatFoldableCatalogIntro(introRaw: string): string {
  const normalized = clampTextForTelegram(introRaw, 1200);
  if (!normalized) return "";
  const linked = linkifyPlainTextUrls(normalized);

  // Use spoiler to keep long intros collapsed by default in Telegram.
  if (normalized.length > 80) {
    return `    简介：<tg-spoiler>${linked}</tg-spoiler>`;
  }

  return `    简介：${linked}`;
}

function formatTimeAgo(ts: number): string {
  const now = Math.floor(Date.now() / 1000);
  const input = Math.floor(ts);

  if (!Number.isFinite(input) || input <= 0) return "";

  const diff = Math.max(1, now - input);

  if (diff < 60) return `${diff}秒前`;
  if (diff < 60 * 60) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 60 * 60 * 24) return `${Math.floor(diff / (60 * 60))}小时前`;
  if (diff < 60 * 60 * 24 * 30) return `${Math.floor(diff / (60 * 60 * 24))}天前`;
  if (diff < 60 * 60 * 24 * 365) return `${Math.floor(diff / (60 * 60 * 24 * 30))}个月前`;
  return `${Math.floor(diff / (60 * 60 * 24 * 365))}年前`;
}

function formatRateStars(rate: number): string {
  const score = Math.floor(rate);
  if (!Number.isFinite(score) || score <= 0) return "";

  const filled = Math.max(1, Math.min(5, Math.round(score / 2)));
  return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
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

  const comment = compactText(info.data.comment, 260);
  if (comment) {
    lines.push(`吐槽了 ${escapeHtml(comment)}`);
  }

  const timePart = formatTimeAgo(info.data.ts);
  const starPart = formatRateStars(info.data.rate);
  if (timePart && starPart) {
    lines.push(`${timePart} ${starPart}`);
  } else if (timePart) {
    lines.push(timePart);
  }

  return lines.join("\n");
}

function formatSayMessage(info: WebHookSay, nicknameOverride?: string): string {
  const lines: string[] = [];

  const content = compactText(info.data.content, 300);
  if (content) {
    lines.push(`${userLink(info.data.user, nicknameOverride)} 吐槽了 ${escapeHtml(content)}`);
  } else {
    lines.push(`${userLink(info.data.user, nicknameOverride)} 吐槽了`);
  }

  const replyUrl = normalizeUrl(info.data.url);
  const timePart = formatTimeAgo(info.data.ts);

  if (replyUrl && timePart) {
    lines.push(`<a href="${replyUrl}">回复</a> ${timePart}`);
  } else if (replyUrl) {
    lines.push(`<a href="${replyUrl}">回复</a>`);
  } else if (timePart) {
    lines.push(timePart);
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
  } else if (typeof info.data.vols === "number" && info.data.vols > 0) {
    lines.push(
      `${userLink(info.data.user, nicknameOverride)} ${epAction(
        info.data.subject.type,
        info.data.type,
      )} ${subject} ${formatEpProgress(info)}`,
    );
  } else {
    lines.push(
      `${userLink(info.data.user, nicknameOverride)} ${epAction(
        info.data.subject.type,
        info.data.type,
      )} ${formatEpProgress(info)}`,
    );
    lines.push(subject);
  }

  const timePart = formatTimeAgo(info.data.ts);
  if (timePart) lines.push(timePart);

  return lines.join("\n");
}

function formatMonoMessage(info: WebHookMono, nicknameOverride?: string): string {
  const isCharacter = info.data.mono.id.startsWith("character/");
  const monoType = isCharacter ? "角色" : "人物";
  const monoName = info.data.mono.name_cn || info.data.mono.name;
  const monoUrl = `https://bgm.tv/${info.data.mono.id}`;

  const lines = [
    `${userLink(info.data.user, nicknameOverride)} 收藏了${monoType} <a href="${monoUrl}">${escapeHtml(
      monoName,
    )}</a>`,
  ];

  const timePart = formatTimeAgo(info.data.ts);
  if (timePart) lines.push(timePart);

  return lines.join("\n");
}

function formatFriendMessage(info: WebHookFriend, nicknameOverride?: string): string {
  const friendName = info.data.friend.nickname || info.data.friend.username;
  const friendUrl = `https://bgm.tv/user/${info.data.friend.username}`;

  const lines = [
    `${userLink(info.data.user, nicknameOverride)} 将 <a href="${friendUrl}">${escapeHtml(
      friendName,
    )}</a> 加为了好友`,
  ];

  const timePart = formatTimeAgo(info.data.ts);
  if (timePart) lines.push(timePart);

  return lines.join("\n");
}

function formatGroupMessage(info: WebHookGroup, nicknameOverride?: string): string {
  const lines: string[] = [];

  lines.push(
    `${userLink(info.data.user, nicknameOverride)} 加入了 <a href="https://bgm.tv/group/${
      info.data.group.id
    }">${escapeHtml(info.data.group.title)}</a> 小组`,
  );

  const summary = compactText(info.data.group.content, 200);
  if (summary) {
    lines.push(`    ${escapeHtml(summary)}`);
  }

  const timePart = formatTimeAgo(info.data.ts);
  if (timePart) lines.push(timePart);

  return lines.join("\n");
}

function formatCatalogMessage(info: WebHookCatalog, nicknameOverride?: string): string {
  const lines: string[] = [];

  lines.push(
    `${userLink(info.data.user, nicknameOverride)} 收藏了目录： <a href="https://bgm.tv/index/${
      info.data.catalog.id
    }">${escapeHtml(info.data.catalog.title)}</a>`,
  );

  const intro = normalizeCatalogIntro(info.data.catalog.content);
  if (intro) {
    lines.push(formatFoldableCatalogIntro(intro));
  }

  const timePart = formatTimeAgo(info.data.ts);
  if (timePart) lines.push(timePart);

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
      return toLargeMonoCover(info.data.mono.cover);
    case "friend":
      return normalizeUrl(info.data.friend.avatar);
    case "group":
      return normalizeUrl(info.data.group.cover);
    case "say":
    case "catalog":
      return undefined;
  }
}
