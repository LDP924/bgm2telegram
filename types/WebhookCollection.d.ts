export type SubjectType = 1 | 2 | 3 | 4 | 6;

export type RatingType = {
  rank: number;
  total: number;
  score: number;
};

export type CollectionType = 1 | 2 | 3 | 4 | 5;

export type StatusType = 0 | 1 | 2 | 3;

export type Subject = {
  id: number;
  image: string;
  name: string;
  name_cn: string;
  type: SubjectType;
  rating: RatingType;
  eps: number | "";
};

export type Ep = {
  id?: number;
  airdate?: string;
  name?: string;
  name_cn?: string;
  duration?: string;
  comment?: number;
};

export type User = {
  id: number;
  username: string;
  avatar: string;
  nickname: string;
  sign: string;
};

export type Group = {
  id: string;
  title: string;
  content: string;
  cover: string;
  create: string;
};

export type Catalog = {
  id: number;
  title: string;
  content: string;
};

export type WebHookCollection = {
  type: "collection";
  data: {
    type: CollectionType;
    rate: number;
    comment: string;
    private: boolean;
    tags: string[];
    subject: Subject;
    user: User;
    ts: number;
  };
};

export type WebHookEp = {
  type: "ep";
  data: {
    type: StatusType;
    batch: boolean;
    eps: number;
    vols?: number;
    ep: Ep;
    subject: Subject;
    user: User;
    ts: number;
  };
};

export type WebHookSay = {
  type: "say";
  data: {
    content: string;
    url: string;
    user: User;
    ts: number;
  };
};

export type WebHookMono = {
  type: "mono";
  data: {
    mono: {
      id: `${"person" | "character"}/${number}`;
      name: string;
      name_cn: string;
      cover: string;
    };
    user: User;
    ts: number;
  };
};

export type WebHookFriend = {
  type: "friend";
  data: {
    friend: User;
    user: User;
    ts: number;
  };
};

export type WebHookGroup = {
  type: "group";
  data: {
    group: Group;
    user: User;
    ts: number;
  };
};

export type WebHookCatalog = {
  type: "catalog";
  data: {
    catalog: Catalog;
    user: User;
    ts: number;
  };
};

export type WebHookEvent =
  | WebHookCatalog
  | WebHookCollection
  | WebHookEp
  | WebHookFriend
  | WebHookGroup
  | WebHookMono
  | WebHookSay;

export type WebHookEventType = WebHookEvent["type"];
