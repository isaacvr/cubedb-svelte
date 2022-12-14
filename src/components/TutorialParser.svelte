<script lang="ts">
  import { Puzzle } from "@classes/puzzle/puzzle";
  import { CubeMode } from "@constants";
  import { generateCubeBundle } from "@helpers/cube-draw";
  import { getSearchParams } from "@helpers/strings";
  import type { BlockType, CubeType, Tutorial } from "@interfaces";
  import { DataService } from "@stores/data.service";
  import { onDestroy, onMount } from "svelte";
  import type { Unsubscriber } from "svelte/store";
  import Tooltip from "@components/material/Tooltip.svelte";
  import Button from "@components/material/Button.svelte";
  import Modal from "@components/Modal.svelte";
  import TabGroup from "@components/material/TabGroup.svelte";
  import Tab from "@components/material/Tab.svelte";
  import Input from "@components/material/Input.svelte";
  import TextArea from "@components/material/TextArea.svelte";

  import ArrowRightIcon from '@icons/ArrowRightThick.svelte';
  import PlusIcon from '@icons/Plus.svelte';
  import ContentSaveIcon from '@icons/ContentSave.svelte';
  import ArrowUpIcon from '@icons/ArrowUp.svelte';
  import ArrowDownIcon from '@icons/ArrowDown.svelte';
  import PencilIcon from '@icons/PencilOutline.svelte';
  import DeleteIcon from '@icons/Delete.svelte';
  import DotsIcon from '@icons/DotsVertical.svelte';

  export let location, puzzle, tutorial;

  void puzzle;
  void tutorial;

  const dataService = DataService.getInstance();
  const ICON_PROPS = { width: "1.5rem", height: "1.5rem" };

  let blocks: BlockType[] = [];
  let tut: Tutorial = null;
  let block: { tab: number; content: BlockType } = null;
  let edition = false;

  // Modal
  let creatingBlock = false;
  let mpos = null;
  let toTop = false;

  let sub: Unsubscriber;

  function init(sheet: any) {
    blocks.length = 0;
    let allCubes: Puzzle[] = [];

    for (let i = 0, maxi = sheet.length; i < maxi; i += 1) {
      switch( (sheet[i].type || sheet[i].t ) ) {
        case "tl":
        case "title":
        case "s":
        case "tx":
        case "subtitle":
        case "text": {
          blocks.push({
            type: (sheet[i].type || sheet[i].t),
            content: (sheet[i].content || sheet[i].c).replace(/\n/g, '<br>'),
            cubes: []
          });
          break;
        }
        case "c":
        case "cubes": {
          let cubes: CubeType[] = [];
          let content = sheet[i].cubes || [];
          for (let j = 0, maxj = content.length; j < maxj; j += 1) {
            let cnt = content[j];
            switch( (cnt.type || cnt.t ) ) {
              case '$': {
                if ( allCubes.length > 0 ) {
                  let lastCube = allCubes[ allCubes.length - 1 ];
                  let newMode: CubeMode = cnt.mode ? CubeMode[ (<string> cnt.mode) ] : lastCube.mode;
                  let cp = lastCube.clone(newMode);
                  cp.move(cnt.scramble);
                  cp.p.rotation = cnt.rotation || cp.p.rotation;
                  cp.rotation = cp.p.rotation;
                  cubes.push(cp);
                  allCubes.push(cp);
                }
                break;
              }
              case 'arrow': {
                cubes.push({
                  type: 'arrow',
                  text: (cnt.text || cnt.tt),
                });
                break;
              }
              default: {
                let p = Puzzle.fromSequence((cnt.scramble || cnt.s || ""), {
                  type: (cnt.type || cnt.t),
                  order: (Array.isArray(cnt.order)) ? cnt.order : [cnt.order],
                  mode: ( typeof cnt.mode === 'number' ) ? cnt.mode : CubeMode[ <string> cnt.mode ],
                  tips: cnt.tips || [],
                  view: cnt.view,
                });
                p.rotation = cnt.rotation || cnt.r || p.rotation;
                cubes.push(p);
                allCubes.push(p);
              }
            }
          }

          blocks.push({
            type: 'cubes',
            cubes,
          });
          break;
        }
      }
    }

    generateCubeBundle(allCubes, 150, false, true).then(g => {
      let subs = g.subscribe((img: string) => {
        if ( img === '__initial__' ) return;
        if ( img === null ) {
          blocks = blocks;
          subs();
        }
      })
    });
  }

  function modalCloseHandler(data) {
    if ( data ) {
      data.content.type = ['title', 'subtitle', 'text', 'cubes'][ data.tab ];
      let title = tut.content.find(b => b.type === 'title');

      if ( data.content.type === 'cubes' ) {
        data.content.cubes.forEach(c => {
          if ( c.type != 'arrow' ) {
            c.rotation.x = c.rotation.x * Math.PI / 180;
            c.rotation.y = c.rotation.y * Math.PI / 180;
            c.rotation.z = c.rotation.z * Math.PI / 180;
          }
        })
      }

      if ( !(data.tab === 0 && title) ) {
        tut.content.splice(mpos, 0, data.content);
        init(tut.content);
      }
    }
  }

  function beginAdd(pos: number) {
    creatingBlock = true;
    mpos = pos;
    block = {
      tab: 0,
      content: {
        type: 'title',
        content: '',
        cubes: []
      }
    }
  }

  function swapBlocks(i: number, j: number) {
    let bi = blocks[i];
    blocks.splice(i, 1, blocks[j]);
    blocks.splice(j, 1, bi);
    blocks = blocks;
  }

  function deleteBlock(i: number) {
    blocks.splice(i, 1);
    blocks = blocks;
  }

  function saveTutorial() {
    tut && dataService.addTutorial(tut);
  }

  function scrollHandler(e) {
    toTop = e.target.scrollTop > 100;
  }

  onMount(() => {
    sub = dataService.tutSub.subscribe((list) => {
      if (!list) return;

      const type = list[0];
      const content = <Tutorial[]> list[1];
      const _id = getSearchParams(location.search).get('id');

      if ( type === 'get-tutorials' ) {
        let current = content.find(t => t._id === _id);

        if ( current ) {
          tut = current;
          tut.content = tut.content || [];
          init(tut.content);
        }
      }
    });

    dataService.getTutorials();
  });

  onDestroy(() => {
    sub();
  });
</script>

<div class="main-container container-mini text-gray-400 scroll-smooth" on:scroll={ scrollHandler }>
  <span id="TOP" class="opacity-0 pointer-events-none"></span>
  {#if edition}
  <div class="container flex gap-4">
    {#if blocks.length === 0}
      <Button class="bg-purple-800 hover:bg-purple-700 hover:text-gray-300 gap-2" on:click={ () => beginAdd(0) }>
        <PlusIcon {...ICON_PROPS}/> Add block
      </Button>
    {/if}
    <Button class="bg-green-800 hover:bg-green-700 hover:text-gray-300 gap-2" on:click={ () => saveTutorial() }>
      <ContentSaveIcon {...ICON_PROPS}/> Save tutorial
    </Button>
  </div>
  {/if}

  <div class="
    fixed -bottom-16 right-4 w-10 h-10 rounded-full bg-purple-600 text-gray-300 z-10
    -rotate-90 shadow-lg flex items-center justify-center to-top transition-all duration-200"
    class:visible={toTop}>
    <a href="#TOP">
      <ArrowRightIcon {...ICON_PROPS}/>
    </a>
  </div>

  {#each blocks as block, i}
    <div class="container-mini bg-white bg-opacity-10 rounded-md py-4 relative" class:cube={ block.type === 'cubes' }>
      {#if edition}
      <div class="absolute top-1 right-0">
        <div class="trigger cursor-pointer">
          <DotsIcon {...ICON_PROPS}/>
          
          <div class="absolute flex right-4 top-2 bg-gray-600 p-2 rounded-md text-gray-300 gap-1
            shadow-lg pointer-events-none opacity-0 transition-all duration-200">
            {#if i > 0}
              <Tooltip class="cursor-pointer" text="Move up" position="top" on:click={() => swapBlocks(i, i - 1)}>
                <ArrowUpIcon {...ICON_PROPS}/>
              </Tooltip>
            {/if}
            {#if i + 1 < blocks.length}
              <Tooltip class="cursor-pointer" text="Move down" position="top" on:click={() => swapBlocks(i, i + 1)}>
                <ArrowDownIcon {...ICON_PROPS}/>
              </Tooltip>
            {/if}
            <Tooltip class="cursor-pointer" text="Edit" position="top">
              <PencilIcon {...ICON_PROPS}/>
            </Tooltip>
            <Tooltip class="cursor-pointer" text="Delete" position="top" on:click={() => deleteBlock(i)}>
              <DeleteIcon {...ICON_PROPS}/>
            </Tooltip>
          </div>
        </div>
      </div>
      {/if}

      {#if block.type === 'title'} <h1 class="text-3xl text-gray-300 text-center font-bold">{block.content}</h1> {/if}
      {#if block.type === 'subtitle'} <h2 class="text-2xl text-gray-300 font-bold text-center">{block.content}</h2> {/if}
      {#if block.type === 'text'}
        <p class="text-justify" bind:innerHTML={block.content} contenteditable="false"></p>
      {/if}
      {#if block.type === 'cubes'}
        {#each block.cubes as cb}
          {#if cb.type != 'arrow'}
            <img class="puzzle-img-mini" src={cb['img'] || ''} alt="">
          {:else}
          <Tooltip text={ cb.text } class="cursor-help">
            <ArrowRightIcon width="1.5rem" height="1.5rem" />
          </Tooltip>
          {/if}
        {/each}
      {/if}
    </div>
  {/each}
</div>
  
<!--
<div class="container">
    <button *ngIf="blocks.length == 0" mat-stroked-button (click)="beginAdd(0)">
      <mat-icon svgIcon="plus"></mat-icon> Add block</button>
  <button mat-stroked-button (click)="saveTutorial()">
    <mat-icon svgIcon="content-save"></mat-icon> Save tutorial</button>
</div>
<ng-container *ngFor="let block of blocks; index as i">
  <div class="container-mini">
    <div class="options">
      <mat-icon
        *ngIf="i > 0"
        (click)="swapBlocks(i, i-1)"
        matTooltipPosition="above" matTooltip="Move up" matTooltipHideDelay="100"
        matSuffix svgIcon="arrow-up"></mat-icon>
      <mat-icon
        *ngIf="i + 1 < blocks.length"
        (click)="swapBlocks(i, i+1)"
        matTooltipPosition="above" matTooltip="Move down" matTooltipHideDelay="100"
        matSuffix svgIcon="arrow-down"></mat-icon>
      <mat-icon
        matTooltipPosition="above" matTooltip="Edit" matTooltipHideDelay="100"
        matSuffix svgIcon="pencil-outline"></mat-icon>
      <mat-icon
        (click)="deleteBlock(i)"
        matTooltipPosition="above" matTooltip="Delete" matTooltipHideDelay="100"
        matSuffix svgIcon="delete"></mat-icon>  
    </div>
  </div>
  <div class="plus">
    <mat-icon (click)="beginAdd(i+1)" svgIcon="plus"></mat-icon>
  </div>
</ng-container> -->

<Modal show={ creatingBlock } onClose={ modalCloseHandler }>
  <TabGroup>
    <Tab name="Title"> <Input bind:value={ block.content.content } placeholder="Title..."/> </Tab>
    <Tab name="Subtitle"> <Input bind:value={ block.content.content } placeholder="Subtitle..."/> </Tab>
    <Tab name="Text"> <TextArea bind:value={ block.content.content } placeholder="Text..."/> </Tab>
    <Tab name="Cubes">
      <section class="flex mt-4">
        <Button>Add cube</Button>
        <Button>Add arrow</Button>
      </section>
      <section class="flex mt-4">
        Cubes goes here
      </section>
    </Tab>
  </TabGroup>
  <!-- <mat-tab-group [(selectedIndex)]="block.tab">
    <mat-tab label="Title">
      <mat-form-field>
        <input matInput type="text" [(ngModel)]="block.content.content" placeholder="Title...">
      </mat-form-field>
    </mat-tab>
    <mat-tab label="Subtitle">
      <mat-form-field>
        <input matInput type="text" [(ngModel)]="block.content.content" placeholder="Subtitle...">
      </mat-form-field>
    </mat-tab>
    <mat-tab label="Text">
      <mat-form-field>
        <textarea matInput cdkTextareaAutosize [(ngModel)]="block.content.content" placeholder="Text...">
        </textarea>
      </mat-form-field>
    </mat-tab>
    <mat-tab label="Cubes">
      <section style="margin-top: 10px;">
        <button (click)="addCube('cube')" mat-stroked-button>Add cube</button>
        <button (click)="addCube('arrow')" mat-stroked-button>Add arrow</button>
      </section>
      <section>
        <ng-container *ngFor="let cube of block.content.cubes; index as i">
          <mat-expansion-panel *ngIf="cube.type == 'arrow'">
            <mat-expansion-panel-header>
              <mat-panel-title>{{cube.text}}</mat-panel-title>
            </mat-expansion-panel-header>
            <mat-form-field>
              <input matInput type="text" [(ngModel)]="cube.text" placeholder="Arrow tooltip...">
              <mat-icon matSuffix
                [matTooltip]="cube.text" matTooltipHideDelay="100" svgIcon="arrow-right-thick"></mat-icon>
            </mat-form-field>
            <button mat-stroked-button (click)="deleteCube(i)"> Delete Arrow </button>
          </mat-expansion-panel>
          <mat-expansion-panel
            (opened)="cube.raw = true" (closed)="cube.raw = false" *ngIf="cube.type != 'arrow'">
            <mat-expansion-panel-header>
              <mat-panel-title *ngIf="!cube.raw">
                <img [attr.src]="cubes[i].img" alt="">
                <span>{{cube.scramble}}</span>
              </mat-panel-title>
            </mat-expansion-panel-header>
            <mat-form-field>
              <mat-select [(value)]="cube.type">
                <mat-option *ngFor="let p of puzzles" [value]="p.value">{{p.name}}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-select [(value)]="cube.mode" [disabled]="cube.type != 'rubik'">
                <mat-option *ngFor="let mode of modes" [value]="mode[1]">{{mode[0]}}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-select [(value)]="cube.view">
                <mat-option value="trans">3D</mat-option>
                <mat-option value="2d">2D</mat-option>
                <mat-option value="plan">Top view</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field *ngIf="cube.view == 'plan'">
              <input matInput type="text" [(ngModel)]="cube.tips" placeholder="tips...">
            </mat-form-field>
            <section>
              Order ({{cube.order[0]}} x {{cube.order[1]}} x {{cube.order[2]}}):
              <mat-slider
              [(ngModel)]="cube.order[0]" min="1" max="10" step="1" thumbLabel
              ></mat-slider>
              <mat-slider *ngIf="cube.type == 'rubik'"
              [(ngModel)]="cube.order[1]" min="1" max="10" step="1" thumbLabel
              ></mat-slider>
              <mat-slider *ngIf="cube.type == 'rubik'"
              [(ngModel)]="cube.order[2]" min="1" max="10" step="1" thumbLabel
              ></mat-slider>
            </section>
            <mat-form-field>
              <input matInput type="text" [(ngModel)]="cube.scramble" placeholder="Scramble...">
            </mat-form-field>
            <section>
              Rotation:
              X: <mat-slider [(ngModel)]="cube.rotation.x"
                min="-180" max="180" step="5" thumbLabel></mat-slider>
              Y: <mat-slider [(ngModel)]="cube.rotation.y"
                min="-180" max="180" step="5" thumbLabel></mat-slider>
              Z: <mat-slider [(ngModel)]="cube.rotation.z"
                min="-180" max="180" step="5" thumbLabel></mat-slider>
            </section>
            <img [attr.src]="cubes[i].img" alt="">
            <section>
              <button mat-stroked-button (click)="refreshCube(i)"> Refresh view </button>
              <button mat-stroked-button (click)="deleteCube(i)"> Delete Cube </button>
            </section>
          </mat-expansion-panel>
        </ng-container>
      </section>
    </mat-tab>
  </mat-tab-group>
  <section>
    <button mat-button (click)="close()">Cancel</button>
    <button mat-button (click)="close(block)">Add</button>
  </section> -->
</Modal>

<style lang="postcss">
  .main-container {
    height: calc(100vh - 7rem);
    overflow: scroll;
  }

  .container-mini.cube {
    @apply flex items-center justify-evenly flex-wrap;
  }

  .container-mini:not(.main-container):last-child {
    @apply mb-4;
  }

  .to-top.visible {
    @apply bottom-4;
  }

  .trigger:hover > .absolute {
    @apply pointer-events-auto opacity-100;
  }
</style>