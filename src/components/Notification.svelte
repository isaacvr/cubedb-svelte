<script lang="ts">
  import { onMount } from 'svelte';
  import type { NotificationAction } from '@interfaces';
  import { NotificationService } from '@stores/notification.service';
  import { Avatar, Button, Toast } from 'flowbite-svelte';
  import { fly } from 'svelte/transition';
  
  export let key: string;
  export let timeout = 5000;
  export let header = 'Header';
  export let text = 'Text';
  export let html = '';
  export let icon: any = '';
  export let fixed = false;
  export let actions: NotificationAction[] = [];
  
  let open = true;
  let tm: NodeJS.Timer;
  let notService = NotificationService.getInstance();

  function close () {
    if ( !open ) return;
    
    !fixed && clearTimeout(tm);
    open = false;
    
    setTimeout(() => {
      notService.removeNotification(key);
    }, 100);
  }

  onMount(() => {
    // Avoid notifications that can't close and have no actions
    if ( actions.length === 0 ) {
      fixed = false;
    }

    if ( !fixed ) {
      tm = setTimeout(close, timeout);
    }
  });
</script>

<Toast transition={fly} params={{ x: 200 }} class="relative pointer-events-auto bottom-0 end-0 ml-auto mr-4"
  contentClass="flex items-center" bind:open dismissable={ fixed } position="bottom-right" on:close={ close }>

  {#if icon}
    {#if typeof icon === 'string'}
      <Avatar slot="icon" src={ icon }/>
    {:else}
      <svelte:component this={ icon } slot="icon" size="1.2rem"/>
    {/if}
  {/if}

  <div class="ms-3 text-sm font-normal">
    <span class="mb-1 text-base font-semibold dark:text-white">{ header }</span>
    <div class="mb-2 text-sm font-normal">{ text }</div>
    <div bind:innerHTML={ html } contenteditable="false"></div>

    {#if (actions || []).length}
      <div class="flex gap-2 mt-4">
        {#each actions || [] as action}
          <Button color={ action.color } on:click={ (e) => { action.callback(e); close(); }}>{ action.text }</Button>
        {/each}
      </div>
    {/if}
  </div>
</Toast>