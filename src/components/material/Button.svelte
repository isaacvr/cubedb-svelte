<script lang="ts">
  import { ripple } from "./actions/ripple";
  import { createEventDispatcher } from "svelte";
  import LoadingIcon from "@icons/Loading.svelte";

  const dispatch = createEventDispatcher();

  export let flat = false;
  export let rp = true;
  export let file: boolean | 'image' | 'audio' | 'video' = false;
  export let tabindex = 0;
  export let ariaLabel = "";
  export let loading = false;
  let cl = "";
  export { cl as class };

  function handleClick(e: MouseEvent) {
    dispatch("click", e);

    if (file) {
      let f = document.createElement("input");
      f.type = "file";
      f.style.display = "none";
      f.accept = typeof file === 'string' ? file + '/*' : '';
      f.addEventListener("change", (e) => {
        dispatch("files", f.files);
        f.remove();
      });
      document.body.appendChild(f);
      f.click();
    }
  }
</script>

<button {tabindex} class={`
  px-4 py-2 rounded-md shadow-md flex items-center justify-center overflow-hidden
  relative font-bold transition-all duration-100 content

  hover:shadow-lg
` +
  (flat ? " shadow-none px-2 py-1 " : "") +
  (cl || " hover:bg-white hover:bg-opacity-10 border-none text-gray-400") +
  ( loading ? ' isLoading pointer-events-none' : '' )}

  on:click={handleClick} use:ripple={rp} aria-label={ariaLabel} 
>
  <slot />
  
  {#if loading}
    <div class="loading-wrapper">
      <div class="loading">
        <LoadingIcon size="1.2rem" />
      </div>
    </div>
  {/if}
</button>

<style>
  button {
    outline-color: transparent;
  }

  button.isLoading > :global( :not(.loading-wrapper) ) {
    opacity: 0;
    color: transparent;
  }

  @keyframes circle {
    0% {
      rotate: 0deg;
    }
    100% {
      rotate: 360deg;
    }
  }

  .loading-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: inherit;
  }

  .loading {
    position: absolute;
    left: 50%;
    translate: -50% 50%;
    animation: circle 1s linear infinite;
  }
</style>
