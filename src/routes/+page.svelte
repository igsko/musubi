<!-- src/routes/+page.svelte -->
<script>
  //@ts-nocheck
  import { onMount } from 'svelte';

  let containerWidth = $state(400);
  let containerHeight = $state(400);

  let x = $state(0);
  let y = $state(0);
  let isDragging = $state(false);
  let isHovered = $state(false);

  let startX = 0;
  let startY = 0;
  let animFrame;

  function snapBack() {
    const ease = 0.15;

    if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) {
      x = 0;
      y = 0;
      isDragging = false;
      cancelAnimationFrame(animFrame);
      return;
    }

    x -= x * ease;
    y -= y * ease;

    animFrame = requestAnimationFrame(snapBack);
  }

  function handleMouseDown(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;

    cancelAnimationFrame(animFrame);
    isDragging = true;

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    startX = clientX - x;
    startY = clientY - y;

    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (!isDragging) return;

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    const limitX = (containerWidth / 2) - 60;
    const limitY = (containerHeight / 2) - 60;

    const newX = clientX - startX;
    const newY = clientY - startY;

    x = Math.max(-limitX, Math.min(limitX, newX));
    y = Math.max(-limitY, Math.min(limitY, newY));
  }

  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      snapBack();
    }
  }

  const ropePath = $derived(
    `M 0,${containerHeight / 2} L ${containerWidth / 2 + x},${containerHeight / 2 + y} L ${containerWidth},${containerHeight / 2}`
  );

  const scaleFactor = $derived(isDragging ? 1.06 : 1);
  const strokeThick = $derived(20 * scaleFactor * (140 / 360));
  const strokeMiddle = $derived(12 * scaleFactor * (140 / 360));
  const strokeThin = $derived(4 * scaleFactor * (140 / 360));
</script>

<svelte:window 
  onmousemove={handleMouseMove} 
  onmouseup={handleMouseUp}
  ontouchmove={handleMouseMove}
  ontouchend={handleMouseUp}
/>

<div 
  class="desktop-empty-card" 
  aria-hidden="true"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => { isHovered = false; handleMouseUp(); }}
>
  <div class="mizuhiki-container">
    <svg 
      class="mizuhiki-rope-svg" 
      class:dragging={isDragging}
      viewBox="0 0 {containerWidth} {containerHeight}"
      aria-hidden="true"
    >
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d={ropePath} stroke="var(--text-muted)" stroke-width={strokeThick} />
        <path d={ropePath} stroke="var(--bg-card)" stroke-width={strokeMiddle} />
        <path d={ropePath} stroke="var(--text-muted)" stroke-width={strokeThin} />
      </g>
    </svg>

    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="-180 -180 360 360" 
      class="mizuhiki-knot" 
      class:dragging={isDragging}
      width="100%" 
      height="100%"
      style="transform: translate({x}px, {y}px);"
      role="presentation"
      onmousedown={handleMouseDown}
      ontouchstart={handleMouseDown}
    >
      <defs>
        <g id="knot-geometry">
          <path d="M 0 30 L -60 -40 A 56.57 56.57 0 1 0 -60 40 L 0 -30 L 60 40 A 56.57 56.57 0 1 0 60 -40 Z" />
          <path d="M -30 0 L 40 -60 A 56.57 56.57 0 1 0 -40 -60 L 30 0 L -40 60 A 56.57 56.57 0 1 0 40 60 Z" />
          <path d="M -34.6 10 L -17.4 -10" />      
          <path d="M 17.4 10 L 34.6 -10" />       
          <path d="M -10 -34.6 L 10 -17.4" />     
          <path d="M 10 34.6 L -10 17.4" />       
          <path d="M -34.5 -10.3 L -20.5 6.1" />  
          <path d="M -8.7 35.2 L 4.5 19.8" />     
          <path d="M 20.5 -6.1 L 34.5 10.3" />    
          <path d="M -4.5 -19.8 L 8.7 -35.2" />   
        </g>
      </defs>

      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <use href="#knot-geometry" stroke="var(--text-muted)" stroke-width="20" />
        <use href="#knot-geometry" stroke="var(--bg-card)" stroke-width="12" />
        <use href="#knot-geometry" stroke="var(--text-muted)" stroke-width="4" />
      </g>
    </svg>
    
  </div>
</div>

<style>
  .desktop-empty-card {
    display: none;
  }

  @media (min-width: 601px) {
    .desktop-empty-card {
        grid-column: 2 !important;
        grid-row: 1 / 3 !important;
        
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background-color: var(--bg-card);
        cursor: default;
        position: relative;
        overflow: hidden;
    }

    .mizuhiki-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
        pointer-events: none;
        opacity: 0.08; 
        transition: opacity 0.4s ease;
    }

    .mizuhiki-rope-svg {
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
        z-index: 1;
    }

    .mizuhiki-knot {
        width: 140px;
        height: 140px;
        position: relative;
        z-index: 2;
        scale: 1;
        transition: scale 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        user-select: none;
        touch-action: none;
        pointer-events: auto;
    }

    .mizuhiki-knot.dragging {
        cursor: grabbing;
        scale: 1.06;
        transition: none !important;
    }
  }
</style>