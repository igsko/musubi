<script>
  // @ts-nocheck
  import { settings } from '$lib/state';
  import { splitJapanese, segmentFurigana } from '$lib/utils/japanese';

  let { entry, onSelect, actionButton } = $props();

  let primaryHW = $derived(entry?.headwords?.[0]);
  let parts = $derived(splitJapanese(primaryHW?.japanese));
  let translation = $derived(
    entry?.meanings?.[0]?.translations 
      ? entry.meanings[0].translations.slice(0, 3).join(', ') 
      : 'Brak tłumaczenia'
  );

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(entry.id);
    }
  }
</script>

<div 
  class="list-item" 
  role="button"
  tabindex="0"
  onclick={() => onSelect?.(entry.id)}
  onkeydown={handleKeyDown}
>
  <div class="item-main">
    <span class="japanese-word" lang="ja">
      {#if settings.showFurigana}
        {#each segmentFurigana(parts.kanji, parts.kana) as segment}
          <ruby class="kanji-with-reading">
            {segment.text}
            {#if segment.furi}
              <rt class="furigana">{segment.furi}</rt>
            {/if}
          </ruby>
        {/each}
      {:else}
        {parts.kanji || parts.kana}
      {/if}
    </span>
    <span class="romaji">{primaryHW?.romaji}</span>
  </div>
  
  <div class="item-sub">
    <span class="translation">
      {translation}
    </span>
    {#if actionButton}
      {@render actionButton()}
    {/if}
  </div>
</div>

<style>
  .list-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 12px;
    background-color: var(--bg-app);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .list-item:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .list-item:hover {
    background-color: var(--bg-card);
    border-color: var(--accent);
  }

  .item-main {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
  }

  .japanese-word {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-main);
    display: inline-flex;
    align-items: baseline;
    line-height: 1.1;
  }

  .kanji-with-reading {
    ruby-position: over;
  }

  .furigana {
    font-size: 0.55em;
    color: var(--text-muted);
    letter-spacing: 0.02em;
    padding-bottom: 2px;
    user-select: none;
  }

  .romaji {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .item-sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 6px;
    gap: 12px;
  }

  .translation {
    font-size: 0.85rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
</style>