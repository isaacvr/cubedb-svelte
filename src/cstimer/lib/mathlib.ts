import { MersenneTwisterObject } from "./mersennetwister";
const DEBUG = false;

export const Cnk = [];
export const fact = [1];

for (let i = 0; i < 32; ++i) {
  Cnk[i] = [];
  for (let j = 0; j < 32; ++j) {
    Cnk[i][j] = 0;
  }
}
for (let i = 0; i < 32; ++i) {
  Cnk[i][0] = Cnk[i][i] = 1;
  fact[i + 1] = fact[i] * (i + 1);
  for (let j = 1; j < i; ++j) {
    Cnk[i][j] = Cnk[i - 1][j - 1] + Cnk[i - 1][j];
  }
}

export function circleOri(arr, a, b, c, d, ori) {
  let temp = arr[a];
  arr[a] = arr[d] ^ ori;
  arr[d] = arr[c] ^ ori;
  arr[c] = arr[b] ^ ori;
  arr[b] = temp ^ ori;
}

export function circle(arr, ...args) {
  let length = args.length - 1;
  let temp = arr[args[length]];
  for (let i = length; i > 0; i -= 1) {
    arr[args[i]] = arr[args[i - 1]];
  }
  arr[args[0]] = temp;
  return circle;
}

//perm: [idx1, idx2, ..., idxn]
//pow: 1, 2, 3, ...
//ori: ori1, ori2, ..., orin, base
// arr[perm[idx2]] = arr[perm[idx1]] + ori[idx2] - ori[idx1] + base
export function acycle(arr, perm, pow?, ori?) {
  pow = pow || 1;
  let plen = perm.length;
  let tmp = [];
  for (let i = 0; i < plen; i++) {
    tmp[i] = arr[perm[i]];
  }
  for (let i = 0; i < plen; i++) {
    let j = (i + pow) % plen;
    arr[perm[j]] = tmp[i];
    if (ori) {
      arr[perm[j]] += ori[j] - ori[i] + ori[ori.length - 1];
    }
  }
  return acycle;
}

export function getPruning(table, index) {
  return (table[index >> 3] >> ((index & 7) << 2)) & 15;
}

export function setNPerm(arr, idx, n) {
  let i, j;
  arr[n - 1] = 0;
  for (i = n - 2; i >= 0; --i) {
    arr[i] = idx % (n - i);
    idx = ~~(idx / (n - i));
    for (j = i + 1; j < n; ++j) {
      arr[j] >= arr[i] && ++arr[j];
    }
  }
}

export function getNPerm(arr, n) {
  let i, idx, j;
  idx = 0;
  for (i = 0; i < n; ++i) {
    idx *= n - i;
    for (j = i + 1; j < n; ++j) {
      arr[j] < arr[i] && ++idx;
    }
  }
  return idx;
}

export function getNParity(idx, n) {
  let i, p;
  p = 0;
  for (i = n - 2; i >= 0; --i) {
    p ^= idx % (n - i);
    idx = ~~(idx / (n - i));
  }
  return p & 1;
}

export function get8Perm(arr, n?, even?) {
  n = n || 8;
  let idx = 0;
  let val = 0x76543210;
  for (let i = 0; i < n - 1; ++i) {
    let v = arr[i] << 2;
    idx = (n - i) * idx + ((val >> v) & 7);
    val -= 0x11111110 << v;
  }
  return even < 0 ? idx >> 1 : idx;
}

export function set8Perm(arr, idx, n?, even?) {
  n = (n || 8) - 1;
  let val = 0x76543210;
  let prt = 0;
  if (even < 0) {
    idx <<= 1;
  }
  for (let i = 0; i < n; ++i) {
    let p = fact[n - i];
    let v = ~~(idx / p);
    prt ^= v;
    idx %= p;
    v <<= 2;
    arr[i] = (val >> v) & 7;
    let m = (1 << v) - 1;
    val = (val & m) + ((val >> 4) & ~m);
  }
  if (even < 0 && (prt & 1) != 0) {
    arr[n] = arr[n - 1];
    arr[n - 1] = val & 7;
  } else {
    arr[n] = val & 7;
  }
  return arr;
}

export function getNOri(arr, n, evenbase) {
  let base = Math.abs(evenbase);
  let idx = evenbase < 0 ? 0 : arr[0] % base;
  for (let i = n - 1; i > 0; i--) {
    idx = idx * base + (arr[i] % base);
  }
  return idx;
}

export function setNOri(arr, idx, n, evenbase) {
  let base = Math.abs(evenbase);
  let parity = base * n;
  for (let i = 1; i < n; i++) {
    arr[i] = idx % base;
    parity -= arr[i];
    idx = ~~(idx / base);
  }
  arr[0] = (evenbase < 0 ? parity : idx) % base;
  return arr;
}

// type: 'p', 'o'
// evenbase: base for ori, sign for even parity
export function coord(type, length, evenbase) {
  this.length = length;
  this.evenbase = evenbase;
  this.get =
    type == "p"
      ? function (arr) {
          return get8Perm(arr, this.length, this.evenbase);
        }
      : function (arr) {
          return getNOri(arr, this.length, this.evenbase);
        };
  this.set =
    type == "p"
      ? function (arr, idx) {
          return set8Perm(arr, idx, this.length, this.evenbase);
        }
      : function (arr, idx) {
          return setNOri(arr, idx, this.length, this.evenbase);
        };
}

export function fillFacelet(facelets, f, perm, ori, divcol) {
  for (let i = 0; i < facelets.length; i++) {
    for (let j = 0; j < facelets[i].length; j++) {
      f[facelets[i][(j + ori[i]) % facelets[i].length]] = ~~(
        facelets[perm[i]][j] / divcol
      );
    }
  }
}

export function createMove(moveTable, size, doMove, N_MOVES?) {
  N_MOVES = N_MOVES || 6;
  if (Array.isArray(doMove)) {
    let cord = new coord(doMove[1], doMove[2], doMove[3]);
    doMove = doMove[0];
    for (let j = 0; j < N_MOVES; j++) {
      moveTable[j] = [];
      for (let i = 0; i < size; i++) {
        let arr = cord.set([], i);
        doMove(arr, j);
        moveTable[j][i] = cord.get(arr);
      }
    }
  } else {
    for (let j = 0; j < N_MOVES; j++) {
      moveTable[j] = [];
      for (let i = 0; i < size; i++) {
        moveTable[j][i] = doMove(i, j);
      }
    }
  }
}

export function edgeMove(arr, m) {
  if (m == 0) {
    //F
    circleOri(arr, 0, 7, 8, 4, 1);
  } else if (m == 1) {
    //R
    circleOri(arr, 3, 6, 11, 7, 0);
  } else if (m == 2) {
    //U
    circleOri(arr, 0, 1, 2, 3, 0);
  } else if (m == 3) {
    //B
    circleOri(arr, 2, 5, 10, 6, 1);
  } else if (m == 4) {
    //L
    circleOri(arr, 1, 4, 9, 5, 0);
  } else if (m == 5) {
    //D
    circleOri(arr, 11, 10, 9, 8, 0);
  }
}

export function CubieCube() {
  this.ca = [0, 1, 2, 3, 4, 5, 6, 7];
  this.ea = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
}

CubieCube.EdgeMult = function (a, b, prod) {
  for (let ed = 0; ed < 12; ed++) {
    prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
  }
};

CubieCube.CornMult = function (a, b, prod) {
  for (let corn = 0; corn < 8; corn++) {
    let ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
    prod.ca[corn] = (a.ca[b.ca[corn] & 7] & 7) | (ori << 3);
  }
};

CubieCube.CubeMult = function (a, b, prod) {
  CubieCube.CornMult(a, b, prod);
  CubieCube.EdgeMult(a, b, prod);
};

CubieCube.prototype.init = function (ca, ea) {
  this.ca = ca.slice();
  this.ea = ea.slice();
  return this;
};

CubieCube.prototype.isEqual = function (c) {
  for (let i = 0; i < 8; i++) {
    if (this.ca[i] != c.ca[i]) {
      return false;
    }
  }
  for (let i = 0; i < 12; i++) {
    if (this.ea[i] != c.ea[i]) {
      return false;
    }
  }
  return true;
};

let cornerFacelet = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 53, 42],
  [35, 17, 51],
];
let edgeFacelet = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];

CubieCube.prototype.toFaceCube = function (cFacelet, eFacelet) {
  cFacelet = cFacelet || cornerFacelet;
  eFacelet = eFacelet || edgeFacelet;
  let ts = "URFDLB";
  let f = [];
  for (let i = 0; i < 54; i++) {
    f[i] = ts[~~(i / 9)];
  }
  for (let c = 0; c < 8; c++) {
    let j = this.ca[c] & 0x7; // cornercubie with index j is at
    let ori = this.ca[c] >> 3; // Orientation of this cubie
    for (let n = 0; n < 3; n++)
      f[cFacelet[c][(n + ori) % 3]] = ts[~~(cFacelet[j][n] / 9)];
  }
  for (let e = 0; e < 12; e++) {
    let j = this.ea[e] >> 1; // edgecubie with index j is at edgeposition
    let ori = this.ea[e] & 1; // Orientation of this cubie
    for (let n = 0; n < 2; n++)
      f[eFacelet[e][(n + ori) % 2]] = ts[~~(eFacelet[j][n] / 9)];
  }
  return f.join("");
};

CubieCube.prototype.invFrom = function (cc) {
  for (let edge = 0; edge < 12; edge++) {
    this.ea[cc.ea[edge] >> 1] = (edge << 1) | (cc.ea[edge] & 1);
  }
  for (let corn = 0; corn < 8; corn++) {
    this.ca[cc.ca[corn] & 0x7] = corn | ((0x20 >> (cc.ca[corn] >> 3)) & 0x18);
  }
  return this;
};

CubieCube.prototype.fromFacelet = function (facelet, cFacelet, eFacelet) {
  cFacelet = cFacelet || cornerFacelet;
  eFacelet = eFacelet || edgeFacelet;
  let count = 0;
  let f = [];
  let centers =
    facelet[4] +
    facelet[13] +
    facelet[22] +
    facelet[31] +
    facelet[40] +
    facelet[49];
  for (let i = 0; i < 54; ++i) {
    f[i] = centers.indexOf(facelet[i]);
    if (f[i] == -1) {
      return -1;
    }
    count += 1 << (f[i] << 2);
  }
  if (count != 0x999999) {
    return -1;
  }
  let col1, col2, i, j, ori;
  for (i = 0; i < 8; ++i) {
    for (ori = 0; ori < 3; ++ori)
      if (f[cFacelet[i][ori]] == 0 || f[cFacelet[i][ori]] == 3) break;
    col1 = f[cFacelet[i][(ori + 1) % 3]];
    col2 = f[cFacelet[i][(ori + 2) % 3]];
    for (j = 0; j < 8; ++j) {
      if (col1 == ~~(cFacelet[j][1] / 9) && col2 == ~~(cFacelet[j][2] / 9)) {
        this.ca[i] = j | (ori % 3 << 3);
        break;
      }
    }
  }
  for (i = 0; i < 12; ++i) {
    for (j = 0; j < 12; ++j) {
      if (
        f[eFacelet[i][0]] == ~~(eFacelet[j][0] / 9) &&
        f[eFacelet[i][1]] == ~~(eFacelet[j][1] / 9)
      ) {
        this.ea[i] = j << 1;
        break;
      }
      if (
        f[eFacelet[i][0]] == ~~(eFacelet[j][1] / 9) &&
        f[eFacelet[i][1]] == ~~(eFacelet[j][0] / 9)
      ) {
        this.ea[i] = (j << 1) | 1;
        break;
      }
    }
  }
  return this;
};

let moveCube = [];
for (let i = 0; i < 18; i++) {
  moveCube[i] = new CubieCube();
}
moveCube[0].init(
  [3, 0, 1, 2, 4, 5, 6, 7],
  [6, 0, 2, 4, 8, 10, 12, 14, 16, 18, 20, 22]
);
moveCube[3].init(
  [20, 1, 2, 8, 15, 5, 6, 19],
  [16, 2, 4, 6, 22, 10, 12, 14, 8, 18, 20, 0]
);
moveCube[6].init(
  [9, 21, 2, 3, 16, 12, 6, 7],
  [0, 19, 4, 6, 8, 17, 12, 14, 3, 11, 20, 22]
);
moveCube[9].init(
  [0, 1, 2, 3, 5, 6, 7, 4],
  [0, 2, 4, 6, 10, 12, 14, 8, 16, 18, 20, 22]
);
moveCube[12].init(
  [0, 10, 22, 3, 4, 17, 13, 7],
  [0, 2, 20, 6, 8, 10, 18, 14, 16, 4, 12, 22]
);
moveCube[15].init(
  [0, 1, 11, 23, 4, 5, 18, 14],
  [0, 2, 4, 23, 8, 10, 12, 21, 16, 18, 7, 15]
);
for (let a = 0; a < 18; a += 3) {
  for (let p = 0; p < 2; p++) {
    CubieCube.EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
    CubieCube.CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
  }
}

CubieCube.moveCube = moveCube;

CubieCube.prototype.edgeCycles = function () {
  let visited = [];
  let small_cycles = [0, 0, 0];
  let cycles = 0;
  let parity = false;
  for (let x = 0; x < 12; ++x) {
    if (visited[x]) {
      continue;
    }
    let length = -1;
    let flip = 0;
    let y = x;
    do {
      visited[y] = true;
      ++length;
      flip ^= this.ea[y] & 1;
      y = this.ea[y] >> 1;
    } while (y != x);
    cycles += length >> 1;
    if (length & 1) {
      parity = !parity;
      ++cycles;
    }
    if (flip) {
      if (length == 0) {
        ++small_cycles[0];
      } else if (length & 1) {
        small_cycles[2] ^= 1;
      } else {
        ++small_cycles[1];
      }
    }
  }
  small_cycles[1] += small_cycles[2];
  if (small_cycles[0] < small_cycles[1]) {
    cycles += (small_cycles[0] + small_cycles[1]) >> 1;
  } else {
    let flip_cycles = [0, 2, 3, 5, 6, 8, 9];
    cycles +=
      small_cycles[1] + flip_cycles[(small_cycles[0] - small_cycles[1]) >> 1];
  }
  return cycles - ~~parity;
};

export function createPrun(
  prun,
  init,
  size,
  maxd,
  doMove,
  N_MOVES?,
  N_POWER?,
  N_INV?
) {
  let isMoveTable = Array.isArray(doMove);
  N_MOVES = N_MOVES || 6;
  N_POWER = N_POWER || 3;
  N_INV = N_INV || 256;
  maxd = maxd || 256;
  for (let i = 0, len = (size + 7) >>> 3; i < len; i++) {
    prun[i] = -1;
  }
  prun[init >> 3] ^= 15 << ((init & 7) << 2);
  let val = 0;
  // let t = +new Date;
  for (let l = 0; l <= maxd; l++) {
    let done = 0;
    let inv = l >= N_INV;
    let fill = (l + 1) ^ 15;
    let find = inv ? 0xf : l;
    let check = inv ? l : 0xf;

    out: for (let p = 0; p < size; p++, val >>= 4) {
      if ((p & 7) == 0) {
        val = prun[p >> 3];
        if (!inv && val == -1) {
          p += 7;
          continue;
        }
      }
      if ((val & 0xf) != find) {
        continue;
      }
      for (let m = 0; m < N_MOVES; m++) {
        let q = p;
        for (let c = 0; c < N_POWER; c++) {
          q = isMoveTable ? doMove[m][q] : doMove(q, m);
          if (getPruning(prun, q) != check) {
            continue;
          }
          ++done;
          if (inv) {
            prun[p >> 3] ^= fill << ((p & 7) << 2);
            continue out;
          }
          prun[q >> 3] ^= fill << ((q & 7) << 2);
        }
      }
    }
    if (done == 0) {
      break;
    }
    DEBUG && console.log("[prun]", done);
  }
}

//state_params: [[init, doMove, size, [maxd], [N_INV]], [...]...]
export function Solver(N_MOVES, N_POWER, state_params) {
  this.N_STATES = state_params.length;
  this.N_MOVES = N_MOVES;
  this.N_POWER = N_POWER;
  this.state_params = state_params;
  this.inited = false;
}

let _ = Solver.prototype;

_.search = function (state, minl, MAXL) {
  MAXL = (MAXL || 99) + 1;
  if (!this.inited) {
    this.move = [];
    this.prun = [];
    for (let i = 0; i < this.N_STATES; i++) {
      let state_param = this.state_params[i];
      let init = state_param[0];
      let doMove = state_param[1];
      let size = state_param[2];
      let maxd = state_param[3];
      let N_INV = state_param[4];
      this.move[i] = [];
      this.prun[i] = [];
      createMove(this.move[i], size, doMove, this.N_MOVES);
      createPrun(
        this.prun[i],
        init,
        size,
        maxd,
        this.move[i],
        this.N_MOVES,
        this.N_POWER,
        N_INV
      );
    }
    this.inited = true;
  }
  this.sol = [];

  let maxl;

  for (maxl = minl; maxl < MAXL; maxl++) {
    if (this.idaSearch(state, maxl, -1)) {
      break;
    }
  }
  return maxl == MAXL ? null : this.sol.reverse();
};

_.toStr = function (sol, move_map, power_map) {
  let ret = [];
  for (let i = 0; i < sol.length; i++) {
    ret.push(move_map[sol[i][0]] + power_map[sol[i][1]]);
  }
  return ret.join(" ").replace(/ +/g, " ");
};

_.idaSearch = function (state, maxl, lm) {
  let N_STATES = this.N_STATES;
  for (let i = 0; i < N_STATES; i++) {
    if (getPruning(this.prun[i], state[i]) > maxl) {
      return false;
    }
  }
  if (maxl == 0) {
    return true;
  }
  let offset = state[0] + maxl + lm + 1;
  for (let move0 = 0; move0 < this.N_MOVES; move0++) {
    let move = (move0 + offset) % this.N_MOVES;
    if (move == lm) {
      continue;
    }
    let cur_state = state.slice();
    for (let power = 0; power < this.N_POWER; power++) {
      for (let i = 0; i < N_STATES; i++) {
        cur_state[i] = this.move[i][move][cur_state[i]];
      }
      if (this.idaSearch(cur_state, maxl - 1, move)) {
        this.sol.push([move, power]);
        return true;
      }
    }
  }
  return false;
};

function identity(state) {
  return state;
}

// state: string not null
// solvedStates: [solvedstate, solvedstate, ...], string not null
// moveFunc: function(state, move);
// moves: {move: face0 | axis0}, face0 | axis0 = 4 + 4 bits
export function gSolver(solvedStates, doMove, moves, prunHash) {
  this.solvedStates = solvedStates;
  this.doMove = doMove;
  this.movesList = [];
  for (let move in moves) {
    this.movesList.push([move, moves[move]]);
  }
  this.prunHash = prunHash || identity;
  this.prunTable = {};
  this.toUpdateArr = null;
  this.prunTableSize = 0;
  this.prunDepth = -1;
  this.cost = 0;
}

_ = gSolver.prototype;

_.updatePrun = function (targetDepth) {
  targetDepth = targetDepth === undefined ? this.prunDepth + 1 : targetDepth;
  for (let depth = this.prunDepth + 1; depth <= targetDepth; depth++) {
    let t = +new Date();
    if (depth < 1) {
      this.prevSize = 0;
      for (let i = 0; i < this.solvedStates.length; i++) {
        let state = this.prunHash(this.solvedStates[i]);
        if (!(state in this.prunTable)) {
          this.prunTable[state] = depth;
          this.prunTableSize++;
        }
      }
    } else {
      this.updatePrunBFS(depth - 1);
    }
    if (this.cost == 0) {
      return;
    }
    this.prunDepth = depth;
    DEBUG && console.log(depth, this.prunTableSize - this.prevSize, +new Date() - t);
    this.prevSize = this.prunTableSize;
  }
};

_.updatePrunBFS = function (fromDepth) {
  if (this.toUpdateArr == null) {
    this.toUpdateArr = [];
    for (let state in this.prunTable) {
      if (this.prunTable[state] != fromDepth) {
        continue;
      }
      this.toUpdateArr.push(state);
    }
  }
  while (this.toUpdateArr.length != 0) {
    let state = this.toUpdateArr.pop();
    for (let moveIdx = 0; moveIdx < this.movesList.length; moveIdx++) {
      let newState = this.doMove(state, this.movesList[moveIdx][0]);
      if (!newState || newState in this.prunTable) {
        continue;
      }
      this.prunTable[newState] = fromDepth + 1;
      this.prunTableSize++;
    }
    if (this.cost >= 0) {
      if (this.cost == 0) {
        return;
      }
      this.cost--;
    }
  }
  this.toUpdateArr = null;
};

_.search = function (state, minl, MAXL) {
  this.sol = [];
  this.subOpt = false;
  this.state = state;
  this.visited = {};
  this.maxl = minl = minl || 0;
  return this.searchNext(MAXL);
};

_.searchNext = function (MAXL, cost) {
  MAXL = MAXL + 1 || 99;
  this.prevSolStr = this.solArr ? this.solArr.join(",") : null;
  this.solArr = null;
  this.cost = cost || -1;
  for (; this.maxl < MAXL; this.maxl++) {
    this.updatePrun(Math.ceil(this.maxl / 2));
    if (this.cost == 0) {
      return null;
    }
    if (this.idaSearch(this.state, this.maxl, null, 0)) {
      break;
    }
  }
  return this.solArr;
};

_.getPruning = function (state) {
  let prun = this.prunTable[this.prunHash(state)];
  return prun === undefined ? this.prunDepth + 1 : prun;
};

_.idaSearch = function (state, maxl, lm, depth) {
  if (this.getPruning(state) > maxl) {
    return false;
  }
  if (maxl == 0) {
    if (this.solvedStates.indexOf(state) == -1) {
      return false;
    }
    let solArr = this.getSolArr();
    this.subOpt = true;
    if (solArr.join(",") == this.prevSolStr) {
      return false;
    }
    this.solArr = solArr;
    return true;
  }
  if (!this.subOpt) {
    if (state in this.visited && this.visited[state] < depth) {
      return false;
    }
    this.visited[state] = depth;
  }
  if (this.cost >= 0) {
    if (this.cost == 0) {
      return true;
    }
    this.cost--;
  }
  let lastMove = lm == null ? "" : this.movesList[lm][0];
  let lastAxisFace = lm == null ? -1 : this.movesList[lm][1];
  for (
    let moveIdx = this.sol[depth] || 0;
    moveIdx < this.movesList.length;
    moveIdx++
  ) {
    let moveArgs = this.movesList[moveIdx];
    let axisface = moveArgs[1] ^ lastAxisFace;
    let move = moveArgs[0];
    if (axisface == 0 || ((axisface & 0xf) == 0 && move <= lastMove)) {
      continue;
    }
    let newState = this.doMove(state, move);
    if (!newState || newState == state) {
      continue;
    }
    this.sol[depth] = moveIdx;
    if (this.idaSearch(newState, maxl - 1, moveIdx, depth + 1)) {
      return true;
    }
    this.sol.pop();
  }
  return false;
};

_.getSolArr = function () {
  let solArr = [];
  for (let i = 0; i < this.sol.length; i++) {
    solArr.push(this.movesList[this.sol[i]][0]);
  }
  return solArr;
};

let randGen = (function () {
  let rndFunc: MersenneTwisterObject;
  let rndCnt;
  let seedStr; // '' + new Date().getTime();

  function random() {
    rndCnt++;
    return rndFunc.randomReal53();
  }

  function getSeed() {
    return [rndCnt, seedStr];
  }

  function setSeed(_rndCnt, _seedStr) {
    if (_seedStr && (_seedStr != seedStr || rndCnt > _rndCnt)) {
      let seed = [];
      for (let i = 0; i < _seedStr.length; i++) {
        seed[i] = _seedStr.charCodeAt(i);
      }
      rndFunc = new MersenneTwisterObject(seed[0], seed);
      rndCnt = 0;
      seedStr = _seedStr;
    }
    while (rndCnt < _rndCnt) {
      rndFunc.randomReal53();
      rndCnt++;
    }
  }

  // setSeed(0, '1576938267035');
  setSeed(0, "" + new Date().getTime());

  return {
    random: random,
    getSeed: getSeed,
    setSeed: setSeed,
  };
})();

export function rndEl(x) {
  return x[~~(randGen.random() * x.length)];
}

export function rn(n) {
  return ~~(randGen.random() * n);
}

export function rndPerm(n) {
  let arr = [];
  for (let i = 0; i < n; i++) {
    arr[i] = i;
  }
  for (let i = 0; i < n - 1; i++) {
    circle(arr, i, i + rn(n - i));
  }
  return arr;
}

export function rndProb(plist) {
  let cum = 0;
  let curIdx = 0;
  for (let i = 0; i < plist.length; i++) {
    if (plist[i] == 0) {
      continue;
    }
    if (randGen.random() < plist[i] / (cum + plist[i])) {
      curIdx = i;
    }
    cum += plist[i];
  }
  return curIdx;
}

export function time2str(unix, format) {
  if (!unix) {
    return "N/A";
  }
  format = format || "%Y-%M-%D %h:%m:%s";
  let date = new Date(unix * 1000);
  return format
    .replace("%Y", date.getFullYear())
    .replace("%M", ("0" + (date.getMonth() + 1)).slice(-2))
    .replace("%D", ("0" + date.getDate()).slice(-2))
    .replace("%h", ("0" + date.getHours()).slice(-2))
    .replace("%m", ("0" + date.getMinutes()).slice(-2))
    .replace("%s", ("0" + date.getSeconds()).slice(-2));
}

let timeRe = /^\s*(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\s*$/;

export function str2time(val) {
  let m = timeRe.exec(val);
  if (!m) {
    return null;
  }
  let date = new Date(0);
  date.setFullYear(~~m[1]);
  date.setMonth(~~m[2] - 1);
  date.setDate(~~m[3]);
  date.setHours(~~m[4]);
  date.setMinutes(~~m[5]);
  date.setSeconds(~~m[6]);
  return ~~(date.getTime() / 1000);
}

export function obj2str(val) {
  if (typeof val == "string") {
    return val;
  }
  return JSON.stringify(val);
}

export function str2obj(val) {
  if (typeof val != "string") {
    return val;
  }
  return JSON.parse(val);
}

export function valuedArray(len, val) {
  let ret = [];
  for (let i = 0; i < len; i++) {
    ret[i] = val;
  }
  return ret;
}

export const SOLVED_FACELET =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
export const getSeed = randGen.getSeed;
export const setSeed = randGen.setSeed;
