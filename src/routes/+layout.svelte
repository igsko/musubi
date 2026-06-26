<script>
  //@ts-nocheck
  import { onMount } from 'svelte';
  import { user } from '$lib/state.svelte.js';
  import '../app.css';

  let { children } = $props();

  // Trigger loading of user storage from disk on startup
  onMount(async () => {
    await user.init();
  });
</script>

<!-- Render the current page -->
{@render children()}