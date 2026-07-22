<script>
  // @ts-nocheck
  import { parsePitchAccent } from "$lib/utils/japanese/pitch.js";

  let { pitch } = $props();

  // Reactively parse the pitch accent string when the prop changes
  let morae = $derived(pitch ? parsePitchAccent(pitch) : []);
</script>

{#if morae.length>0}
  <div class="pitch-container" lang="ja">
    {#each morae as mora}
      <div 
        class="mora-node"
        class:high={mora.isHigh}
        class:downstep={mora.isDownstep}
      >
        <span class="mora-text">{mora.text}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .pitch-container {
    display: inline-flex;
    align-items: flex-end;
    flex-wrap: nowrap; /* prevent pitch accents from wrapping mid-word */
    gap: 0px;          /* zero physical gap allows overlines to connect seamlessly */
    position: relative;
    user-select: none;
    vertical-align: middle;
  }

  .mora-node {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    /* 
      6px top padding holds line height boundaries
      2px side padding ensures glyphs do not overlap
    */
    padding: 0.4em 0.08em 0.15em 0.08em; 
    box-sizing: border-box;
  }

  /* 
    Establish base overline layout. Using absolute positioning prevents 
    line drift when character widths vary (e.g. "し" vs wider "しゅ").
  */
  .mora-node::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: transparent;
  }

  /* Trigger the overline when the mora is high pitch */
  .mora-node.high::before {
    background-color: var(--accent, #b82c3c);
  }


  .mora-node.downstep::before {
    right: -0.05em;
  }

  /* 
    Trigger the vertical downstep drop line on the right edge.
    Adjusting bottom limits prevents layout collisions with descenders.
  */
  .mora-node.downstep::after {
    content: '';
    position: absolute;
    top: 0;
    right: -0.05em; 
    bottom: 0.15em; /* Aligns cleanly with the text baseline padding */
    width: 2px;
    background-color: var(--accent, #b82c3c);
    z-index: 2;
  }

  .mora-text {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-main);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
</style>