import type { Puzzle } from './../classes/puzzle/puzzle';
import type { Sticker } from './../classes/puzzle/Sticker';
import type { Piece } from './../classes/puzzle/Piece';
import type { Vector3D } from '../classes/vector3d';
import type { CubeMode } from "../constants";
import type { Writable } from 'svelte/store';

export declare type PuzzleType = 'rubik' | 'skewb' | 'square1' | 'pyraminx' | 'axis' | 'fisher' | 'ivy' | 'clock' | 'megaminx' | 'mirror' | 'dino' | 'rex' | 'redi' | 'mixup' | 'pyramorphix' | 'gear' | 'dreidel' | 'bandaged222' | 'bicube' | 'square2' | 'pandora' | 'ultimateSkewb' | 'pyraminxCrystal' | 'tetraminx' | 'meierHalpernPyramid';
export declare type CubeView = 'plan' | 'trans' | '2d';

export enum TimerState {
  CLEAN = 0, STOPPED = 1, PREVENTION = 2, INSPECTION = 3, RUNNING = 4
};

export enum AverageSetting {
  SEQUENTIAL = 0,
  GROUP = 1
}

export interface Card {
  title: string;
  cube: string;
  ready: boolean;
  route: string;
  timer?: boolean;
  puzzle?: Puzzle;
}

export interface RawCard {
  title: string;
  scramble: string;
  route: string;
  cubeType: PuzzleType;
  cubeMode: CubeMode;
  order: number[];
  timer: boolean;
  view?: CubeView;
  tips?: number[];
  createdAt?: number;
}

export interface Solution {
  moves: string;
  votes: number;
}

export interface Algorithm {
  name: string;
  shortName: string;
  group?: string;
  order: number;
  scramble: string;
  puzzle?: string;
  solutions?: Solution[];
  mode: CubeMode;
  cube ?: string;
  ready: boolean;
  tips ?: number[];
  parentPath ?: string;
  view?: CubeView;
  _puzzle?: Puzzle;
}

export interface NavigationRoute {
  link: string;
  name: string;
}

export interface PuzzleInterface {
  pieces: Piece[];
  palette: any;
  rotation: any;
  center: Vector3D;
  faceVectors: Vector3D[];
  faceColors: string[];
  getAllStickers: () => Sticker[];
  move: (m: any) => any;
  roundParams: any[];
  isRounded?: boolean;
  dims?: number[];
  raw?: any;
  scramble?: () => any;
  toMove?: (...args: any) => any;
  vectorsFromCamera?: (...args: any) => any;
}

export interface PuzzleOptions {
  type: PuzzleType;
  order?: number[];
  mode?: CubeMode;
  view?: CubeView;
  tips?: number[];
  headless?: boolean;
  sequence?: string; // This field has no effects in the constructor
  rounded?: boolean;
}

export enum Penalty {
  NONE = 0, P2 = 1, DNF = 2, DNS = 3
}

export interface Solve {
  _id?: any;
  time: number;
  date: number;
  scramble: string;
  penalty: Penalty;
  selected: boolean;
  session: string;
  comments?: string;
  group?: number;
  mode?: string;
  len?: number;
  prob?: number;
}

export type TimerInput = 'Keyboard' | 'Manual' | 'StackMat';

export const TIMER_INPUT: TimerInput[] = [ 'Keyboard', 'Manual', 'StackMat' ];

export interface SessionSettings {
  hasInspection: boolean;
  inspection: number;
  showElapsedTime: boolean;
  calcAoX: AverageSetting;
  genImage: boolean;
  scrambleAfterCancel: boolean;
  input?: TimerInput;
}

export interface Session {
  _id: string;
  name: string;
  editing?: boolean;
  tName?: string;
  settings: SessionSettings;
}

export interface TimerPuzzleCategory {
  [name: string]: Solve[];
}

export interface TimerPuzzle {
  puzzle: string;
  title: string;
  categoriesStr: string[];
  categories: TimerPuzzleCategory;
}

export interface RawPuzzle {
  type: PuzzleType;
  mode: CubeMode;
  scramble: string;
  tips: number[];
  rotation: any;
  order: number[];
  view: CubeView;
  img?: string;
  raw?: any; // Intended for user specific purposes
}

declare type ArrowLarge = { type: 'arrow', text: string };
export declare type CubeType = Puzzle | RawPuzzle | ArrowLarge;

export interface BlockType {
  type: "title" | "subtitle" | "text" | "cubes";
  content ?: string;
  cubes?: CubeType[];
}

export interface Tutorial {
  _id: string;
  title: string;
  titleLower: string;
  puzzle: string;
  algs: number;
  content: BlockType[];
  level: number;
}

export interface Metric {
  value: number;
  better: boolean;
}

export interface Statistics {
  best: Metric;
  worst: Metric;
  avg: Metric;
  dev: Metric;
  count: Metric;
  time: Metric;
  Mo3: Metric;
  Ao5: Metric;
  Ao12: Metric;
  Ao50: Metric;
  Ao100: Metric;
  Ao200: Metric;
  Ao500: Metric;
  Ao1k: Metric;
  Ao2k: Metric;

  // Penalties
  NP: Metric;
  P2: Metric;
  DNF: Metric;
  DNS: Metric;
  counter: Metric;

  [key: string]: Metric;
}

export interface TimerContext {
  state: Writable<TimerState>;
  ready: Writable<boolean>;
  tab: Writable<number>;
  solves: Writable<Solve[]>;
  allSolves: Writable<Solve[]>;
  session: Writable<Session>;
  Ao5: Writable<number[]>;
  AoX: Writable<number>;
  stats: Writable<Statistics>;
  scramble: Writable<string>;
  group: Writable<number>;
  mode: Writable<{ 0: string, 1: string, 2: number }>;
  hintDialog: Writable<boolean>;
  hint: Writable<boolean>;
  cross: Writable<string>;
  xcross: Writable<string>;
  preview: Writable<string>;
  prob: Writable<number>;
  isRunning: Writable<boolean>;
  
  sortSolves: () => any;
  updateStatistics: (inc ?: boolean) => any;
  initScrambler: (scr?: string, _mode ?: string) => any;
  selectedGroup: () => any;
  setConfigFromSolve: (s: Solve) => any;
}

export const ROLES = {
  CONTESTANT: 1 << 0,
  JUDGE:      1 << 1,
  SCRAMBLER:  1 << 2,
  ORGANIZER:  1 << 3,
  DELEGATE:   1 << 4,
  SPONSOR:    1 << 5,
  GUEST:      1 << 6,
};

// export const ROLES_STR = [ "Contestant", "Judge", "Scrambler", "Organizer", "Delegate", "Sponsor", "Guest" ];
export const ROLES_STR = [ "Competidor", "Juez", "Scrambler", "Organizador", "Delegado", "Patrocinador", "Invitado" ];

export interface ContestResult {
  round: number;
  solves: Solve[];
}

export interface Contestant {
  fullname: string;
  oid: string;
  age: number;
  // gender: "Male" | "Female";
  gender: "Hombre" | "Mujer";
  categories: string[];
  results: {
    [key: string]: ContestResult[];
  };
  role: number; // mask
  otherData: string;
  expanded?: boolean;
}

export interface CubeEvent {
  _id: string;
  name: string;
  place: string;
  date: string;
  status: "editing" | "running";
  contestants: Contestant[];
  inscriptionI: string;
  inscriptionF: string;
  inscriptionCost: number;
  rounds: {
    [key: string]: number;
  }
}

export interface Sheet {
  name: string;
  mode: string;
  round: number;
  buffer: Buffer;
}

export interface SheetRegistry {
  count: number;
  total: number;
  sheets: Sheet[];
  clear: () => any;
  save: () => any;
  addCount: (c: number) => any;
  addTotal: (c: number) => any;
  addSheet: (s: Sheet) => any;
}

export interface CubeDBData {
  sessions: Session[];
  solves: Solve[];
}

export interface Tab {
  name: string;
  id: string;
  index: number;
  icon: any;
  ariaLabel?: string;
}

// This is for import/export adaptors to implement
export interface CubeDBAdaptor {
  name: string;
  modes: string[];
  toCubeDB: (scr: string, mode?: number) => CubeDBData;
  fromCubeDB: (data: CubeDBData, mode?: number) => string;
}

export interface IPC {
  getAlgorithms: (args?:any) => any;
  handleAlgorithms: (args?:any) => any;
  
  getCards: (args?:any) => any;
  handleCards: (args?:any) => any;
  
  addSolve: (args?:any) => any;
  getSolves: (args?:any) => any;
  updateSolve: (args?:any) => any;
  removeSolves: (args?:any) => any;
  handleSolves: (args?:any) => any;
  
  addContest: (args?:any) => any;
  getContests: (args?:any) => any;
  updateContest: (args?:any) => any;
  removeContests: (args?:any) => any;
  handleContests: (args?:any) => any;
  
  addSession: (args?:any) => any;
  getSessions: (args?:any) => any;
  removeSession: (args?:any) => any;
  renameSession: (args?:any) => any;
  updateSession: (args?:any) => any;
  handleSessions: (args?:any) => any;

  addTutorial: (args?:any) => any;
  getTutorials: (args?:any) => any;
  updateTutorial: (args?:any) => any;
  handleTutorials: (args?:any) => any;

  minimize: (args?:any) => any;
  maximize: (args?:any) => any;
  close: (args?:any) => any;
  generatePDF: (args?:any) => any;
  zipPDF: (args?:any) => any;
  openFile: (args?:any) => any;
  revealFile: (args?:any) => any;
  handleAny: (args?:any) => any;
}

export interface Game {
  players: { 0: string, 1: { name: string, times: number[] } }[];
  observers: { 0: string, 1: { name: string } }[];
  round: number;
  total: number;
  started: boolean;
}

export interface StackmatState {
  time_milli: number;
  unit: number;
  on: boolean;
  greenLight: boolean;
  leftHand: boolean;
  rightHand: boolean;
  running: boolean;
  unknownRunning: boolean;
  signalHeader: 'I' | ' ' | 'S';
  noise: number;
  power: number;
}

export interface NotificationAction {
  text: string;
  callback: (e: CustomEvent<any>) => void;
}

export interface INotification {
  key: string;
  header: string;
  text: string;
  fixed?: boolean;
  timeout?: number;
  actions?: NotificationAction[];
}