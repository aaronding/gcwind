<script>
  // Where the club in hand comes from, one tap away: Flex, which is any club at
  // any level, or one of the account's bags. + adds a bag, up to five. The name
  // of the bag in use opens the bag manager.
  import { MAX_BAGS, bagLabel } from '../lib/bags.js';

  let { account, flex, onbag, onflex, onadd, onmanage } = $props();

  const bag = $derived(account.bags[account.activeBag] ?? account.bags[0]);
  const name = $derived(flex ? 'Any club' : bag.name);
  const canAdd = $derived(account.bags.length < MAX_BAGS);
  /** Flex and the bags share the row equally; + is narrower. */
  const count = $derived(account.bags.length + 1);
  /** With six buttons, the narrowest phones need the room the name takes. */
  const crowded = $derived(count + (canAdd ? 1 : 0) >= 6);
</script>

<div class="bagbar" class:crowded data-testid="bag-bar">
  <button
    class="name"
    data-testid="bags-manage"
    title="Manage bags"
    aria-label={`${name}, manage bags`}
    onclick={onmanage}
  >
    <span class="name-text" data-testid="bag-name">{name}</span>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 4.5h6.5M12.5 4.5H14M2 11.5h1.5M7.5 11.5H14" />
      <circle cx="10.5" cy="4.5" r="1.8" />
      <circle cx="5.5" cy="11.5" r="1.8" />
    </svg>
  </button>

  <div
    class="bags"
    class:can-add={canAdd}
    style:--count={count}
    role="group"
    aria-label="Clubs in use"
  >
    <button
      class="bag flex"
      class:selected={flex}
      aria-pressed={flex}
      aria-label="Flex: any club, any level"
      title="Any club, any level"
      data-testid="bag-flex"
      onclick={onflex}
    >
      Flex
    </button>
    {#each account.bags as b, i (i)}
      {@const selected = !flex && i === account.activeBag}
      <button
        class="bag"
        class:selected
        aria-pressed={selected}
        aria-label={bagLabel(b, i)}
        title={b.name}
        data-testid={`bag-${i + 1}`}
        onclick={() => onbag(i)}
      >
        {i + 1}
      </button>
    {/each}
    {#if canAdd}
      <button
        class="bag add"
        aria-label="Add a bag"
        title="Add a bag"
        data-testid="bag-add"
        onclick={onadd}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  /* The name takes what it needs and the buttons take the rest, so on a phone
     each one is a wide, easy target. On a wide screen they stop at a
     comfortable width rather than stretching across the page. */
  .bagbar {
    container-type: inline-size;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  /* Not a card, so on a phone, where the cards run to the screen edge, it
     keeps a margin of its own. */
  @media (max-width: 440px) {
    .bagbar {
      padding: 0 12px;
    }
  }

  .name {
    flex: 0 1 auto;
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: var(--tap);
    padding: 0 6px 0 2px;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--ink);
    cursor: pointer;
  }

  .name-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 800;
    line-height: 1.2;
  }

  /* Six buttons on a 320px phone: the name gives way to its icon, which still
     opens the manager. The button's aria-label keeps the name for screen
     readers. */
  @container (max-width: 330px) {
    .crowded .name-text {
      display: none;
    }

    .crowded .name {
      padding: 0 10px;
    }
  }

  .name svg {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    color: var(--ink-faint);
  }

  .name:hover svg {
    color: var(--accent-ink);
  }

  .name:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  .bags {
    /* The rest of the row, never so little that a button gets narrower than
       34px, and at most 420px. */
    flex: 1 1 0;
    min-width: calc(var(--count) * 37px + 3px);
    max-width: 420px;
    margin-left: auto;
    display: grid;
    grid-template-columns: repeat(var(--count), minmax(0, 1fr));
    gap: 3px;
    padding: 3px;
    background: var(--surface-sunken);
    border-radius: var(--radius);
  }

  .bags.can-add {
    min-width: calc(var(--count) * 37px + 42px);
    grid-template-columns: repeat(var(--count), minmax(0, 1fr)) 36px;
  }

  .bag {
    min-width: 0;
    height: var(--tap);
    padding: 0;
    border: none;
    border-radius: calc(var(--radius) - 3px);
    background: transparent;
    color: var(--ink-muted);
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition:
      background-color 140ms ease,
      color 140ms ease;
  }

  .bag.flex {
    font-size: 15px;
  }

  /* A faint line between neighbours sets each button apart without boxing it
     in. The lines either side of the selected button go, since its green
     already does that. */
  .bag {
    position: relative;
  }

  .bag + .bag::after {
    content: '';
    position: absolute;
    left: -2px;
    top: 12px;
    bottom: 12px;
    width: 1px;
    background: color-mix(in srgb, var(--surface-sunken), var(--ink) 16%);
    pointer-events: none;
  }

  .bag.selected::after,
  .bag.selected + .bag::after {
    opacity: 0;
  }

  /* Flex and + are not bags, so the word and the + are a shade darker than
     the numbers. */
  .flex:not(.selected),
  .add {
    color: color-mix(in srgb, var(--ink-muted), var(--ink) 20%);
  }

  .bag:hover:not(.selected) {
    color: var(--ink);
  }

  .bag.selected {
    background: var(--green-500);
    color: var(--on-dark);
    box-shadow: 0 2px 0 var(--green-700);
  }

  .bag:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  /* Adding a bag is rare, so + is narrower than the buttons that switch. */
  .add {
    display: grid;
    place-items: center;
  }

  .add svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }
</style>
