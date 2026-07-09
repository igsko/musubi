<script>
  //@ts-nocheck
  import { search, details, user, uiState } from '$lib/state.svelte.js';
  import { segmentFurigana } from '$lib/utils/furigana.js';

  function getFrequencyMilestone(rank) {
    if (!rank) return null;

    // crimson
    if (rank <= 100)   return { text: '100',  tier: 'tier-100' };
    if (rank <= 250)   return { text: '250',  tier: 'tier-250' };
    // slate blue
    if (rank <= 500)   return { text: '500',  tier: 'tier-500' };
    if (rank <= 1000)  return { text: '1k',  tier: 'tier-1k' };
    // amber
    if (rank <= 2000)  return { text: '2k',  tier: 'tier-2k' };
    if (rank <= 5000)  return { text: '5k',  tier: 'tier-5k' };
    // sand
    if (rank <= 7500)  return { text: '7.5k', tier: 'tier-75k' };
    // slate gray
    if (rank <= 10000) return { text: '10k', tier: 'tier-10k' };
    if (rank <= 15000) return { text: '15k',  tier: 'tier-15k' };
    if (rank <= 20000) return { text: '20k', tier: 'tier-20k' };
    if (rank <= 30000) return { text: '30k', tier: 'tier-rare' };
    return { text: '45k', tier: 'tier-rare' };
  }

  // Detects when the user is reaching the bottom of the list
  function handleScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    // Trigger when we are within 30px of the bottom boundary
    if (scrollHeight - scrollTop - clientHeight < 40) {
      // User is near the bottom of the list, load more suggestions
      search.loadMore();
    }
  }
</script>

<ul class="dropdown" onscroll={handleScroll}>
  {#if search.suggestions.length > 0}
    {#each search.suggestions as sug, idx (sug.id)}
      <li class:active={search.selectedIndex === idx}>
        <button type="button" onclick={
          () => {
            search.selectedIndex = idx;         // synchronize index

            // switch view and clear list instantly
            uiState.closeSettings();           

            details.selectWord(sug.id).catch(err => {
              console.error("Failed to load entry details:", err);
            });
            user.addToHistory(sug.id).catch(err => {
              console.error("Failed to add entry to history:", err);
            });
          }} 
          class="suggestion-btn"
        >
          <div class="suggestion-row">
            <div class="japanese-word" lang="ja">
              {#each segmentFurigana(sug.kanji, sug.kana) as segment}
                <ruby class="kanji-with-reading">
                  {segment.text}
                  {#if segment.furi}
                    <rt class="furigana">{segment.furi}</rt>
                  {/if}
                </ruby>
              {/each}
            </div>

            <!-- List Badges/Indicators (Right-aligned) -->
            <div class="suggestion-meta">
              <!-- Bookmark Star (if saved by user) -->
              {#if user.bookmarks?.includes(sug.id)}
                <span class="bookmark-indicator" title="Zapisano w zakładkach">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </span>
              {/if}

              <!-- SQLite frequency rank badge -->
              {#if sug.frequency_rank}
                {const milestone = getFrequencyMilestone(sug.frequency_rank)}
                <span class="rank-badge {milestone.tier}" title="Pozycja w słowniku: #{sug.frequency_rank}">
                  {milestone.text}
                </span>
              {/if}
            </div>
          </div>

          <div class="translation">{sug.translation}</div>
        </button>
      </li>
    {/each}

    {#if search.loading}
      <li class="skeleton-inline-row">
        <div class="skeleton-shimmer inline-shimmer"></div>
      </li>
    {/if}

  {:else if search.loading && search.query.trim().length > 0}
    <!-- Initial search query placeholder skeletons -->
    {#each Array(6) as _, i}
      <li class="skeleton-item">
        <div class="skeleton-shimmer title-shimmer"></div>
        <div class="skeleton-shimmer body-shimmer"></div>
      </li>
    {/each}
  {/if}
</ul>


<style>
  .dropdown {
      display: flex;
      flex-direction: column;

      height: 100%;
      overflow-y: auto; /* adds a scrollbar only when items exceed max-height */

      /* visual */
      background-color: var(--bg-card);
      border-right: 1px solid var(--border-main);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      list-style: none;
  }

  .dropdown::-webkit-scrollbar {
      width: 6px;
  }

  .dropdown::-webkit-scrollbar-track {
      background: transparent;
  }

  .dropdown::-webkit-scrollbar-thumb {
      background-color: rgba(128, 128, 128, 0.2);
      border-radius: 3px;
  }

  .dropdown::-webkit-scrollbar-thumb:hover {
      background-color: rgba(128, 128, 128, 0.4);
  }

  /* Individual list item wrapper */
  .dropdown li {
      display: flex;
      align-items: stretch;
      width: 100%;
      border: none;
      border-bottom: 1px solid var(--border-main);
      background: transparent;
      color: var(--text-main);
      cursor: pointer;
      transition: background-color 0.1s ease;
  }

  /* Hover highlights */
  .dropdown li:hover {
      background-color: rgba(0, 0, 0, 0.03);
  }

  :root.dark .dropdown li:hover {
      background-color: rgba(255, 255, 255, 0.03);
  }

  /* 
    Preserves the active state
    When the user selects an item, this visually anchors 
    the left selection to the details loading in on the right.
  */
  .dropdown li.active {
      background-color: rgba(184, 44, 60, 0.06);
      border-left: 3px solid var(--accent);
  }

  .suggestion-btn {
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px 8px 8px 10px; /* Symmetrical padding for 2-line layout */

      /* STACK ELEMENTS VERTICALLY */
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 3px; /* Small vertical gap between Japanese word and translation */
  }

  .suggestion-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
  }

  .japanese-word {
      font-size: 1.3rem;
      color: var(--text-main);
      display: inline-flex;
      align-items: baseline;
      line-height: 1;
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

 .translation {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-top: 2px;
    padding-left: 4px;
  }

  .suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    width: 100%;
    gap: 12px;
  }

  .suggestion-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  /* badge and indicator typography */
  .bookmark-indicator {
    color: var(--accent);
    display: flex;
    align-items: center;
  }

  .rank-badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    border: none;
    white-space: nowrap;
    letter-spacing: 0.03em;
    border: none;
  }

  /* CRIMSON FAMILY*/
  .rank-badge.tier-100 {
    background-color: rgba(184, 44, 60, 0.12);
    color: var(--accent);
  }

  .rank-badge.tier-250 {
    background-color: rgba(184, 44, 60, 0.05);
    color: rgba(184, 44, 60, 0.85);
  }

  /* SLATE BLUE FAMILY */
  .rank-badge.tier-500 {
    background-color: rgba(49, 130, 206, 0.12);
    color: #2b6cb0;
  }

  .rank-badge.tier-1k {
    background-color: rgba(49, 130, 206, 0.05);
    color: rgba(43, 108, 176, 0.85);
  }

  :global(.dark) .rank-badge.tier-500 {
    background-color: rgba(99, 179, 237, 0.15);
    color: #90cdf4;
  }
  :global(.dark) .rank-badge.tier-1k {
    background-color: rgba(99, 179, 237, 0.06);
    color: rgba(144, 205, 244, 0.85);
  }

  /* WARM AMBER FAMILY */
  .rank-badge.tier-2k {
    background-color: rgba(214, 158, 46, 0.12);
    color: #b7791f;
  }

  .rank-badge.tier-5k {
    background-color: rgba(214, 158, 46, 0.05);
    color: rgba(183, 121, 31, 0.85);
  }

  :global(.dark) .rank-badge.tier-2k {
    background-color: rgba(236, 201, 75, 0.15);
    color: #ecc94b;
  }
  :global(.dark) .rank-badge.tier-5k {
    background-color: rgba(236, 201, 75, 0.06);
    color: rgba(236, 201, 75, 0.8);
  }

  /* SAND FAMILY */
  .rank-badge.tier-75k {
    background-color: rgba(183, 121, 31, 0.02);
    color: var(--text-muted);
  }
  
  :global(.dark) .rank-badge.tier-75k {
    background-color: rgba(236, 201, 75, 0.02);
    color: var(--text-muted);
  }

  /* GRAY FAMILY */
  .rank-badge.tier-10k,
  .rank-badge.tier-15k,
  .rank-badge.tier-20k {
    background-color: rgba(0, 0, 0, 0.03);
    color: var(--text-muted);
  }

  .rank-badge.tier-15k { opacity: 0.85; }
  .rank-badge.tier-20k { opacity: 0.7; }

  :global(.dark) .rank-badge.tier-10k,
  :global(.dark) .rank-badge.tier-15k,
  :global(.dark) .rank-badge.tier-20k {
    background-color: rgba(255, 255, 255, 0.04);
  }

  /* RARE FAMILY */
  .rank-badge.tier-rare {
    background-color: transparent;
    color: var(--text-muted);
    border: 1px dashed var(--border-main) !important;
    opacity: 0.4;
  }

  /* ==========================================
     SHIMMER SKELETON PLACEHOLDERS
     ========================================== */
  .placeholder-list {
    overflow: hidden;
  }

  .skeleton-item {
    padding: 12px;
    border-bottom: 1px solid var(--border-main);
    display: flex;
    flex-direction: column;
    gap: 6px;
    list-style: none;
  }

  .skeleton-inline-row {
    padding: 12px;
    display: flex;
    justify-content: center;
    border: none !important;
  }

  .skeleton-shimmer {
    background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-app) 50%, var(--bg-card) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
    border-radius: 4px;
  }

  :global(.dark) .skeleton-shimmer {
    background: linear-gradient(90deg, var(--bg-card) 25%, var(--border-main) 50%, var(--bg-card) 75%);
    background-size: 200% 100%;
  }

  .title-shimmer {
    width: 45%;
    height: 18px;
  }

  .body-shimmer {
    width: 80%;
    height: 12px;
  }

  .inline-shimmer {
    width: 100%;
    height: 10px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
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
  /* desktop responsivity */
  @media (min-width: 601px) {
    .dropdown {
      grid-column: 1 !important;
      grid-row: 2 !important;
      
      position: static !important;
      width: auto !important;
      max-height: none !important;
      height: 100% !important;
      overflow-y: auto;
      
      margin: 0px;
      border: none !important;
      border-right: 1px solid var(--border-main) !important;
      border-radius: 0px !important;
      box-shadow: none !important;
      background-color: var(--bg-sidebar) !important;
    }
  }
</style>