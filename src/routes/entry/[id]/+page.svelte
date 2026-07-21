<script>
  //@ts-nocheck
  import { page } from '$app/stores'; // store to access active route parameters
  import { details } from '$lib/state.svelte.js';
  import EntryDetails from '$lib/components/EntryDetails.svelte';

  // Reactively fetch new word details from SQLite whenever the URL [id] changes
  $effect(() => {
    const id = $page.params.id; // extract the dynamic entry ID from the current route path
    if (id) {
      details.selectWord(id);
    }
  });
</script>

<EntryDetails />