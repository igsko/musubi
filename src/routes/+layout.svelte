<script>
  //@ts-nocheck
  import { onMount } from 'svelte';
  import '../app.css';

  let { children } = $props();
</script>

<!-- Render the current page -->
{@render children()}