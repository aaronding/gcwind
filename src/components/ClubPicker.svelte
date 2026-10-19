<script>
  // Rarity is in the club data and was previously used only to cap the level.
  // Showing it as a frame colour turns it into something a player can read at a
  // glance, the way the game does.
  let { clubs, clubType, selected, onselect } = $props();
</script>

<div class="clubs" data-testid={`club-list-${clubType}`}>
  {#each clubs as club (club.name)}
    <button
      class="club chunky"
      class:selected={club.name === selected}
      data-rarity={club.type}
      data-testid={`club-${club.name}`}
      title={`${club.name} · ${club.type} · Tour ${club.tour}`}
      aria-pressed={club.name === selected}
      onclick={() => onselect(club.name)}
    >
      <img src={`images/${club.image}`} alt={club.name} loading="lazy" width="48" height="48" />
      <span class="visually-hidden">{club.name}, {club.type}</span>
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
    flex: 0 0 auto;
    width: 64px;
    height: 64px;
    min-height: 0;
    display: grid;
    place-items: center;
    padding: 6px;
    /* The rarity tint sits in the frame, not the artwork. */
    border: 2px solid var(--rarity, var(--edge));
    background: var(--surface);
  }

  .club[data-rarity='Common'] {
    --rarity: var(--rarity-common);
  }

  .club[data-rarity='Rare'] {
    --rarity: var(--rarity-rare);
  }

  .club[data-rarity='Epic'] {
    --rarity: var(--rarity-epic);
  }

  .club.selected {
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
