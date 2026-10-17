<script>
  // A bag's clubs, one card per type, each showing the club with its level on
  // the picture, the way the game shows it. On a bag this is how the player
  // says which club the game put in their hand; in the bag editor it picks the
  // type to change.
  import { CLUB_TYPES, clubFor } from '../lib/clubs.js';

  let { selections, selected, onselect, onedit, label = 'Club in hand' } = $props();
</script>

<div
  class="cards"
  class:with-edit={!!onedit}
  role="group"
  aria-label={label}
  data-testid="bag-clubs"
>
  {#each CLUB_TYPES as type (type.key)}
    {@const pick = selections[type.key]}
    {@const club = clubFor(type.key, pick.club)}
    <button
      class="card chunky"
      class:selected={selected === type.key}
      data-rarity={club?.type}
      aria-pressed={selected === type.key}
      aria-label={`${type.name}: ${pick.club}, level ${pick.level}`}
      title={`${pick.club} · Lv ${pick.level}`}
      data-testid={`bag-club-${type.key}`}
      onclick={() => onselect(type.key)}
    >
      <span class="pic">
        {#if club}
          <img src={`images/${club.image}`} alt="" width="44" height="44" />
        {/if}
        <span class="level-badge" data-rarity={club?.type}>{pick.level}</span>
      </span>
      <span class="type">{type.label}</span>
    </button>
  {/each}

  {#if onedit}
    <button class="card edit" data-testid="bag-edit" onclick={onedit}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M10.5 2.5l3 3L6 13H3v-3z" />
        <path d="M9 4l3 3" />
      </svg>
      <span class="type">Edit bag</span>
    </button>
  {/if}
</div>

<style>
  /* Four across on a phone, so seven clubs and Edit fill two rows exactly;
     one row of eight once there is room. Kept short on a phone, so the rings
     come into view sooner. */
  .cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .card {
    /* The level badge rings itself in the card's own background. */
    --card-bg: var(--surface);
    --pic: 34px;
    min-width: 0;
    min-height: 0;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    padding: 5px 4px;
    border: 2px solid var(--edge);
    background: var(--card-bg);
    color: var(--ink);
  }

  @media (min-width: 560px) {
    .cards.with-edit {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }

    .card {
      --pic: 44px;
      gap: 4px;
      padding: 7px 4px;
    }
  }

  .card[data-rarity='Common'] {
    --rarity: var(--rarity-common);
  }

  .card[data-rarity='Rare'] {
    --rarity: var(--rarity-rare);
  }

  .card[data-rarity='Epic'] {
    --rarity: var(--rarity-epic);
  }

  .card.selected {
    --card-bg: var(--green-100);
    border-color: var(--green-500);
    box-shadow:
      0 var(--bevel) 0 var(--green-700),
      0 0 0 3px var(--green-300);
  }

  .pic {
    position: relative;
    display: grid;
    place-items: center;
    width: var(--pic);
    height: var(--pic);
  }

  img {
    width: var(--pic);
    height: var(--pic);
    object-fit: contain;
  }

  .level-badge {
    --badge-ring: var(--card-bg);
    right: -9px;
    bottom: -3px;
  }

  .type {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 800;
    line-height: 1.2;
  }

  @media (min-width: 560px) {
    .type {
      font-size: 13px;
    }
  }

  .edit {
    border: 2px dashed var(--edge);
    border-radius: var(--radius);
    background: transparent;
    color: var(--accent-ink);
    cursor: pointer;
  }

  /* Two short lines rather than "Edit …" when a 320px phone squeezes it. */
  .edit .type {
    white-space: normal;
    text-align: center;
  }

  .edit:hover {
    border-color: var(--green-500);
    background: var(--green-100);
  }

  .edit:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
