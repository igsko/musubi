<script>
  import '../app.css';

  // Svelte 5 snippet syntax for rendering child pages (+page.svelte)
  let { children } = $props();
</script>

<!-- Render the current page -->
{@render children()}