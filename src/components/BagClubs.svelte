<script>
  // A bag's clubs, one card per type, each showing the club with its level on
  // the picture, the way the game shows it. On a bag this is how the player
  // says which club the game put in their hand; in the bag editor it picks the
  // type to change. `row` keeps the seven in one row wherever they fit.
  import { CLUB_TYPES, clubFor } from '../lib/clubs.js';

  let { selections, selected, onselect, row = false, label = 'Club in hand' } = $props();
</script>

<div class="cards" class:row role="group" aria-label={label} data-testid="bag-clubs">
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
</div>

<style>
  /* Four across, as the bag editor shows them. The bag in use keeps all
     seven in one row from 360px, with smaller pictures on a phone, which
     saves a row of height for the rings below. */
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

  /* Narrower than that, four over three, the three centred under the four:
     each card spans two half-columns and the fifth starts one in. */
  @media (max-width: 359px) {
    .cards.row {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }

    .row .card {
      grid-column: span 2;
    }

    .row .card:nth-child(5) {
      grid-column: 2 / span 2;
    }
  }

  @media (min-width: 360px) and (max-width: 559px) {
    .cards.row {
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
    }

    .row .card {
      --pic: 32px;
      gap: 3px;
      padding: 4px 1px;
    }

    .row .type {
      font-size: 11px;
      letter-spacing: -0.01em;
    }

    /* Smaller, in proportion to the smaller picture, and clear of the label
       under it, which its ring would otherwise cut. */
    .row .level-badge {
      right: -6px;
      bottom: 0;
      min-width: 14px;
      padding: 0 3px;
      font-size: 9px;
      line-height: 13px;
      box-shadow:
        inset 0 0 0 1px var(--badge, var(--rarity-common-strong)),
        0 0 0 1.5px var(--badge-ring, var(--surface));
    }
  }

  @media (min-width: 400px) and (max-width: 559px) {
    .row .type {
      font-size: 12px;
    }
  }

  @media (min-width: 560px) {
    .cards.row {
      grid-template-columns: repeat(7, minmax(0, 1fr));
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
</style>
