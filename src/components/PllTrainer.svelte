<script lang="ts">
  import { Puzzle } from "@classes/puzzle/puzzle";
  import { getPLLScramble, pllfilter } from "@cstimer/scramble/scramble_333";
  import { generateCubeBundle } from "@helpers/cube-draw";
  import Select from "@components/material/Select.svelte";
  import Button from "@components/material/Button.svelte";
  import Modal from "@components/Modal.svelte";
  
  import CheckIcon from '@icons/Check.svelte';
  import timer from "@helpers/timer";

  const TOP_FACE = [
    { value: 'random', label: 'Color neutral' },
    { value: '',       label: 'White' },
    { value: 'x2',     label: 'Yellow' },
    { value: "z'",     label: 'Red' },
    { value: 'z',      label: 'Orange' },
    { value: "x'",     label: 'Blue' },
    { value: 'x',      label: 'Green' },
  ]

  let columns: string[] = ['No.', 'Case', 'Expected', 'Answer', 'Time'];
  let CASES: number[] = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  let topFace: string = 'random';
  let cases: number = 20;
  let stage: number = 0;
  let correct: number = 0;

  let idx: number;
  let pllCases: string[] = [];
  let caseName: string[] = [];
  let images: string[] = [];
  let answers: string[] = [];
  let filters: string[] = pllfilter.slice().sort();
  let times: number[] = [];
  let bundle: any[] = [];

  let showAnswer: boolean = false;
  let lastAnswer: string = null;

  let lastTime: number;
  let showModal: boolean = false;

  function next() {
    switch(stage) {
      case 0: {
        pllCases.length = 0;
        caseName.length = 0;
        images.length = 0;
        answers.length = 0;
        times.length = 0;
        idx = 0;

        let len = pllfilter.length;
        let puzzles: Puzzle[] = [];

        for (let i = 0, maxi = cases; i < maxi; i += 1) {
          let idx = ~~( Math.random() * len );
          let scr = getPLLScramble(null, null, idx);
          pllCases.push( scr );
          caseName.push( pllfilter[idx] );
          
          let pref = topFace === 'random' ?
            [ "x", "x'", "", "z", "z'", "x2" ][ ~~(Math.random() * 6) ]
            : topFace;

          let rot = ["", "y", "y'", "y2"][ ~~(Math.random() * 4) ];

          puzzles.push( Puzzle.fromSequence(pref + " " + rot + " " + scr, {
            type: 'rubik',
            view: 'trans'
          }) );
        }

        let subscr = generateCubeBundle(puzzles, null, true).subscribe((res: string[]) => {
          if ( res !== null ) {
            images.push(...res);
          } else {
            lastTime = Date.now();
            stage = 1;
            setTimeout(() => subscr());
          }
        });
        break;
      }
      case 1: {
        bundle.length = 0;

        for (let i = 0, maxi = cases; i < maxi; i += 1) {
          bundle.push({
            id: i + 1,
            img: images[i],
            expected: caseName[i],
            answer: answers[i],
            time: times[i],
          });
        }

        stage = 2;
        break;
      }
      case 2: {
        correct = 0;
        stage = 0;
        break;
      }
    }
  }

  function addAnswer(ans: string) {
    answers.push(ans);
    times.push( Date.now() - lastTime );
    lastAnswer = ans;
    showAnswer = true;

    if ( ans === caseName[ idx ] ) {
      correct += 1;
    }

    setTimeout(() => {
      showAnswer = false;
      idx += 1;
      lastTime = Date.now();

      if ( idx === cases ) {
        next();
      }
    }, 1000);
  }

  function handleKeyUp(e: KeyboardEvent) {
    if ( stage != 1 ) return;

    let gFilters = [ /^(Numpad|Digit)1$/, /^(Numpad|Digit)2$/, /^(Numpad|Digit)3$/, /^(Numpad|Digit)4$/ ];
    let twoFilter = /^Key[AJNRU]$/;
    let singleFilter = /^Key[EFHTVYZ]$/;

    if ( gFilters.some(r => r.test(e.code)) ) {
      addAnswer([ 'Ga', 'Gb', 'Gc', 'Gd' ][ +e.code.slice(-1) - 1 ]);
    } else if ( twoFilter.test(e.code) ) {
      addAnswer(e.code.slice(-1) + (e.shiftKey ? 'b' : 'a'));
    } else if ( singleFilter.test(e.code) ) {
      addAnswer(e.code.slice(-1));
    }
  }
</script>

<svelte:window on:keyup={ handleKeyUp }></svelte:window>

<div
  class="text-gray-400 container-mini bg-white bg-opacity-10 w-4/5 mx-auto rounded-md
    flex flex-col items-center px-4 py-8 cnt relative
  ">
  <h1 class="text-center text-3xl mb-4 text-gray-300 font-bold">PLL Trainer</h1>

  <span class="absolute right-4 top-4 bg-gray-500 text-gray-200 w-6 h-6 flex items-center justify-center
    cursor-pointer rounded-full shadow-md hover:shadow-lg hover:bg-gray-400 font-bold
    transition-all duration-200
  " on:click={ () => showModal = true }>?</span>
  
  {#if stage === 0}
    <div class="grid grid-cols-2 w-max items-center mx-auto gap-4">
      <span>Top Face</span>
      <Select items={ TOP_FACE } label={ e => e.label  } bind:value={ topFace }/>
      
      <span>Cases</span>
      <Select items={ CASES } transform={ e => e } bind:value={ cases }/>
    </div>

    <Button
      on:click={ next }
      class="bg-green-700 hover:bg-green-600 text-gray-300 mx-auto my-4">Next</Button>
  {/if}

  {#if stage === 1}
    <h3>Case {idx + 1} / {cases}</h3>
    <img src={ images[ idx ] } class="puzzle-img" alt="">

    <div class="answer-container grid gap-2 my-4 max-w-2xl">
      {#each filters as f}
        <button
          class="answer border border-gray-300 p-4 flex items-center justify-center outline-none rounded-md"
          class:right={ f === caseName[idx] && showAnswer }
          class:wrong={ f != caseName[idx] && f === lastAnswer && showAnswer }
          on:click={ () => addAnswer(f) }
        >{f}</button>
      {/each}
    </div>
  {/if}

  {#if stage === 2}
    <div class="flex items-center text-gray-400 font-bold">
      <span class="mr-1">Completed: {correct} / {cases}</span>
      {#if correct === cases} <CheckIcon width="1.2rem" height="1.2rem"/> {/if}
      <Button on:click={ next } class="ml-12 bg-green-700 hover:bg-green-600 text-gray-300">Try again</Button>
    </div>

    <div class="grid grid-cols-5 mt-8 text-center w-full overflow-scroll place-items-center">
      {#each columns as c}
        <strong>{ c }</strong>
      {/each}

      {#each bundle as b}
        <span class="{ b.expected === b.answer ? 'text-green-400' : '' }">{ b.id }</span>
        <img src={ b.img } alt="" class="puzzle-img flex mx-auto">
        <span class="{ b.expected === b.answer ? 'text-green-400' : '' }">{ b.expected }</span>
        <span class="{ b.expected === b.answer ? 'text-green-400' : '' }">{ b.answer }</span>
        <span class="{ b.expected === b.answer ? 'text-green-400' : '' }">{ timer(b.time, false, true) }</span>
      {/each}
    </div>
  {/if}

  <Modal bind:show={ showModal }>
    <h1>Key bindings</h1>

    <h2>Single letter PLL</h2>
    <blockquote>Just tap the letter to answer the quiz.</blockquote>
    
    <h2>Two variants PLL</h2>
    <blockquote>For PLL's like <mark>Ja</mark> and <mark>Jb</mark>, lowercase letter is the <mark>a</mark> variant <mark>(j is Ja)</mark> and capital letter is the <mark>b</mark> variant <mark>(J is Jb)</mark></blockquote>

    <h2>G perms</h2>
    <blockquote>For the G Perms you can use the numbers <mark>1</mark> to <mark>4</mark> (Ga, Gb, Gc and Gd).</blockquote>
  </Modal>
</div>

<style lang="postcss">
  .cnt {
    max-height: 80vh;
  }

  .grid {
    max-height: 30rem;
  }

  .answer-container {
    grid-template-columns: repeat(auto-fit, minmax(3rem, 1fr));
  }

  .answer.right {
    @apply border-green-400 text-green-400 shadow-green-400 shadow-md;
  }
  
  .answer.wrong {
    @apply border-red-400 text-red-400 shadow-red-400 shadow-md;
  }

  h1 {
    @apply text-2xl font-bold text-gray-300 text-center;
  }

  h2 {
    @apply text-xl font-bold text-gray-300 mt-4;
  }

  mark {
    @apply bg-purple-600 p-1 text-slate-200 inline-flex items-center justify-center;
    border-radius: .25rem;
  }
</style>