<script>
  // @ts-nocheck
  import {isTauri} from '$lib/services/platform.js';
  import Titlebar from '$lib/components/Titlebar.svelte';
  import SearchBox from '$lib/components/SearchBox.svelte';
  import SuggestionsList from '$lib/components/SuggestionsList.svelte';
  import EntryDetails from '$lib/components/EntryDetails.svelte';
</script>

<Titlebar />

<main class="container" class:tauri-desktop={isTauri}>
  <!-- search container -->
  <div class="search-section">
    <SearchBox />
  </div>

  <!-- content viewport -->
  <div class="view-section">
    <SuggestionsList />
    <EntryDetails />
  </div>

</main>

<style>
</style>
