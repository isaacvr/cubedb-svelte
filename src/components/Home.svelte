<script lang="ts">
  import { Link } from "svelte-routing";
  import { globalLang } from "@stores/language.service";
  import { getLanguage } from "@lang/index";
  import type { ICard } from "@interfaces";
  import { screen } from "@stores/screen.store";
  // import { Snow } from "@pclasses/Snow";
  // import { onDestroy, onMount } from "svelte";

  let cards: ICard[] = [];
  let canvas: HTMLCanvasElement;
  // let snow = new Snow(100);
  // let showSnow = true;

  function updateTexts() {
    const HOME = getLanguage( $globalLang ).HOME;

    const showPrivate = true;

    cards = [
      {
        title: HOME.tutorials,
        route: "/tutorials",
        ready: showPrivate,
        cube: '/assets/tutorials.png',
      }, {
        title: HOME.algorithms,
        route: "/algorithms",
        ready: true,
        cube: '/assets/algorithms.png',
      }, {
        title: 'Algorithm Handler',
        route: "/algorithms-admin",
        ready: showPrivate,
        cube: '/assets/algorithms-admin.png',
      }, {
        title: HOME.timer,
        route: "/timer",
        ready: true,
        cube: '/assets/timer.png',
      }, {
        title: HOME.reconstructions,
        route: "/reconstructions",
        ready: true,
        cube: '/assets/reconstructions.png',
      }, {
        title: HOME.battle,
        route: "/battle",
        ready: showPrivate,
        cube: '/assets/battle.png',
      }, {
        title: HOME.pll_recognition,
        route: "/pll-trainer",
        ready: true,
        cube: '/assets/pll.png',
      }, {
        title: HOME.simulator,
        route: "/simulator",
        ready: true,
        cube: '/assets/megaminx.png',
      }, {
        title: HOME.contest,
        route: '/contest',
        cube: '/assets/logo-500.png',
        ready: showPrivate,
      }, {
        title: HOME.tools,
        route: '/tools',
        cube: '/assets/tools.png',
        ready: true,
      }, {
        title: HOME.importExport,
        route: '/import-export',
        cube: '/assets/import-export.png',
        // ready: DataService.getInstance().isElectron,
        ready: true,
      }, {
        title: HOME.settings,
        route: "/settings",
        ready: true,
        cube: '/assets/settings.png'
      },
      {
        title: 'CubeDB',
        route: '/cubedb',
        cube: '/assets/logo-500.png',
        ready: false,
      }, {
        title: 'Remote',
        route: '/remote',
        cube: '/assets/logo-500.png',
        ready: false,
      }
    ].filter(c => c.ready);
  };

  // function updateSnow() {
  //   let ctx = canvas.getContext('2d');

  //   if ( !showSnow || !ctx ) return;
    
  //   ctx.fillStyle = 'white';
  //   ctx.strokeStyle = 'white';
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   snow.draw( ctx );
  //   requestAnimationFrame(updateSnow);
  // }

  // onMount(() => {
  //   canvas.width = window.innerWidth;
  //   canvas.height = window.innerHeight;

  //   updateSnow();
  // });

  // onDestroy(() => {
  //   showSnow = false;
  // });

  $: $globalLang, updateTexts();
</script>

<!-- <svelte:window on:resize={() => snow.reset()}/> -->

<main class="container-mini relative">
  <ul class="w-full grid place-items-center" class:isMobile={ $screen.isMobile }>
    {#each cards as card (card.route)}
      <li class={`text-center shadow-md rounded-md select-none cursor-pointer
      transition-all duration-200 py-3 px-3
      bg-backgroundLv1 text-gray-400

      hover:rotate-3 hover:shadow-lg ` + 'card-premium'}>
        <Link class="flex flex-col items-center justify-between w-full h-full" to={ card.route }>
          <img class="mx-auto" src={card.puzzle ? card.puzzle.img : card.cube} alt={ card.title }>
          <h2 class="text-sm">{card.title}</h2>
        </Link>
      </li>
      {/each}
  </ul>

</main>

<canvas bind:this={ canvas } class="absolute inset-0 pointer-events-none"/>

<style lang="postcss">
  ul {
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    row-gap: 2rem;
    padding-bottom: 1rem;
  }

  ul.isMobile {
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    row-gap: 1rem;
  }

  ul li {
    @apply w-40 h-48;
  }

  ul img {
    @apply w-32 h-32 object-contain;
  }

  ul.isMobile li {
    @apply w-36 h-44;
  }

  ul.isMobile img {
    @apply w-32 h-32;
  }
</style>