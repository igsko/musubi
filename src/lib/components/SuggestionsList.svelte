<script>
  //@ts-nocheck
  import { dict } from '$lib/state.svelte.js';
  import { segmentFurigana } from '$lib/utils/furigana.js';

  // Detects when the user is reaching the bottom of the list
  function handleScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    // Trigger when we are within 30px of the bottom boundary
    if (scrollHeight - scrollTop - clientHeight < 30) {
      // User is near the bottom of the list, load more suggestions
      dict.loadMore();
    }
  }
</script>

{#if dict.suggestions.length > 0}
  <ul class="dropdown" onscroll={handleScroll}>
    {#each dict.suggestions as sug (sug.id)}
      <li>
        <button type="button" onclick={() => dict.selectWord(sug.id)} class="suggestion-btn">
          <div class="japanese-word">
            {#each segmentFurigana(sug.kanji, sug.kana) as segment}
              <ruby class="kanji-with-reading">
                {segment.text}
                {#if segment.furi}
                  <rt class="furigana">{segment.furi}</rt>
                {/if}
              </ruby>
            {/each}
            </div>
          <div class="translation">{sug.translation}</div>
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>

  /* mobile responsivity */
  @media (max-width: 600px) {
    .dropdown {
      /* Force the list to occupy 100% of the vertical viewport below the searchbox */
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100%;
      max-height: 100%;
      
      /* Reset floating borders and shadows */
      border: none;
      box-shadow: none;
      border-radius: 0;
    }
  }
</style>