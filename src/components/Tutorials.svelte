<script lang="ts">
  import { onMount } from 'svelte';
  import type { Tutorial } from '../interfaces';
  import { Link, useLocation } from 'svelte-routing';
  import { DataService } from '../stores/data.service';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import Button from './material/Button.svelte';

  const location = useLocation();

  let dataService = DataService.getInstance();

  let tutorials:{ [key: string]: Tutorial[] } = {};
  let keys: string[] = [];
  let edition = false;

  onMount(() => {
    dataService.getTutorials().then(tut => {
      tutorials = tut.reduce((acc: { [key: string]: Tutorial[] }, e) => {
        !acc[e.puzzle] && (acc[e.puzzle] = []);
        acc[e.puzzle].push(e);
        return acc;
      }, {});

      keys = Object.keys(tutorials);

      keys.forEach(k => tutorials[k].sort((a, b) => a.level < b.level ? -1 : 1))
    })
  });
</script>

<main>
  <h1 class="text-2xl text-yellow-300 italic text-center">(experimental)</h1>
  {#if edition}
  <section class="container-mini">
    <Button><Plus />Add Tutorial</Button>
  </section>
  {/if}
  
  {#each keys as k}
    <section class="container-mini grid grid-cols-1">
      <h2 class="text-gray-400 font-bold">{k}</h2>
      <div class="flex">
        {#each tutorials[k] as t}
          <Link to="{ $location.pathname + '/' + t.puzzle + '/' + t.titleLower + '?id=' + t._id }"
            class="m-1.5 text-gray-400 p-2.5 shadow-md bg-purple-900 rounded-md"
          >{t.title}
          </Link>
        {/each}
      </div>
    </section>
  {/each}
</main>

<style>
  h2 {
    font-size: 1.2rem;
  }
</style>