<script lang="ts">
  import { Piece } from "@classes/puzzle/Piece";
  import { CENTER, Vector3D } from "@classes/vector3d";
  import { CubeMode, EPS } from "@constants";
  import { Puzzle } from "@classes/puzzle/puzzle";
  import type { PuzzleType } from "@interfaces";
  import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
  import { puzzleReg } from "@classes/puzzle/puzzleRegister";
  import { onDestroy, onMount } from "svelte";

  import SettingsIcon from "@icons/Cog.svelte";
  import Refresh from "@icons/Refresh.svelte";
  import Tooltip from "@components/material/Tooltip.svelte";
  import Input from "@components/material/Input.svelte";
  import {
    Matrix4,
    Object3D,
    PerspectiveCamera,
    PointLight,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
    type Intersection,
    FrontSide,
    PCFSoftShadowMap,
    PlaneGeometry,
    MeshBasicMaterial,
    DoubleSide,
    Mesh,
  } from "three";

  // } from "three";
  import { cubeToThree, piecesToTree } from "@helpers/cubeToThree";
  import { localLang } from "@stores/language.service";
  import type { Sticker } from "@classes/puzzle/Sticker";
  import { ImageSticker } from "@classes/puzzle/ImageSticker";
  import { screen } from "@stores/screen.store";
  import { Button, Modal, Toggle } from "flowbite-svelte";
  import Select from "./material/Select.svelte";
  import { easeIn } from "@helpers/math";

  export let enableKeyboard = true;
  export let enableDrag = true;
  export let enableRotation = true;
  export let gui = true;
  export let contained = false;
  export let selectedPuzzle: PuzzleType = "rubik";
  export let order = 3;
  export let animationTime = $screen.isMobile ? 150 : 200; /// Default animation time: 200ms
  export let showBackFace = false;
  export let sequence: string[] = [];
  export let sequenceAlpha = 0;
  export let useScramble = "";
  export let zoom = 12;

  let _cl = "";

  export { _cl as class };

  let cube: Puzzle;
  let dragging = false;
  let group: Object3D = new Object3D();
  let backFace: Object3D = new Object3D();
  let W = 0;
  let H = 0;

  /// GUI
  let excludedPuzzles: PuzzleType[] = ["icarry", "clock"];
  let puzzles: { name: string; value: string; order: boolean }[] = [];
  let hasOrder = true;
  let GUIExpanded = false;
  let mounted = false;

  for (let [key, value] of puzzleReg) {
    if (excludedPuzzles.indexOf(key as PuzzleType) === -1) {
      puzzles.push({
        name: value.name,
        value: key,
        order: value.order,
      });
    }
  }

  /// Animation
  let animating = false;
  let timeIni: number;
  let animationTimes: number[] = [];
  let from: Matrix4[][] = [];
  let animBuffer: Object3D[][] = [];
  let userData: any[][];
  let u: Vector3D;
  let angs: number[];
  let animationQueue: any[] = [];
  let moveQueue: any[] = [];

  // Reconstruction
  let states: Matrix4[][] = [];
  let stateAngle: number[] = [];
  let stateCenter: Vector3D[] = [];
  let stateDir: Vector3D[] = [];
  let stateFilter: boolean[][] = [];

  function vectorsFromCamera(vecs: any[], cam: PerspectiveCamera) {
    return vecs.map(e => {
      let vp = new Vector3(e.x, e.y, e.z).project(cam);
      return new Vector3D(vp.x, -vp.y, 0);
    });
  }

  function mouseIntersection(
    mx: number,
    my: number,
    arr: any[],
    camera: PerspectiveCamera
  ): Intersection[] {
    let mouse = new Vector2(mx, my);
    let raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(arr);
  }

  function findPiece(p: Piece, arr: Piece[]): boolean {
    for (let i = 0, maxi = arr.length; i < maxi; i += 1) {
      if (arr[i].equal(p)) {
        return true;
      }
    }

    return false;
  }

  function dataFromGroup(pc: any, best: Vector3D, vv: Vector3D, dir: number, fp = findPiece) {
    let animationBuffer: Object3D[][] = [];
    let userData: any[][] = [];
    let angs: number[] = [];
    let animationTimes: number[] = [];

    let toMove = cube.p.toMove ? cube.p.toMove(pc[0], pc[1], best) : [];
    let groupToMove = Array.isArray(toMove) ? toMove : [toMove];

    let u: any = best;

    groupToMove.forEach(g => {
      if ("dir" in g) {
        let cr = vv.cross(vectorsFromCamera([g.dir], camera)[0]);
        dir = -Math.sign(cr.z);
        u = g.dir;
      }

      let pieces: Piece[] = g.pieces;
      let subBuffer: Object3D[] = [];
      let subUserData: any[] = [];

      group.children.forEach((p: Object3D, pos: number) => {
        if (fp(<Piece>p.userData, pieces)) {
          subUserData.push(p.userData);
          subBuffer.push(p);

          subUserData.push(new Piece([]));
          subBuffer.push(backFace.children[pos]);
        }
      });

      userData.push(subUserData);
      animationBuffer.push(subBuffer);
      angs.push(g.ang);
      animationTimes.push(g.animationTime);
    });

    return {
      buffer: animationBuffer,
      userData,
      u,
      dir,
      ang: angs,
      animationTime: animationTimes,
    };
  }

  export async function handleSequence(s: string[], scr: string) {
    if (!mounted) return;

    let nc: Puzzle;

    try {
      resetPuzzle("", false, scr);

      nc = Puzzle.fromSequence(scr, {
        type: selectedPuzzle,
        view: "trans",
        order: Array.isArray(order) ? order : [order, order, order],
        mode: CubeMode.NORMAL,
      });

      let cubeIDs = cube.p.pieces.map(p => p.id);
      let ncIDs = nc.p.pieces.map(p => p.id);
      let idMap: Map<string, string> = new Map(ncIDs.map((id, pos) => [id, cubeIDs[pos]]));

      states.length = 0;
      stateAngle.length = 0;
      stateCenter.length = 0;
      stateDir.length = 0;
      stateFilter.length = 0;

      if (nc.p.applySequence) {
        let seq = nc.p.applySequence(s);

        let getMatrices = (data: Object3D[]) => {
          return data.map(d => d.matrixWorld.clone());
        };

        let allObjects = [...group.children, ...backFace.children];

        states.push(getMatrices(allObjects));

        for (let i = 0, maxi = seq.length; i < maxi; i += 1) {
          let s = seq[i];
          let nu = new Vector3(s.u.x, s.u.y, s.u.z).normalize();
          let ang = s.ang;
          let ids = s.pieces;
          let center = cube.p.center;
          let c = new Vector3(center.x, center.y, center.z);

          stateFilter.push(
            allObjects.map(d => {
              if (!ids.some(id => idMap.get(id) === (d.userData as Piece).id)) {
                return false;
              }
              // if (p.hasCallback) {
              //   p.callback(d, new Vector3(0, 0, 0), u, ang, true, Vector3);
              // } else {

              d.parent?.localToWorld(d.position);
              d.position.sub(c);
              d.position.applyAxisAngle(nu, ang);
              d.position.add(c);
              d.parent?.worldToLocal(d.position);
              d.rotateOnWorldAxis(nu, ang);
              d.updateMatrixWorld();

              // }

              return true;
            })
          );

          states.push(getMatrices(allObjects));
          stateAngle.push(ang);
          stateCenter.push(center.clone());
          stateDir.push(s.u.clone());
        }

        allObjects.forEach((d, idx) => {
          d.rotation.setFromRotationMatrix(states[0][idx]);
          d.position.setFromMatrixPosition(states[0][idx]);
        });

        stateAngle.push(0);
        stateCenter.push(CENTER);
        stateDir.push(CENTER);
        stateFilter.push([]);

        sequenceAlpha = 0;
      }
    } catch (err) {
      console.log("ERROR: ", err);
    }
  }

  function handleAlpha(a: number) {
    if (!mounted) return;
    if (a < 0 || a >= states.length) return;

    let id = ~~a;
    let alpha = easeIn(a - id);

    let state = states[id];
    let ang = stateAngle[id];
    let center = stateCenter[id];
    let u = stateDir[id];
    let filter = stateFilter[id];
    let c = new Vector3(center.x, center.y, center.z);
    let nu = new Vector3(u.x, u.y, u.z);

    let allObjects = [...group.children, ...backFace.children];

    allObjects.forEach((d, idx) => {
      d.rotation.setFromRotationMatrix(state[idx]);
      d.position.setFromMatrixPosition(state[idx]);

      if (!filter[idx]) return;

      d.parent?.localToWorld(d.position);
      d.position.sub(c);
      d.position.applyAxisAngle(nu, ang * alpha);
      d.position.add(c);
      d.parent?.worldToLocal(d.position);
      d.rotateOnWorldAxis(nu, ang * alpha);
    });
  }

  function drag(piece: Intersection, ini: Vector2, fin: Vector2, camera: PerspectiveCamera) {
    camera.updateMatrix();
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    let pc = [piece.object.parent!.userData, piece.object.userData!];
    let po = pc[1].getOrientation();
    let vecs: Vector3D[] = pc[1].vecs.filter((v: Vector3D) => v.cross(po).abs() > EPS);
    let v = fin.clone().sub(ini);
    let vv = new Vector3D(v.x, v.y, 0);

    let faceVectors = vectorsFromCamera(vecs, camera);

    let dir: number = 0;
    let best: Vector3D = new Vector3D(0, 0, 0);

    faceVectors.reduce((ac, fv, p) => {
      let cr = vv.cross(fv);
      if (cr.abs() > ac) {
        best = vecs[p];
        dir = -Math.sign(cr.z);
        return cr.abs();
      }
      return ac;
    }, -Infinity);

    if (best.x === 0 && best.y === 0 && best.z === 0) {
      return null;
    }

    return dataFromGroup(pc, best, vv, dir);
  }

  let renderer: WebGLRenderer;

  let scene = new Scene();
  let canvas: HTMLCanvasElement;

  let camera = new PerspectiveCamera(40, 1, 0.1, 50);
  let controls: TrackballControls;

  export function resetCamera() {
    let pos = new Vector3D(0.68068, 0.34081, 0.6485).setLength(zoom);

    camera.position.set(pos.x, pos.y, pos.z);
    camera.rotation.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  const planeGeometry = new PlaneGeometry(2, 2);
  const planeMaterial = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });
  const planeMesh = new Mesh(planeGeometry, planeMaterial);

  function resetPuzzle(facelet?: string, scramble = false, useScr = "") {
    let children = scene.children;
    scene.remove(...children);

    // Scene preparation

    let light = new PointLight("#ffffff", 3, 3, 1);
    light.position.set(0, 2, 0);
    light.castShadow = true;
    scene.add(light);

    // let plane = new Mesh(new PlaneGeometry(20, 20), new MeshBasicMaterial({ color: 0x888888, side: DoubleSide }));
    // plane.lookAt( new Vector3(0, 1, 0) );
    // plane.position.set(0, -1.5, 0);
    // plane.receiveShadow = true;
    // scene.add( plane );
    // scene.add(planeMesh);

    // Puzzle setup
    if (facelet) {
      cube = Puzzle.fromFacelet(facelet, selectedPuzzle);
    } else {
      cube = Puzzle.fromSequence(useScr, {
        type: selectedPuzzle,
        view: "trans",
        order: Array.isArray(order) ? order : [order, order, order],
        mode: CubeMode.NORMAL,
      });

      scramble && cube.p.scramble && cube.p.scramble();
    }

    // @ts-ignore
    // window.cube = cube;

    let ctt = cubeToThree(cube);
    let bfc = piecesToTree(
      cube,
      1,
      (st: Sticker[]) => {
        return st
          .filter(s => cube.p.faceColors.indexOf(s.color) > -1 && !(s instanceof ImageSticker))
          .map(s =>
            s
              .reflect1(
                s.getMassCenter().add(s.getOrientation().mul(0.6)),
                s.getOrientation(),
                true
              )
              .mul(1.3)
          );
      },
      FrontSide
    );

    group = ctt.group;
    cube = ctt.nc;
    backFace = bfc.group;

    group.castShadow = true;

    scene.add(group);
    scene.add(backFace);

    group.rotation.x = 0;
    group.rotation.y = 0;
    group.rotation.z = 0;

    resetCamera();
  }

  function scramble() {
    resetPuzzle(undefined, true);
  }

  let piece: Intersection | null = null;
  let ini: Vector2 | null = null;
  let iniM = null;
  let mcx: number = 0,
    mcy: number = 0; // Mouse coordinates

  let downHandler = (event: MouseEvent) => {
    event.preventDefault && event.preventDefault();

    if (animating) {
      controls.enabled = false;
      return;
    }

    if (!enableDrag) {
      dragging = false;
      return;
    }

    dragging = true;

    ini = new Vector2(event.clientX, event.clientY);
    iniM = new Vector3((event.clientX / W) * 2 - 1, -(event.clientY / H) * 2 + 1);

    let allStickers: Object3D[] = [];

    group.children.forEach((c: Object3D) => {
      allStickers.push(...c.children);
    });

    let intersects = mouseIntersection(iniM.x, iniM.y, allStickers, camera);

    piece = null;

    if (intersects.length > 0) {
      for (let i = 0, maxi = intersects.length; i < maxi; i += 1) {
        if ((intersects[i].object.userData as Sticker).nonInteractive) {
          continue;
        }

        if ((<any>intersects[i].object).material.color.getHex()) {
          piece = intersects[i];
        } else {
          break;
        }
      }

      controls.enabled = false;
    }
  };

  let upHandler = () => {
    dragging = false;
    controls.enabled = true;
  };

  let prepareFromDrag = (data: any, push = true) => {
    let animation = {
      animBuffer: data.buffer,
      userData: data.userData,
      u: data.u,
      angs: data.ang.map((a: number) => a * data.dir),
      from: data.buffer.map((g: any[]) => g.map(e => e.matrixWorld.clone())),
      animationTimes: data.animationTime.map((e: any) => e || animationTime),
      timeIni: performance.now(),
    };

    push && animationQueue.push(animation);

    return animation;
  };

  let moveHandler = (event: MouseEvent) => {
    event.preventDefault && event.preventDefault();

    mcx = event.clientX;
    mcy = event.clientY;

    if (!dragging) {
      return;
    }

    let fin = new Vector2(event.clientX, event.clientY);

    if (
      piece &&
      fin
        .clone()
        .sub(ini as Vector2)
        .length() > 40
    ) {
      let data: any = drag(piece, ini as Vector2, fin, camera);
      data && prepareFromDrag(data);
      dragging = false;
    }
  };

  let interpolate = (data: Object3D[], from: Matrix4[], ang: number, userData: Piece[]) => {
    let nu = new Vector3(u.x, u.y, u.z).normalize();
    let center = cube.p.center;
    let c = new Vector3(center.x, center.y, center.z);

    userData.forEach((p, idx) => {
      let d = data[idx];
      d.rotation.setFromRotationMatrix(from[idx]);
      d.position.setFromMatrixPosition(from[idx]);
      if (p.hasCallback) {
        p.callback(d, new Vector3(0, 0, 0), u, ang, true, Vector3);
      } else {
        d.parent?.localToWorld(d.position);
        d.position.sub(c);
        d.position.applyAxisAngle(nu, ang);
        d.position.add(c);
        d.parent?.worldToLocal(d.position);
        d.rotateOnWorldAxis(nu, ang);
      }
    });
  };

  let setAnimationData = () => {
    let anim = animationQueue[0];

    animBuffer = anim.animBuffer;
    userData = anim.userData;
    u = anim.u;
    angs = anim.angs;
    from = anim.from;
    animationTimes = anim.animationTimes;
    timeIni = anim.timeIni;
  };

  let addMove = (mov: any[]) => {
    let m = mov[0];
    animationTime = Math.min(100, (mov[1] * 2) / 3);

    let mv = ["R", "L", "U", "D", "F", "B"];
    let mc = [
      new Vector3D(0.9, 0, 0),
      new Vector3D(-0.9, 0, 0),
      new Vector3D(0, 0.9, 0),
      new Vector3D(0, -0.9, 0),
      new Vector3D(0, 0, 0.9),
      new Vector3D(0, 0, -0.9),
    ];

    let pos = mv.indexOf(m[0]);

    if (pos < 0) {
      return false;
    }

    let dir = m[1] === "'" ? 1 : -1;
    let u: any = mc[pos];
    let piece = cube.pieces.find(p => p.direction1(u, u) === 0 && p.stickers.length > 4);
    let sticker = piece?.stickers.find(s => s.vecs.length === 3);

    let data: any = dataFromGroup([piece, sticker], u, u, dir);
    data && prepareFromDrag(data);
    return true;
  };

  let render = () => {
    if (!animating) {
      if (moveQueue.length) {
        if (addMove(moveQueue[0])) {
          setAnimationData();
          animating = true;
        }

        moveQueue.shift();
      } else if (animationQueue.length) {
        setAnimationData();
        animating = true;
      }
    }

    if (animating) {
      let total = animBuffer.length;
      let anim = 0;
      let animLen = moveQueue.length;

      for (let i = 0; i < total; i += 1) {
        let animationTime = animationTimes[i];
        let alpha = (performance.now() - timeIni) / animationTime;

        if (animLen) {
          alpha = 2;
        }

        if (alpha > 1) {
          interpolate(animBuffer[i], from[i], angs[i], userData[i]);
          userData[i].forEach((p: Piece) => {
            if (p.hasCallback) {
              p.callback(p, cube.p.center, u, angs[i]);
            } else {
              p.rotate(cube.p.center, u, angs[i], true);
            }
          });
        } else {
          anim += 1;
          interpolate(animBuffer[i], from[i], angs[i] * alpha, userData[i]);
        }
      }

      if (anim === 0) {
        animationQueue.shift();
        animating = false;
      }
    }

    backFace.visible = showBackFace;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  let resizeHandler = () => {
    W = window.innerWidth;
    H = window.innerHeight;

    if (contained && canvas?.parentElement) {
      W = (canvas.parentElement as any).clientWidth;
      H = (canvas.parentElement as any).clientHeight;
    }

    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    controls.handleResize();
  };

  export function applyMove(m: string, t: number) {
    if (cube.type != "icarry" && cube.type != "rubik") return;
    moveQueue.push([m, t]);
  }

  export function fromFacelet(f: string) {
    resetPuzzle(f);
  }

  function moveFromKeyboard(vec: Vector2) {
    if (animating || !enableKeyboard) return;

    let allStickers: Object3D[] = [];

    group.children.forEach((c: Object3D) => {
      allStickers.push(...c.children);
    });

    let mcm = new Vector3((mcx / W) * 2 - 1, -(mcy / H) * 2 + 1);

    let intersects = mouseIntersection(mcm.x, mcm.y, allStickers, camera);

    piece = null;

    let pos;

    if (intersects.length > 0) {
      for (let i = 0, maxi = intersects.length; i < maxi; i += 1) {
        if ((intersects[i].object.userData as Sticker).nonInteractive) {
          continue;
        }

        if ((<any>intersects[i].object).material.color.getHex()) {
          piece = intersects[i];
          pos = intersects[i].point;
        } else {
          break;
        }
      }

      controls.enabled = false;
    }

    if (!piece) return;

    let data: any = drag(piece, new Vector2(mcx, mcy), vec, camera);

    if (data && pos) {
      let dg = prepareFromDrag(data);

      planeMesh.position.set(pos.x, pos.y, pos.z);
      planeMesh.lookAt(pos.x + dg.u.x, pos.y + dg.u.y, pos.z + dg.u.z);
      setAnimationData();
      animating = true;
    }
  }

  function keyDownHandler(e: KeyboardEvent) {
    if (!enableKeyboard) return;

    let mc = new Vector2(mcx, mcy);

    switch (e.code) {
      case "ArrowUp": {
        moveFromKeyboard(mc.add(new Vector2(0, -50)));
        break;
      }
      case "ArrowDown": {
        moveFromKeyboard(mc.add(new Vector2(0, 50)));
        break;
      }
      case "ArrowLeft": {
        moveFromKeyboard(mc.add(new Vector2(-50, 0)));
        break;
      }
      case "ArrowRight": {
        moveFromKeyboard(mc.add(new Vector2(50, 0)));
        break;
      }
      case "Comma": {
        if (e.ctrlKey) {
          showGUI();
        }
        break;
      }
      case "KeyB": {
        if (e.ctrlKey) {
          showBackFace = !showBackFace;
        }
        break;
      }
      case "KeyS": {
        if (e.ctrlKey) {
          scramble();
        }
        break;
      }
    }
  }

  onMount(() => {
    mounted = true;

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      canvas,
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    renderer.setPixelRatio(window.devicePixelRatio);

    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";

    canvas.addEventListener("pointerdown", downHandler);
    canvas.addEventListener("pointerup", upHandler);
    canvas.addEventListener("pointermove", moveHandler);

    canvas.addEventListener("touchstart", e => downHandler(e.touches[0] as any), { passive: true });
    canvas.addEventListener("touchend", upHandler);
    canvas.addEventListener("touchmove", e => moveHandler(e.touches[0] as any), { passive: true });

    controls = new TrackballControls(camera, canvas);
    controls.rotateSpeed = 3;
    controls.noPan = true;
    controls.minDistance = 3;
    controls.maxDistance = 12;

    resetPuzzle();

    handleSequence(sequence, useScramble);
    handleAlpha(sequenceAlpha);

    resizeHandler();
    render();

    setTimeout(resizeHandler, 1000);
  });

  onDestroy(() => {
    renderer.domElement.remove();
    renderer.dispose();
    renderer.forceContextLoss();
    controls.dispose();
  });

  /// GUI
  function setOrder() {
    hasOrder = !!puzzles.find(p => p.value === selectedPuzzle)?.order;
  }

  setOrder();

  function hideGUI() {
    GUIExpanded = false;
  }

  function showGUI() {
    GUIExpanded = true;
  }

  $: controls && (controls.noRotate = !enableRotation);
  $: handleSequence(sequence, useScramble);
  $: handleAlpha(sequenceAlpha);
</script>

<svelte:window on:resize={resizeHandler} on:keydown={keyDownHandler} />

<canvas bind:this={canvas} class={_cl || ""} />

{#if gui}
  <div class="absolute right-2 top-[5rem] flex flex-col gap-2 items-center ps-3">
    <Tooltip
      hasKeybinding
      position="left"
      on:click={showGUI}
      text={$localLang.SIMULATOR.settings + "[Ctrl + ,]"}
    >
      <Button color="alternative" class="h-8 w-8 p-0 me-3 rounded-full"
        ><SettingsIcon size="1.2rem" /></Button
      >
    </Tooltip>

    {#if cube?.p.scramble}
      <Tooltip hasKeybinding position="left" text={$localLang.global.toScramble + "[Ctrl + S]"}>
        <Button on:click={scramble} color="alternative" class="h-8 w-8 p-0 me-3 rounded-full"
          ><Refresh size="1.2rem" /></Button
        >
      </Tooltip>
    {/if}

    <Tooltip hasKeybinding text={$localLang.SIMULATOR.showBackFace + "[Ctrl + B]"} position="left">
      <Toggle class="cursor-pointer" bind:checked={showBackFace} />
    </Tooltip>
  </div>
{/if}

<Modal bind:open={GUIExpanded} size="xs" title={$localLang.SIMULATOR.puzzleSettings} outsideclose>
  <div class="grid grid-cols-2 gap-4 place-items-center text-gray-400">
    <span>{$localLang.SIMULATOR.puzzle}</span>

    <Select
      items={puzzles}
      label={e => e.name}
      bind:value={selectedPuzzle}
      onChange={setOrder}
      class="text-gray-400 w-full max-w-[unset]"
    />

    {#if hasOrder}
      <span>{$localLang.SIMULATOR.order}</span>
      <Input
        on:UENTER={() => {
          resetPuzzle();
          hideGUI();
        }}
        type="number"
        min={1}
        bind:value={order}
        class="bg-white bg-opacity-10 text-gray-400 !w-20"
      />
    {/if}
  </div>

  <svelte:fragment slot="footer">
    <div class="flex flex-wrap items-center mx-auto gap-2">
      <Button color="alternative" on:click={hideGUI}>{$localLang.global.cancel}</Button>

      <Button
        color="green"
        on:click={() => {
          resetPuzzle();
          hideGUI();
        }}
      >
        {$localLang.SIMULATOR.setPuzzle}
      </Button>
    </div>
  </svelte:fragment>
</Modal>
