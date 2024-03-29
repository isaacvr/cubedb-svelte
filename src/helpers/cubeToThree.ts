import { FaceSticker } from "@classes/puzzle/FaceSticker";
import { ImageSticker } from "@classes/puzzle/ImageSticker";
import type { Sticker } from "@classes/puzzle/Sticker";
import type { Puzzle } from "@classes/puzzle/puzzle";
import { roundCorners } from "@classes/puzzle/puzzleUtils";
import { CubeMode } from "@constants";
import { DoubleSide, Face3, Geometry, Material, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { loadImageToPiece } from "./loadImageToPiece";

export function piecesToTree(cube: Puzzle, F: number = 1, sTrans: Function = (s: Sticker[]) => s, side = DoubleSide) {
  let group = new Object3D();
  let pieces = cube.pieces;
  let meshes: Mesh[] = [];

  for (let p = 0, maxp = pieces.length; p < maxp; p += 1) {
    let stickers: Sticker[] = sTrans( pieces[p].stickers );
    let piece = new Object3D();

    piece.userData = pieces[p];

    for (let s = 0, maxs = stickers.length; s < maxs; s += 1) {
      let sticker = stickers[s].mul(F);
      let color = cube.getHexColor( sticker.color );
      let stickerGeometry = new Geometry();
      let stickerMaterial: Material;

      if ( sticker instanceof ImageSticker ) {
        loadImageToPiece(sticker, piece);
        continue;
      }
      
      stickerGeometry.vertices.push( ...sticker.points.map(p => new Vector3(p.x, p.y, p.z)) );

      if ( sticker instanceof FaceSticker ) {
        stickerMaterial = new MeshBasicMaterial({
          color: 0xffffff,
          side,
          vertexColors: true
        });

        let f = sticker.faces;
        for (let i = 0, maxi = f.length; i < maxi; i += 1) {
          let face = new Face3(f[i][0], f[i][1], f[i][2]);
          face.color.setHex( color );
          stickerGeometry.faces.push(face);
        }
        stickerGeometry.colorsNeedUpdate = true;
      } else {
        stickerMaterial = new MeshBasicMaterial({
          color,
          side
        });

        for (let i = 2, maxi = sticker.points.length; i < maxi; i += 1) {
          stickerGeometry.faces.push( new Face3(0, i - 1, i) );
        }
      }

      let box = new Mesh(stickerGeometry, stickerMaterial);
      box.userData = stickers[s];
      
      piece.add(box);
      meshes.push(box);

    }

    group.add(piece); 
  }

  return { group, meshes };
}

export function cubeToThree(cube: Puzzle, F: number = 1) {
  let nc = cube;
  
  roundCorners(nc.p, ...nc.p.roundParams);
  
  let defFilter = (s: Sticker[]) => s;
  let rubikFilter = (s: Sticker[]) => {
    return s.filter(st => !(st.color === 'x' || st.oColor === 'x' || st._generated.color === 'x' || st._generated.oColor === 'x'));
  };

  let normalMode = [ CubeMode.NORMAL, CubeMode.ELL, CubeMode.PLL, CubeMode.ZBLL ].some(e => e === cube.mode);

  let { group, meshes } = piecesToTree(nc, F, (cube.type === 'rubik' && normalMode) ? rubikFilter : defFilter);

  group.rotation.x = nc.rotation.x;
  group.rotation.y = nc.rotation.y;
  group.rotation.z = nc.rotation.z;

  return {group, meshes, nc};
}