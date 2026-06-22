<script>
  import { onMount } from 'svelte';
  import { dict } from '$lib/state.svelte.js';
  import '../app.css';

  let { children } = $props();

  // Trigger loading of user storage from disk on startup
  onMount(async () => {
    await dict.init();
  });
</script>

<!-- Render the current page -->
{@render children()}