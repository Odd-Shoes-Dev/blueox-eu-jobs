export type Region =
  | 'Western Europe'
  | 'Central Europe'
  | 'The Balkans'
  | 'Elsewhere in Europe'
  | 'Outside Europe'
  | 'Not sure';

export type YesNo = 'Yes' | 'No';

export type Answer = 'Yes' | 'No' | 'Not sure';

export interface RouteState {
  region: Region | null;
  country: string;
  paid: YesNo | null;
}

export type Step =
  | 'intro'
  | 'route-region'
  | 'route-country'
  | 'route-paid'
  | { kind: 'question'; index: number }
  | 'results';

export type AnswersState = Record<string, Answer>;
