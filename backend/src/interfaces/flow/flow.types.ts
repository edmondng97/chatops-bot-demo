export type Locale = 'en' | 'zh';

export type LocaleText = { [K in Locale]: string };

export type StepType = 'choice' | 'input' | 'multiselect';

export interface StepOption {
  key: string;
  i18n: LocaleText;
}

export interface FlowStep {
  id: string;
  type: StepType;
  /** Named dataset for dynamic options (resolved by the engine), e.g. 'env-list'. */
  source?: string;
  /** Static options for choice/multiselect when no source is given. */
  options?: StepOption[];
  /** Default value for input steps. */
  default?: string;
  /** Step is skippable. */
  optional?: boolean;
  /** Conditional render: only show when collected[field] === equals. */
  when?: { field: string; equals: string };
  i18n: { title: LocaleText; note?: LocaleText };
}

export type ClosePolicy = 'conversational' | 'oneshot';

export interface FlowConfig {
  command: string;
  triggers: { en: string[]; zh: string[] };
  closePolicy: ClosePolicy;
  worker: { skill: string };
  steps: FlowStep[];
  feedback?: { enabled: boolean };
}
