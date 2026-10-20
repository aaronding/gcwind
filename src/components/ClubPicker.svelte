<script>
  // The cards are framed like the club cards of a bag: grey, and green for the
  // one selected. Rarity shows only in the level badge. Given a `level`, the
  // selected club carries it on its corner, as the cards of a bag do.
  let { clubs, clubType, selected, level, onselect } = $props();
</script>

<div class="clubs" data-testid={`club-list-${clubType}`}>
  {#each clubs as club (club.name)}
    {@const isSelected = club.name === selected}
    <button
      class="club chunky"
      class:selected={isSelected}
      data-testid={`club-${club.name}`}
      title={`${club.name} · ${club.type} · Tour ${club.tour}`}
      aria-pressed={isSelected}
      onclick={() => onselect(club.name)}
    >
      <img src={`images/${club.image}`} alt={club.name} loading="lazy" width="48" height="48" />
      {#if isSelected && level}
        <span class="level-badge" data-rarity={club.type} data-testid="club-level-badge">
          {level}
        </span>
      {/if}
      <span class="visually-hidden">
        {club.name}, {club.type}{isSelected && level ? `, level ${level}` : ''}
      </span>
    </button>
  {/each}
</div>

<style>
  .clubs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 2px 10px;
    scrollbar-width: thin;
  }

  .club {
    /* The level badge rings itself in the card's own background. */
    --card-bg: var(--surface);
    flex: 0 0 auto;
    width: 64px;
    height: 64px;
    min-height: 0;
    display: grid;
    place-items: center;
    padding: 6px;
    border: 2px solid var(--edge);
    background: var(--card-bg);
  }

  /* The badge sits on the picture's lower right corner. */
  .club .level-badge {
    --badge-ring: var(--card-bg);
    right: 1px;
    bottom: 1px;
  }

  .club.selected {
    --card-bg: var(--green-100);
    border-color: var(--green-500);
    background: var(--green-100);
    box-shadow:
      0 var(--bevel) 0 var(--green-700),
      0 0 0 3px var(--green-300);
  }

  .club img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  /* Smaller on a phone, where the height goes to the rings. */
  @media (max-width: 680px) {
    .clubs {
      padding: 2px 2px 6px;
    }

    .clubs .club {
      width: 52px;
      height: 52px;
      padding: 4px;
    }

    .club img {
      width: 40px;
      height: 40px;
    }
  }
</style>
