export type SkillPackage = {
  readonly registry: "npm";
  readonly name: string | null;
  readonly skillPath: string;
};

export type SkillPrerequisite = {
  readonly skillId?: string;
  readonly platform?: string;
  readonly application?: string;
  readonly reason?: string;
};

export type SkillEntry = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly order: number;
  /** Public source fields are absent for skills delivered only inside a package. */
  readonly sourceRepo?: string;
  readonly sourcePath?: string;
  readonly sourceVersion: string | null;
  readonly sourceRevision?: string;
  readonly sourceRef?: string;
  /** The package name stays null until the package is published. */
  readonly package?: SkillPackage;
  readonly public: boolean;
  readonly ownedBy: string;
  readonly relatedSkills: readonly string[];
  readonly prerequisites: readonly SkillPrerequisite[];
  readonly recommendationOnly: boolean;
};

export type SkillVideo = {
  readonly url: string;
  readonly title?: string;
};

export type SkillLesson = {
  readonly skillId: string;
  readonly updated: string;
  readonly html: string;
  readonly video?: SkillVideo;
};

export type PackageEntry = {
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  readonly repository: string;
};

export type SitePages = {
  readonly guide: string;
  readonly about: string;
  readonly cloudflareIphone: string;
};

export type PhaseOutlineEntry = {
  readonly id: string;
  readonly labelHtml: string;
  readonly lesson: boolean;
};

export type PhaseEntry = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: string;
  readonly order: number;
  readonly html: string;
  readonly outline: readonly PhaseOutlineEntry[];
};

export type RecommendationReferral = {
  readonly url: string;
  readonly disclosure: string;
};

export type RecommendationEntry = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly requirement: string;
  readonly status: string;
  readonly recommended_by: string;
  readonly checked_at: string;
  readonly reason: string;
  readonly url: string;
  readonly referral?: RecommendationReferral;
};

export type SkillRecommendation = {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly author: string;
  readonly url: string;
};

export type SkillRecommendationGroup = {
  readonly group: string;
  readonly description: string;
  readonly items: readonly SkillRecommendation[];
};

export type SiteSkills = {
  readonly manifest: readonly SkillEntry[];
  readonly lessons: Readonly<Record<string, SkillLesson>>;
  readonly recommendations: readonly SkillRecommendationGroup[];
};

export type StyleOutlineEntry = {
  readonly id: string;
  readonly labelHtml: string;
};

export type StyleGuideEntry = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly humanSummary: string;
  readonly status: string;
  readonly updated: string;
  readonly acceptedThrough: string;
  readonly version: string;
  readonly route: string;
  readonly introHtml: string;
  readonly html: string;
  readonly outline: readonly StyleOutlineEntry[];
};

export type SiteStyles = {
  readonly guides: readonly StyleGuideEntry[];
};

export type SiteData = {
  readonly pages: SitePages;
  readonly phases: readonly PhaseEntry[];
  readonly recommendations: readonly RecommendationEntry[];
  readonly packages: readonly PackageEntry[];
  readonly skills: SiteSkills;
  readonly styles: SiteStyles;
  readonly prompt: string;
  readonly phase2Prompt: string;
  readonly instructionPacket: string;
};
