<script>
  // @ts-nocheck
  import { dict } from '$lib/state.svelte.js';
  import { segmentFurigana } from '$lib/utils/furigana.js';

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
  let firstHW = $derived(dict.selectedEntry ? dict.selectedEntry.headwords[0] : null);
  // reactively split the primary word into kanji and kana
  let primary = $derived(firstHW ? splitJapanese(firstHW.japanese) : { kanji: null, kana: "" });
</script>

{#if dict.selectedEntry}
  <div class="card">
    <!-- 
      Mobile-only Back Button.
      Resolves to the global action to return to search suggestions.
    -->
    <button class="back-btn" onclick={() => dict.goBack()}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Powrót do wyników
    </button>

    <div class="card-content">
      <!-- MAIN HEADER (kanji, furigana & romaji) -->
      <header class="card-header">
        {#if firstHW}
          <div class="main-word">
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
          </div>
          <div class="main-romaji">{firstHW.romaji}</div>
        {/if}
      </header>

      <!-- ALTERNATIVE SPELLINGS (if multiple exist) -->
      {#if dict.selectedEntry.headwords.length > 1}
        <section class="section">
          <h3 class="section-title">Inne pisownie / odczyty</h3>
          <div class="spelling-tags">
            {#each dict.selectedEntry.headwords.slice(1) as hw}
              {const p = splitJapanese(hw.japanese)}
              <span class="spelling-tag">
                <span class="spelling-core">
                  {#if p.kanji}
                    <span class="tag-kanji">{p.kanji}</span> <span class="tag-kana">【{p.kana}】</span>
                  {:else}
                    <span class="tag-kana">{p.kana}</span>
                  {/if}
                  <span class="tag-romaji">({hw.romaji})</span>
                </span>
                {#if hw.note}
                  <span class="tag-note">— {hw.note}</span>
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
          {#each dict.selectedEntry.meanings as meaning}
            <li class="meaning-item">
              <!-- Metadata and Interactive Badges -->
              {#if meaning.metadata && meaning.metadata.length > 0}
                <div class="metadata-badges">
                  {#each meaning.metadata as meta}
                    <!-- Check if this specific metadata is a redirect link -->
                     {const seeAlso = parseSeeAlso(meta)}
                     {#if seeAlso}
                      <!-- Render as an interactive button link -->
                      <button 
                        type="button" 
                        class="meta-badge see-also-btn" 
                        onclick={() => dict.goToWord(seeAlso.keyword)}
                      >
                        <span class="see-also-label">ZOBACZ RÓWNIEŻ</span>
                        <span class="see-also-target">{seeAlso.display}</span>
                         <!-- inline arrow indicating redirection navigation -->
                        <svg class="see-also-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                      {:else if isPartOfSpeechTag(meta)}
                        <!-- Render as a part of speech badge -->
                        <span class="meta-badge pos-badge">{cleanPartsOfSpeech(meta)}</span>
                      {:else if isCategory(meta)}
                        <!-- Render as a category badge -->
                        <span class="meta-badge category-badge">{meta}</span>
                      {:else}
                        <!-- render as static badge -->
                        <span class="meta-badge context-badge">{meta}</span>
                      {/if}
                  {/each}
                </div>
              {/if}

              <!-- translation list -->
              <div class="translations-list">
                {#each meaning.translations as trans, t_idx}
                  <span class="translation-term">
                    {trans}{t_idx < meaning.translations.length - 1 ? ', ' : ''}
                  </span>
                {/each}
              </div>
            </li>
          {/each}
        </ol>
      </section>
    </div>
  </div>
{/if}

<style>
  /* 
    The layout and container styling of ".card", ".card-content" and ".back-btn" 
    are handled by global app.css

    We style the interior typography and component design elements here.
  */

  .card-header {
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border-main);
    padding-bottom: 18px;
  }

  .main-word {
    font-size: 3rem;
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
    font-size: 1.1rem;
    color: var(--text-muted);
    margin-top: 6px;
    font-style: italic;
  }

  .section {
    margin-bottom: 28px;
  }

  .section-title {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 14px;
    border-bottom: 1px solid var(--border-main);
    padding-bottom: 4px;
  }

  .spelling-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .spelling-tag {
    font-size: 0.95rem;
    background-color: var(--bg-app);
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--border-main);
    color: var(--text-main);
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  .spelling-core {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  .tag-kanji {
    font-weight: bold;
  }

  .tag-kana {
    color: var(--text-main);
    margin-left: 2px;
  }

  .tag-romaji {
    font-size: 0.85em;
    color: var(--text-muted);
    margin-left: 6px;
  }

  .tag-note {
    font-size: 0.8em;
    color: #cc3300; /* Muted crimson accent for inline annotations */
    margin-left: 6px;
    font-style: italic;
  }

  .meanings-list {
    padding-left: 20px;
  }

  .meaning-item {
    margin-bottom: 20px;
    line-height: 1.6;
    color: var(--text-main);
  }

  /* List bullet styling adjustments */
  .meaning-item::marker {
    color: var(--text-muted);
    font-weight: bold;
  }

  .metadata-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .meta-badge {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    background-color: rgba(184, 44, 60, 0.08); /* Light accent background */
    color: var(--accent);
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid rgba(184, 44, 60, 0.15); /* Accent outline border */
    letter-spacing: 0.02em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    min-height: 22px;
    line-height: normal;
  }

  .see-also-btn {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    
    background-color: var(--bg-card) !important;
    color: var(--accent) !important;
    border: 1px solid var(--border-main) !important;
    padding: 2px 10px 2px 8px !important;
    border-radius: 4px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    
    transition: 
      background-color 0.15s ease, 
      border-color 0.15s ease, 
      color 0.15s ease, 
      transform 0.15s ease, 
      box-shadow 0.15s ease;
  }

  .see-also-btn:hover {
    background-color: var(--bg-app) !important; /* Soft shift on hover */
    border-color: var(--accent) !important;     /* Crimson border highlights on hover */
    box-shadow: 0 3px 8px rgba(184, 44, 60, 0.12); /* Soft crimson glow on hover */
    transform: translateY(-1px);                 /* Micro-lift effect */
  }

  .see-also-btn:active {
    transform: translateY(0px);
  }

  .see-also-label {
    font-weight: 700;
    opacity: 0.8;
    letter-spacing: 0.04em;
  }

  .see-also-target {
    text-transform: none !important;
    font-weight: bold;
    text-decoration: underline; /* Native hyperlink underline */
    text-underline-offset: 2px;  /* Spacing between text and underline */
  }

  .see-also-arrow {
    margin-left: 2px;
    transition: transform 0.15s ease; /* Animate the arrow slide */
  }

  .see-also-btn:hover .see-also-arrow {
    transform: translateX(2px);
  }

  .pos-badge {
    background-color: rgba(49, 130, 206, 0.08); /* Soft blue background */
    color: #2b6cb0;                              /* Slate blue text */
    border: 1px solid rgba(49, 130, 206, 0.18);
  }

  .category-badge {
    background-color: rgba(214, 158, 46, 0.08); /* Soft translucent gold background */
    color: #b7791f;                              /* Muted gold/amber text */
    border: 1px solid rgba(214, 158, 46, 0.18);
  }

  /* Dark mode override for the gold badges */
  :global(.dark) .category-badge {
    background-color: rgba(236, 201, 75, 0.1);
    color: #ecc94b;
    border: 1px solid rgba(236, 201, 75, 0.2);
  }

  .context-badge {
    background-color: rgba(184, 44, 60, 0.08); /* Soft crimson background */
    color: var(--accent);                       /* Crimson text */
    border: 1px solid rgba(184, 44, 60, 0.15);
  }

  /* Dark mode override for the blue badges */
  :global(.dark) .pos-badge {
    background-color: rgba(99, 179, 237, 0.1);
    color: #90cdf4;
    border: 1px solid rgba(99, 179, 237, 0.2);
  }

  .translations-list {
    font-size: 1.1rem;
  }

  .translation-term {
    font-weight: 500;
  }
</style>