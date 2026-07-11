<script>
  // @ts-nocheck
  import {details, user, goBack, goToWord, settings} from '$lib/state.svelte.js'; // import state and actions
  import { segmentFurigana } from '$lib/utils/furigana.js';
  import PitchAccent from '$lib/components/PitchAccent.svelte';

  const POS_KEYWORDS = [
    'rzeczownik', 'czasownik', 'przymiotnik', 'przysłówek', 'zaimek', 
    'wykrzyknik', 'spójnik', 'przedrostek', 'przyrostek', 'klasyfikator', 
    'partykuła', 'imiesłów', 'liczebnik'
  ];

  const CATEGORY_KEYWORDS = [
    'sport', 'buddyzm', 'geologia', 'fizyka', 'chemia', 'medycyna', 
    'anatomia', 'informatyka', 'matematyka', 'teatr', 'muzyka', 
    'religia', 'filozofia', 'prawo', 'ekonomia', 'astronomia', 
    'biologia', 'zoologia', 'botanika', 'lingwistyka', 'gramatyka', 
    'archeologia'
  ];

  // Helper to split a raw japanese database string (e.g., "物, もの") into kanji & kana
  function splitJapanese(rawJap) {
    if (!rawJap) return { kanji: null, kana: "" };
    const parts = rawJap.split(',').map(p => p.strip ? p.strip() : p.trim());
    if (parts.length >= 2) {
      return { kanji: parts[0], kana: parts[1] };
    }
    return { kanji: null, kana: parts[0] };
  }

  // Detects and parses "see also" references at runtime
  function parseSeeAlso(metaText) {
    if (!metaText) return null;

    const match = metaText.match(/^zobacz również\s+(.+?)(?:\s*-\s*\d+)?$/i);
    if(match) {
      const rawTarget = match[1].trim(); // e.g. "物珍しい/ ものめずらしい"

      // Extract just the first word before any slashes to use as the search key
      const searchKeyword = rawTarget.split(/[\/\s]/)[0].trim(); // e.g. "物珍しい"
      return {
        display: rawTarget,
        keyword: searchKeyword,
      };
    }
    return null;
  }

  // Detects if a tag string represents a Part of Speech
  function isPartOfSpeechTag(tag) {
    if (!tag) return false;
    const normalizedTag = tag.toLowerCase().trim();

    // EXCLUDE syntactic relational rules (e.g. "po czasowniku...", "przed rzeczownikiem...")
    if (normalizedTag.startsWith('po ') || normalizedTag.startsWith('przed ')) {
      return false;
    }
    
    return POS_KEYWORDS.some(keyword => normalizedTag.includes(keyword));
  }

  // Detects if a tag string represents a Subject Category / Domain
  function isCategory(metaText) {
    if (!metaText) return false;
    const lower = metaText.toLowerCase().trim();
    return CATEGORY_KEYWORDS.some(keyword => lower.includes(keyword));
  }

  // Cleans up the metadata strings
  function cleanPartsOfSpeech(text) {
    if (!text) return "";
    
    let cleaned = text.replace(/\s*\((powszechny|powszechne|powszechna|powszechnych)\)\s*/gi, ' ');
    
    // Normalize any double spaces created by the removal
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  // reactively compute the primary headword whenever selectedEntry changes
  let firstHW = $derived(details.selectedEntry ? details.selectedEntry.headwords[0] : null);
  // reactively split the primary word into kanji and kana
  let primary = $derived(firstHW ? splitJapanese(firstHW.japanese) : { kanji: null, kana: "" });
</script>

{#if details.selectedEntry}
  <div class="card">
    <button class="back-btn" onclick={() => goBack()}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Powrót do wyników
    </button>

    <div class="card-content">
      <!-- MAIN HEADER (kanji, furigana & romaji) -->
      <header class="card-header" lang="ja">
        {#if firstHW}
          <div class="main-word">
            {#if settings.showFurigana}
              {#each segmentFurigana(primary.kanji, primary.kana) as segment, i}
                <ruby class="card-kanji">
                  {segment.text}
                  {#if segment.furi}
                    <rt class="card-furigana">{segment.furi}</rt>
                  {:else}
                    <rt class="card-furigana invisible" aria-hidden="true">あ</rt>
                  {/if}
                </ruby>
              {/each}
            {:else}
                {primary.kanji || primary.kana}
            {/if}
          </div>

          <div class="header-sub-line">
            <span class="main-romaji">{firstHW.romaji}</span>
            {#if details.selectedEntry.pitch_accent}
              <PitchAccent pitch={details.selectedEntry.pitch_accent} />
            {/if}
          </div>
        {/if}
      </header>

      <!-- ALTERNATIVE SPELLINGS (Clean Comma-Separated List) -->
      {#if details.selectedEntry.headwords.length > 1}
        <section class="section">
          <h3 class="section-title">Inne pisownie / odczyty</h3>
          <div class="spelling-list">
            {#each details.selectedEntry.headwords.slice(1) as hw}
              {const p = splitJapanese(hw.japanese)}
              <span class="spelling-item">
                <span class="spelling-core">
                  {#if p.kanji}
                    <span class="tag-kanji">{p.kanji}</span>
                    <span class="tag-kana">({p.kana})</span>
                  {:else}
                    <span class="tag-kana">{p.kana}</span>
                  {/if}
                  <span class="tag-romaji">{hw.romaji}</span>
                </span>

                {#if hw.note}
                  <span class="tag-note">[{hw.note}]</span>
                {/if}
              </span>
            {/each}
          </div>
        </section>
      {/if}

      <!-- MEANINGS & DEFINITIONS -->
      <section class="section">
        <h3 class="section-title">Znaczenia</h3>
        <ol class="meanings-list">
          {#each details.selectedEntry.meanings as meaning}
            {const seeAlsos = meaning.metadata ? meaning.metadata.map(parseSeeAlso).filter(Boolean) : []}
            {const posTags = meaning.metadata ? meaning.metadata.filter(isPartOfSpeechTag).map(cleanPartsOfSpeech) : []}
            {const categoryTags = meaning.metadata ? meaning.metadata.filter(isCategory) : []}

            <!-- extract context tags and separate short tags from long explanations -->
            {const rawContextTags = meaning.metadata ? meaning.metadata.filter(meta => !parseSeeAlso(meta) && !isPartOfSpeechTag(meta) && !isCategory(meta)) : []}
            {const contextBadges = rawContextTags.filter(tag => tag.length <= 35)}
            {const longExplanations = rawContextTags.filter(tag => tag.length > 35)}

            <li class="meaning-item">
              <!-- parts of speech -->
              {#if posTags.length > 0}
                <span class="meaning-pos">{posTags.join(', ')}</span>
              {/if}

              <!-- badges -->
              <div class="meaning-body">
                <span class="translations-list">
                  {#each meaning.translations as trans, t_idx}
                    <span class="translation-term">
                      {trans}{t_idx < meaning.translations.length - 1 ? ', ' : ''}
                    </span>
                  {/each}
                </span>

                {#if categoryTags.length > 0 || contextBadges.length > 0}
                  <span class="inline-badges">
                    {#each categoryTags as cat}
                      <span class="meta-badge category-badge">{cat}</span>
                    {/each}
                    {#each contextBadges as ctx}
                      <span class="meta-badge context-badge">{ctx}</span>
                    {/each}
                  </span>
                {/if}
              </div>

              {#if longExplanations.length > 0}
                <p class="meaning-explanation">
                  {longExplanations.join('; ')}
                </p>
              {/if}

              <!-- see also footer -->
              {#if seeAlsos.length > 0}
                <div class="see-also-footer">
                  {#each seeAlsos as seeAlso}
                    <button 
                      type="button" 
                      class="see-also-link" 
                      onclick={() => goToWord(seeAlso.keyword)}
                    >
                      <span class="see-also-arrow">→</span>
                      zobacz również:&nbsp;<span class="see-also-target">{seeAlso.display}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </li>
          {/each}
        </ol>
      </section>
    </div>
  </div>
{/if}

<style>
  /* Detail Card base styling */
  .card {
      height: 100%;
      overflow-y: auto;
      padding: 16px;
      background-color: var(--bg-card);
      color: var(--text-main);
  }

  .back-btn {
      display: none;
  }

  .card-header {
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-main);
    padding-bottom: 12px;
  }

  .header-sub-line {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .main-word {
    font-size: 2.8rem;
    font-weight: 400;
    color: var(--text-main);
    display: inline-flex;
    align-items: baseline;
    line-height: 1.1;
  }

  .card-kanji {
    ruby-position: over;
  }

  .card-furigana {
    font-size: 0.45em;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    padding-bottom: 4px;
  }

  .card-furigana.invisible {
    visibility: hidden;
  }

  .main-romaji {
    font-size: 1.05rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1;
  }

  .section {
    margin-bottom: 18px;
  }

  .section-title {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 10px;
    border-bottom: 1px solid var(--border-main);
    padding-bottom: 4px;
  }

  .spelling-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    font-size: 0.95rem;
    color: var(--text-main);
    width: 100%;
  }

  .spelling-item {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
  }

  /* adds a comma after every spelling item except the last one in the container */
  .spelling-item:not(:last-child)::after {
    content: ',';
    color: var(--text-muted);
    margin-left: 0px;
  }

  .spelling-core {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    white-space: nowrap;
  }

  .tag-kanji {
    font-weight: 600;
    color: var(--text-muted);
  }

  .tag-kana {
    color: var(--text-muted);
  }

  .tag-romaji {
    font-size: 0.85em;
    color: var(--text-muted);
    margin-left: 4px;
    font-style: italic;
  }

  .tag-note {
    font-size: 0.8em;
    color: var(--accent);
    margin-left: 6px;
    font-style: italic;
  }

  .meanings-list {
    padding-left: 20px;
  }

  .meaning-item {
    margin-bottom: 16px;
    line-height: 1.5;
    color: var(--text-main);
  }

  /* List bullet styling adjustments */
  .meaning-item::marker {
    color: var(--text-muted);
    font-weight: bold;
  }

  .meaning-pos {
    display: inline-block;
    font-size: 0.8rem;
    font-style: italic;
    color: var(--text-muted);
    margin-bottom: 4px;
    font-weight: 500;
    text-transform: lowercase;
  }

  .meaning-body {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
  }

  .meaning-explanation {
    margin: 6px 0 8px 0;
    font-size: 0.88rem;
    color: var(--text-muted);
    font-style: italic;
    line-height: 1.4;
    padding-left: 10px;
    border-left: 2px solid var(--border-main);
  }

  .inline-badges {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-right: 2px;
  }

  .translations-list {
    font-size: 1.1rem;
    color: var(--text-main);
  }

  .translation-term {
    font-weight: 500;
  }

  .meta-badge {
    font-size: 0.72rem;
    font-weight: 500;
    text-transform: lowercase;
    font-style: italic;
    padding: 1px 8px;
    border-radius: 12px;
    letter-spacing: 0.02em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 20px;
    line-height: normal;
  }

  .category-badge {
    background-color: rgba(214, 158, 46, 0.08); /* gold background */
    color: #b7791f;                              /* gold text */
    border: 1px solid rgba(214, 158, 46, 0.18);
  }

  /* Dark mode override for the gold badges */
  :global(.dark) .category-badge {
    background-color: rgba(236, 201, 75, 0.1);
    color: #ecc94b;
    border: 1px solid rgba(236, 201, 75, 0.2);
  }

  .context-badge {
    background-color: rgba(184, 44, 60, 0.03); /* Soft crimson background */
    color: rgba(184, 44, 60, 0.99);                      /* Crimson text */
    border: 1px solid rgba(184, 44, 60, 0.12);
  }

  .see-also-footer {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .see-also-link {
    font-size: 0.8rem;
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    width: fit-content;
    padding: 2px 0;
    display: inline-flex;
    align-items: center;
    transition: color 0.15s ease;
  }

  .see-also-link:hover {
    color: var(--accent);
  }

  .see-also-arrow {
    color: var(--accent);
    font-weight: bold;
    margin-right: 6px;
    margin-left: 2px;
    transition: transform 0.15s ease; /* Animate the arrow slide */
  }

  .see-also-link:hover .see-also-arrow {
    transform: translateX(2px);
  }

  .see-also-target {
    font-weight: bold;
    text-decoration: underline; /* Native hyperlink underline */
    text-underline-offset: 2px;  /* Spacing between text and underline */
  }

  :global(.compact-layout) .card {
    padding: 12px;
  }

  :global(.compact-layout) .card-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
  }

  :global(.compact-layout) .main-word {
    font-size: 2.4rem;
  }

  :global(.compact-layout) .section {
    margin-bottom: 12px;
  }

  :global(.compact-layout) .section-title {
    margin-bottom: 6px;
    padding-bottom: 2px;
  }

  :global(.compact-layout) .meaning-item {
    margin-bottom: 8px;
  }

  :global(.compact-layout) .spelling-list {
    gap: 4px 8px;
  }

  @media (max-width: 600px) {
    .card {
      display: none; 
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 20; 
      background-color: var(--bg-card);
      flex-direction: column;
      padding: 0;
    }

    /* Show absolute overlay on mobile when a selection occurs */
    :global(main.container.has-selection) .card {
      display: flex;
    }

    .card-content {
      flex-grow: 1;
      overflow-y: auto;
      padding: 8px 16px 16px 16px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
      padding: 12px 16px 4px 16px;
      background-color: transparent !important;
      border-bottom: none;
      color: var(--accent);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: text-decoration 0.1s ease;
    }

    .back-btn:hover {
      background-color: transparent !important;
      text-decoration: underline; 
    }
  }

  @media (min-width: 601px) {
    /* position the card on the right spanning both rows.*/
    .card {
      grid-column: 2 !important;
      grid-row: 1 / 3 !important; 
      height: 100%;
      overflow-y: auto;
      padding: 24px;
      background-color: var(--bg-card);
      border-left: none;
    }

    .back-btn {
      display: none !important;
    }
  }
</style>