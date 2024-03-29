import type { PuzzleOptions } from '@interfaces';
import { rn, rndEl, rndProb } from '../lib/mathlib';

export function mega(turns: any, suffixes: any, length: number) {
  turns = turns || [[""]];
  suffixes = suffixes || [""];
  length = length || 0;
  var donemoves = 0;
  var lastaxis = -1;
  var s = [];
  var first, second;
  for (var i = 0; i < length; i++) {
    do {
      first = rn(turns.length);
      second = rn(turns[first].length);
      if (first != lastaxis) {
        donemoves = 0;
        lastaxis = first;
      }
    } while (((donemoves >> second) & 1) != 0);
    donemoves |= 1 << second;
    if (turns[first][second].constructor == Array) {
      s.push(rndEl(turns[first][second]) + rndEl(suffixes));
    } else {
      s.push(turns[first][second] + rndEl(suffixes));
    }
  }
  return s.join(' ');
}

export let scramblers: Map<string, Function> = new Map<string, Function> ();

export let filters: Map<string, string[]> = new Map<string, string[]>();

export let probs: Map<string, number[]> = new Map<string, number[]>();

export let options: Map<string, PuzzleOptions | PuzzleOptions[]> = new Map<string, PuzzleOptions | PuzzleOptions[]> ();

export function regScrambler(mode: string | string[], callback: Function, filter_and_probs?: any) {
  if ( Array.isArray(mode) ) {
    for (let i = 0; i < mode.length; i++) {
      scramblers.set(mode[i], callback);
      filters.set(mode[i], []);
      probs.set(mode[i], []);
    }
  } else {
    scramblers.set(mode, callback);    
    if (filter_and_probs != undefined) {
      filters.set(mode, filter_and_probs[0]);
      probs.set(mode, filter_and_probs[1]);
    }
  }

  return regScrambler;
}

/**
 *	format string,
  *		${args} => scramblers[scrType](scrType, scrArg)
  *		#{args} => mega(args)
  */
export function formatScramble(str: string) {
  var repfunc = function(match: string, p1: any) {
    if (match[0] == '$') {
      var args = [p1];
      if (p1[0] == '[') {
        args = JSON.parse(p1);
      }
      return scramblers.get( args[0].toString() )?.apply(this, args);
    } else if (match[0] == '#') {
      return mega.apply(this, JSON.parse('[' + p1 + ']'));
    } else {
      return '';
    }
  };
  var re1 = /[$#]\{([^\}]+)\}/g;
  return str.replace(re1, repfunc);
}

export function rndState(filter, probs) {
  if (probs == undefined) {
    return undefined;
  }
  var ret = probs.slice();
  if (filter == undefined) {
    filter = ret;
  }
  for (var i = 0; i < filter.length; i++) {
    if (!filter[i]) {
      ret[i] = 0;
    }
  }
  return rndProb(ret);
}

export function fixCase(cases, probs) {
  return cases == undefined ? rndProb(probs) : cases;
}