<script context="module">
  export const TABS = {};
</script>

<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import Button from './Button.svelte';

  const selectedTab = writable(0);

  let tabs = [];
  let cl = '';

  export { cl as class };
  export let onChange = (tab?: number) => {};

  setContext(TABS, {
    registerTab(tab) {
      tabs.push(tab);
      tabs.forEach((e, p) => e.index = p);
      tabs = tabs;
    },

    unregisterTab(tab) {
      let pos = tabs.indexOf(tab);
      tabs.splice(pos, 1);

      $selectedTab = $selectedTab === tab.index ? 0 : $selectedTab;

      tabs.forEach((e, p) => e.index = p);
      tabs = tabs;
    },

    selectedTab,
  });

  function selectTab(tab) {
    $selectedTab = tab.index;
    onChange(tab.index);
  }

  export function prevTab() {
    let p = Math.max(0, $selectedTab - 1);
    selectTab( tabs[p] );
  }

  export function nextTab() {
    let p = Math.min(tabs.length - 1, $selectedTab + 1);
    selectTab( tabs[p] );
  }
</script>

<main class={`w-full ` + (cl || '')}>
  <section class="flex relative" style="--len: {tabs.length};">
    <slot />
  </section>
  <footer class="flex mt-auto border-t-2 border-t-gray-700">
    {#each tabs as tab}
      <Button
        class="rounded-none w-full
        { tab.index === $selectedTab ? 'bg-blue-400 text-black hover:bg-blue-500 hover:bg-opacity-100' : '' }"
        on:click={ () => selectTab(tab) }
      >
        {#if tab.icon }
          <svelte:component this={ tab.icon }/>
        {/if}
        { tab.name }
      </Button>
    {/each}
  </footer>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: 1fr auto;
    height: calc(100% - 6rem);
    overflow: hidden;
  }
</style>